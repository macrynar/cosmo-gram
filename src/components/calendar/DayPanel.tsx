"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Astronomy from "astronomy-engine";
import { longitudeToSign } from "@/lib/astro-types";
import type { NatalChart } from "@/lib/astro-types";
import type { DayData, TransitAspect } from "@/lib/chart-engine";
import { CosmoIcon } from "@/components/CosmoIcon";
import { useAuth } from "@/components/AuthContext";
import DailyReading from "@/components/generate/DailyReading";
import { X, Moon, HelpCircle, TrendingUp, AlertTriangle } from "lucide-react";

const REFLECTIVE_QUESTIONS = [
  "Co dziś chcesz wyrazić, a powstrzymujesz?",
  "Czego naprawdę potrzebujesz dziś od siebie?",
  "Gdzie marnujesz energię, zamiast ją inwestować?",
  "Co byś zrobił, gdybyś nie bał się oceny innych?",
  "Jaką jedną rzecz możesz dziś puścić?",
  "Kto potrzebuje dziś Twojej uwagi — i czy to Ty?",
  "Co odkładasz, co mogłoby zmienić coś ważnego?",
  "Która decyzja czeka na Ciebie dłużej niż powinna?",
  "Co sprawia Ci radość, a co tylko wydaje się ważne?",
  "Czego szukasz w zewnętrznym świecie, co masz w sobie?",
  "Jak wygląda Twoja wersja spokoju — i kiedy ją czułeś?",
  "Co chciałbyś usłyszeć od kogoś bliskiego?",
  "Jaką małą odwagę możesz dziś zrobić?",
  "Czego nauczył Cię ostatni trudny czas?",
];

// Plain-language planet meanings
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

const PLANET_WHAT: Record<string, string> = {
  "Słońce":   "poczucie celu i siły",
  "Księżyc":  "emocje i potrzeby",
  "Merkury":  "komunikację i myślenie",
  "Wenus":    "relacje i finanse",
  "Mars":     "energię i działanie",
  "Jowisz":   "szanse i ekspansję",
  "Saturn":   "strukturę i obowiązki",
  "Uran":     "zmiany i przełomy",
  "Neptun":   "intuicję i wrażliwość",
  "Pluton":   "transformację",
};

function transitToText(t: TransitAspect): string {
  const verb = t.favorable ? "harmonizuje z" : "napina";
  const what = PLANET_WHAT[t.natal_planet] ? `(Twoj${t.natal_planet === "Księżyc" ? "a" : "e"} ${PLANET_WHAT[t.natal_planet]})` : "";
  return `${t.transit_planet} w ${t.transit_sign} ${verb} Twojego ${t.natal_planet} ${what}`;
}

function getMoonSign(date: Date): string {
  const geo = Astronomy.GeoVector(Astronomy.Body.Moon, date, false);
  const ecl = Astronomy.Ecliptic(geo);
  const lon = ((ecl.elon % 360) + 360) % 360;
  return longitudeToSign(lon).name;
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86400000);
}

function formatDatePL(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

type Props = {
  date: string;
  dayData?: DayData;
  chart: NatalChart;
  readingId: string;
  promptContext: string;
  interpretation: string;
  onClose: () => void;
};

export default function DayPanel({ date, dayData, chart, readingId, promptContext, interpretation, onClose }: Props) {
  const { session } = useAuth();
  const dateObj = new Date(date + "T12:00:00Z");
  const moonSign = getMoonSign(dateObj);
  const question = REFLECTIVE_QUESTIONS[getDayOfYear(dateObj) % REFLECTIVE_QUESTIONS.length];

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

  const supporting = dayData?.topSupporting;
  const challenging = dayData?.topChallenging;
  const hasTransits = supporting || challenging;

  return (
    <div className="glass-card rounded-2xl border border-amber-700/25 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-0.5">Wybrany dzień</p>
          <h3 className="text-base font-semibold text-white capitalize">{formatDatePL(date)}</h3>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Moon + Question */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-900/20 border border-indigo-700/30 text-sm shrink-0">
            <Moon className="w-4 h-4 text-indigo-300 shrink-0" />
            <span className="text-slate-300">Księżyc w <span className="text-indigo-200 font-medium">{moonSign}</span></span>
          </div>
          <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm flex-1 min-w-0">
            <HelpCircle className="w-4 h-4 text-amber-400/60 shrink-0 mt-0.5" />
            <span className="text-slate-400 italic">{question}</span>
          </div>
        </div>

        {/* Transit summary — instant, no AI needed */}
        {hasTransits && (
          <div className="space-y-2">
            {supporting && (
              <div className="flex gap-3 p-3.5 rounded-xl bg-emerald-900/15 border border-emerald-800/25">
                <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-emerald-400/80 uppercase tracking-wider mb-1">Co sprzyja</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{transitToText(supporting)}</p>
                  <p className="text-xs text-emerald-300/70 mt-1">{SUPPORTING_ENABLES[supporting.transit_planet]}</p>
                </div>
              </div>
            )}
            {challenging && (
              <div className="flex gap-3 p-3.5 rounded-xl bg-amber-900/10 border border-amber-800/20">
                <AlertTriangle className="w-4 h-4 text-amber-400/70 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-amber-400/60 uppercase tracking-wider mb-1">Na co uważać</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{transitToText(challenging)}</p>
                  <p className="text-xs text-amber-300/60 mt-1">{CHALLENGING_WATCH[challenging.transit_planet]}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {!hasTransits && (
          <p className="text-xs text-slate-600 italic">Brak wyraźnych tranzytów tego dnia — spokojny, neutralny czas.</p>
        )}

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

        {/* Generate button / result */}
        {!readingText ? (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-900/25 border border-amber-700/35 text-amber-200 text-sm font-medium hover:bg-amber-800/35 disabled:opacity-50 transition-all"
          >
            {generating
              ? <span className="w-4 h-4 border-2 border-amber-300/25 border-t-amber-300 rounded-full animate-spin" />
              : <CosmoIcon className="w-4 h-4" />}
            {generating ? "Interpretuję tranzyty…" : "Wygeneruj pełną interpretację AI"}
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

        {/* Note */}
        {noteLoaded && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500 uppercase tracking-widest">Notatka</p>
              {noteSaving && <span className="text-[10px] text-slate-600 animate-pulse">Zapisuję…</span>}
            </div>
            <textarea
              value={note}
              onChange={e => handleNoteChange(e.target.value)}
              placeholder="Twoje przemyślenia na ten dzień…"
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-700/50 resize-none transition-all"
            />
          </div>
        )}
      </div>
    </div>
  );
}
