import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { hasActiveSubscription } from "@/lib/subscription";
import { getFastWindows } from "@/lib/astro/layers";
import { aiComplete, correctCalendarText, AiDisabledError } from "@/lib/deepseek";
import { transitPhrase } from "@/lib/i18n/astro";
import { containsForeignScript, endsWithSentence, containsPlanetOrSign } from "@/lib/text-validation";
import { STYLE_BLOCK } from "@/lib/moduleSpecs";
import type { NatalChart } from "@/lib/astro-types";
import { z } from "zod";

export const runtime = "nodejs";

const BodySchema = z.object({
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),  // ISO Monday of the week
  reading_id: z.string().uuid(),
});

function getISOWeekKey(weekStartISO: string): string {
  const d = new Date(weekStartISO + "T12:00:00Z");
  // Shift to Thursday of the week (ISO week year = year of Thursday)
  const thu = new Date(d);
  thu.setUTCDate(d.getUTCDate() + 3);
  const yearStart = new Date(Date.UTC(thu.getUTCFullYear(), 0, 1));
  const weekNum   = Math.ceil(((thu.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${thu.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

function addDays(date: Date, n: number): Date {
  return new Date(date.getTime() + n * 86_400_000);
}

const SYSTEM_PROMPT = `Jesteś astrolożką. Opisz charakter tygodnia w 3–4 zdaniach.

ZASADY (bezwzględne):
- Pisz w 2. osobie czasu teraźniejszego: "masz", "czujesz", "możesz"
- Każde zdanie = jeden konkretny fakt lub praktyczna wskazówka — bez metafor
- Cytuj planety i znaki z podanego kontekstu
- Poprawna polszczyzna — sprawdź formy gramatyczne przed odpowiedzią
- Zakaz poetyckich obrazów i ozdobników
- Zakaz pytań retorycznych

${STYLE_BLOCK}`;

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

  const { week_start, reading_id: readingId } = body.data;
  const isoWeek = getISOWeekKey(week_start);

  // Cache check
  const { data: cached } = await supabaseAdmin
    .from("week_interpretations")
    .select("content")
    .eq("reading_id", readingId)
    .eq("iso_week", isoWeek)
    .maybeSingle();

  if (cached) return NextResponse.json({ content: cached.content, cached: true });

  // Verify ownership + get natal chart
  const { data: reading } = await supabaseAdmin
    .from("readings")
    .select("chart_data")
    .eq("id", readingId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!reading?.chart_data) return NextResponse.json({ error: "Brak kosmogramu" }, { status: 404 });

  const chart = reading.chart_data as NatalChart;

  // Collect windows covering this week (may span month boundary)
  const weekStart  = new Date(week_start + "T12:00:00Z");
  const weekEnd    = addDays(weekStart, 6);
  const seen       = new Set<string>();
  const allWindows = [];

  for (const d of [weekStart, weekEnd]) {
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    for (const w of getFastWindows(chart, y, m)) {
      const key = `${w.transitPlanet}-${w.aspectType}-${w.natalPoint}`;
      if (!seen.has(key) && w.peak >= week_start && w.peak <= (week_start.slice(0, 7) + "-31")) {
        seen.add(key);
        allWindows.push(w);
      }
    }
  }

  const topWindows = allWindows
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const windowLines = topWindows.map(w =>
    `${w.transitPlanet} ${transitPhrase(w)} (${w.character}, peak ${w.peak})`
  ).join("\n");

  const context = `Tydzień ${isoWeek} (${week_start} – ${weekEnd.toISOString().slice(0, 10)})\nOkna tranzytowe:\n${windowLines || "brak znaczących okien"}`;

  try {
    let content = "";
    const models = ["claude-haiku-4-5-20251001", "claude-haiku-4-5-20251001", "claude-sonnet-4-6"];
    for (const model of models) {
      const candidate = await aiComplete({
        model,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: `Opisz energię tego tygodnia:\n\n${context}` }],
        maxTokens: 500,
        task: "week-interpretation",
      });
      if (!containsForeignScript(candidate) && endsWithSentence(candidate) && containsPlanetOrSign(candidate)) {
        content = candidate;
        break;
      }
    }
    if (content) content = await correctCalendarText(content, "week-interpretation");
    if (!content) return NextResponse.json({ error: "Błąd jakości AI" }, { status: 500 });

    await supabaseAdmin.from("week_interpretations").upsert({
      user_id:       user.id,
      reading_id:    readingId,
      iso_week:      isoWeek,
      content,
      transits_used: topWindows,
      prompt_version: "1",
      model:         "claude-haiku-4-5-20251001",
    });

    return NextResponse.json({ content, cached: false });

  } catch (err) {
    if (err instanceof AiDisabledError) return NextResponse.json({ error: "AI tymczasowo niedostępne" }, { status: 503 });
    return NextResponse.json({ error: "Błąd generowania" }, { status: 500 });
  }
}
