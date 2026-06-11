"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Astronomy from "astronomy-engine";
import { longitudeToSign } from "@/lib/astro-types";
import type { NatalChart } from "@/lib/astro-types";
import type { DayData } from "@/lib/chart-engine";
import type { TransitWindow } from "@/lib/astro/windows";
import { MOON_PHASE_INFO, getRitualPrompt } from "@/lib/moonPhases";
import { CosmoIcon } from "@/components/CosmoIcon";
import { useAuth } from "@/components/AuthContext";
import { motion } from "framer-motion";
import { X, Moon, TrendingUp, AlertTriangle, Pencil, Lock } from "lucide-react";
import {
  SIGN_LOCATIVE,
  natalInstrumental, formatTransit,
} from "@/lib/i18n/astro";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getMoonSign(date: Date): string {
  const geo = Astronomy.GeoVector(Astronomy.Body.Moon, date, false);
  const ecl = Astronomy.Ecliptic(geo);
  return longitudeToSign(((ecl.elon % 360) + 360) % 360).name;
}

function getDayOfYear(date: Date): number {
  return Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
}

function capitalize(s: string): string {
  return s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;
}

function formatDatePL(dateStr: string): string {
  return capitalize(new Date(dateStr + "T12:00:00Z").toLocaleDateString("pl-PL", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }));
}

function formatDateShortPL(dateStr: string): string {
  return capitalize(new Date(dateStr + "T12:00:00Z").toLocaleDateString("pl-PL", {
    weekday: "long", day: "numeric", month: "long",
  }));
}

// ── Structured personal horoscope (from daily_personal_horoscopes table) ─────

type PersonalHoroscope = {
  headline:   string;
  main:       string;
  reflection: string;
  weather?:   { intensity: number; element: string; character: string };
  cached:     boolean;
};

// ── Static text pools ─────────────────────────────────────────────────────────

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

// ── Props ────────────────────────────────────────────────────────────────────

type Props = {
  date:         string;
  dayData?:     DayData;
  chart:        NatalChart;
  readingId:    string;
  isPremium:    boolean;
  // Window this day belongs to (if any), for "peak" status
  activeWindow?: TransitWindow;
  onClose:      () => void;
};

// ── Component ────────────────────────────────────────────────────────────────

export default function DayPanel({
  date, dayData, chart, readingId, isPremium, activeWindow, onClose,
}: Props) {
  const { session } = useAuth();
  const today      = new Date().toISOString().slice(0, 10);
  const isToday    = date === today;
  const isPeak     = !!activeWindow && activeWindow.peak === date;

  const dateObj    = new Date(date + "T12:00:00Z");
  const moonSign   = getMoonSign(dateObj);
  const dayOfYear  = getDayOfYear(dateObj);
  const moonPhase  = dayData?.moonPhase ?? null;
  const moonPhaseInfo  = moonPhase ? MOON_PHASE_INFO[moonPhase] : null;
  const ritualPrompt   = moonPhase ? getRitualPrompt(moonPhase, dayOfYear) : null;

  const supporting  = (dayData?.score ?? 0) >= 3 ? (dayData?.topSupporting  ?? null) : null;
  const challenging = (dayData?.score ?? 0) >= 3 ? (dayData?.topChallenging ?? null) : null;

  const authHeader: Record<string, string> = session
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};

  // ── State ──
  const [note, setNote]             = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteLoaded, setNoteLoaded] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Today: personal horoscope (headline/main/reflection)
  const [horoscope, setHoroscope]       = useState<PersonalHoroscope | null>(null);
  const [horoLoading, setHoroLoading]   = useState(false);  // on-demand generation
  const [horoChecking, setHoroChecking] = useState(false);  // checking cache on mount
  const [horoError, setHoroError]       = useState("");

  // Other days (peak): cached reading (just main text)
  const [peakText, setPeakText]         = useState<string | null>(null);
  const [peakChecking, setPeakChecking] = useState(false);
  const [peakLoading, setPeakLoading]   = useState(false);
  const [peakError, setPeakError]       = useState("");

  // Significant days (on-demand interpretation)
  const [sigContent, setSigContent]   = useState<string | null>(null);
  const [sigChecking, setSigChecking] = useState(false);
  const [sigLoading, setSigLoading]   = useState(false);
  const [sigError, setSigError]       = useState("");

  const isSignificant = !isPeak && (dayData?.score ?? 0) >= 5;

  // ── Load on mount ──
  useEffect(() => {
    setHoroscope(null); setHoroError(""); setHoroChecking(false);
    setPeakText(null);  setPeakError("");  setPeakChecking(false);
    setSigContent(null); setSigError(""); setSigChecking(false);
    setNote(""); setNoteLoaded(false);

    if (!session) return;

    // Always load note
    fetch(`/api/calendar-note?date=${date}&reading_id=${readingId}`, { headers: authHeader })
      .then(r => r.json())
      .then(({ note_text }) => { setNote(note_text ?? ""); setNoteLoaded(true); })
      .catch(() => setNoteLoaded(true));

    if (!isPremium) return;

    if (isToday) {
      // Today: load personal horoscope
      setHoroChecking(true);
      fetch(`/api/daily-personal-horoscope?date=${date}`, { headers: authHeader })
        .then(async r => {
          if (r.ok) setHoroscope(await r.json());
        })
        .catch(() => {})
        .finally(() => setHoroChecking(false));
    } else if (isPeak) {
      // Peak day: load cached reading
      setPeakChecking(true);
      fetch(`/api/daily-personal-horoscope?date=${date}`, { headers: authHeader })
        .then(async r => {
          if (r.ok) { const d = await r.json(); setPeakText(d.main ?? null); }
        })
        .catch(() => {})
        .finally(() => setPeakChecking(false));
    } else if (isSignificant) {
      // Significant day: check interpretation cache silently
      setSigChecking(true);
      fetch("/api/day-interpretation", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ date }),
      }).then(async r => {
        if (r.ok) { const { content } = await r.json() as { content: string }; setSigContent(content); }
      }).catch(() => {})
      .finally(() => setSigChecking(false));
    }

    import("posthog-js").then(({ default: ph }) =>
      ph?.capture("calendar_day_opened", {
        date,
        is_today: isToday,
        is_peak: isPeak,
        score: dayData?.score ?? 0,
      })
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, readingId, session, isPremium]);

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

  // On-demand: today's horoscope (cron hasn't run yet)
  async function handleHoroGenerate() {
    if (!session) return;
    setHoroLoading(true); setHoroError("");
    try {
      const res = await fetch(`/api/daily-personal-horoscope?date=${date}`, { headers: authHeader });
      if (res.ok) setHoroscope(await res.json());
      else { const b = await res.json().catch(() => ({})); setHoroError(b.error ?? "Błąd"); }
    } finally { setHoroLoading(false); }
  }

  // On-demand: peak day reading (cron hasn't run yet)
  async function handlePeakGenerate() {
    if (!session) return;
    setPeakLoading(true); setPeakError("");
    try {
      const res = await fetch(`/api/daily-personal-horoscope?date=${date}`, { headers: authHeader });
      if (res.ok) { const d = await res.json(); setPeakText(d.main ?? ""); }
      else { const b = await res.json().catch(() => ({})); setPeakError(b.error ?? "Błąd"); }
    } finally { setPeakLoading(false); }
  }

  // On-demand: significant day interpretation
  async function handleSigGenerate() {
    if (!session || sigLoading) return;
    setSigLoading(true); setSigError("");
    try {
      import("posthog-js").then(({ default: ph }) =>
        ph?.capture("day_reading_generated", { date, is_peak: isPeak })
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
    } finally { setSigLoading(false); }
  }

  // ── Helpers ──
  const question = (() => {
    const planet = supporting?.transit_planet ?? activeWindow?.transitPlanet ?? null;
    if (planet) {
      const pool = TRANSIT_QUESTIONS[planet];
      if (pool) return pool[dayOfYear % pool.length];
    }
    return "Czego naprawdę potrzebujesz dziś od siebie?";
  })();

  const normalSentence = NORMAL_SENTENCES[dayOfYear % NORMAL_SENTENCES.length];
  const hasContent = (dayData?.score ?? 0) >= 3 || isPeak;

  // ── Border color ──
  const borderCls = isPeak
    ? "border-amber-700/40"
    : (dayData?.score ?? 0) >= 5
    ? "border-white/12"
    : "border-white/8";

  // ── Spinner component ──
  function Spinner() {
    return (
      <div className="flex items-center justify-center py-6">
        <span className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(212,175,55,0.25)", borderTopColor: "#D4AF37" }} />
      </div>
    );
  }

  return (
    <div className={`glass-card rounded-2xl border overflow-hidden ${borderCls}`}>

      {/* ── 1. Header ── */}
      <div className={`flex items-center justify-between px-5 py-4 border-b border-white/6 ${isPeak ? "bg-amber-900/8" : ""}`}>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-0.5">
            {isToday ? "Dzisiaj" : "Wybrany dzień"}
          </p>
          <h3 className={`text-base font-semibold ${isPeak ? "text-amber-100" : "text-white"}`}>
            {isToday ? formatDateShortPL(date) : formatDatePL(date)}
          </h3>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {isPeak && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold text-amber-200 bg-amber-900/40 border border-amber-500/40">
                ★ Dzień Mocy
              </span>
            )}
            {activeWindow && !isPeak && (
              <span className="px-2 py-0.5 rounded-full text-[11px] text-amber-300/70 bg-amber-900/20 border border-amber-700/30">
                Okno: {activeWindow.transitPlanet} → {activeWindow.natalPoint}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Moon className="w-3 h-3 text-indigo-400" />
              Księżyc w{" "}
              <span className="text-indigo-300 font-medium ml-0.5">{SIGN_LOCATIVE[moonSign] ?? moonSign}</span>
            </span>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-4">

        {/* ── 2. Window context ── */}
        {activeWindow && (
          <div className={`rounded-xl px-3.5 py-3 ${isPeak ? "bg-amber-900/12 border border-amber-700/25" : "bg-white/3 border border-white/8"}`}>
            <p className={`text-sm font-medium leading-snug ${isPeak ? "text-amber-200" : "text-slate-300"}`}>
              {formatTransit(activeWindow)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {isPeak
                ? `★ Peak okna · ${activeWindow.start} – ${activeWindow.end} · ${activeWindow.lengthDays} dni`
                : `Dzień ${Math.round((new Date(date + "T12:00:00Z").getTime() - new Date(activeWindow.start + "T12:00:00Z").getTime()) / 86_400_000) + 1} z ${activeWindow.lengthDays} · peak ${date < activeWindow.peak ? `za ${Math.round((new Date(activeWindow.peak + "T12:00:00Z").getTime() - new Date(date + "T12:00:00Z").getTime()) / 86_400_000)} dni` : "już za nami"}`}
            </p>
          </div>
        )}

        {/* ── 3. Sprzyja / Uważaj ── */}
        {hasContent && (supporting || challenging) && (
          <div className="space-y-2">
            {supporting && (
              <div className="flex gap-3 p-3.5 rounded-xl bg-emerald-900/15 border border-emerald-800/25">
                <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-emerald-400/80 uppercase tracking-wider mb-1">Co sprzyja</p>
                  <p className="text-sm text-slate-200 leading-snug">
                    {supporting.transit_planet} w {SIGN_LOCATIVE[supporting.transit_sign] ?? supporting.transit_sign}
                    {" — harmonizuje z "}
                    {natalInstrumental(supporting.natal_planet)}
                  </p>
                  <p className="text-xs text-emerald-300/70 mt-1">{SUPPORTING_ENABLES[supporting.transit_planet]}</p>
                </div>
              </div>
            )}
            {challenging && (
              <div className="flex gap-3 p-3.5 rounded-xl bg-amber-900/10 border border-amber-800/20">
                <AlertTriangle className="w-4 h-4 text-amber-400/70 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-amber-400/60 uppercase tracking-wider mb-1">Na co uważać</p>
                  <p className="text-sm text-slate-200 leading-snug">
                    {challenging.transit_planet} w {SIGN_LOCATIVE[challenging.transit_sign] ?? challenging.transit_sign}
                    {" — tworzy napięcie z "}
                    {natalInstrumental(challenging.natal_planet)}
                  </p>
                  <p className="text-xs text-amber-300/60 mt-1">{CHALLENGING_WATCH[challenging.transit_planet]}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Normal day info */}
        {!hasContent && !moonPhaseInfo && (
          <p className="text-sm text-slate-500 leading-relaxed">{normalSentence}</p>
        )}

        {/* ── Moon ritual ── */}
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

        {/* ── 4. Personalna treść ── */}
        {isPremium && isToday && (
          /* Today: personal horoscope with headline/main/reflection */
          horoChecking ? <Spinner /> :
          horoscope ? (
            <div className="space-y-3">
              <h4 className="text-base font-semibold text-amber-100 leading-snug" style={{ fontFamily: "Georgia, serif" }}>
                {horoscope.headline}
              </h4>
              {horoscope.main.split("\n\n").filter(Boolean).map((p, i) => (
                <p key={i} className="text-sm text-slate-300 leading-relaxed">{p}</p>
              ))}
              {horoscope.reflection && (
                <div className="rounded-xl p-3.5" style={{ background: "rgba(212,175,55,0.05)", border: "0.5px solid rgba(212,175,55,0.18)" }}>
                  <p className="text-xs uppercase tracking-widest text-amber-500/50 mb-1.5">Refleksja</p>
                  <p className="text-sm text-slate-300 italic leading-relaxed">{horoscope.reflection}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-slate-500">{horoError || "Horoskop na dziś nie jest jeszcze gotowy."}</p>
              <motion.button
                onClick={handleHoroGenerate}
                disabled={horoLoading}
                whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                style={{ background: "rgba(5,4,14,0.90)", border: "0.5px solid rgba(212,175,55,0.55)", color: "#D4AF37" }}
              >
                {horoLoading
                  ? <><span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(212,175,55,0.25)", borderTopColor: "#D4AF37" }} />Generuję…</>
                  : <><CosmoIcon className="w-4 h-4" />Wygeneruj horoskop</>}
              </motion.button>
            </div>
          )
        )}

        {isPremium && !isToday && isPeak && (
          /* Peak day: odczyt dnia (NOT called "horoskop") */
          peakChecking ? <Spinner /> :
          peakText ? (
            <p className="text-sm text-slate-300 leading-relaxed">{peakText}</p>
          ) : (
            <div className="space-y-2">
              {peakError && <p className="text-xs text-red-400">{peakError}</p>}
              <motion.button
                onClick={handlePeakGenerate}
                disabled={peakLoading}
                whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                style={{ background: "rgba(5,4,14,0.90)", border: "0.5px solid rgba(212,175,55,0.55)", color: "#D4AF37" }}
              >
                {peakLoading
                  ? <><span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(212,175,55,0.25)", borderTopColor: "#D4AF37" }} />Odczytuję…</>
                  : <><CosmoIcon className="w-4 h-4" />Odczytaj ten dzień</>}
              </motion.button>
            </div>
          )
        )}

        {isPremium && !isToday && !isPeak && isSignificant && (
          /* Significant day: on-demand interpretation, cached after first */
          sigChecking ? <Spinner /> :
          sigContent ? (
            <p className="text-sm text-slate-300 leading-relaxed">{sigContent}</p>
          ) : (
            <>
              <motion.button
                onClick={handleSigGenerate}
                disabled={sigLoading}
                whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                style={{ background: "rgba(5,4,14,0.90)", border: "0.5px solid rgba(212,175,55,0.35)", color: "rgba(212,175,55,0.85)" }}
              >
                {sigLoading
                  ? <><span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(212,175,55,0.25)", borderTopColor: "#D4AF37" }} />Odczytuję…</>
                  : <><CosmoIcon className="w-4 h-4" />Odczytaj ten dzień</>}
              </motion.button>
              {sigError && <p className="text-xs text-red-400">{sigError}</p>}
            </>
          )
        )}

        {/* Free user lock */}
        {!isPremium && (isPeak || isSignificant) && (
          <div className="flex items-center gap-3 p-3.5 rounded-xl" style={{ background: "rgba(212,175,55,0.04)", border: "0.5px solid rgba(212,175,55,0.14)" }}>
            <Lock className="w-4 h-4 text-amber-500/40 shrink-0" />
            <p className="text-sm text-slate-500">
              Personalny odczyt dni — dostępny w{" "}
              <a href="/pricing" className="text-amber-400 hover:text-amber-300 transition-colors">Premium</a>.
            </p>
          </div>
        )}

        {/* ── Divider ── */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

        {/* ── Refleksja ── */}
        {activeWindow && !moonPhaseInfo && (
          <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
            <p className="text-[10px] uppercase tracking-widest font-medium mb-2 flex items-center gap-1.5" style={{ color: "rgba(100,116,139,0.7)" }}>
              <Pencil className="w-3 h-3" />
              Pytanie na ten dzień
            </p>
            <p className="text-sm italic leading-relaxed" style={{ color: "rgba(203,213,225,0.85)" }}>&ldquo;{question}&rdquo;</p>
            <p className="text-[11px] mt-2" style={{ color: "rgba(100,116,139,0.55)" }}>Zapisz odpowiedź w notatce poniżej ↓</p>
          </div>
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
              placeholder={hasContent ? "Odpowiedź na pytanie, refleksja, plan…" : "Notatka na ten dzień…"}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-700/50 resize-none transition-all"
            />
          </div>
        )}

      </div>
    </div>
  );
}
