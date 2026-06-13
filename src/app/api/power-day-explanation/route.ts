import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { hasActiveSubscription } from "@/lib/subscription";
import { getTransitsForDate } from "@/lib/astro/transits";
import { aiComplete, correctCalendarText, AiDisabledError } from "@/lib/deepseek";
import { inSign, ASPECT_LABEL_PL } from "@/lib/i18n/astro";
import { containsForeignScript, endsWithSentence, containsPlanetOrSign } from "@/lib/text-validation";
import { STYLE_BLOCK } from "@/lib/moduleSpecs";
import type { NatalChart } from "@/lib/astro-types";
import { z } from "zod";

export const runtime = "nodejs";

const BodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const SYSTEM_PROMPT = `Jesteś astrolożką wyjaśniającą dlaczego konkretny dzień jest "Dniem Mocy" dla tej osoby.
Napisz krótko (3–5 zdań): który tranzyt tworzy ten dzień mocnym, co to znaczy dla tej osoby konkretnie, na co warto ten dzień wykorzystać.
Zakaz żargonu astrologicznego w warstwie wniosku. Zakaz clichés. Pisz w drugiej osobie.
Odpowiedz tylko zwykłym tekstem, bez JSON.

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
  if (!body.success) return NextResponse.json({ error: "Nieprawidłowa data" }, { status: 400 });

  const { date: dateStr } = body.data;

  // Check cache
  const { data: cached } = await supabaseAdmin
    .from("power_day_explanations")
    .select("content, transit")
    .eq("user_id", user.id)
    .eq("date", dateStr)
    .maybeSingle();

  if (cached) {
    return NextResponse.json({ content: cached.content, transit: cached.transit, cached: true });
  }

  // Get natal chart
  const { data: reading } = await supabaseAdmin
    .from("readings")
    .select("chart_data")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!reading?.chart_data) {
    return NextResponse.json({ error: "Brak kosmogramu" }, { status: 404 });
  }

  const chart    = reading.chart_data as NatalChart;
  const date     = new Date(`${dateStr}T12:00:00Z`);
  const transits = getTransitsForDate(chart, date);

  // Find the slow-planet transit that makes it a Power Day
  const SLOW = new Set(["Jowisz", "Saturn", "Uran", "Neptun", "Pluton"]);
  const topTransit = transits.find(t => SLOW.has(t.transitPlanet));

  if (!topTransit) {
    return NextResponse.json({ error: "Brak mocnych tranzytów tego dnia" }, { status: 404 });
  }

  const aspect  = ASPECT_LABEL_PL[topTransit.aspectType] ?? topTransit.aspectType;
  const context = `Dzień: ${dateStr}
Tranzyt: ${topTransit.transitPlanet} ${inSign(topTransit.transitSign)} · ${aspect} do natalnego ${topTransit.natalPoint} ${inSign(topTransit.natalSign)} (orb ${topTransit.orbDegrees.toFixed(1)}°, ${topTransit.applying ? "aplikacyjny" : "separacyjny"}, ${topTransit.favorable ? "sprzyjający" : "napięciowy"})`;

  try {
    const models  = ["claude-haiku-4-5-20251001", "claude-haiku-4-5-20251001", "claude-sonnet-4-6"];
    let content   = "";
    for (const model of models) {
      const candidate = await aiComplete({
        model,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: `Wyjaśnij dlaczego ${dateStr} jest Dniem Mocy:\n\n${context}` }],
        maxTokens: 400,
        task: "power-day-explanation",
      });
      if (!containsForeignScript(candidate) && endsWithSentence(candidate) && containsPlanetOrSign(candidate)) {
        content = candidate;
        break;
      }
    }
    if (!content) return NextResponse.json({ error: "Błąd jakości AI" }, { status: 500 });
    content = await correctCalendarText(content, "power-day-explanation");

    await supabaseAdmin.from("power_day_explanations").upsert({
      user_id: user.id,
      date:    dateStr,
      content,
      transit: topTransit,
    });

    return NextResponse.json({ content, transit: topTransit, cached: false });

  } catch (err) {
    if (err instanceof AiDisabledError) {
      return NextResponse.json({ error: "AI tymczasowo niedostępne" }, { status: 503 });
    }
    return NextResponse.json({ error: "Błąd generowania" }, { status: 500 });
  }
}
