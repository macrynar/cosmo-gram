import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { hasActiveSubscription } from "@/lib/subscription";
import { getFastWindows } from "@/lib/astro/layers";
import { aiComplete, AiDisabledError } from "@/lib/deepseek";
import { transitPhrase } from "@/lib/i18n/astro";
import { containsForeignScript, endsWithSentence } from "@/lib/text-validation";
import { STYLE_BLOCK } from "@/lib/moduleSpecs";
import type { NatalChart } from "@/lib/astro-types";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `Jesteś astrolożką piszącą krótkie opisy okien tranzytowych dla konkretnej osoby.
Dla każdego okna: 1 zdanie co to oznacza praktycznie — konkretnie, bez clichés, bez żargonu.
Na końcu: 1 zdanie syntezy całego miesiąca.

${STYLE_BLOCK}

Wejście: lista okien tranzytowych (planeta, aspekt, punkt natalny, charakter, daty).
Zwróć WYŁĄCZNIE JSON:
{
  "windows": [
    { "key": "klucz okna", "sentence": "1 zdanie znaczenia" },
    ...
  ],
  "synthesis": "1 zdanie syntezy miesiąca"
}`;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isPremium = await hasActiveSubscription(user.id);

  const url       = new URL(req.url);
  const year      = parseInt(url.searchParams.get("year")  ?? "0");
  const month     = parseInt(url.searchParams.get("month") ?? "0");
  const readingId = url.searchParams.get("reading_id");
  if (!year || !month) return NextResponse.json({ error: "Wymagane year i month" }, { status: 400 });

  // Get natal chart — use specific reading_id when provided to avoid cross-reading inconsistency
  const { data: reading } = readingId
    ? await supabaseAdmin.from("readings").select("chart_data").eq("user_id", user.id).eq("id", readingId).maybeSingle()
    : await supabaseAdmin.from("readings").select("chart_data").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();

  if (!reading?.chart_data) return NextResponse.json({ error: "Brak kosmogramu" }, { status: 404 });

  const chart   = reading.chart_data as NatalChart;
  const windows = getFastWindows(chart, year, month);
  // top-N fast windows for AI sentence generation (reuse existing limit)
  const power   = windows.slice(0, 5);

  // Free users get window phrases (deterministic) but no AI sentences
  if (!isPremium) {
    return NextResponse.json({
      windows: power.map(w => ({
        key:      `${w.transitPlanet}-${w.aspectType}-${w.natalPoint}`,
        phrase:   transitPhrase(w),
        start:    w.start,
        peak:     w.peak,
        end:      w.end,
        character: w.character,
        category:  w.category,
        sentence:  null,
      })),
      synthesis: null,
      allWindows: windows.map(w => ({
        key:      `${w.transitPlanet}-${w.aspectType}-${w.natalPoint}`,
        phrase:   transitPhrase(w),
        start:    w.start,
        peak:     w.peak,
        end:      w.end,
        character: w.character,
        category:  w.category,
      })),
    });
  }

  // Premium: check cache (keyed per reading to avoid cross-reading stale data)
  const cacheQuery = supabaseAdmin
    .from("monthly_summaries")
    .select("summary_text, windows_json")
    .eq("year", year)
    .eq("month", month);
  if (readingId) cacheQuery.eq("reading_id", readingId);
  else cacheQuery.eq("user_id", user.id);
  const { data: cached } = await cacheQuery.maybeSingle();

  if (cached) {
    return NextResponse.json({
      windows: (cached.windows_json as Array<{ key: string; sentence: string; phrase: string; start: string; peak: string; end: string; character: string; category: string }>),
      synthesis: cached.summary_text,
      allWindows: windows.map(w => ({
        key:      `${w.transitPlanet}-${w.aspectType}-${w.natalPoint}`,
        phrase:   transitPhrase(w),
        start:    w.start,
        peak:     w.peak,
        end:      w.end,
        character: w.character,
        category:  w.category,
      })),
      cached: true,
    });
  }

  if (power.length === 0) {
    return NextResponse.json({ windows: [], synthesis: null, allWindows: [], cached: false });
  }

  // Generate AI sentences for top windows
  const windowList = power.map(w => ({
    key:      `${w.transitPlanet}-${w.aspectType}-${w.natalPoint}`,
    phrase:   transitPhrase(w),
    start:    w.start,
    peak:     w.peak,
    end:      w.end,
    character: w.character,
    category:  w.category,
    lengthDays: w.lengthDays,
  }));

  const context = windowList.map(w =>
    `- [${w.key}] ${w.phrase} | ${w.character} | ${w.start}–${w.end} (peak ${w.peak}, ${w.lengthDays} dni)`
  ).join("\n");

  try {
    type AiSummaryResult = { windows: Array<{ key: string; sentence: string }>; synthesis: string };
    let aiResult: AiSummaryResult | null = null;

    for (const model of ["claude-haiku-4-5-20251001", "claude-sonnet-4-6"] as const) {
      const raw = await aiComplete({
        model,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: `Miesiąc: ${year}-${String(month).padStart(2,"0")}\n\nOkna:\n${context}` }],
        maxTokens: 600,
        task: "monthly-summary",
      });
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      const obj = JSON.parse(jsonMatch ? jsonMatch[0] : raw) as Partial<AiSummaryResult>;
      if (!obj?.synthesis || !Array.isArray(obj?.windows)) continue;
      if (containsForeignScript(obj.synthesis) || !endsWithSentence(obj.synthesis)) continue;
      aiResult = obj as AiSummaryResult;
      break;
    }

    if (!aiResult) throw new Error("AI validation failed");

    // Merge AI sentences back into window list
    const sentenceMap = new Map(aiResult.windows.map(w => [w.key, w.sentence]));
    const enriched = windowList.map(w => ({ ...w, sentence: sentenceMap.get(w.key) ?? null }));

    await supabaseAdmin.from("monthly_summaries").upsert({
      user_id:      user.id,
      reading_id:   readingId ?? null,
      year,
      month,
      windows_json: enriched,
      summary_text: aiResult.synthesis,
      generated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      windows:    enriched,
      synthesis:  aiResult.synthesis,
      allWindows: windows.map(w => ({
        key:      `${w.transitPlanet}-${w.aspectType}-${w.natalPoint}`,
        phrase:   transitPhrase(w),
        start:    w.start,
        peak:     w.peak,
        end:      w.end,
        character: w.character,
        category:  w.category,
      })),
      cached: false,
    });

  } catch (err) {
    if (err instanceof AiDisabledError) return NextResponse.json({ error: "AI niedostępne" }, { status: 503 });
    console.error("[monthly-summary]", err);
    return NextResponse.json({ error: "Błąd generowania" }, { status: 500 });
  }
}
