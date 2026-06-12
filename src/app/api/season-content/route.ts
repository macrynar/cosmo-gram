import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { hasActiveSubscription } from "@/lib/subscription";
import { aiComplete, AiDisabledError } from "@/lib/deepseek";
import { STYLE_BLOCK } from "@/lib/moduleSpecs";
import { containsForeignScript, endsWithSentence } from "@/lib/text-validation";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `Jesteś astrolożką opisującą aktywny tranzyt sezonu dla konkretnej osoby.
Nadaj sezonowi tematyczną nazwę (3–5 słów) i napisz 2–3 zdania co on oznacza w życiu tej osoby.

${STYLE_BLOCK}

Zwróć WYŁĄCZNIE JSON:
{
  "name": "nazwa sezonu",
  "paragraph": "2–3 zdania znaczenia"
}`;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isPremium = await hasActiveSubscription(user.id);
  if (!isPremium) return NextResponse.json({ error: "Premium required" }, { status: 403 });

  const url        = new URL(req.url);
  const readingId  = url.searchParams.get("reading_id");
  const transitKey = url.searchParams.get("transit_key");
  const phase      = url.searchParams.get("phase");

  if (!readingId || !transitKey || !phase) {
    return NextResponse.json({ error: "Wymagane: reading_id, transit_key, phase" }, { status: 400 });
  }

  // Verify reading belongs to user
  const { data: reading } = await supabaseAdmin
    .from("readings")
    .select("id, chart_data")
    .eq("id", readingId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!reading) return NextResponse.json({ error: "Nie znaleziono kosmogramu" }, { status: 404 });

  // Check cache
  const { data: cached } = await supabaseAdmin
    .from("seasons")
    .select("name, paragraph")
    .eq("reading_id", readingId)
    .eq("transit_key", transitKey)
    .eq("phase", phase)
    .maybeSingle();

  if (cached) {
    return NextResponse.json({ name: cached.name, paragraph: cached.paragraph, cached: true });
  }

  // Generate via AI
  const [planet, aspect, natalPoint] = transitKey.split("-");
  const context = `Tranzyt: ${planet} (${aspect}) do natalnego ${natalPoint}. Faza sezonu: ${phase}.`;

  try {
    type AiResult = { name: string; paragraph: string };
    let aiResult: AiResult | null = null;

    for (const model of ["claude-haiku-4-5-20251001", "claude-sonnet-4-6"] as const) {
      const raw = await aiComplete({
        model,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: context }],
        maxTokens: 300,
        task: "season-content",
      });
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      const obj = JSON.parse(jsonMatch ? jsonMatch[0] : raw) as Partial<AiResult>;
      if (!obj?.name || !obj?.paragraph) continue;
      if (containsForeignScript(obj.paragraph) || !endsWithSentence(obj.paragraph)) continue;
      aiResult = obj as AiResult;
      break;
    }

    if (!aiResult) throw new Error("AI validation failed");

    await supabaseAdmin.from("seasons").upsert({
      user_id:      user.id,
      reading_id:   readingId,
      transit_key:  transitKey,
      phase,
      name:         aiResult.name,
      paragraph:    aiResult.paragraph,
      generated_at: new Date().toISOString(),
    });

    return NextResponse.json({ name: aiResult.name, paragraph: aiResult.paragraph, cached: false });

  } catch (err) {
    if (err instanceof AiDisabledError) return NextResponse.json({ error: "AI niedostępne" }, { status: 503 });
    console.error("[season-content]", err);
    return NextResponse.json({ error: "Błąd generowania" }, { status: 500 });
  }
}
