import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { CHILD_V2_SYSTEM, buildChildV2UserPrompt, calcAgeYears } from "@/lib/prompts/child-v2";
import { ChildModuleAIOutputSchema, CHILD_MODULE_SPECS, FREE_CHILD_MODULE_IDS, type ChildModule, type ChildModuleId } from "@/lib/schemas/childModule";
import type { ChartPlacement, NatalAspect, ChartNodes } from "@/lib/chart-engine";
import { checkRateLimit } from "@/lib/rateLimiter";
import { supabaseAdmin } from "@/lib/supabase-server";
import { resolveActiveSubscription } from "@/lib/subscription";
import { checkUsageLimit, incrementUsage } from "@/lib/usageLimits";
import { logAiCall } from "@/lib/deepseek";
import { FREE_GENERATION_LIMIT, PREMIUM_MONTHLY_GENERATION_CAP } from "@/lib/pricing";

// Freemium: free → 1 dziecko (lifetime), 2/6 modułów; premium → 5/mc, pełne 6.

export const maxDuration = 180;

const PROMPT_VERSION = "child-v2.1";

function extractJsonArray(raw: string): string | null {
  const stripped = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  const match = stripped.match(/\[[\s\S]*\]/);
  return match ? match[0] : null;
}

function escapeControlCharsInJsonStrings(raw: string): string {
  let result = "";
  let inString = false;
  let isEscaped = false;

  for (const char of raw) {
    if (isEscaped) {
      result += char;
      isEscaped = false;
      continue;
    }

    if (char === "\\") {
      result += char;
      isEscaped = true;
      continue;
    }

    if (char === '"') {
      result += char;
      inString = !inString;
      continue;
    }

    if (inString) {
      if (char === "\n") {
        result += "\\n";
        continue;
      }
      if (char === "\r") {
        result += "\\r";
        continue;
      }
      if (char === "\t") {
        result += "\\t";
        continue;
      }
    }

    result += char;
  }

  return result;
}

function parseModulesInput(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];

  const stripped = value
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  const candidates = [stripped];
  const arrayMatch = stripped.match(/\[[\s\S]*\]/);
  if (arrayMatch) candidates.push(arrayMatch[0]);

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (Array.isArray(parsed)) return parsed;
      if (
        parsed &&
        typeof parsed === "object" &&
        "modules" in parsed &&
        Array.isArray((parsed as { modules?: unknown }).modules)
      ) {
        return (parsed as { modules: unknown[] }).modules;
      }
    } catch {
      try {
        const repaired = JSON.parse(escapeControlCharsInJsonStrings(candidate)) as unknown;
        if (Array.isArray(repaired)) return repaired;
        if (
          repaired &&
          typeof repaired === "object" &&
          "modules" in repaired &&
          Array.isArray((repaired as { modules?: unknown }).modules)
        ) {
          return (repaired as { modules: unknown[] }).modules;
        }
      } catch {
        continue;
      }
    }
  }

  return [];
}

async function repairModulesInput(client: Anthropic, brokenModules: string): Promise<unknown[]> {
  const candidate = extractJsonArray(brokenModules) ?? brokenModules;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4000,
    system: [
      "Napraw uszkodzony JSON i zwróć wyłącznie poprawny JSON.",
      "Oczekiwany wynik to tablica modułów dziecięcej interpretacji kosmogramu.",
      "Nie zmieniaj struktury danych. Nie dodawaj komentarzy, markdownu ani wyjaśnień.",
      "Jeśli w tekście są nieucieczone cudzysłowy lub znaki nowej linii wewnątrz stringów, popraw je.",
    ].join(" "),
    messages: [{ role: "user", content: candidate }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map(block => block.text)
    .join("\n")
    .trim();

  return parseModulesInput(text);
}

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
  return new Anthropic({ apiKey });
}

// tool_use forces the SDK to handle JSON serialisation — no unescaped quotes
// or literal newlines can appear regardless of what Claude generates.
const CHILD_MODULES_TOOL: Anthropic.Tool = {
  name: "output_child_modules",
  description: "Zwróć DOKŁADNIE te moduły interpretacji kosmogramu dziecka, o które prosi instrukcja (id z zbioru: temperament, emotions, learning, talents, parenting, peers). Nie dodawaj modułów spoza listy w instrukcji.",
  input_schema: {
    type: "object",
    properties: {
      modules: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id:      { type: "string", enum: ["temperament", "emotions", "learning", "talents", "parenting", "peers"] },
            title:   { type: "string" },
            quote:   { type: "string" },
            content: { type: "string" },
            tactics: { type: "array", items: { type: "string" } },
            tags:    { type: "array", items: { type: "string" } },
            visualMeters: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  label:     { type: "string" },
                  value:     { type: "integer", minimum: 0, maximum: 100 },
                  archetype: { type: "string" },
                  category:  { type: "string", enum: ["action", "emotion", "mind", "soul", "social"] },
                },
                required: ["label", "value", "archetype", "category"],
              },
            },
          },
          required: ["id", "title", "quote", "content", "tactics", "tags", "visualMeters"],
        },
      },
    },
    required: ["modules"],
  },
};

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimitRes = await checkRateLimit("ai", user.id);
  if (rateLimitRes) return rateLimitRes;

  // ── Subscription gate + delete-proof anti-abuse cap (§2.6) ──
  const isPaid = await resolveActiveSubscription(user.id, user.email).catch(() => false);
  const limitOpts = isPaid
    ? { limit: PREMIUM_MONTHLY_GENERATION_CAP, scope: "month" as const }
    : { limit: FREE_GENERATION_LIMIT, scope: "lifetime" as const };
  const { allowed } = await checkUsageLimit(user.id, "child", limitOpts);
  if (!allowed) {
    // FREE_LIMIT → paywall (1. dziecko za darmo); MONTHLY_LIMIT → cap 5/mc.
    return NextResponse.json({ error: isPaid ? "MONTHLY_LIMIT" : "FREE_LIMIT" }, { status: 402 });
  }

  const body = await req.json() as {
    name: string;
    birthDate: string;
    placements: ChartPlacement[];
    aspects: NatalAspect[];
    nodes: ChartNodes;
  };

  // Free generuje TYLKO 2 wolne moduły (mniejszy prompt + niższy max_tokens).
  const moduleIds = isPaid ? undefined : FREE_CHILD_MODULE_IDS;
  const maxTokens = isPaid ? 8000 : 3500;

  const userMessage = buildChildV2UserPrompt({
    name:       body.name,
    birthDate:  body.birthDate,
    placements: body.placements ?? [],
    aspects:    body.aspects    ?? [],
    nodes:      body.nodes      ?? { north_node_sign: "", south_node_sign: "" },
    moduleIds,
  });

  const client = getClient();
  let rawModules: unknown[];
  let attemptedRepair = false;
  const t0 = Date.now();
  try {
    const response = await client.messages.create({
      model:       "claude-sonnet-4-6",
      max_tokens:  maxTokens,
      system:      CHILD_V2_SYSTEM,
      messages:    [{ role: "user", content: userMessage }],
      tools:       [CHILD_MODULES_TOOL],
      tool_choice: { type: "tool", name: "output_child_modules" },
    });

    logAiCall({
      task: isPaid ? "child" : "child-free",
      model: "claude-sonnet-4-6",
      input_tokens: response.usage?.input_tokens,
      output_tokens: response.usage?.output_tokens,
      latency_ms: Date.now() - t0,
      status: "ok",
      user_id: user.id,
    });

    const toolBlock = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );
    if (!toolBlock) {
      console.error("[ai-child] no tool_use block, stop_reason:", response.stop_reason);
      return NextResponse.json({ error: "Błąd generowania interpretacji" }, { status: 500 });
    }

    const input  = toolBlock.input as Record<string, unknown>;
    rawModules = parseModulesInput(input.modules);
    if (rawModules.length === 0 && typeof input.modules === "string") {
      attemptedRepair = true;
      console.warn("[ai-child] attempting repair for malformed modules string");
      rawModules = await repairModulesInput(client, input.modules);
    }
    const inputPreview = JSON.stringify(input).slice(0, 400);
    console.log("[ai-child] tool_use OK, modules:", rawModules.length,
      "stop_reason:", response.stop_reason,
      "input keys:", Object.keys(input),
      "input[:400]:", inputPreview);
    if (rawModules.length === 0) {
      const isDev = process.env.NODE_ENV !== "production";
      return NextResponse.json({
        error: "Brak modułów — spróbuj ponownie",
        ...(isDev ? {
          debug_input: inputPreview,
          debug_modules_type: typeof input.modules,
          debug_attempted_repair: attemptedRepair,
        } : {}),
      }, { status: 500 });
    }
  } catch (err) {
    console.error("[ai-child] API error:", err);
    logAiCall({
      task: isPaid ? "child" : "child-free",
      model: "claude-sonnet-4-6",
      latency_ms: Date.now() - t0,
      status: "error",
      error_msg: (err instanceof Error ? err.message : String(err)).slice(0, 500),
      user_id: user.id,
    });
    return NextResponse.json({ error: "Błąd generowania interpretacji" }, { status: 500 });
  }


  const modules: ChildModule[]     = [];
  const failedIds: ChildModuleId[] = [];

  for (const raw of rawModules) {
    try {
      const item = raw as Record<string, unknown>;

      if (typeof item.quote === "string") {
        item.quote = item.quote.replace(/\.\s*$/, "").trim();
      }
      if (Array.isArray(item.tags))    item.tags    = (item.tags    as unknown[]).slice(0, 8);
      if (Array.isArray(item.tactics)) item.tactics = (item.tactics as unknown[]).slice(0, 6);

      const VALID_CATEGORIES = new Set(["action", "emotion", "mind", "soul", "social"]);
      if (Array.isArray(item.visualMeters)) {
        item.visualMeters = (item.visualMeters as Record<string, unknown>[]).slice(0, 5).map(m => ({
          ...m,
          value:     typeof m.value === "number" ? Math.round(m.value) : m.value,
          archetype: typeof m.archetype === "string" ? m.archetype.slice(0, 80) : m.archetype,
          category:  VALID_CATEGORIES.has(m.category as string) ? m.category : "mind",
        }));
      }

      const validated = ChildModuleAIOutputSchema.parse(item);
      const spec      = CHILD_MODULE_SPECS[validated.id];
      modules.push({
        ...validated,
        confidenceScore: 75 + Math.floor(Math.random() * 15),
        isPremium:       spec.isPremium,
        cacheKey:        `child:${validated.id}:${body.name}:${body.birthDate}`,
        promptVersion:   PROMPT_VERSION,
      });
    } catch (err) {
      const id = (raw as { id?: string })?.id as ChildModuleId | undefined;
      console.error("[ai-child] module validation failed for", id, err);
      if (id) failedIds.push(id);
    }
  }

  if (modules.length === 0) {
    return NextResponse.json({ error: "Generowanie nie powiodło się — spróbuj ponownie" }, { status: 500 });
  }

  // Udana generacja = utworzenie → inkrementuj delete-proof licznik (best-effort).
  await incrementUsage(user.id, "child");

  return NextResponse.json({ modules, failedIds });
}

export async function GET() {
  return NextResponse.json({ modules: [] });
}
