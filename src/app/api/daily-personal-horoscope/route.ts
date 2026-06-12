import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { hasActiveSubscription } from "@/lib/subscription";
import { getTransitsForDate, getDayWeather } from "@/lib/astro/transits";
import { aiComplete, AiDisabledError } from "@/lib/deepseek";
import { PersonalHoroscopeAIOutputSchema } from "@/lib/schemas/personalHoroscope";
import type { NatalChart } from "@/lib/astro-types";
import { STYLE_BLOCK } from "@/lib/moduleSpecs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `Jesteś astrolożką piszącą dzienny horoskop personalny dla konkretnej osoby.

# ZASADY BEZWZGLĘDNE
- Zawsze cytuj konkretne elementy kosmogramu (planeta, znak, aspekt). Minimum 2 odniesienia do danych z wejścia.
- Pisz w drugiej osobie liczby pojedynczej, forma neutralna lub z inputu.
- Zakaz slash-form: "oddałeś/aś", "gotowy/a" itp. Używaj form bezosobowych.
- Zakaz żargonu astrologicznego w outputcie: zero "orb", "tranzytujący", "dom N", stopni/minut.
- Tłumacz tranzyty na ludzki język: Saturn = "czas zamykania zaległości", Mars = "energia szuka ujścia".
- Zakaz clichés: "zaufaj sobie", "wszechświat", "moc chwili".
- Zakaz przepowiadania przyszłości jako pewnika. Używaj: "może", "warto", "pojawia się".

${STYLE_BLOCK}

# FORMAT ODPOWIEDZI (JSON)
Zwróć WYŁĄCZNIE JSON bez markdown:
{
  "headline": "max 80 znaków — tytuł dnia od dominującego tranzytu",
  "main": "2–3 akapity wyjaśniające co tranzyty znaczą dla tej osoby — musi cytować konkretne planety i znaki z wejścia",
  "reflection": "jedno pytanie refleksyjne LUB mikro-praktyka na dziś, 1–2 zdania",
  "weather": {
    "intensity": 1-5,
    "element": "Ogień|Ziemia|Powietrze|Woda|Mieszany",
    "character": "jedno słowo po polsku"
  }
}

${STYLE_BLOCK}`;

function buildTransitContext(
  transits: ReturnType<typeof getTransitsForDate>,
  weather: ReturnType<typeof getDayWeather>,
  date: string,
): string {
  const top3 = transits.slice(0, 3);
  const lines = top3.map(t => {
    const dir = t.applying ? "zbliża się (aplikacyjny)" : "oddala się (separacyjny)";
    const fav = t.favorable ? "sprzyjający" : "napięciowy";
    return `- ${t.transitPlanet} w ${t.transitSign} ${t.aspectType} do natalnego ${t.natalPoint} w ${t.natalSign} (orb ${t.orbDegrees}°, ${dir}, ${fav})`;
  });

  return `Data: ${date}
Pogoda dnia: intensywność ${weather.intensity}/5, żywioł ${weather.element}, charakter: ${weather.character}

Aktywne tranzyty (od najważniejszego):
${lines.join("\n")}`;
}

async function generateHoroscope(
  userId: string,
  natalChart: NatalChart,
  dateStr: string,
): Promise<{
  headline: string;
  main: string;
  reflection: string;
  weather: { intensity: number; element: string; character: string };
  transitsUsed: unknown[];
}> {
  const date     = new Date(`${dateStr}T12:00:00Z`);
  const transits = getTransitsForDate(natalChart, date);
  const weather  = getDayWeather(transits);
  const context  = buildTransitContext(transits, weather, dateStr);

  const raw = await aiComplete({
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: `Napisz personalny horoskop na ${dateStr}:\n\n${context}` }],
    maxTokens: 1200,
    task: "personal-horoscope",
  });

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const obj = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
  const validated = PersonalHoroscopeAIOutputSchema.parse(obj);

  return {
    headline:     validated.headline,
    main:         validated.main,
    reflection:   validated.reflection,
    weather:      validated.weather,
    transitsUsed: transits.slice(0, 3),
  };
}

// ─── GET: read cached horoscope or generate on-demand ────────────────────────

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isPremium = await hasActiveSubscription(user.id);
  if (!isPremium) return NextResponse.json({ error: "Premium required" }, { status: 402 });

  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

  // Try cache first
  const { data: cached } = await supabaseAdmin
    .from("daily_personal_horoscopes")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", dateStr)
    .maybeSingle();

  if (cached) {
    return NextResponse.json({
      headline:    cached.headline,
      main:        cached.main,
      reflection:  cached.reflection,
      weather: {
        intensity:  cached.weather_intensity,
        element:    cached.weather_element,
        character:  cached.weather_character,
      },
      transitsUsed: cached.transits_used,
      cached: true,
    });
  }

  // On-demand fallback — generate and cache
  const { data: reading } = await supabaseAdmin
    .from("readings")
    .select("chart_data")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!reading?.chart_data) {
    return NextResponse.json({ error: "Brak kosmogramu — wygeneruj najpierw swoją kartę" }, { status: 404 });
  }

  try {
    const result = await generateHoroscope(user.id, reading.chart_data as NatalChart, dateStr);

    await supabaseAdmin.from("daily_personal_horoscopes").upsert({
      user_id:           user.id,
      date:              dateStr,
      headline:          result.headline,
      main:              result.main,
      reflection:        result.reflection,
      weather_intensity: result.weather.intensity,
      weather_element:   result.weather.element,
      weather_character: result.weather.character,
      transits_used:     result.transitsUsed,
    });

    return NextResponse.json({ ...result, cached: false });

  } catch (err) {
    if (err instanceof AiDisabledError) {
      return NextResponse.json({ error: "AI tymczasowo niedostępne" }, { status: 503 });
    }
    console.error("[daily-personal-horoscope] generation error:", err);
    return NextResponse.json({ error: "Błąd generowania" }, { status: 500 });
  }
}
