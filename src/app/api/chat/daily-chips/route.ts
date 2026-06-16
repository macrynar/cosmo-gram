import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { aiComplete } from "@/lib/deepseek";
import { calculateChart } from "@/lib/chart-engine";
import { getTransitsForDate, getDayWeather } from "@/lib/astro/transits";
import type { NatalChart } from "@/lib/astro-types";

// Fallback chips per Sun sign (gender-neutral 2 os.)
const FALLBACK_CHIPS: Record<string, string[]> = {
  "Baran":       ["Co o aktywności mówi mój kosmogram?", "Gdzie teraz leży moja energia?", "Jak pracować z niecierpliwością?"],
  "Byk":         ["Co mój kosmogram mówi o stabilności?", "Gdzie warto teraz budować?", "Jak radzę sobie ze zmianami?"],
  "Bliźnięta":   ["Co kosmogram mówi o komunikacji?", "Jak pracować z nadmiarem myśli?", "Gdzie leży moja ciekawość?"],
  "Rak":         ["Co mój kosmogram mówi o emocjach?", "Jak dbać o siebie w trudnych chwilach?", "Co mówi Księżyc w moim wykresie?"],
  "Lew":         ["Co kosmogram mówi o ekspresji?", "Gdzie leży moja kreatywność?", "Jak radzić sobie z potrzebą uznania?"],
  "Panna":       ["Co mój kosmogram mówi o codziennych nawykach?", "Jak pracować z perfekcjonizmem?", "Gdzie leży moje skupienie?"],
  "Waga":        ["Co kosmogram mówi o relacjach?", "Jak podejmuję trudne decyzje?", "Gdzie szukać równowagi?"],
  "Skorpion":    ["Co mój kosmogram mówi o transformacji?", "Jak pracować z intensywnymi emocjami?", "Gdzie leżą moje zasoby?"],
  "Strzelec":    ["Co kosmogram mówi o kierunku?", "Jak rozwinąć wizję tego, czego chcę?", "Gdzie leży moja filozofia życia?"],
  "Koziorożec":  ["Co mój kosmogram mówi o celach?", "Jak pracować z poczuciem odpowiedzialności?", "Gdzie leży moja ambicja?"],
  "Wodnik":      ["Co kosmogram mówi o społeczności?", "Jak radzić sobie z potrzebą wolności?", "Gdzie leży moja oryginalność?"],
  "Ryby":        ["Co mój kosmogram mówi o intuicji?", "Jak pracować z marzeniami?", "Gdzie leży moja wrażliwość?"],
};

const CHIPS_PROMPT = `Wygeneruj 3 krótkie pytania (max 60 znaków każde), które TA OSOBA mogłaby dziś zadać astrolożce — w PIERWSZEJ osobie, jej głosem (np. „Co mój kosmogram mówi o…?", „Gdzie teraz leży moja energia?"). Pytania konkretne i ciekawe, oparte na jej kosmogramie i dzisiejszym układzie planet — nie ogólnikowe. NIE pisz pytań skierowanych do usera (żadne „Co czujesz…?"). Zwróć TYLKO tablicę JSON, np.: ["Pytanie 1?","Pytanie 2?","Pytanie 3?"]`;

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ chips: [] });

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ chips: [] });

  const today = new Date().toISOString().slice(0, 10);

  // Return cached chips if they exist for today
  const { data: cached } = await supabaseAdmin
    .from("chat_suggested_questions")
    .select("payload")
    .eq("user_id", user.id)
    .eq("date", today)
    .eq("type", "chips")
    .single();

  if (cached?.payload) return NextResponse.json({ chips: cached.payload as string[] });

  // Generate chips from chart + transits
  let chips: string[] = [];
  try {
    const { data: reading } = await supabaseAdmin
      .from("readings")
      .select("chart_data")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (reading?.chart_data) {
      const chartData = reading.chart_data as NatalChart;
      const bd = chartData.birthData;
      const { promptContext } = calculateChart({ date: bd.date, time: bd.time, lat: bd.lat, lng: bd.lng, place: bd.place });

      const transits = getTransitsForDate(chartData, new Date());
      const weather = getDayWeather(transits);
      const top3 = transits.slice(0, 3);

      const transitContext = top3.length > 0
        ? `Dzisiejsze tranzyty: ${top3.map(t => `${t.transitPlanet} ${t.aspectType} natal ${t.natalPoint} (orb ${t.orbDegrees}°)`).join("; ")}. Pogoda dnia: ${weather.character}, intensywność ${weather.intensity}/5.`
        : "Brak znaczących tranzytów dziś.";

      const raw = await aiComplete({
        system: CHIPS_PROMPT,
        messages: [{ role: "user", content: `${promptContext}\n\n${transitContext}` }],
        maxTokens: 150,
        task: "chat_chips",
      });

      // Parse JSON array from response
      const match = raw.match(/\[[\s\S]*?\]/);
      if (match) {
        const parsed = JSON.parse(match[0]) as unknown[];
        chips = (parsed as string[]).filter(s => typeof s === "string").slice(0, 3);
      }

      // Fallback to Sun sign if AI parse fails
      if (chips.length < 3) {
        const sunSign = chartData.planets.find(p => p.name === "Słońce")?.sign ?? "";
        chips = FALLBACK_CHIPS[sunSign] ?? FALLBACK_CHIPS["Baran"];
      }
    }
  } catch {
    // silently return empty — frontend uses STARTERS fallback
  }

  if (chips.length > 0) {
    await supabaseAdmin.from("chat_suggested_questions").upsert({
      user_id: user.id,
      date: today,
      type: "chips",
      payload: chips,
    }, { onConflict: "user_id,date,type" });
  }

  return NextResponse.json({ chips });
}
