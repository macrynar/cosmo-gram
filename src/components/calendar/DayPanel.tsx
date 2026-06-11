"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Astronomy from "astronomy-engine";
import { longitudeToSign } from "@/lib/astro-types";
import type { NatalChart } from "@/lib/astro-types";
import type { DayData, TransitAspect } from "@/lib/chart-engine";
import type { PowerDay } from "@/lib/astro/powerDays";
import type { DayClass } from "@/lib/astro/dayClasses";
import { MOON_PHASE_INFO, getRitualPrompt } from "@/lib/moonPhases";
import { CosmoIcon } from "@/components/CosmoIcon";
import { useAuth } from "@/components/AuthContext";
import DailyReading from "@/components/generate/DailyReading";
import { motion } from "framer-motion";
import { X, Moon, TrendingUp, AlertTriangle, Pencil, Lock, Zap } from "lucide-react";
import {
  SIGN_LOCATIVE, ASPECT_LABEL_PL, PLANET_GENITIVE,
  natalInstrumental, inSign,
} from "@/lib/i18n/astro";
import type { Transit } from "@/lib/astro/transits";

// ── Helpers ─────────────────────────────────────────────────────────────────

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

// Declension-aware transit sentence: "Jowisz w Byku trygon do natalnego Saturna w Koziorożcu"
function transitHeadline(t: Transit): string {
  const aspect = ASPECT_LABEL_PL[t.aspectType] ?? t.aspectType;
  const natalSign = SIGN_LOCATIVE[t.natalSign] ?? t.natalSign;
  return `${t.transitPlanet} ${inSign(t.transitSign)} — ${aspect} do natalnego ${PLANET_GENITIVE[t.natalPoint] ?? t.natalPoint} w ${natalSign}`;
}

// Older DayData transit → text (for sprzyja/uważaj sections)
function transitToText(t: TransitAspect): string {
  const verb = t.favorable ? "harmonizuje z" : "tworzy napięcie z";
  return `${t.transit_planet} ${inSign(t.transit_sign)} ${verb} ${natalInstrumental(t.natal_planet)}`;
}

// ── Static text maps (replaces AI for non-significant days) ──────────────────

const SUPPORTING_ENABLES: Record<string, string> = {
  "Słońce":   "dobry moment na pewność siebie i ważne decyzje",
  "Księżyc":  "sprzyja emocjonalnemu kontaktowi z bliskimi i z samym sobą",
  "Merkury":  "jasne myślenie, dobry czas na ważne rozmowy",
  "Wenus":    "relacje, wyrażanie uczuć, decyzje finansowe",
  "Mars":     "energia i napęd — dobry moment na push",
  "Jowisz":   "okno na nowe możliwości i odważniejszy ruch",
  "Saturn":   "dobry czas na domknięcie zaległości i zobowiązania",
  "Uran":     "nieoczekiwane przełomy mogą działać na Twoją korzyść",
  "Neptun":   "twórcze myślenie i intuicja są dziś silne",
  "Pluton":   "głęboki wgląd i możliwość przełomowej zmiany",
};

const CHALLENGING_WATCH: Record<string, string> = {
  "Mars":     "słowa mogą wychodzić ostrzej — świadoma komunikacja",
  "Saturn":   "więcej ograniczeń niż zwykle — cierpliwość popłaca",
  "Neptun":   "mglistsze myślenie — unikaj ważnych decyzji",
  "Pluton":   "intensywne napięcia pod powierzchnią — pilnuj reakcji",
  "Uran":     "niestabilność i nieoczekiwane zakłócenia — elastyczność",
  "Księżyc":  "nastroje mogą być zmienne — daj sobie przestrzeń",
  "Merkury":  "łatwo o nieporozumienia — sprawdzaj szczegóły",
  "Słońce":   "konflikty mogą eskalować — pilnuj relacji",
  "Wenus":    "napięcia w relacjach wymagają uwagi",
  "Jowisz":   "nadmierny optymizm może mylić — sprawdzaj realia",
};

const TRANSIT_QUESTIONS: Record<string, string[]> = {
  "Jowisz": ["Na jaki odważny ruch jest teraz czas?", "Jaką możliwość ignorujesz, bo wydaje się zbyt duża?", "Gdzie w swoim życiu zachowujesz się zbyt ostrożnie?"],
  "Saturn": ["Którą ważną rzecz odkładasz, bo wydaje się za trudna?", "Co warto teraz zakończyć, żeby zrobić miejsce na coś nowego?", "Jaką odpowiedzialność unikasz?"],
  "Pluton": ["Co w Tobie jest gotowe na zmianę — nawet jeśli to boli?", "Czego się trzymasz, choć wiesz że czas to puścić?", "Co chcesz przekształcić w sobie do końca roku?"],
  "Neptun": ["Jakie marzenie przestałeś słuchać?", "Co by się zmieniło, gdybyś zaufał intuicji zamiast logice?", "Gdzie potrzebujesz więcej miękkości wobec siebie?"],
  "Uran":   ["Co by się zmieniło, gdybyś zrobił coś zupełnie inaczej niż zwykle?", "Gdzie czujesz, że chcesz wyrwać się z schematu?", "Jaką nieoczekiwaną zmianę możesz przyjąć jako szansę?"],
  "Mars":   ["Co chcesz zainicjować, a wciąż odkładasz?", "Na jaki jeden konkretny krok masz dziś energię?", "Gdzie dziś możesz być odważniejszy niż zwykle?"],
  "Wenus":  ["Co chciałbyś powiedzieć komuś bliskim, a jeszcze tego nie powiedziałeś?", "Jak chcesz, żeby bliscy Cię dziś doświadczyli?"],
  "Księżyc":["Co czujesz, a starasz się nie czuć?", "Czego emocjonalnie potrzebujesz dziś od siebie?"],
  "Słońce": ["Jaka wersja Ciebie chce się dziś wyrazić?", "Co daje Ci dziś poczucie siły i sensu?"],
  "Merkury":["Jaką ważną rozmowę odkładasz?", "Co chciałbyś wyrazić wprost, a zamiast tego owijasz w bawełnę?"],
};

const NORMAL_SENTENCES = [
  "Spokojny dzień bez silnych tranzytów — dobry czas na regenerację i domykanie drobiazgów.",
  "Planety nie tworzą dziś wyraźnych akcentów w Twoim kosmogramie — naturalna pauza.",
  "Cichy dzień energetycznie — dobry moment na rutynę, odpoczynek i porządkowanie.",
  "Brak aktywnych tranzytów. Niskie tło planetarne — dobry czas na spokojną pracę.",
  "Spokojny dzień. Dobry na zadania, które wymagają skupienia bez zewnętrznego bodźca.",
];

function getReflectionQuestion(transit: TransitAspect | null, dayOfYear: number): string {
  if (transit) {
    const pool = TRANSIT_QUESTIONS[transit.transit_planet];
    if (pool) return pool[dayOfYear % pool.length];
  }
  return "Czego naprawdę potrzebujesz dziś od siebie?";
}

// ── Props ────────────────────────────────────────────────────────────────────

type Props = {
  date:       string;
  dayData?:   DayData;
  chart:      NatalChart;
  readingId:  string;
  dayClass:   DayClass;
  powerDay?:  PowerDay;
  isPremium:  boolean;
  onClose:    () => void;
};

// ── Component ────────────────────────────────────────────────────────────────

export default function DayPanel({
  date, dayData, chart, readingId, dayClass, powerDay, isPremium, onClose,
}: Props) {
  const { session } = useAuth();
  const dateObj   = new Date(date + "T12:00:00Z");
  const moonSign  = getMoonSign(dateObj);
  const dayOfYear = getDayOfYear(dateObj);
  const moonPhase = dayData?.moonPhase ?? null;
  const moonPhaseInfo = moonPhase ? MOON_PHASE_INFO[moonPhase] : null;
  const ritualPrompt  = moonPhase ? getRitualPrompt(moonPhase, dayOfYear) : null;

  const supporting  = (dayData?.score ?? 0) >= 3 ? (dayData?.topSupporting  ?? null) : null;
  const challenging = (dayData?.score ?? 0) >= 3 ? (dayData?.topChallenging ?? null) : null;
  const question    = getReflectionQuestion(supporting, dayOfYear);

  const authHeader: Record<string, string> = session ? { Authorization: `Bearer ${session.access_token}` } : {};

  // ── State ──
  const [note, setNote]               = useState("");
  const [noteSaving, setNoteSaving]   = useState(false);
  const [noteLoaded, setNoteLoaded]   = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // State for "significant" day on-demand interpretation
  const [sigContent, setSigContent]   = useState<string | null>(null);
  const [sigLoading, setSigLoading]   = useState(false);
  const [sigError, setSigError]       = useState("");

  // State for legacy daily-reading (power/exceptional days on-demand fallback)
  const [readingText, setReadingText] = useState("");
  const [generating, setGenerating]   = useState(false);
  const [genError, setGenError]       = useState("");

  // ── Load note + check cache ──
  useEffect(() => {
    setReadingText(""); setGenError(""); setSigContent(null); setSigError("");
    if (!session) return;

    fetch(`/api/calendar-note?date=${date}&reading_id=${readingId}`, { headers: authHeader })
      .then(r => r.json())
      .then(({ note_text }) => { setNote(note_text ?? ""); setNoteLoaded(true); })
      .catch(() => setNoteLoaded(true));

    // For significant days: check cache silently
    if (isPremium && dayClass === "significant") {
      fetch("/api/day-interpretation", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ date }),
      }).then(async r => {
        if (r.ok) {
          const { content } = await r.json() as { content: string };
          setSigContent(content);
        }
      }).catch(() => {});
    }

    // For power/exceptional: check daily_personal_horoscopes cache
    if (isPremium && (dayClass === "power" || dayClass === "exceptional")) {
      fetch(`/api/daily-personal-horoscope?date=${date}`, { headers: authHeader })
        .then(async r => { if (r.ok) { const d = await r.json(); setReadingText(d.main ?? ""); } })
        .catch(() => {});
    }

    import("posthog-js").then(({ default: ph }) =>
      ph?.capture("calendar_day_opened", { date, day_class: dayClass })
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, readingId, session, dayClass, isPremium]);

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

  // On-demand for "significant" class
  async function handleSigGenerate() {
    if (!session || sigLoading) return;
    setSigLoading(true);
    setSigError("");
    try {
      import("posthog-js").then(({ default: ph }) =>
        ph?.capture("day_interpretation_generated", { date, day_class: dayClass })
      );
      const res = await fetch("/api/day-interpretation", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ date }),
      });
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error ?? "Błąd"); }
      const { content } = await res.json() as { content: string };
      setSigContent(content);
    } catch (e) {
      setSigError(e instanceof Error ? e.message : "Nieznany błąd");
    } finally {
      setSigLoading(false);
    }
  }

  // On-demand fallback for power/exceptional (cron hasn't run yet)
  async function handlePowerGenerate() {
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
      if (!chartRes.ok) throw new Error("Błąd kosmogramu");
      const { promptContext } = await chartRes.json() as { promptContext: string };
      const res = await fetch("/api/daily-reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptContext, interpretationContext: "", timezone: birth.timezone, chartData: chart, targetDate: date }),
      });
      if (!res.ok) throw new Error("Błąd generowania");
      const { dailyReading } = await res.json() as { dailyReading: string };
      setReadingText(dailyReading);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Nieznany błąd");
    } finally {
      setGenerating(false);
    }
  }

  // ── Headline (deterministic) ──
  const headline = powerDay
    ? transitHeadline(powerDay.topTransit)
    : supporting
    ? `${supporting.transit_planet} aktywuje Twojego ${supporting.natal_planet}`
    : null;

  // ── Normal day sentence ──
  const normalSentence = NORMAL_SENTENCES[dayOfYear % NORMAL_SENTENCES.length];

  // ── Border color by class ──
  const borderCls =
    dayClass === "exceptional" ? "border-amber-500/50" :
    dayClass === "power"       ? "border-amber-700/40" :
    dayClass === "significant" ? "border-white/12" :
                                 "border-white/8";

  return (
    <div className={`glass-card rounded-2xl border overflow-hidden ${borderCls}`}>

      {/* ── 1. Header meta ── */}
      <div className={`flex items-center justify-between px-5 py-4 border-b border-white/6 ${dayClass === "exceptional" ? "bg-amber-900/10" : ""}`}>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-0.5">Wybrany dzień</p>
          <h3 className={`text-base font-semibold capitalize ${dayClass === "exceptional" ? "text-amber-100" : "text-white"}`}>
            {formatDatePL(date)}
          </h3>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {/* Day class chip — only for exceptional */}
            {dayClass === "exceptional" && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold text-amber-200 bg-amber-900/40 border border-amber-500/40">
                ★ Wyjątkowy dzień
              </span>
            )}
            {/* Moon sign */}
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Moon className="w-3 h-3 text-indigo-400" />
              Księżyc w <span className="text-indigo-300 font-medium ml-0.5">{SIGN_LOCATIVE[moonSign] ?? moonSign}</span>
            </span>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-4">

        {/* ── 2. Headline — one sentence from dominant transit ── */}
        {headline && (dayClass === "power" || dayClass === "exceptional" || dayClass === "significant") && (
          <p className={`text-sm font-medium leading-snug ${dayClass === "exceptional" ? "text-amber-200" : "text-slate-200"}`}>
            {headline}
          </p>
        )}

        {/* ── 3a. Normal day: static sentence ── */}
        {dayClass === "normal" && (
          <p className="text-sm text-slate-500 leading-relaxed">{normalSentence}</p>
        )}

        {/* ── 3b. Sprzyja / Uważaj — only for significant, power, exceptional ── */}
        {(dayClass === "significant" || dayClass === "power" || dayClass === "exceptional") && (supporting || challenging) && (
          <div className="space-y-2">
            {supporting && (
              <div className="flex gap-3 p-3.5 rounded-xl bg-emerald-900/15 border border-emerald-800/25">
                <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-emerald-400/80 uppercase tracking-wider mb-1">Co sprzyja</p>
                  <p className="text-sm text-slate-200 leading-snug">{transitToText(supporting)}</p>
                  <p className="text-xs text-emerald-300/70 mt-1">{SUPPORTING_ENABLES[supporting.transit_planet]}</p>
                </div>
              </div>
            )}
            {challenging && (
              <div className="flex gap-3 p-3.5 rounded-xl bg-amber-900/10 border border-amber-800/20">
                <AlertTriangle className="w-4 h-4 text-amber-400/70 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-amber-400/60 uppercase tracking-wider mb-1">Na co uważać</p>
                  <p className="text-sm text-slate-200 leading-snug">{transitToText(challenging)}</p>
                  <p className="text-xs text-amber-300/60 mt-1">{CHALLENGING_WATCH[challenging.transit_planet]}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Moon ritual (replaces sections on phase days) ── */}
        {moonPhaseInfo && ritualPrompt && (
          <div className="rounded-xl bg-indigo-950/40 border border-indigo-700/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{moonPhaseInfo.symbol}</span>
              <div>
                <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">{moonPhaseInfo.label}</p>
                <p className="text-[11px] text-indigo-400/70">{moonPhaseInfo.purpose}</p>
              </div>
            </div>
            <p className="text-sm text-slate-200 italic leading-relaxed">&ldquo;{ritualPrompt}&rdquo;</p>
          </div>
        )}

        {/* ── 4. Personalna interpretacja ── */}

        {/* 4a. Power / Exceptional — premium, from cron or on-demand */}
        {isPremium && (dayClass === "power" || dayClass === "exceptional") && (
          <>
            {readingText ? (
              <>
                <DailyReading text={readingText} loading={generating} dateLabel={formatDatePL(date)} />
                <button onClick={handlePowerGenerate} disabled={generating} className="text-xs text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1">
                  <CosmoIcon className="w-3 h-3" /> Generuj ponownie
                </button>
              </>
            ) : (
              <motion.button
                onClick={handlePowerGenerate}
                disabled={generating}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                style={{ background: "rgba(5,4,14,0.90)", border: "0.5px solid rgba(212,175,55,0.55)", color: "#D4AF37" }}
              >
                {generating
                  ? <><span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(212,175,55,0.25)", borderTopColor: "#D4AF37" }} />Interpretuję…</>
                  : <><CosmoIcon className="w-4 h-4" />{dayClass === "exceptional" ? "★ Wygeneruj interpretację" : "Odczytaj ten dzień"}</>}
              </motion.button>
            )}
            {genError && <p className="text-xs text-red-400">{genError}</p>}
          </>
        )}

        {/* 4b. Significant — premium on-demand, cached after first generation */}
        {isPremium && dayClass === "significant" && (
          <>
            {sigContent ? (
              <p className="text-sm text-slate-300 leading-relaxed">{sigContent}</p>
            ) : (
              <>
                <motion.button
                  onClick={handleSigGenerate}
                  disabled={sigLoading}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                  style={{ background: "rgba(5,4,14,0.90)", border: "0.5px solid rgba(212,175,55,0.35)", color: "rgba(212,175,55,0.85)" }}
                >
                  {sigLoading
                    ? <><span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(212,175,55,0.25)", borderTopColor: "#D4AF37" }} />Odczytuję…</>
                    : <><CosmoIcon className="w-4 h-4" />Odczytaj ten dzień</>}
                </motion.button>
                {sigError && <p className="text-xs text-red-400">{sigError}</p>}
              </>
            )}
          </>
        )}

        {/* 4c. Free user — lock */}
        {!isPremium && (dayClass === "power" || dayClass === "exceptional" || dayClass === "significant") && (
          <div className="flex items-center gap-3 p-3.5 rounded-xl" style={{ background: "rgba(212,175,55,0.04)", border: "0.5px solid rgba(212,175,55,0.14)" }}>
            <Lock className="w-4 h-4 text-amber-500/40 shrink-0" />
            <p className="text-sm text-slate-500">
              Personalny odczyt dni — dostępny w <a href="/pricing" className="text-amber-400 hover:text-amber-300 transition-colors">Premium</a>.
            </p>
          </div>
        )}

        {/* ── Power Day "Dzień Mocy" explain widget (Zap button) ── */}
        {isPremium && dayClass === "power" && powerDay && (
          <PowerDayWidget date={date} transitLabel={transitHeadline(powerDay.topTransit)} session={session} />
        )}

        {/* ── Divider ── */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

        {/* ── 5. Refleksja + notatka — only for class 1/2/4, not normal ── */}
        {dayClass !== "normal" && (
          !moonPhaseInfo || !ritualPrompt ? (
            <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
              <p className="text-[10px] uppercase tracking-widest font-medium mb-2 flex items-center gap-1.5" style={{ color: "rgba(100,116,139,0.7)" }}>
                <Pencil className="w-3 h-3" />
                Pytanie na ten dzień
              </p>
              <p className="text-sm italic leading-relaxed" style={{ color: "rgba(203,213,225,0.85)" }}>&ldquo;{question}&rdquo;</p>
              <p className="text-[11px] mt-2" style={{ color: "rgba(100,116,139,0.55)" }}>Zapisz odpowiedź w notatce poniżej ↓</p>
            </div>
          ) : null
        )}

        {/* ── Notatka ── */}
        {noteLoaded && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500 uppercase tracking-widest">Twoja notatka</p>
              {noteSaving && <span className="text-[10px] text-slate-600 animate-pulse">Zapisuję…</span>}
            </div>
            <textarea
              value={note}
              onChange={e => handleNoteChange(e.target.value)}
              placeholder={dayClass !== "normal" ? "Odpowiedź na pytanie, refleksja, plan…" : "Notatka na ten dzień…"}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-700/50 resize-none transition-all"
            />
          </div>
        )}

      </div>
    </div>
  );
}

// ── PowerDayWidget (sub-component, wyjaśnienie Dnia Mocy) ─────────────────────

function PowerDayWidget({ date, transitLabel, session }: {
  date: string;
  transitLabel: string;
  session: { access_token: string } | null;
}) {
  const [content, setContent]   = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const authHeader: Record<string, string> = session ? { Authorization: `Bearer ${session.access_token}` } : {};

  async function fetch_() {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      import("posthog-js").then(({ default: ph }) => ph?.capture("power_day_clicked", { date }));
      const res = await fetch("/api/power-day-explanation", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ date }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Błąd");
      const { content: c } = await res.json() as { content: string };
      setContent(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nieznany błąd");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(212,175,55,0.06)", border: "0.5px solid rgba(212,175,55,0.30)" }}>
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-amber-400 shrink-0" />
        <p className="text-xs font-semibold text-amber-300 uppercase tracking-wider">Dzień Mocy</p>
      </div>
      <p className="text-xs text-slate-400 leading-snug">{transitLabel}</p>
      {content ? (
        <p className="text-sm text-slate-200 leading-relaxed">{content}</p>
      ) : (
        <>
          <button
            onClick={fetch_}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
            style={{ background: "rgba(212,175,55,0.12)", border: "0.5px solid rgba(212,175,55,0.40)", color: "#F3E5AB" }}
          >
            {loading
              ? <><span className="w-3 h-3 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(212,175,55,0.3)", borderTopColor: "#D4AF37" }} />Analizuję…</>
              : <><Zap className="w-3 h-3" />Co ten dzień oznacza dla Ciebie?</>}
          </button>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </>
      )}
    </div>
  );
}
