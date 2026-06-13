import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { hasActiveSubscription } from "@/lib/subscription";
import { getTransitsForDate } from "@/lib/astro/transits";
import { aiComplete, AiDisabledError } from "@/lib/deepseek";
import { ASPECT_LABEL_PL, inSign, PLANET_GENITIVE } from "@/lib/i18n/astro";
import { containsForeignScript, endsWithSentence } from "@/lib/text-validation";
import type { NatalChart } from "@/lib/astro-types";
import { z } from "zod";

export const runtime = "nodejs";

const BodySchema = z.object({
  date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reading_id: z.string().uuid(),
});

const SYSTEM_PROMPT = `Jesteś astrolożką opisującą energię konkretnego dnia dla danej osoby.
Napisz 3–4 zdania: co dzieje się w kosmogramie tej osoby tego dnia, na co warto to skierować.
Bądź konkretna — cytuj planety i znaki z podanego kontekstu. Pisz w drugiej osobie.
Zakaz żargonu. Zakaz clichés. Tylko czysty tekst, bez nagłówków.`;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isPremium = await hasActiveSubscription(user.id);
  if (!isPremium) return NextResponse.json({ error: "Premium required" }, { status: 402 });

  const body = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "Nieprawidłowa data" }, { status: 400 });

  const { date: dateStr, reading_id: readingId } = body.data;

  // Cache check — keyed by (reading_id, date) to avoid cross-reading contamination
  const { data: cached } = await supabaseAdmin
    .from("day_interpretations")
    .select("content")
    .eq("reading_id", readingId)
    .eq("date", dateStr)
    .maybeSingle();

  if (cached) return NextResponse.json({ content: cached.content, cached: true });

  // Get natal chart for the specified reading (verify ownership)
  const { data: reading } = await supabaseAdmin
    .from("readings")
    .select("chart_data")
    .eq("id", readingId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!reading?.chart_data) return NextResponse.json({ error: "Brak kosmogramu" }, { status: 404 });

  const chart   = reading.chart_data as NatalChart;
  const date    = new Date(`${dateStr}T12:00:00Z`);
  const transits = getTransitsForDate(chart, date);
  const top3     = transits.slice(0, 3);

  if (top3.length === 0) return NextResponse.json({ error: "Brak aktywnych tranzytów" }, { status: 404 });

  const transitLines = top3.map(t =>
    `${t.transitPlanet} ${inSign(t.transitSign)} ${ASPECT_LABEL_PL[t.aspectType] ?? t.aspectType} do natalnego ${PLANET_GENITIVE[t.natalPoint] ?? t.natalPoint} ${inSign(t.natalSign)} (orb ${t.orbDegrees.toFixed(1)}°, ${t.applying ? "aplikacyjny" : "separacyjny"}, ${t.favorable ? "sprzyjający" : "napięciowy"})`
  ).join("\n");

  const context = `Dzień: ${dateStr}\nAktywne tranzyty:\n${transitLines}`;

  try {
    const userMsg = `Opisz energię tego dnia:\n\n${context}`;
    let content = "";
    const models = ["claude-haiku-4-5-20251001", "claude-haiku-4-5-20251001", "claude-sonnet-4-6"];
    for (const model of models) {
      const candidate = await aiComplete({
        model,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMsg }],
        maxTokens: 400,
        task: "day-interpretation",
      });
      if (!containsForeignScript(candidate) && endsWithSentence(candidate)) {
        content = candidate;
        break;
      }
    }
    if (!content) return NextResponse.json({ error: "Błąd jakości AI" }, { status: 500 });

    await supabaseAdmin.from("day_interpretations").upsert({
      user_id:       user.id,
      reading_id:    readingId,
      date:          dateStr,
      content,
      day_class:     "significant",
      transits_used: top3,
      model:         "claude-haiku-4-5-20251001",
    });

    return NextResponse.json({ content, cached: false });

  } catch (err) {
    if (err instanceof AiDisabledError) return NextResponse.json({ error: "AI tymczasowo niedostępne" }, { status: 503 });
    return NextResponse.json({ error: "Błąd generowania" }, { status: 500 });
  }
}
