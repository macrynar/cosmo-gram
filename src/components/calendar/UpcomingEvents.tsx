"use client";

import { useMemo, useState } from "react";
import * as Astronomy from "astronomy-engine";
import { longitudeToSign } from "@/lib/astro-types";
import type { NatalChart } from "@/lib/astro-types";
import { TrendingUp, AlertTriangle, Bell, BellOff } from "lucide-react";

const SHORT_MONTHS = ["sty","lut","mar","kwi","maj","cze","lip","sie","wrz","paź","lis","gru"];

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  return `${d.getUTCDate()} ${SHORT_MONTHS[d.getUTCMonth()]}`;
}

type PersonalEvent = {
  daysFromNow: number;
  date: string;
  transit_planet: string;
  transit_sign: string;
  aspect_label: string;
  natal_planet: string;
  favorable: boolean;
  meaning: string;
  windowDays: number;   // total active days within 2° orb
  daysLeft: number;     // days from today until orb > 2° again
  peakDate: string;     // exact peak date string
};

const TRACKED_PLANETS: Array<{ name: string; body: Astronomy.Body; priority: number }> = [
  { name: "Jowisz", body: Astronomy.Body.Jupiter, priority: 5 },
  { name: "Saturn",  body: Astronomy.Body.Saturn,  priority: 5 },
  { name: "Mars",    body: Astronomy.Body.Mars,    priority: 8 },
  { name: "Wenus",   body: Astronomy.Body.Venus,   priority: 8 },
  { name: "Merkury", body: Astronomy.Body.Mercury, priority: 6 },
];

const PERSONAL_NATAL = new Set(["Słońce", "Księżyc", "Wenus", "Mars", "Merkury", "Jowisz", "Saturn"]);

const ASPECT_ANGLES: Record<string, number> = {
  conjunction: 0, sextile: 60, trine: 120, square: 90, opposition: 180,
};

const ASPECT_LABEL: Record<string, string> = {
  conjunction: "koniunkcja", sextile: "sekstyl", trine: "trygon",
  square: "kwadrat", opposition: "opozycja",
};

const FAVORABLE_ASPECTS = new Set(["sextile", "trine"]);
const CONJUNCTION_FAVORABLE: Record<string, boolean> = {
  "Jowisz": true, "Wenus": true, "Merkury": true,
  "Saturn": false, "Mars": false,
};

const MEANINGS: Record<string, { fav: string; tense: string }> = {
  "Wenus":   { fav: "dobry moment na relacje, wyrażanie uczuć i decyzje finansowe", tense: "napięcia w relacjach lub finansach wymagają uwagi" },
  "Mars":    { fav: "energia i napęd — czas na push i realizację planów", tense: "słowa mogą wychodzić ostrzej, świadoma komunikacja" },
  "Merkury": { fav: "jasne myślenie, dobry czas na ważne rozmowy i decyzje", tense: "łatwo o nieporozumienia — sprawdzaj szczegóły" },
  "Jowisz":  { fav: "okno na odważniejszy ruch, nowe możliwości i ekspansję", tense: "nadmierny optymizm może mylić — sprawdzaj realia" },
  "Saturn":  { fav: "dobry czas na zamknięcie zaległości i poważne zobowiązania", tense: "więcej ograniczeń i ciężaru niż zwykle — cierpliwość" },
};

// Polish instrumental declension
const PLANET_INSTR: Record<string, string> = {
  "Słońce": "Słońcem", "Księżyc": "Księżycem", "Merkury": "Merkurym",
  "Wenus": "Wenus", "Mars": "Marsem", "Jowisz": "Jowiszem",
  "Saturn": "Saturnem", "Uran": "Uranem", "Neptun": "Neptunem", "Pluton": "Plutonem",
};
const PLANET_INSTR_ARTICLE: Record<string, string> = { "Wenus": "Twoją" };

function natalPhrase(planet: string): string {
  const article = PLANET_INSTR_ARTICLE[planet] ?? "Twoim";
  return `${article} ${PLANET_INSTR[planet] ?? planet}`;
}

function getEclipticLon(body: Astronomy.Body, date: Date): number {
  const geo = Astronomy.GeoVector(body, date, false);
  const ecl = Astronomy.Ecliptic(geo);
  return ((ecl.elon % 360) + 360) % 360;
}

const WINDOW_ORB = 2.0; // degrees for "active" window

function computeWindow(
  body: Astronomy.Body,
  natalLon: number,
  angle: number,
  peakDayIdx: number,
  fromDate: Date,
): { windowDays: number; daysLeft: number } {
  const ms = fromDate.getTime();

  // Forward scan from peak to find window end
  let endDay = peakDayIdx;
  for (let d = peakDayIdx + 1; d <= peakDayIdx + 90; d++) {
    const date = new Date(ms + d * 86400000);
    const tLon = getEclipticLon(body, date);
    let diff = Math.abs(tLon - natalLon) % 360;
    if (diff > 180) diff = 360 - diff;
    if (Math.abs(diff - angle) > WINDOW_ORB) break;
    endDay = d;
  }

  // Backward scan from peak to find window start
  let startDay = peakDayIdx;
  for (let d = peakDayIdx - 1; d >= peakDayIdx - 90; d--) {
    const date = new Date(ms + d * 86400000);
    const tLon = getEclipticLon(body, date);
    let diff = Math.abs(tLon - natalLon) % 360;
    if (diff > 180) diff = 360 - diff;
    if (Math.abs(diff - angle) > WINDOW_ORB) break;
    startDay = d;
  }

  const windowDays = endDay - startDay + 1;
  const daysLeft   = Math.max(0, endDay); // days from today (day 0) to window end
  return { windowDays, daysLeft };
}

function computePersonalEvents(natalChart: NatalChart, fromDate: Date, lookahead: number): PersonalEvent[] {
  const events: PersonalEvent[] = [];
  const seen = new Set<string>();
  const personalPlanets = natalChart.planets.filter(p => PERSONAL_NATAL.has(p.name));

  for (const { name: tName, body, priority } of TRACKED_PLANETS) {
    for (const natal of personalPlanets) {
      for (const [typeName, angle] of Object.entries(ASPECT_ANGLES)) {
        let prevOrb = Infinity;

        for (let d = 0; d <= lookahead; d++) {
          const date = new Date(fromDate.getTime() + d * 86400000);
          const tLon = getEclipticLon(body, date);
          const { name: tSign } = longitudeToSign(tLon);

          let diff = Math.abs(tLon - natal.longitude) % 360;
          if (diff > 180) diff = 360 - diff;
          const orb = Math.abs(diff - angle);

          if (orb <= 1.2 && orb > prevOrb && prevOrb <= 1.0) {
            const key = `${tName}-${typeName}-${natal.name}`;
            if (!seen.has(key)) {
              seen.add(key);
              priority; // referenced to avoid lint warning — priority used in sort

              const favorable = typeName === "conjunction"
                ? (CONJUNCTION_FAVORABLE[tName] ?? true)
                : FAVORABLE_ASPECTS.has(typeName);

              const meaning = favorable
                ? (MEANINGS[tName]?.fav ?? "korzystna energia")
                : (MEANINGS[tName]?.tense ?? "wymagający czas");

              const peakDayIdx = d - 1;
              const { windowDays, daysLeft } = computeWindow(body, natal.longitude, angle, peakDayIdx, fromDate);

              events.push({
                daysFromNow: peakDayIdx,
                date: new Date(fromDate.getTime() + peakDayIdx * 86400000).toISOString().slice(0, 10),
                peakDate: new Date(fromDate.getTime() + peakDayIdx * 86400000).toISOString().slice(0, 10),
                transit_planet: tName,
                transit_sign: tSign,
                aspect_label: ASPECT_LABEL[typeName] ?? typeName,
                natal_planet: natal.name,
                favorable,
                meaning,
                windowDays,
                daysLeft,
              });
            }
          }

          if (orb > 3) prevOrb = Infinity;
          else prevOrb = orb;
        }
      }
    }
  }

  return events
    .sort((a, b) => a.daysFromNow - b.daysFromNow || (TRACKED_PLANETS.find(p => p.name === b.transit_planet)?.priority ?? 0) - (TRACKED_PLANETS.find(p => p.name === a.transit_planet)?.priority ?? 0))
    .slice(0, 6);
}

function durationLabel(e: PersonalEvent): string {
  const today = new Date().toISOString().slice(0, 10);
  if (e.daysLeft === 0) return "Wygasa dziś";
  if (e.date === today) return `Peak dziś · jeszcze ${e.daysLeft}d`;
  if (e.daysFromNow > 0) return `Peak ${formatShortDate(e.peakDate)} · ${e.windowDays}d razem`;
  return `Słabnie · ${e.daysLeft}d zostało`;
}

// Max 3 bells for free users (UI only, no backend yet)
const FREE_BELL_LIMIT = 3;

type Props = { chart: NatalChart };

export default function UpcomingEvents({ chart }: Props) {
  const events = useMemo(() => computePersonalEvents(chart, new Date(), 60), [chart]);
  const [bells, setBells] = useState<Set<string>>(new Set());

  if (events.length === 0) return null;

  function toggleBell(key: string) {
    setBells(prev => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); return next; }
      if (next.size >= FREE_BELL_LIMIT) {
        // TODO: show premium upsell modal
        return prev;
      }
      next.add(key);
      return next;
    });
  }

  return (
    <div className="glass-card rounded-2xl p-4 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide">Twoje nadchodzące okna</h3>
        <span className="text-[11px] text-slate-600">{bells.size}/{FREE_BELL_LIMIT} powiadomień</span>
      </div>
      <ul className="space-y-4">
        {events.map((e, i) => {
          const bellKey = `${e.transit_planet}-${e.aspect_label}-${e.natal_planet}`;
          const hasBell = bells.has(bellKey);
          const atLimit = bells.size >= FREE_BELL_LIMIT && !hasBell;

          return (
            <li key={i} className="flex gap-3 items-start">
              {/* Date column */}
              <div className="w-16 shrink-0 text-right">
                <p className="text-amber-400 font-semibold text-sm leading-tight whitespace-nowrap">
                  {e.daysFromNow <= 0 ? "Dziś" : e.daysFromNow === 1 ? "Jutro" : `Za ${e.daysFromNow}d`}
                </p>
                <p className="text-slate-600 text-xs mt-0.5">{formatShortDate(e.date)}</p>
              </div>

              {/* Icon */}
              <div className="mt-0.5 shrink-0">
                {e.favorable
                  ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  : <AlertTriangle className="w-3.5 h-3.5 text-amber-500/80" />}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-200 leading-snug">
                  <span className="font-semibold text-white">{e.transit_planet}</span>
                  <span className="text-slate-500 text-xs mx-1">{e.aspect_label}</span>
                  <span className="text-amber-200">{natalPhrase(e.natal_planet)}</span>
                </p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{e.meaning}</p>
                <p className="text-[11px] text-slate-600 mt-1">{durationLabel(e)}</p>
              </div>

              {/* Bell */}
              <button
                onClick={() => toggleBell(bellKey)}
                title={hasBell ? "Kliknij by wyłączyć powiadomienie" : atLimit ? "Limit 3 powiadomień (wkrótce Premium)" : "Powiadom mnie dzień wcześniej"}
                className={`shrink-0 mt-0.5 p-1.5 rounded-full transition-colors ${
                  hasBell
                    ? "bg-amber-500/20 text-amber-400"
                    : atLimit
                    ? "text-slate-700 cursor-not-allowed"
                    : "text-slate-600 hover:text-slate-300 hover:bg-white/5"
                }`}
              >
                {hasBell
                  ? <Bell className="w-3.5 h-3.5" />
                  : <BellOff className="w-3.5 h-3.5" />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
