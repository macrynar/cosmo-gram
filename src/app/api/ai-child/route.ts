import { NextRequest, NextResponse } from "next/server";
import { CHILD_V2_SYSTEM, buildChildV2UserPrompt, calcAgeYears } from "@/lib/prompts/child-v2";
import { ChildModuleAIOutputSchema, CHILD_MODULE_SPECS, type ChildModule, type ChildModuleId } from "@/lib/schemas/childModule";
import type { ChartPlacement, NatalAspect, ChartNodes } from "@/lib/chart-engine";
import { supabaseAdmin } from "@/lib/supabase-server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rateLimiter";

export const maxDuration = 180;

const PROMPT_VERSION = "child-v2.0";

type AnthropicMessage = {
  content: { type: string; text?: string }[];
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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Brak klucza API" }, { status: 500 });

  const userMessage = buildChildV2UserPrompt({
    name:       body.name,
    birthDate:  body.birthDate,
    placements: body.placements ?? [],
    aspects:    body.aspects    ?? [],
    nodes:      body.nodes      ?? { north_node_sign: "", south_node_sign: "" },
  });

  let anthropicRes: Response;
  try {
    anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":    "application/json",
        "x-api-key":       apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:      "claude-sonnet-4-6",
        max_tokens: 7000,
        stream:     false,
        system:     CHILD_V2_SYSTEM,
        messages:   [{ role: "user", content: userMessage }],
      }),
    });
  } catch (err) {
    console.error("[ai-child] fetch error:", err);
    return NextResponse.json({ error: "Błąd połączenia z AI" }, { status: 500 });
  }

  if (!anthropicRes.ok) {
    const body = await anthropicRes.text();
    console.error("[ai-child] Anthropic non-ok:", anthropicRes.status, body);
    return NextResponse.json({ error: "Błąd generowania interpretacji" }, { status: 500 });
  }

  const msg = await anthropicRes.json() as AnthropicMessage;
  const raw  = msg.content.find(c => c.type === "text")?.text ?? "";

  // Parse JSON array from response
  let parsed: unknown[];
  try {
    // Strip any leading/trailing whitespace and potential code fence
    const clean = raw.trim().replace(/^```json\s*/i, "").replace(/```\s*$/, "");
    parsed = JSON.parse(clean) as unknown[];
    if (!Array.isArray(parsed)) throw new Error("Not an array");
  } catch (err) {
    console.error("[ai-child] JSON parse error. Raw:", raw.slice(0, 300), err);
    return NextResponse.json({ error: "Błąd parsowania odpowiedzi AI" }, { status: 500 });
  }

  // Sanitize and validate
  const ageYears = calcAgeYears(body.birthDate);
  const modules: ChildModule[] = [];
  const failedIds: ChildModuleId[] = [];

  for (const raw of parsed) {
    try {
      // Sanitize before validation: strip trailing period from quote, coerce arrays
      const item = raw as Record<string, unknown>;
      if (typeof item.quote === "string") {
        item.quote = item.quote.replace(/\.\s*$/, "").trim();
      }
      if (Array.isArray(item.tags)) {
        item.tags = (item.tags as unknown[]).slice(0, 8);
      }
      if (Array.isArray(item.visualMeters)) {
        item.visualMeters = (item.visualMeters as unknown[]).slice(0, 5);
      }
      if (Array.isArray(item.tactics)) {
        item.tactics = (item.tactics as unknown[]).slice(0, 6);
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

  // Log token usage for observability (fire-and-forget)
  const usage = (msg as unknown as { usage?: { input_tokens?: number; output_tokens?: number } }).usage;
  if (usage) {
    console.log(`[ai-child] tokens: in=${usage.input_tokens} out=${usage.output_tokens} age=${ageYears}`);
  }

  return NextResponse.json({ modules, failedIds });
}

// Keep legacy GET for any existing cache lookups (no-op, returns empty)
export async function GET() {
  return NextResponse.json({ modules: [] });
}
