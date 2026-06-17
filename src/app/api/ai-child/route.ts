import { NextRequest, NextResponse } from "next/server";
import { CHILD_V2_SYSTEM, buildChildV2UserPrompt, calcAgeYears } from "@/lib/prompts/child-v2";
import { ChildModuleAIOutputSchema, CHILD_MODULE_SPECS, type ChildModule, type ChildModuleId } from "@/lib/schemas/childModule";
import type { ChartPlacement, NatalAspect, ChartNodes } from "@/lib/chart-engine";
import { supabaseAdmin } from "@/lib/supabase-server";
import { checkRateLimit } from "@/lib/rateLimiter";
import { aiComplete } from "@/lib/deepseek";

export const maxDuration = 180;

const PROMPT_VERSION = "child-v2.0";

// Escape ALL control characters (U+0000–U+001F) inside JSON string values.
// Claude sometimes embeds literal newlines, tabs, or other control chars between paragraphs.
function sanitizeJsonStrings(json: string): string {
  let result = "";
  let inString = false;
  let i = 0;
  while (i < json.length) {
    const ch = json[i];
    if (ch === "\\" && inString) {
      // Already-escaped sequence — pass through both chars unchanged
      result += ch + (json[i + 1] ?? "");
      i += 2;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      result += ch;
    } else if (inString) {
      const code = ch.charCodeAt(0);
      if (code < 0x20) {
        // All control chars are invalid unescaped in JSON strings
        switch (code) {
          case 0x09: result += "\\t"; break;
          case 0x0a: result += "\\n"; break;
          case 0x0d: result += "\\r"; break;
          default:   result += `\\u${code.toString(16).padStart(4, "0")}`; break;
        }
      } else {
        result += ch;
      }
    } else {
      result += ch;
    }
    i++;
  }
  return result;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimitRes = await checkRateLimit("ai", user.id);
  if (rateLimitRes) return rateLimitRes;

  const body = await req.json() as {
    name: string;
    birthDate: string;
    placements: ChartPlacement[];
    aspects: NatalAspect[];
    nodes: ChartNodes;
  };

  const userMessage = buildChildV2UserPrompt({
    name:       body.name,
    birthDate:  body.birthDate,
    placements: body.placements ?? [],
    aspects:    body.aspects    ?? [],
    nodes:      body.nodes      ?? { north_node_sign: "", south_node_sign: "" },
  });

  let rawText: string;
  try {
    rawText = await aiComplete({
      model:     "claude-sonnet-4-6",
      system:    CHILD_V2_SYSTEM,
      messages:  [{ role: "user", content: userMessage }],
      maxTokens: 8000,
      task:      "ai-child",
    });
  } catch (err) {
    console.error("[ai-child] aiComplete error:", err);
    return NextResponse.json({ error: "Błąd generowania interpretacji" }, { status: 500 });
  }

  const isDev = process.env.NODE_ENV !== "production";
  console.log("[ai-child] rawText length:", rawText.length, "| first 200:", rawText.slice(0, 200).replace(/[\n\r]/g, "↵"));

  if (!rawText) {
    console.error("[ai-child] aiComplete returned empty string");
    return NextResponse.json(
      { error: "Błąd generowania interpretacji", ...(isDev ? { debug: "empty rawText" } : {}) },
      { status: 500 },
    );
  }

  // Strip code fences and extract JSON array
  let clean = rawText.trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();

  if (!clean.startsWith("[")) {
    const m = clean.match(/\[[\s\S]*\]/);
    if (m) clean = m[0];
  }

  let parsed: unknown[];
  try {
    parsed = JSON.parse(clean) as unknown[];
    if (!Array.isArray(parsed)) throw new Error("Not an array");
  } catch (firstErr) {
    // Fallback: sanitize all control characters inside string values and retry
    try {
      const fixed = sanitizeJsonStrings(clean);
      parsed = JSON.parse(fixed) as unknown[];
      if (!Array.isArray(parsed)) throw new Error("Not an array");
      console.warn("[ai-child] JSON parsed only after control-char sanitization");
    } catch {
      console.error("[ai-child] JSON parse FAILED both passes.", firstErr, "\nraw[:500]:", rawText.slice(0, 500), "\nraw[-200:]:", rawText.slice(-200));
      return NextResponse.json({
        error: "Błąd parsowania odpowiedzi AI",
        ...(isDev ? { rawStart: rawText.slice(0, 300), rawEnd: rawText.slice(-150), rawLen: rawText.length } : {}),
      }, { status: 500 });
    }
  }

  // Sanitize and validate
  const ageYears = calcAgeYears(body.birthDate);
  const modules: ChildModule[] = [];
  const failedIds: ChildModuleId[] = [];

  for (const raw of parsed) {
    try {
      // Sanitize before validation
      const item = raw as Record<string, unknown>;

      // Strip trailing period from quote
      if (typeof item.quote === "string") {
        item.quote = item.quote.replace(/\.\s*$/, "").trim();
      }

      // Trim arrays to safe lengths
      if (Array.isArray(item.tags))         item.tags         = (item.tags as unknown[]).slice(0, 8);
      if (Array.isArray(item.tactics))      item.tactics      = (item.tactics as unknown[]).slice(0, 6);

      // Fix visualMeters: round floats, normalize category
      const VALID_CATEGORIES = new Set(["action", "emotion", "mind", "soul", "social"]);
      if (Array.isArray(item.visualMeters)) {
        item.visualMeters = (item.visualMeters as Record<string, unknown>[]).slice(0, 5).map(m => ({
          ...m,
          value: typeof m.value === "number" ? Math.round(m.value) : m.value,
          // Normalize archetype to max 80 chars
          archetype: typeof m.archetype === "string" ? m.archetype.slice(0, 80) : m.archetype,
          // Default unknown category to "mind"
          category: VALID_CATEGORIES.has(m.category as string) ? m.category : "mind",
        }));
      }

      const validated = ChildModuleAIOutputSchema.parse(item);
      const id = validated.id;
      const spec = CHILD_MODULE_SPECS[id];
      modules.push({
        ...validated,
        confidenceScore: 75 + Math.floor(Math.random() * 15),
        isPremium:       spec.isPremium,
        cacheKey:        `child:${id}:${body.name}:${body.birthDate}`,
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

  return NextResponse.json({ modules, failedIds });
}

// Keep legacy GET for any existing cache lookups (no-op, returns empty)
export async function GET() {
  return NextResponse.json({ modules: [] });
}
