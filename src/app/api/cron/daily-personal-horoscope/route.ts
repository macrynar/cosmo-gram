import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getTransitsForDate, getDayWeather } from "@/lib/astro/transits";
import { aiComplete, AiDisabledError } from "@/lib/deepseek";
import { PersonalHoroscopeAIOutputSchema } from "@/lib/schemas/personalHoroscope";
import { sendDailyHoroscopeEmail } from "@/lib/email";
import type { NatalChart } from "@/lib/astro-types";

// Vercel Cron calls this at 03:00 UTC — before the morning email cron
export const runtime = "nodejs";

const BATCH_SIZE = 20;

const SYSTEM_PROMPT = `Jesteś astrolożką piszącą dzienny horoskop personalny.
Zawsze cytuj konkretne elementy kosmogramu (planeta, znak, aspekt) — minimum 2 odniesienia.
Pisz w drugiej osobie, forma neutralna. Zakaz slash-form. Zakaz żargonu astrologicznego.
Tłumacz tranzyty na ludzki język. Zakaz clichés i przepowiadania przyszłości jako pewnika.

Zwróć WYŁĄCZNIE JSON:
{
  "headline": "max 80 znaków",
  "main": "2–3 akapity — cytuj konkretne planety i znaki z wejścia",
  "reflection": "1 pytanie refleksyjne lub mikro-praktyka, max 2 zdania",
  "weather": { "intensity": 1-5, "element": "Ogień|Ziemia|Powietrze|Woda|Mieszany", "character": "jedno słowo" }
}`;

function buildContext(transits: ReturnType<typeof getTransitsForDate>, weather: ReturnType<typeof getDayWeather>, dateStr: string): string {
  const top3 = transits.slice(0, 3).map(t =>
    `- ${t.transitPlanet} w ${t.transitSign} ${t.aspectType} do natalnego ${t.natalPoint} w ${t.natalSign} (orb ${t.orbDegrees}°, ${t.applying ? "aplikacyjny" : "separacyjny"}, ${t.favorable ? "sprzyjający" : "napięciowy"})`
  );
  return `Data: ${dateStr}
Pogoda: intensywność ${weather.intensity}/5, żywioł ${weather.element}, charakter: ${weather.character}
Aktywne tranzyty:\n${top3.join("\n")}`;
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization");
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.AI_DISABLED === "true") {
    return NextResponse.json({ skipped: true, reason: "AI_DISABLED" });
  }

  const today = new Date().toISOString().slice(0, 10);

  // Get premium users with a reading who opted in to email
  const { data: premiumUsers } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id")
    .in("status", ["active", "trialing"])
    .limit(BATCH_SIZE);

  if (!premiumUsers?.length) {
    await supabaseAdmin.from("cron_runs").insert({ name: "daily-personal-horoscope", status: "ok", metadata: { generated: 0, date: today } });
    return NextResponse.json({ generated: 0 });
  }

  // Get their most recent natal charts
  const userIds = premiumUsers.map(u => u.user_id);
  const { data: readings } = await supabaseAdmin
    .from("readings")
    .select("user_id, chart_data")
    .in("user_id", userIds)
    .order("created_at", { ascending: false });

  const latestByUser = new Map<string, NatalChart>();
  for (const r of readings ?? []) {
    if (!latestByUser.has(r.user_id) && r.chart_data) {
      latestByUser.set(r.user_id, r.chart_data as NatalChart);
    }
  }

  // Skip users who already have today's horoscope
  const { data: existing } = await supabaseAdmin
    .from("daily_personal_horoscopes")
    .select("user_id")
    .in("user_id", userIds)
    .eq("date", today);

  const alreadyDone = new Set((existing ?? []).map(e => e.user_id));

  let generated = 0, failed = 0;
  const date = new Date(`${today}T12:00:00Z`);
  const headlineByUser = new Map<string, string>(); // track headlines for email

  for (const userId of userIds) {
    if (alreadyDone.has(userId)) continue;
    const chart = latestByUser.get(userId);
    if (!chart) continue;

    try {
      const transits = getTransitsForDate(chart, date);
      const weather  = getDayWeather(transits);
      const context  = buildContext(transits, weather, today);

      const raw = await aiComplete({
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: `Horoskop na ${today}:\n\n${context}` }],
        maxTokens: 1200,
        task: "personal-horoscope-batch",
      });

      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      const obj = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
      const validated = PersonalHoroscopeAIOutputSchema.parse(obj);

      await supabaseAdmin.from("daily_personal_horoscopes").upsert({
        user_id:           userId,
        date:              today,
        headline:          validated.headline,
        main:              validated.main,
        reflection:        validated.reflection,
        weather_intensity: validated.weather.intensity,
        weather_element:   validated.weather.element,
        weather_character: validated.weather.character,
        transits_used:     transits.slice(0, 3),
      });

      headlineByUser.set(userId, validated.headline);
      generated++;
    } catch (err) {
      if (err instanceof AiDisabledError) break;
      console.error(`[cron/personal-horoscope] userId=${userId} failed:`, err);
      failed++;
    }
  }

  // Send emails to opted-in premium users
  const { data: prefs } = await supabaseAdmin
    .from("user_preferences")
    .select("user_id")
    .in("user_id", userIds)
    .eq("email_horoscope", true);

  const optedIn = new Set((prefs ?? []).map(p => p.user_id));

  if (optedIn.size > 0) {
    const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const emailById = new Map(authUsers.map(u => [u.id, u.email ?? ""]));

    const today_pl = new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "long", year: "numeric", timeZone: "Europe/Warsaw" }).format(new Date());

    // Premium users get personal horoscope email (headline-only teaser)
    await Promise.allSettled(
      Array.from(optedIn).map(async userId => {
        const email = emailById.get(userId);
        if (!email) return;
        const chart = latestByUser.get(userId);
        const sunSign = (chart?.planets ?? []).find(p => p.name === "Słońce")?.sign ?? "Baran";
        await sendDailyHoroscopeEmail(email, sunSign, today_pl, userId, headlineByUser.get(userId));
      })
    );
  }

  await supabaseAdmin.from("cron_runs").insert({
    name: "daily-personal-horoscope",
    status: failed === 0 ? "ok" : generated > 0 ? "partial" : "error",
    metadata: { generated, failed, date: today },
  });

  return NextResponse.json({ generated, failed });
}
