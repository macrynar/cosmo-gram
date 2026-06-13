import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { hasActiveSubscription } from "@/lib/subscription";
import { getSeasons } from "@/lib/astro/layers";
import { aiComplete, correctCalendarText, AiDisabledError } from "@/lib/deepseek";
import { ASPECT_LABEL_PL, inSign } from "@/lib/i18n/astro";
import { containsForeignScript, endsWithSentence, containsPlanetOrSign } from "@/lib/text-validation";
import { STYLE_BLOCK } from "@/lib/moduleSpecs";
import type { NatalChart } from "@/lib/astro-types";
import { z } from "zod";

export const runtime = "nodejs";

const BodySchema = z.object({
  year:       z.number().int().min(2020).max(2050),
  reading_id: z.string().uuid(),
});

const QUARTERS = [
  { name: "Zima/Wiosna", months: "sty–mar" },
  { name: "Wiosna/Lato", months: "kwi–cze" },
  { name: "Lato/Jesień",  months: "lip–wrz" },
  { name: "Jesień/Zima", months: "paź–gru" },
];

const SYSTEM_PROMPT = `Jesteś astrolożką opisującą charakter roku dla konkretnej osoby.
Napisz 5–7 zdań: jakie tematy dominują w tym roku, jakie momenty są kluczowe, jaki ogólny kierunek.
Bądź konkretna — cytuj planety i aspekty z podanego kontekstu sezonów. Pisz w drugiej osobie.
Zakaz żargonu w warstwie wniosku. Zakaz clichés. Tylko czysty tekst.

${STYLE_BLOCK}`;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isPremium = await hasActiveSubscription(user.id);
  if (!isPremium) return NextResponse.json({ error: "Premium required" }, { status: 402 });

  const body = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "Nieprawidłowe dane" }, { status: 400 });

  const { year, reading_id: readingId } = body.data;

  // Cache check
  const { data: cached } = await supabaseAdmin
    .from("year_interpretations")
    .select("content")
    .eq("reading_id", readingId)
    .eq("year", year)
    .maybeSingle();

  if (cached) return NextResponse.json({ content: cached.content, cached: true });

  // Verify ownership + get natal chart
  const { data: reading } = await supabaseAdmin
    .from("readings")
    .select("chart_data")
    .eq("id", readingId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!reading?.chart_data) return NextResponse.json({ error: "Brak kosmogramu" }, { status: 404 });

  const chart   = reading.chart_data as NatalChart;
  const midYear = new Date(Date.UTC(year, 6, 1)); // July 1st for scan anchor
  const seasons = getSeasons(chart, midYear)
    .filter(s => s.start.startsWith(`${year}`) || s.end.startsWith(`${year}`));

  const seasonLines = seasons
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(s =>
      `${s.transitPlanet} ${inSign(s.transitSign)} ${ASPECT_LABEL_PL[s.aspectType] ?? s.aspectType} do ${s.natalPoint} ${inSign(s.natalSign)} — ${s.start} do ${s.end} (${s.phase}, ${s.favorable ? "wspierający" : "wymagający"})`
    )
    .join("\n");

  const quarterLines = QUARTERS.map(q => q.name + " (" + q.months + ")").join(", ");
  const context = `Rok: ${year}\nKwartały: ${quarterLines}\nAktywne sezony:\n${seasonLines || "brak dużych sezonów w tym roku"}`;

  try {
    let content = "";
    const models = ["claude-haiku-4-5-20251001", "claude-haiku-4-5-20251001", "claude-sonnet-4-6"];
    for (const model of models) {
      const candidate = await aiComplete({
        model,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: `Opisz charakter roku dla tej osoby:\n\n${context}` }],
        maxTokens: 700,
        task: "year-interpretation",
      });
      if (!containsForeignScript(candidate) && endsWithSentence(candidate) && containsPlanetOrSign(candidate)) {
        content = candidate;
        break;
      }
    }
    if (content) content = await correctCalendarText(content, "year-interpretation");
    if (!content) return NextResponse.json({ error: "Błąd jakości AI" }, { status: 500 });

    const seasonsUsed = seasons.map(s => `${s.transitPlanet}-${s.aspectType}-${s.natalPoint}`);

    await supabaseAdmin.from("year_interpretations").upsert({
      user_id:       user.id,
      reading_id:    readingId,
      year,
      content,
      seasons_used:  seasonsUsed,
      prompt_version: "1",
      model:         "claude-haiku-4-5-20251001",
    });

    return NextResponse.json({ content, cached: false });

  } catch (err) {
    if (err instanceof AiDisabledError) return NextResponse.json({ error: "AI tymczasowo niedostępne" }, { status: 503 });
    return NextResponse.json({ error: "Błąd generowania" }, { status: 500 });
  }
}
