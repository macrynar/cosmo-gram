/**
 * Week/month interpretation generation for the email crons.
 *
 * Mirrors the on-demand routes (/api/week-interpretation, /api/monthly-summary)
 * so the weekly/monthly crons can generate the reading for EVERY premium user —
 * not only those who already opened the app and triggered it. Same AI pipeline
 * (Claude Haiku + validation + correctCalendarText), same cache tables.
 *
 * NOTE: prompts mirror those two routes — keep in sync if either changes.
 */
import { supabaseAdmin } from "@/lib/supabase-server";
import { getFastWindows } from "@/lib/astro/layers";
import { aiComplete, correctCalendarText } from "@/lib/deepseek";
import { transitPhrase } from "@/lib/i18n/astro";
import { containsForeignScript, endsWithSentence, containsPlanetOrSign } from "@/lib/text-validation";
import { STYLE_BLOCK } from "@/lib/moduleSpecs";
import type { NatalChart } from "@/lib/astro-types";

const HAIKU = "claude-haiku-4-5-20251001";
const SONNET = "claude-sonnet-4-6";

function addDays(date: Date, n: number): Date {
  return new Date(date.getTime() + n * 86_400_000);
}

function getISOWeekKey(weekStartISO: string): string {
  const d = new Date(weekStartISO + "T12:00:00Z");
  const thu = new Date(d);
  thu.setUTCDate(d.getUTCDate() + 3);
  const yearStart = new Date(Date.UTC(thu.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((thu.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${thu.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

// ─── Week ─────────────────────────────────────────────────────────────────────

const WEEK_PROMPT = `Jesteś astrolożką. Opisz charakter tygodnia w 3–4 zdaniach.

ZASADY (bezwzględne):
- Pisz w 2. osobie czasu teraźniejszego: "masz", "czujesz", "możesz"
- Każde zdanie = jeden konkretny fakt lub praktyczna wskazówka — bez metafor
- Cytuj planety i znaki z podanego kontekstu
- Poprawna polszczyzna — sprawdź formy gramatyczne przed odpowiedzią
- Zakaz poetyckich obrazów i ozdobników
- Zakaz pytań retorycznych

${STYLE_BLOCK}`;

/** Cached week content, or generate + cache it. Returns null on AI/quality failure. */
export async function getOrGenerateWeekContent(
  userId: string,
  readingId: string,
  chart: NatalChart,
  weekStart: string,
): Promise<string | null> {
  const isoWeek = getISOWeekKey(weekStart);

  const { data: cached } = await supabaseAdmin
    .from("week_interpretations")
    .select("content")
    .eq("user_id", userId)
    .eq("reading_id", readingId)
    .eq("iso_week", isoWeek)
    .maybeSingle();
  if (cached?.content) return cached.content;

  const start = new Date(weekStart + "T12:00:00Z");
  const end   = addDays(start, 6);
  const seen  = new Set<string>();
  const windows = [];
  for (const d of [start, end]) {
    for (const w of getFastWindows(chart, d.getUTCFullYear(), d.getUTCMonth() + 1)) {
      const key = `${w.transitPlanet}-${w.aspectType}-${w.natalPoint}`;
      if (!seen.has(key) && w.peak >= weekStart && w.peak <= weekStart.slice(0, 7) + "-31") {
        seen.add(key);
        windows.push(w);
      }
    }
  }
  const top = windows.sort((a, b) => b.score - a.score).slice(0, 4);
  const lines = top.map(w => `${w.transitPlanet} ${transitPhrase(w)} (${w.character}, peak ${w.peak})`).join("\n");
  const context = `Tydzień ${isoWeek} (${weekStart} – ${end.toISOString().slice(0, 10)})\nOkna tranzytowe:\n${lines || "brak znaczących okien"}`;

  let content = "";
  for (const model of [HAIKU, HAIKU, SONNET]) {
    const candidate = await aiComplete({
      model,
      system: WEEK_PROMPT,
      messages: [{ role: "user", content: `Opisz energię tego tygodnia:\n\n${context}` }],
      maxTokens: 500,
      task: "week-interpretation",
    });
    if (!containsForeignScript(candidate) && endsWithSentence(candidate) && containsPlanetOrSign(candidate)) {
      content = candidate;
      break;
    }
  }
  if (!content) return null;
  content = await correctCalendarText(content, "week-interpretation");
  if (!content) return null;

  await supabaseAdmin.from("week_interpretations").upsert({
    user_id: userId, reading_id: readingId, iso_week: isoWeek,
    content, transits_used: top, prompt_version: "1", model: HAIKU,
  });
  return content;
}

// ─── Month ────────────────────────────────────────────────────────────────────

const MONTH_PROMPT = `Jesteś astrolożką piszącą krótkie opisy okien tranzytowych dla konkretnej osoby.
Dla każdego okna: 1 zdanie co to oznacza praktycznie — konkretnie, bez clichés, bez żargonu.
Na końcu: 1 zdanie syntezy całego miesiąca.

${STYLE_BLOCK}

Wejście: lista okien tranzytowych (planeta, aspekt, punkt natalny, charakter, daty).
Zwróć WYŁĄCZNIE JSON:
{
  "windows": [
    { "key": "klucz okna", "sentence": "1 zdanie znaczenia" },
    ...
  ],
  "synthesis": "1 zdanie syntezy miesiąca"
}`;

type MonthWindow = { key: string; sentence: string | null };

function composeMonthContent(synthesis: string, windows: MonthWindow[]): string {
  const sentences = windows.map(w => w.sentence).filter((s): s is string => !!s).slice(0, 4);
  return [synthesis, ...sentences].join("\n\n");
}

/** Cached month content, or generate + cache it. Returns null on AI/quality failure. */
export async function getOrGenerateMonthContent(
  userId: string,
  readingId: string,
  chart: NatalChart,
  year: number,
  month: number,
): Promise<string | null> {
  const { data: cached } = await supabaseAdmin
    .from("monthly_summaries")
    .select("summary_text, windows_json")
    .eq("reading_id", readingId)
    .eq("year", year)
    .eq("month", month)
    .maybeSingle();
  if (cached?.summary_text) {
    return composeMonthContent(cached.summary_text, (cached.windows_json as MonthWindow[]) ?? []);
  }

  const windows = getFastWindows(chart, year, month);
  const power = windows.slice(0, 5);
  if (power.length === 0) return null;

  const windowList = power.map(w => ({
    key: `${w.transitPlanet}-${w.aspectType}-${w.natalPoint}`,
    phrase: transitPhrase(w), start: w.start, peak: w.peak, end: w.end,
    character: w.character, category: w.category, lengthDays: w.lengthDays,
  }));
  const context = windowList.map(w =>
    `- [${w.key}] ${w.phrase} | ${w.character} | ${w.start}–${w.end} (peak ${w.peak}, ${w.lengthDays} dni)`
  ).join("\n");

  type AiResult = { windows: Array<{ key: string; sentence: string }>; synthesis: string };
  let result: AiResult | null = null;
  for (const model of [HAIKU, SONNET]) {
    const raw = await aiComplete({
      model,
      system: MONTH_PROMPT,
      messages: [{ role: "user", content: `Miesiąc: ${year}-${String(month).padStart(2, "0")}\n\nOkna:\n${context}` }],
      maxTokens: 600,
      task: "monthly-summary",
    });
    const m = raw.match(/\{[\s\S]*\}/);
    const obj = JSON.parse(m ? m[0] : raw) as Partial<AiResult>;
    if (!obj?.synthesis || !Array.isArray(obj?.windows)) continue;
    if (containsForeignScript(obj.synthesis) || !endsWithSentence(obj.synthesis)) continue;
    result = obj as AiResult;
    break;
  }
  if (!result) return null;

  const sentenceMap = new Map(result.windows.map(w => [w.key, w.sentence]));
  const enriched = windowList.map(w => ({ ...w, sentence: sentenceMap.get(w.key) ?? null }));

  await supabaseAdmin.from("monthly_summaries").upsert({
    user_id: userId, reading_id: readingId, year, month,
    windows_json: enriched, summary_text: result.synthesis, generated_at: new Date().toISOString(),
  });
  return composeMonthContent(result.synthesis, enriched);
}
