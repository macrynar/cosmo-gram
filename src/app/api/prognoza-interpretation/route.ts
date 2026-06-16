import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { hasActiveSubscription } from "@/lib/subscription";
import { getFastWindows, getSeasons } from "@/lib/astro/layers";
import { aiComplete, correctCalendarText, AiDisabledError } from "@/lib/deepseek";
import { transitPhrase } from "@/lib/i18n/astro";
import { STYLE_BLOCK } from "@/lib/moduleSpecs";
import type { NatalChart } from "@/lib/astro-types";
import { z } from "zod";

export const runtime = "nodejs";

const BodySchema = z.object({
  reading_id: z.string().uuid(),
  zoom:       z.enum(["dzis", "tydzien", "miesiac", "rok"]),
  date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  check_only: z.boolean().optional(),
});

const SYSTEM_PROMPT = `Jesteś astrolożką Astreą. Tworzysz interpretację prognozy astrologicznej w języku polskim.

STRUKTURA ODPOWIEDZI (JSON):
{
  "theme": "2-5 słów (tytuł okresu, po ludzku)",
  "summary": "1 zdanie po ludzku bez żargonu astrologicznego",
  "narr": "3-4 akapity interpretacji po ludzku, bez nazw aspektów, każdy <p>treść</p>",
  "sources": ["zwięzła fraza astro np. 'Uran napina Ascendent'", "..."],
  "reflection": "1 pytanie lub refleksja na ten okres",
  "whenBest": {
    "Nowy biznes": "daty · krótkie wyjaśnienie",
    "Miłość": "daty · krótkie wyjaśnienie",
    "Pieniądze": "daty · krótkie wyjaśnienie",
    "Ważna rozmowa": "daty · krótkie wyjaśnienie",
    "Odpoczynek": "daty · krótkie wyjaśnienie"
  }
}

ZASADY:
- Pisz w 2. osobie: "masz", "czujesz", "możesz"
- Główna narracja BEZ nazw planet i aspektów — tylko ludzkie konsekwencje
- Konkretne daty w whenBest (dzień/zakres + miesiąc po polsku)
- Jeśli brak okien — "spokojny okres · naładuj baterie" dla odpoczynku
- TYLKO poprawna polszczyzna, bez angielskich słów
- Odpowiedź WYŁĄCZNIE w formacie JSON (bez markdown wokół)

${STYLE_BLOCK}`;

function getDateKey(zoom: string, date: string): string {
  if (zoom === "dzis") return date;
  if (zoom === "tydzien") {
    const d = new Date(date + "T12:00:00Z");
    const day = d.getUTCDay();
    d.setUTCDate(d.getUTCDate() + (day === 0 ? -6 : 1 - day));
    const thu = new Date(d);
    thu.setUTCDate(d.getUTCDate() + 3);
    const yearStart = new Date(Date.UTC(thu.getUTCFullYear(), 0, 1));
    const weekNum = Math.ceil(((thu.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${thu.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
  }
  if (zoom === "miesiac") return date.slice(0, 7);
  return date.slice(0, 4); // rok
}

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

  const { reading_id: readingId, zoom, date, check_only } = body.data;
  const dateKey = getDateKey(zoom, date);

  // Cache check
  const { data: cached } = await supabaseAdmin
    .from("week_interpretations")
    .select("content")
    .eq("reading_id", readingId)
    .eq("iso_week", `prognoza-${zoom}-${dateKey}`)
    .maybeSingle();

  if (cached?.content) {
    try {
      return NextResponse.json({ ...JSON.parse(cached.content), cached: true });
    } catch {
      // corrupted cache — fall through to regenerate
    }
  }

  if (check_only) return NextResponse.json({ content: null, cached: false });

  // Verify ownership + get natal chart
  const { data: reading } = await supabaseAdmin
    .from("readings")
    .select("chart_data")
    .eq("id", readingId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!reading?.chart_data) return NextResponse.json({ error: "Brak kosmogramu" }, { status: 404 });

  const chart = reading.chart_data as NatalChart;
  const now = new Date(date + "T12:00:00Z");
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  // Build context based on zoom
  let context = `Zoom: ${zoom}, data: ${date}\n`;

  try {
    if (zoom === "rok") {
      const seasons = getSeasons(chart, now);
      const seasonLines = seasons.slice(0, 5).map(s =>
        `Sezon: ${s.transitPlanet} ${transitPhrase(s as Parameters<typeof transitPhrase>[0])} (${s.start} – ${s.end})`
      ).join("\n");
      context += `Sezony roczne:\n${seasonLines || "brak aktywnych sezonów"}`;
    } else {
      const windows = getFastWindows(chart, year, month);
      let filtered = windows;

      if (zoom === "dzis") {
        // Only windows active on this specific day
        filtered = windows.filter(w => w.start <= date && w.end >= date);
      } else if (zoom === "tydzien") {
        // Only windows overlapping with the 7-day week starting at `date`
        const weekEnd = new Date(new Date(date + "T12:00:00Z").getTime() + 6 * 86400000)
          .toISOString().slice(0, 10);
        filtered = windows.filter(w => w.start <= weekEnd && w.end >= date);
      }
      // For "miesiac": all month windows (no additional filtering)

      const top = filtered.slice(0, 5);
      const windowLines = top.map(w =>
        `${w.transitPlanet} ${transitPhrase(w)} (${w.character}, peak ${w.peak}, start ${w.start}, end ${w.end})`
      ).join("\n");
      context += `Okna tranzytowe (zakres: ${zoom}):\n${windowLines || "brak znaczących okien w tym okresie"}`;
    }
  } catch {
    context += "Brak danych tranzytowych.";
  }

  try {
    let rawJson = "";
    const models = ["claude-haiku-4-5-20251001", "claude-sonnet-4-6"];
    for (const model of models) {
      const candidate = await aiComplete({
        model,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: `Stwórz interpretację prognozy:\n\n${context}` }],
        maxTokens: 1000,
        task: "prognoza-interpretation",
      });
      // Try to parse as JSON
      try {
        const cleaned = candidate.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
        JSON.parse(cleaned);
        rawJson = cleaned;
        break;
      } catch {
        // not valid JSON, try next model
      }
    }

    if (!rawJson) return NextResponse.json({ error: "Błąd jakości AI" }, { status: 500 });

    // Optionally run text correction on narr field
    const parsed = JSON.parse(rawJson) as {
      theme: string; summary: string; narr: string;
      sources: string[]; reflection: string;
      whenBest: Record<string, string>;
    };

    try {
      parsed.narr = await correctCalendarText(parsed.narr, "prognoza-narr");
    } catch {
      // correction optional
    }

    const finalJson = JSON.stringify(parsed);

    await supabaseAdmin.from("week_interpretations").upsert({
      user_id:        user.id,
      reading_id:     readingId,
      iso_week:       `prognoza-${zoom}-${dateKey}`,
      content:        finalJson,
      transits_used:  [],
      prompt_version: "prognoza-v1",
      model:          "claude-haiku-4-5-20251001",
    });

    return NextResponse.json({ ...parsed, cached: false });

  } catch (err) {
    if (err instanceof AiDisabledError) return NextResponse.json({ error: "AI tymczasowo niedostępne" }, { status: 503 });
    return NextResponse.json({ error: "Błąd generowania" }, { status: 500 });
  }
}
