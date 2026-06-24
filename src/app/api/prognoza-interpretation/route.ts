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

/**
 * Robustly turn a model response into a JSON object:
 *  1. slice from the first "{" to the last "}" (drops any preamble / ```json fences),
 *  2. if that still won't parse, escape raw control characters left unescaped INSIDE
 *     string values — the #1 cause of JSON.parse failures (model puts a real line
 *     break between <p> blocks). Structural newlines (between fields) are left alone.
 */
function parseLenientJson(raw: string): Record<string, unknown> | null {
  const start = raw.indexOf("{");
  const end   = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  const body = raw.slice(start, end + 1);

  try { return JSON.parse(body) as Record<string, unknown>; } catch { /* try repair */ }

  let out   = "";
  let inStr = false;
  let esc   = false;
  for (const ch of body) {
    if (esc)         { out += ch; esc = false; continue; }
    if (ch === "\\") { out += ch; esc = true;  continue; }
    if (ch === '"')  { inStr = !inStr; out += ch; continue; }
    if (inStr && (ch === "\n" || ch === "\r" || ch === "\t")) {
      out += ch === "\n" ? "\\n" : ch === "\r" ? "\\r" : "\\t";
      continue;
    }
    out += ch;
  }
  try { return JSON.parse(out) as Record<string, unknown>; } catch { return null; }
}

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
  "reflection": "1 pytanie lub refleksja na ten okres"
}

ZASADY:
- Pisz w 2. osobie: "masz", "czujesz", "możesz"
- Główna narracja BEZ nazw planet i aspektów — tylko ludzkie konsekwencje
- Dokończ każdy akapit — nie urywaj zdań w połowie
- TYLKO poprawna polszczyzna, bez angielskich słów
- Odpowiedź WYŁĄCZNIE jako jeden obiekt JSON: zacznij od { i zakończ na }, bez tekstu przed/po, bez bloków markdown
- W wartościach tekstowych NIE używaj surowych znaków nowej linii — akapity zapisz w jednej linii jako "<p>...</p><p>...</p>"

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
    .eq("iso_week", `prognoza-v2-${zoom}-${dateKey}`)
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
    type ProgJson = {
      theme: string; summary: string; narr: string;
      sources: string[]; reflection: string;
    };
    let parsed: ProgJson | null = null;
    const models = ["claude-haiku-4-5-20251001", "claude-sonnet-4-6"];
    for (const model of models) {
      const candidate = await aiComplete({
        model,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: `Stwórz interpretację prognozy:\n\n${context}` }],
        maxTokens: 2000,
        task: "prognoza-interpretation",
        mockFixture: "prognoza/interpretation-01.json",
      });
      const obj = parseLenientJson(candidate);
      if (obj && typeof obj.narr === "string" && typeof obj.theme === "string") {
        parsed = obj as ProgJson;
        break;
      }
    }

    if (!parsed) return NextResponse.json({ error: "Błąd jakości AI" }, { status: 500 });

    // Run language correction on the prose fields (narr + summary), in parallel so
    // it doesn't add wall-clock latency.
    try {
      const [narr, summary] = await Promise.all([
        correctCalendarText(parsed.narr, "prognoza-narr"),
        correctCalendarText(parsed.summary, "prognoza-summary"),
      ]);
      parsed.narr = narr;
      parsed.summary = summary;
    } catch {
      // correction optional
    }

    const finalJson = JSON.stringify(parsed);

    await supabaseAdmin.from("week_interpretations").upsert({
      user_id:        user.id,
      reading_id:     readingId,
      iso_week:       `prognoza-v2-${zoom}-${dateKey}`,
      content:        finalJson,
      transits_used:  [],
      prompt_version: "prognoza-v2",
      model:          "claude-haiku-4-5-20251001",
    });

    return NextResponse.json({ ...parsed, cached: false });

  } catch (err) {
    if (err instanceof AiDisabledError) return NextResponse.json({ error: "AI tymczasowo niedostępne" }, { status: 503 });
    return NextResponse.json({ error: "Błąd generowania" }, { status: 500 });
  }
}
