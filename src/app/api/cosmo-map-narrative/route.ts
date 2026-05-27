import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getCuratedCity, CURATED_CITIES } from "@/lib/curatedCities";
import { getIntention } from "@/lib/intentions";
import { PLANET_PL } from "@/lib/astrocartography";
import type { ActiveLine } from "@/lib/astrocartography";

export const maxDuration = 60;

const SYSTEM_PROMPT = `Jesteś ekspertem astrokartografii o głębokiej wiedzy kulturowej. Twoje zadanie: napisać głęboką, evocative interpretację konkretnego miejsca dla konkretnej osoby w kontekście wybranej intencji życiowej.

KRYTYCZNE ZASADY:
1. NIE WYMYŚLAJ konkretnych wydarzeń, festiwali, lokalnych nazw dzielnic ani szczegółów których nie jesteś PEWIEN. Trzymaj się szeroko-znanych faktów (te które są w cultural_blurb).
2. ZAWSZE odnoś się do KONKRETNEJ planety + linii. To core wartość.
3. ZAKAZ: slash-form (oddałeś/aś), żargon astrologiczny bez tłumaczenia (orb, dyspozytor, retrograde, MC w sensie technicznym), generyczne truizmy.
4. Forma: bezosobowa lub 2. osoba (ty/twój).
5. Język: polski.

OUTPUT JSON (tylko ten JSON, bez żadnego innego tekstu):
{
  "card_teaser": "<≤8 słów, jedna emotional fraza>",
  "why_place": "<2-3 zdania o kulturowej tożsamości miejsca>",
  "why_for_you": "<4-5 zdań głębokiej astro warstwy: która linia + jak to działa dla tej osoby>",
  "what_youll_feel": "<3-4 zdania behavioral/sensory — co poczujesz, jak to się rozłoży>",
  "similar_slugs": ["slug1", "slug2", "slug3"]
}`;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = authHeader.replace("Bearer ", "");
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    city_slug: string;
    intention_id: string;
    reading_id?: string;
    active_lines: ActiveLine[];
  };

  const city = getCuratedCity(body.city_slug);
  const intention = getIntention(body.intention_id);
  if (!city || !intention) {
    return NextResponse.json({ error: "Nieznane miasto lub intencja" }, { status: 400 });
  }

  // Check cache
  const { data: cached } = await supabaseAdmin
    .from("map_place_narratives")
    .select("narrative")
    .eq("user_id", user.id)
    .eq("city_slug", body.city_slug)
    .eq("intention_id", body.intention_id)
    .maybeSingle();

  if (cached?.narrative) {
    return NextResponse.json({ narrative: cached.narrative, cached: true });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Brak klucza AI" }, { status: 500 });
  }

  // Build list of similar slugs from same tags
  const sameTags = city.tags.slice(0, 2);
  const similarCandidates = CURATED_CITIES
    .filter((c) => c.slug !== city.slug && c.tags.some((t) => sameTags.includes(t)))
    .slice(0, 8)
    .map((c) => `${c.slug}: ${c.name_pl}, ${c.country_pl}`);

  const activeLinesSummary = body.active_lines
    .slice(0, 5)
    .map((l) => `- ${PLANET_PL[l.planet]} ${l.type} — ${l.distance_km}km`)
    .join("\n");

  const userPrompt = `INTENCJA: ${intention.label} — ${intention.subtitle}
TON: ${intention.tone}

MIASTO: ${city.name_pl}, ${city.country_pl}
TOŻSAMOŚĆ KULTUROWA: ${city.cultural_blurb}
TAGI: ${city.tags.join(", ")}

AKTYWNE LINIE W POBLIŻU:
${activeLinesSummary || "Brak linii w bliskim zasięgu"}

PODOBNE MIEJSCA DO SUGESTII (wybierz 3):
${similarCandidates.join("\n")}

Napisz głęboką narrację. JSON tylko.`;

  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1200,
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "";
    const narrative = JSON.parse(raw);

    // Cache it
    await supabaseAdmin.from("map_place_narratives").upsert({
      user_id: user.id,
      city_slug: body.city_slug,
      intention_id: body.intention_id,
      active_lines: body.active_lines,
      narrative,
    }, { onConflict: "user_id,city_slug,intention_id" });

    return NextResponse.json({ narrative, cached: false });
  } catch (err) {
    console.error("cosmo-map-narrative error:", err);
    return NextResponse.json({ error: "Błąd generowania narracji" }, { status: 500 });
  }
}
