import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { hasActiveSubscription } from "@/lib/subscription";
import { getTransitsForDate } from "@/lib/astro/transits";
import { deepSeekChat, AiDisabledError } from "@/lib/deepseek";
import type { NatalChart } from "@/lib/astro-types";
import { z } from "zod";

export const runtime = "nodejs";

const BodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const SYSTEM_PROMPT = `Jesteś astrolożką wyjaśniającą dlaczego konkretny dzień jest "Dniem Mocy" dla tej osoby.
Napisz krótko (3–5 zdań): który tranzyt tworzy ten dzień mocnym, co to znaczy dla tej osoby konkretnie, na co warto ten dzień wykorzystać.
Zakaz żargonu astrologicznego w tekście dla użytkownika. Zakaz clichés. Pisz w drugiej osobie.
Odpowiedz tylko zwykłym tekstem, bez JSON.`;

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

  const context = `Dzień: ${dateStr}
Tranzyt: ${topTransit.transitPlanet} w ${topTransit.transitSign} ${topTransit.aspectType} do natalnego ${topTransit.natalPoint} w ${topTransit.natalSign} (orb ${topTransit.orbDegrees}°, ${topTransit.applying ? "aplikacyjny" : "separacyjny"}, ${topTransit.favorable ? "sprzyjający" : "napięciowy"})`;

  try {
    const content = await deepSeekChat({
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Wyjaśnij dlaczego ${dateStr} jest Dniem Mocy:\n\n${context}` }],
      maxTokens: 400,
      task: "power-day-explanation",
    });

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
