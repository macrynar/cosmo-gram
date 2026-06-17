import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { CHILD_V2_SYSTEM, buildChildV2UserPrompt, calcAgeYears } from "@/lib/prompts/child-v2";
import { ChildModuleAIOutputSchema, CHILD_MODULE_SPECS, type ChildModule, type ChildModuleId } from "@/lib/schemas/childModule";
import type { ChartPlacement, NatalAspect, ChartNodes } from "@/lib/chart-engine";
import { checkRateLimit } from "@/lib/rateLimiter";
import { supabaseAdmin } from "@/lib/supabase-server";

export const maxDuration = 180;

const PROMPT_VERSION = "child-v2.1";

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
  return new Anthropic({ apiKey });
}

// tool_use forces the SDK to handle JSON serialisation — no unescaped quotes
// or literal newlines can appear regardless of what Claude generates.
const CHILD_MODULES_TOOL: Anthropic.Tool = {
  name: "output_child_modules",
  description: "Zwróć 6 modułów interpretacji kosmogramu dziecka: temperament, emotions, learning, talents, parenting, peers",
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

  let rawModules: unknown[];
  try {
    const response = await getClient().messages.create({
      model:       "claude-sonnet-4-6",
      max_tokens:  8000,
      system:      CHILD_V2_SYSTEM,
      messages:    [{ role: "user", content: userMessage }],
      tools:       [CHILD_MODULES_TOOL],
      tool_choice: { type: "tool", name: "output_child_modules" },
    });

    const toolBlock = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );
    if (!toolBlock) {
      console.error("[ai-child] no tool_use block, stop_reason:", response.stop_reason);
      return NextResponse.json({ error: "Błąd generowania interpretacji" }, { status: 500 });
    }

    const input  = toolBlock.input as Record<string, unknown>;
    rawModules   = Array.isArray(input.modules) ? (input.modules as unknown[]) : [];
    const inputPreview = JSON.stringify(input).slice(0, 400);
    console.log("[ai-child] tool_use OK, modules:", rawModules.length,
      "stop_reason:", response.stop_reason,
      "input keys:", Object.keys(input),
      "input[:400]:", inputPreview);
    if (rawModules.length === 0) {
      const isDev = process.env.NODE_ENV !== "production";
      return NextResponse.json({
        error: "Brak modułów — spróbuj ponownie",
        ...(isDev ? { debug_input: inputPreview } : {}),
      }, { status: 500 });
    }
  } catch (err) {
    console.error("[ai-child] API error:", err);
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

  return NextResponse.json({ modules, failedIds });
}

export async function GET() {
  return NextResponse.json({ modules: [] });
}
