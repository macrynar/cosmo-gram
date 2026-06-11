import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import type { ActiveLine } from "@/lib/astrocartography";
import { PLANET_PL, LINE_PL_SHORT } from "@/lib/astrocartography";
import { aiComplete } from "@/lib/deepseek";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = authHeader.replace("Bearer ", "");
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    profile_id?: string;
    city_slug: string;
    city_name_pl: string;
    city_country_pl: string;
    active_lines: ActiveLine[];
    scenario_id?: string;
    scenario_label?: string;
    scenario_subtitle?: string;
    scenario_tone?: string;
    default_duration?: { min: number; max: number };
    flight_hours?: number;
    price_tier?: string;
    home_city?: string;
  };

  const {
    profile_id: profileId = null,
    city_slug,
    city_name_pl,
    city_country_pl,
    active_lines,
    scenario_id = "regen",
    scenario_label = "Wakacje regeneracyjne",
    scenario_subtitle = "",
    scenario_tone = "spokojny",
    default_duration = { min: 7, max: 14 },
    flight_hours = 2,
    price_tier = "mid",
    home_city = "Warszawa",
  } = body;

  // Cache key — bump PROMPT_V to invalidate
  const PROMPT_V = "v4";
  const cacheSlug = `${city_slug}_${scenario_id}_${PROMPT_V}`;

  const { data: cached } = await supabaseAdmin
    .from("map_city_interpretations")
    .select("interpretation_markdown")
    .eq("user_id", user.id)
    .is("profile_id", profileId)
    .eq("city_slug", cacheSlug)
    .maybeSingle();

  if (cached) {
    return NextResponse.json({ interpretation_markdown: cached.interpretation_markdown, cached: true });
  }

  if (active_lines.length === 0) {
    const text = JSON.stringify({
      main_prose: "Brak aktywnych linii planetarnych w pobliżu tego miasta (orb 700 km). To neutralna energetycznie lokalizacja — dobre miejsce na reset bez intensywnych wpływów.",
      optimal_duration: `${default_duration.min}-${default_duration.max} dni to dobry horyzont dla tego scenariusza.`,
      what_to_do: "Skup się na tym co przywiozłeś ze sobą — miasto nie będzie wzmacniać konkretnej planety, więc masz przestrzeń na własne tempo.",
      bad_window: "Brak konkretnych planet do obserwowania — żadnego szczególnego złego okna.",
      logistics: `Lot z Warszawy: ok. ${flight_hours}h. Tier cenowy: ${price_tier}.`,
    });
    await supabaseAdmin.from("map_city_interpretations").insert({
      user_id: user.id, profile_id: profileId, city_slug: cacheSlug,
      active_lines: [], interpretation_markdown: text,
    });
    return NextResponse.json({ interpretation_markdown: text, cached: false });
  }

  const topLine = active_lines[0];
  const linesText = active_lines
    .slice(0, 4)
    .map((l) => `${PLANET_PL[l.planet]} na ${LINE_PL_SHORT[l.type]} (${l.distance_km} km)`)
    .join(", ");

  const priceTierPL = price_tier === "low" ? "niski (tania destynacja)" : price_tier === "high" ? "wysoki (droga destynacja)" : "średni";

  const systemPrompt = `Jesteś ekspertem astrokartografii. Piszesz krótkie, UNIKALNE interpretacje dla konkretnych miast pod konkretny SCENARIUSZ podróży.

ZASADA KLUCZOWA: ${city_name_pl} MUSI brzmieć inaczej niż każde inne miasto. Miasto jest protagonistą — opisujesz CO poczujesz W TYM KONKRETNYM MIEJSCU przez pryzmat aktywnych planet. Sekcja "what_to_do" MUSI pasować do scenariusza "${scenario_label}" — ton: ${scenario_tone}.

OUTPUT: ścisły JSON (bez markdown code fences) z dokładnie tymi polami:
{
  "main_prose": "2-3 zdania głównej interpretacji, evocative, konkretnej dla tego miasta",
  "optimal_duration": "1 zdanie o tym jak długo zostać i dlaczego",
  "what_to_do": "1-2 zdania konkretnych aktywności pasujących do aktywnych linii i scenariusza",
  "bad_window": "1 zdanie kiedy nie jechać — konkretny okres lub generyczna ostrzeżenie",
  "logistics": "1-2 zdania: czas lotu z Warszawy, tier cenowy, praktyczna wskazówka"
}

ZAKAZY: bez slash-form (oddałeś/aś), bez MC/IC/ASC/DSC jako terminy techniczne, bez orb/tranzyt/dyspozytor, bez wstępu "W tym mieście...", bez disclaimerów. Pisz w drugiej osobie, neutralnie płciowo.`;

  const userPrompt = `Scenariusz: ${scenario_label} (${scenario_subtitle})
Czas trwania: ${default_duration.min}-${default_duration.max} dni. Ton: ${scenario_tone}.

Miasto: ${city_name_pl}, ${city_country_pl}
Lot z ${home_city}: ok. ${flight_hours}h
Tier cenowy: ${priceTierPL}

Aktywne linie (od najsilniejszej): ${linesText}
Dominująca: ${PLANET_PL[topLine.planet]} — ${LINE_PL_SHORT[topLine.type]}, ${topLine.distance_km} km

Zwróć JSON. Pierwsze zdanie main_prose MUSI być rozpoznawalnie o ${city_name_pl} — nie może brzmieć jak interpretacja innego miasta.`;

  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: "AI not configured" }, { status: 500 });

  let text = "";
  try {
    text = await aiComplete({
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 900,
    });
  } catch (error) {
    console.error("AI cosmo-map-city error:", error);
    return NextResponse.json({ error: "AI error" }, { status: 500 });
  }

  await supabaseAdmin.from("map_city_interpretations").insert({
    user_id: user.id, profile_id: profileId, city_slug: cacheSlug,
    active_lines, interpretation_markdown: text,
  });

  return NextResponse.json({ interpretation_markdown: text, cached: false });
}
