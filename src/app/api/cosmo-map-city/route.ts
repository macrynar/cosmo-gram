import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import type { ActiveLine } from "@/lib/astrocartography";
import { PLANET_PL, LINE_PL } from "@/lib/astrocartography";

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
  };

  const { profile_id: profileId = null, city_slug, city_name_pl, city_country_pl, active_lines } = body;

  // Check cache
  const { data: cached } = await supabaseAdmin
    .from("map_city_interpretations")
    .select("interpretation_markdown")
    .eq("user_id", user.id)
    .is("profile_id", profileId)
    .eq("city_slug", city_slug)
    .maybeSingle();

  if (cached) {
    return NextResponse.json({ interpretation_markdown: cached.interpretation_markdown, cached: true });
  }

  if (active_lines.length === 0) {
    const text = "Brak aktywnych linii planetarnych w pobliżu tego miasta (orb 700 km). To neutralna energetycznie lokalizacja — dobre miejsce na reset bez intensywnych wpływów.";
    await supabaseAdmin.from("map_city_interpretations").insert({
      user_id: user.id,
      profile_id: profileId,
      city_slug,
      active_lines: [],
      interpretation_markdown: text,
    });
    return NextResponse.json({ interpretation_markdown: text, cached: false });
  }

  const linesText = active_lines
    .slice(0, 5)
    .map((l) => `- ${PLANET_PL[l.planet]} na ${LINE_PL[l.type]} (${l.distance_km} km)`)
    .join("\n");

  const systemPrompt = `Jesteś ekspertem astrokartografii. Piszesz krótkie, konkretne interpretacje energii planetarnej dla konkretnego miasta. ZAKAZY: bez slash-formy (oddałeś/aś), bez żargonu astrologicznego (orb, dyspozytor, retrograde, MC, IC, ASC, DSC), bez generalnych truizmów, bez disclaimerów. Pisz w drugiej osobie l.p., forma żeńska. Maks 3 zdania. Wejdź od razu w meritum bez wstępu.`;

  const userPrompt = `Miasto: ${city_name_pl}, ${city_country_pl}.

Aktywne energie planetarne w promieniu 700 km:
${linesText}

Napisz 2-3 zdania konkretnej interpretacji. Zacznij od najsilniejszego wpływu (najmniejsza odległość). Powiedz CO osoba poczuje i doświadczy w tym miejscu.`;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 500 });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 256,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!response.ok) return NextResponse.json({ error: "AI error" }, { status: 500 });
  const aiData = await response.json() as { content: Array<{ type: string; text: string }> };
  const text = aiData.content[0]?.type === "text" ? aiData.content[0].text : "";

  await supabaseAdmin.from("map_city_interpretations").insert({
    user_id: user.id,
    profile_id: profileId,
    city_slug,
    active_lines,
    interpretation_markdown: text,
  });

  return NextResponse.json({ interpretation_markdown: text, cached: false });
}
