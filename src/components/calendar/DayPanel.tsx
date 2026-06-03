"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Astronomy from "astronomy-engine";
import { longitudeToSign } from "@/lib/astro-types";
import type { NatalChart } from "@/lib/astro-types";
import type { DayData, TransitAspect } from "@/lib/chart-engine";
import type { CalendarFilter } from "@/components/calendar/IntentionFilter";
import { MOON_PHASE_INFO, getRitualPrompt } from "@/lib/moonPhases";
import { CosmoIcon } from "@/components/CosmoIcon";
import { useAuth } from "@/components/AuthContext";
import DailyReading from "@/components/generate/DailyReading";
import { X, Moon, TrendingUp, AlertTriangle, Pencil } from "lucide-react";

// ── Polish instrumental case for planet names (after "z") ──────────────────
const PLANET_INSTR: Record<string, string> = {
  "Słońce":  "Słońcem",
  "Księżyc": "Księżycem",
  "Merkury": "Merkurym",
  "Wenus":   "Wenus",
  "Mars":    "Marsem",
  "Jowisz":  "Jowiszem",
  "Saturn":  "Saturnem",
  "Uran":    "Uranem",
  "Neptun":  "Neptunem",
  "Pluton":  "Plutonem",
};
const PLANET_INSTR_ARTICLE: Record<string, string> = { "Wenus": "Twoją" };

function natalPhrase(planet: string): string {
  const article = PLANET_INSTR_ARTICLE[planet] ?? "Twoim";
  return `${article} ${PLANET_INSTR[planet] ?? planet}`;
}

function transitToText(t: TransitAspect): string {
  const verb = t.favorable ? "harmonizuje z" : "tworzy napięcie z";
  return `${t.transit_planet} w ${t.transit_sign} ${verb} ${natalPhrase(t.natal_planet)}`;
}

// ── What each transit planet enables / warns about ─────────────────────────
const SUPPORTING_ENABLES: Record<string, string> = {
  "Słońce":   "dobry moment na pewność siebie, widoczność i ważne decyzje",
  "Księżyc":  "sprzyja emocjonalnemu kontaktowi z bliskimi i z samym sobą",
  "Merkury":  "jasne myślenie, dobry czas na ważne rozmowy i decyzje",
  "Wenus":    "relacje, wyrażanie uczuć, a także decyzje finansowe",
  "Mars":     "energia i napęd — dobry moment na push i realizację planów",
  "Jowisz":   "okno na odważniejszy ruch, nowe możliwości i ekspansję",
  "Saturn":   "dobry czas na zamknięcie zaległości i poważne zobowiązania",
  "Uran":     "nieoczekiwane przełomy mogą działać na Twoją korzyść",
  "Neptun":   "twórcze myślenie, intuicja i refleksja są silne",
  "Pluton":   "głęboki wgląd w siebie i przełomowe zmiany",
};

const CHALLENGING_WATCH: Record<string, string> = {
  "Mars":     "słowa mogą wychodzić ostrzej niż zamierzasz — świadoma komunikacja",
  "Saturn":   "więcej ograniczeń i ciężaru niż zwykle — cierpliwość popłaca",
  "Neptun":   "mglistsze myślenie — unikaj ważnych decyzji, daj sobie czas",
  "Pluton":   "intensywne emocje i napięcia pod powierzchnią — pilnuj reakcji",
  "Uran":     "niestabilność i nieoczekiwane zakłócenia — elastyczność w cenie",
  "Księżyc":  "nastroje mogą być zmienne — daj sobie przestrzeń na uczucia",
  "Merkury":  "łatwo o nieporozumienia — sprawdzaj szczegóły, dopytuj",
  "Słońce":   "ego i konflikty mogą eskalować — pilnuj partnerskich relacji",
  "Wenus":    "napięcia w relacjach lub sprawach finansowych wymagają uwagi",
  "Jowisz":   "nadmierny optymizm może mylić — sprawdzaj realia przed ruchem",
};

// ── Contextual reflective questions linked to transit planet ───────────────
const TRANSIT_QUESTIONS: Record<string, string[]> = {
  "Wenus": [
    "Co chciałbyś powiedzieć komuś bliskim, a jeszcze tego nie powiedziałeś?",
    "Co sprawia Ci prawdziwą przyjemność — i kiedy ostatnio to poczułeś?",
    "Jak chcesz, żeby bliscy Cię dziś doświadczyli?",
    "Gdzie w związkach chcesz więcej głębokości, a dajesz tylko powierzchowność?",
    "Co wartościowego masz w swoim życiu, czego nie dostrzegasz na co dzień?",
    "Jak możesz dziś wyrazić wdzięczność komuś, kto jest dla Ciebie ważny?",
    "Czego szukasz w relacjach — i czy dajesz to samo, czego oczekujesz?",
  ],
  "Mars": [
    "Co chcesz zainicjować, a wciąż odkładasz?",
    "Na jaki jeden konkretny krok masz dziś energię?",
    "Gdzie zatrzymuje Cię strach przed oceną innych?",
    "Co chcesz osiągnąć w najbliższym tygodniu — i co Cię powstrzymuje?",
    "Jak reagujesz, gdy ktoś przekracza Twoje granice — i czy to działa?",
    "Gdzie dziś możesz być odważniejszy niż zwykle?",
    "Co zrobiłbyś inaczej, gdybyś wiedział, że nie możesz przegrać?",
  ],
  "Księżyc": [
    "Co czujesz, a starasz się nie czuć?",
    "Czego emocjonalnie potrzebujesz dziś od siebie?",
    "Kto lub co potrzebuje dziś Twojej uwagi — czy to przypadkiem Ty?",
    "Jakie emocje niesiesz ze sobą od ostatnich dni — czy je rozpoznajesz?",
    "Co przypomina Ci o bezpieczeństwie, gdy świat wydaje się trudny?",
    "Czego dziś potrzebuje Twoje wewnętrzne dziecko?",
    "Które relacje odżywiają Cię emocjonalnie, a które wysysają energię?",
  ],
  "Słońce": [
    "Gdzie masz poczucie, że nie jesteś sobą — i co za tym stoi?",
    "Jaka wersja Ciebie chce się dziś wyrazić?",
    "Co daje Ci dziś poczucie siły i sensu?",
    "Jak wygląda dzień, w którym jesteś w pełni sobą?",
    "Co w Tobie jest wyjątkowe — i czy pozwalasz innym to widzieć?",
    "Czego dziś szukasz — uznania, celu czy po prostu spokoju?",
    "Kiedy ostatnio zrobiłeś coś tylko dla siebie, bez oglądania się na innych?",
  ],
  "Merkury": [
    "Jaką ważną rozmowę odkładasz?",
    "Co chciałbyś wyrazić wprost, a zamiast tego owijasz w bawełnę?",
    "Jaka decyzja domaga się Twojej uwagi — i czemu jej jeszcze nie podjąłeś?",
    "Czy jest coś, co mówisz innym, ale nie mówisz sobie?",
    "Jaką informację masz, a nie wiesz jak ją przekazać?",
    "Co zrozumiałeś ostatnio, co zmieniło Twój sposób myślenia?",
    "Które przekonanie na swój temat chciałbyś zweryfikować?",
  ],
  "Jowisz": [
    "Na jaki odważny ruch jest teraz czas?",
    "Gdzie w swoim życiu zachowujesz się zbyt ostrożnie?",
    "Co możesz zaoferować innym z nadwyżki swoich zasobów i energii?",
    "Jaką możliwość ignorujesz, bo wydaje się zbyt duża?",
    "W którym kierunku chciałbyś rosnąć w ciągu najbliższego roku?",
    "Co się wydarzy za 5 lat, jeśli będziesz działał tak jak teraz?",
    "Co daje Ci poczucie, że życie jest większe niż codzienność?",
  ],
  "Saturn": [
    "Którą ważną rzecz odkładasz, bo wydaje się za trudna?",
    "Co warto teraz zakończyć, żeby zrobić miejsce na coś nowego?",
    "Czego nie chcesz widzieć, bo zmusiłoby Cię to do zmiany?",
    "Jaką odpowiedzialność unikasz i co Cię to kosztuje?",
    "Co zbudowałeś w ostatnim roku, z czego jesteś naprawdę dumny?",
    "Gdzie w życiu brakuje Ci dyscypliny — i dlaczego się jej opierasz?",
    "Jaka granica jest potrzebna w Twoim życiu, a jeszcze jej nie postawiłeś?",
  ],
  "Uran": [
    "Co by się zmieniło, gdybyś zrobił coś zupełnie inaczej niż zwykle?",
    "Które zasady zasługują na kwestionowanie — w Twoim życiu lub wokół Ciebie?",
    "Gdzie czujesz, że chcesz wyrwać się z schematu?",
    "Co Cię ogranicza — tradycja, oczekiwania czy własna historia?",
    "Jaką nieoczekiwaną zmianę mógłbyś przyjąć jako szansę?",
  ],
  "Neptun": [
    "Jakie marzenie przestałeś słuchać — i dlaczego?",
    "Co by się zmieniło, gdybyś zaufał intuicji zamiast logice?",
    "Gdzie potrzebujesz więcej miękkości wobec siebie?",
    "Co wyobrażasz sobie, gdy myślisz o idealnym życiu — i co Cię od niego dzieli?",
    "Która część Ciebie jest bardziej wrażliwa niż pokazujesz na zewnątrz?",
    "Co przynosi Ci głęboki spokój — i ile czasu temu poświęcasz?",
    "Gdzie zatracasz granicę między swoimi a cudzymi potrzebami?",
  ],
  "Pluton": [
    "Co w Tobie jest gotowe na zmianę — nawet jeśli to boli?",
    "Czego się trzymasz, choć wiesz już, że czas to puścić?",
    "Co kryje się pod sytuacją, którą wciąż omijasz wzrokiem?",
    "Jaką władzę oddajesz innym — świadomie lub nie?",
    "Co chcesz przekształcić w sobie, zanim skończy się ten rok?",
    "Gdzie nosisz ciężar, który nie jest Twój?",
    "Co byś zrobił, gdybyś nie bał się straty?",
  ],
};

const GENERAL_QUESTIONS = [
  "Czego naprawdę potrzebujesz dziś od siebie?",
  "Co byś zrobił, gdybyś nie bał się oceny innych?",
  "Jaką jedną rzecz możesz dziś puścić?",
  "Gdzie marnujesz energię zamiast ją inwestować?",
  "Co chciałbyś zapamiętać z tego okresu swojego życia?",
];

function getContextualQuestion(supporting: TransitAspect | null, dayOfYear: number): string {
  if (supporting) {
    const pool = TRANSIT_QUESTIONS[supporting.transit_planet];
    if (pool) return pool[dayOfYear % pool.length];
  }
  return GENERAL_QUESTIONS[dayOfYear % GENERAL_QUESTIONS.length];
}

// ── Significance levels ────────────────────────────────────────────────────
type SigLevel = "exceptional" | "notable" | "minor" | "quiet";

const FILTER_BADGE: Record<CalendarFilter, Record<SigLevel, string>> = {
  all:    { exceptional: "★ Wyjątkowy dzień",          notable: "✦ Wyraźny sygnał",          minor: "Mały sygnał",                quiet: "Spokojny dzień" },
  love:   { exceptional: "★ Wyjątkowy dzień miłosny",  notable: "✦ Sygnał w miłości",         minor: "Delikatny sygnał miłosny",   quiet: "Spokojny dzień miłosny" },
  career: { exceptional: "★ Wyjątkowy dzień kariery",  notable: "✦ Sygnał dla kariery",       minor: "Delikatny sygnał kariery",   quiet: "Spokojny dzień kariery" },
  energy: { exceptional: "★ Wyjątkowy dzień energii",  notable: "✦ Sygnał energii",           minor: "Delikatny sygnał energii",   quiet: "Spokojny dzień energii" },
  mind:   { exceptional: "★ Wyjątkowy dzień myślenia", notable: "✦ Sygnał komunikacji",       minor: "Delikatny sygnał myślenia",  quiet: "Spokojny dzień myślenia" },
};

const FILTER_AREA: Record<CalendarFilter, string> = {
  all:    "Twojego kosmogramu",
  love:   "miłości i relacji",
  career: "kariery i działania",
  energy: "energii i działania",
  mind:   "komunikacji i myślenia",
};

function buildDescription(
  level: SigLevel,
  filter: CalendarFilter,
  supporting: TransitAspect | null,
  challenging: TransitAspect | null,
): string {
  if (level === "quiet") {
    const area = filter !== "all" ? `obszarze ${FILTER_AREA[filter]}` : "Twoim kosmogramie";
    return `Żaden tranzyt nie aktywuje wyraźnie Twojego kosmogramu w ${area}. Spokojne dni są równie wartościowe — naturalna pauza, dobry moment na ciszę bez zewnętrznego ciśnienia planet.`;
  }

  const parts: string[] = [];
  if (supporting) {
    const text = SUPPORTING_ENABLES[supporting.transit_planet];
    if (text) parts.push(text.charAt(0).toUpperCase() + text.slice(1) + ".");
  }
  if (challenging) {
    const text = CHALLENGING_WATCH[challenging.transit_planet];
    if (text) parts.push(text.charAt(0).toUpperCase() + text.slice(1) + ".");
  }
  if (parts.length > 0) return parts.join(" ");

  if (level === "exceptional") return `Silne tranzyty aktywują kluczowe planety ${FILTER_AREA[filter]}.`;
  if (level === "notable")     return `Planety tworzą zauważalne wzorce w obszarze ${FILTER_AREA[filter]}.`;
  return `Subtelna energia planetarna aktywuje Twój kosmogram.`;
}

function getEffectiveScore(dayData: DayData | undefined, filter: CalendarFilter): number {
  if (!dayData) return 0;
  if (filter === "love")   return dayData.intentionScores.love;
  if (filter === "career") return dayData.intentionScores.career;
  if (filter === "energy") return dayData.intentionScores.energy;
  if (filter === "mind")   return dayData.intentionScores.mind;
  return dayData.score;
}

function getSignificance(
  score: number,
  filter: CalendarFilter,
  supporting: TransitAspect | null,
  challenging: TransitAspect | null,
): {
  level: SigLevel;
  badge: string;
  description: string;
  generateLabel: string;
  border: string;
  badgeClass: string;
} {
  const level: SigLevel = score >= 8 ? "exceptional" : score >= 5 ? "notable" : score >= 3 ? "minor" : "quiet";
  const badge = FILTER_BADGE[filter][level];
  const description = buildDescription(level, filter, supporting, challenging);

  const border      = level === "exceptional" ? "border-amber-500/40" : level === "notable" ? "border-amber-700/30" : "border-white/10";
  const badgeClass  = level === "exceptional"
    ? "text-amber-200 bg-amber-900/40 border border-amber-500/40"
    : level === "notable"
    ? "text-amber-300/80 bg-amber-900/20 border border-amber-700/30"
    : level === "minor"
    ? "text-slate-400 bg-white/5 border border-white/10"
    : "text-slate-500 bg-transparent border border-white/10";
  const generateLabel = level === "exceptional"
    ? "★ Wygeneruj interpretację — szczególnie wartościowe dziś"
    : level === "notable"
    ? "Wygeneruj pogłębioną interpretację AI"
    : level === "minor"
    ? "Wygeneruj interpretację AI"
    : "Wygeneruj ogólny horoskop na ten dzień";

  return { level, badge, description, generateLabel, border, badgeClass };
}

// ── Helpers ────────────────────────────────────────────────────────────────
function getMoonSign(date: Date): string {
  const geo = Astronomy.GeoVector(Astronomy.Body.Moon, date, false);
  const ecl = Astronomy.Ecliptic(geo);
  return longitudeToSign(((ecl.elon % 360) + 360) % 360).name;
}

function getDayOfYear(date: Date): number {
  return Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
}

function formatDatePL(dateStr: string): string {
  return new Date(dateStr + "T12:00:00Z").toLocaleDateString("pl-PL", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

// ── Component ──────────────────────────────────────────────────────────────
type Props = {
  date: string;
  dayData?: DayData;
  chart: NatalChart;
  readingId: string;
  promptContext: string;
  interpretation: string;
  filter: CalendarFilter;
  onClose: () => void;
};

export default function DayPanel({ date, dayData, chart, readingId, promptContext, interpretation, filter, onClose }: Props) {
  const { session } = useAuth();
  const effectiveScore = getEffectiveScore(dayData, filter);
  const dateObj   = new Date(date + "T12:00:00Z");
  const moonSign  = getMoonSign(dateObj);
  const dayOfYear = getDayOfYear(dateObj);
  const supporting  = (effectiveScore >= 3 ? dayData?.topSupporting  : null) ?? null;
  const challenging = (effectiveScore >= 3 ? dayData?.topChallenging : null) ?? null;
  const sig = getSignificance(effectiveScore, filter, supporting, challenging);
  const question = getContextualQuestion(supporting, dayOfYear);
  const moonPhase = dayData?.moonPhase ?? null;
  const moonPhaseInfo = moonPhase ? MOON_PHASE_INFO[moonPhase] : null;
  const ritualPrompt  = moonPhase ? getRitualPrompt(moonPhase, dayOfYear) : null;

  const [readingText, setReadingText] = useState("");
  const [dateLabel, setDateLabel] = useState(formatDatePL(date));
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [note, setNote] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteLoaded, setNoteLoaded] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const authHeader: Record<string, string> = session ? { Authorization: `Bearer ${session.access_token}` } : {};

  useEffect(() => {
    setReadingText("");
    setGenError("");
    if (!session) return;
    fetch(`/api/calendar-note?date=${date}&reading_id=${readingId}`, { headers: authHeader })
      .then(r => r.json())
      .then(({ note_text }) => { setNote(note_text ?? ""); setNoteLoaded(true); })
      .catch(() => setNoteLoaded(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, readingId, session]);

  const saveNote = useCallback((text: string) => {
    if (!session) return;
    setNoteSaving(true);
    fetch("/api/calendar-note", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({ date, reading_id: readingId, note_text: text }),
    }).finally(() => setNoteSaving(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, readingId, session]);

  function handleNoteChange(text: string) {
    setNote(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveNote(text), 400);
  }

  async function handleGenerate() {
    if (!session) return;
    setGenerating(true);
    setGenError("");
    try {
      const birth = chart.birthData;
      const chartRes = await fetch("/api/chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: birth.date, time: birth.time, place: birth.place, lat: birth.lat, lng: birth.lng, timeUnknown: birth.timeUnknown }),
      });
      if (!chartRes.ok) throw new Error("Błąd danych kosmogramu");
      const { promptContext: ctx } = await chartRes.json() as { promptContext: string };

      const res = await fetch("/api/daily-reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptContext: ctx || promptContext,
          interpretationContext: interpretation,
          timezone: birth.timezone,
          chartData: chart,
          targetDate: date,
        }),
      });
      if (!res.ok) throw new Error("Błąd generowania");
      const { dailyReading, dateLabel: dl } = await res.json() as { dailyReading: string; dateLabel: string };
      setReadingText(dailyReading);
      setDateLabel(dl || formatDatePL(date));
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Nieznany błąd");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className={`glass-card rounded-2xl border overflow-hidden ${sig.border}`}>
      {/* ── Header ── */}
      <div className={`flex items-center justify-between px-5 py-4 border-b border-white/6 ${sig.level === "exceptional" ? "bg-amber-900/10" : ""}`}>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-0.5">Wybrany dzień</p>
          <h3 className={`text-base font-semibold capitalize ${sig.level === "exceptional" ? "text-amber-100" : "text-white"}`}>
            {formatDatePL(date)}
          </h3>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* ── Significance badge + Moon ── */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${sig.badgeClass}`}>
            {sig.badge}
          </span>
          <div className="flex items-center gap-1.5 text-sm text-slate-400">
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Księżyc w <span className="text-indigo-300 font-medium">{moonSign}</span></span>
          </div>
        </div>

        {/* ── Day description ── */}
        <p className={`text-sm leading-relaxed ${sig.level === "quiet" ? "text-slate-500" : "text-slate-400"}`}>
          {sig.description}
        </p>

        {/* ── Transit cards — only for significant days ── */}
        {effectiveScore >= 3 && (supporting || challenging) && (
          <div className="space-y-2">
            {supporting && (
              <div className="flex gap-3 p-3.5 rounded-xl bg-emerald-900/15 border border-emerald-800/25">
                <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-emerald-400/80 uppercase tracking-wider mb-1">Co sprzyja</p>
                  <p className="text-sm text-slate-200 leading-relaxed">{transitToText(supporting)}</p>
                  <p className="text-xs text-emerald-300/70 mt-1">{SUPPORTING_ENABLES[supporting.transit_planet]}</p>
                </div>
              </div>
            )}
            {challenging && (
              <div className="flex gap-3 p-3.5 rounded-xl bg-amber-900/10 border border-amber-800/20">
                <AlertTriangle className="w-4 h-4 text-amber-400/70 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-amber-400/60 uppercase tracking-wider mb-1">Na co uważać</p>
                  <p className="text-sm text-slate-200 leading-relaxed">{transitToText(challenging)}</p>
                  <p className="text-xs text-amber-300/60 mt-1">{CHALLENGING_WATCH[challenging.transit_planet]}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Moon ritual (replaces question on phase days) ── */}
        {moonPhaseInfo && ritualPrompt ? (
          <div className="rounded-xl bg-indigo-950/40 border border-indigo-700/30 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{moonPhaseInfo.symbol}</span>
              <div>
                <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                  {moonPhaseInfo.label}
                </p>
                <p className="text-[11px] text-indigo-400/70">{moonPhaseInfo.purpose}</p>
              </div>
            </div>
            <p className="text-sm text-slate-200 italic leading-relaxed">&ldquo;{ritualPrompt}&rdquo;</p>
            <p className="text-[11px] text-slate-600 mt-2.5">Zapisz swoją odpowiedź w notatce poniżej ↓</p>
          </div>
        ) : (
          /* ── Regular reflective question ── */
          <div className="rounded-xl bg-white/4 border border-white/8 p-4">
            <p className="text-[10px] text-slate-600 uppercase tracking-widest font-medium mb-2 flex items-center gap-1.5">
              <Pencil className="w-3 h-3" />
              {effectiveScore >= 5
                ? "Pytanie refleksyjne — na podstawie dzisiejszej energii"
                : "Pytanie na ten dzień"}
            </p>
            <p className="text-sm text-slate-300 italic leading-relaxed">&ldquo;{question}&rdquo;</p>
            <p className="text-[11px] text-slate-600 mt-2.5">
              Zapisz swoją odpowiedź lub przemyślenia w notatce poniżej ↓
            </p>
          </div>
        )}

        {/* ── Divider ── */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

        {/* ── Generate / Reading ── */}
        {!readingText ? (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50 ${
              sig.level === "exceptional"
                ? "bg-amber-700/40 border border-amber-500/40 text-amber-100 hover:bg-amber-600/50"
                : "bg-amber-900/20 border border-amber-700/30 text-amber-200 hover:bg-amber-800/30"
            }`}
          >
            {generating
              ? <span className="w-4 h-4 border-2 border-amber-300/25 border-t-amber-300 rounded-full animate-spin" />
              : <CosmoIcon className="w-4 h-4" />}
            {generating ? "Interpretuję tranzyty…" : sig.generateLabel}
          </button>
        ) : (
          <>
            <DailyReading text={readingText} loading={generating} dateLabel={dateLabel} />
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1"
            >
              <CosmoIcon className="w-3 h-3" /> Generuj ponownie
            </button>
          </>
        )}

        {genError && <p className="text-xs text-red-400">{genError}</p>}

        {/* ── Note ── */}
        {noteLoaded && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500 uppercase tracking-widest">Twoja notatka</p>
              {noteSaving && <span className="text-[10px] text-slate-600 animate-pulse">Zapisuję…</span>}
            </div>
            <textarea
              value={note}
              onChange={e => handleNoteChange(e.target.value)}
              placeholder={
                effectiveScore >= 5
                  ? "Co czujesz / co chcesz zapamiętać z tego szczególnego dnia…"
                  : "Twoje przemyślenia, odpowiedź na pytanie…"
              }
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-700/50 resize-none transition-all"
            />
          </div>
        )}
      </div>
    </div>
  );
}
