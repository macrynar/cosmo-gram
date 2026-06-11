"use client";

import { useMemo } from "react";
import * as Astronomy from "astronomy-engine";
import { longitudeToSign } from "@/lib/astro-types";
import type { NatalChart } from "@/lib/astro-types";
import { TrendingUp, AlertTriangle } from "lucide-react";
import { formatTransit } from "@/lib/i18n/astro";
import { getWindowDescription } from "@/lib/astro/windowDescriptions";

const SHORT_MONTHS = ["sty","lut","mar","kwi","maj","cze","lip","sie","wrz","paź","lis","gru"];

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  return `${d.getUTCDate()} ${SHORT_MONTHS[d.getUTCMonth()]}`;
}

type PersonalEvent = {
  daysFromNow: number;
  date:        string;
  peakDate:    string;
  transitPlanet: string;
  transitSign:   string;
  aspectType:    string;   // English key for transitPhrase
  natalPlanet:   string;
  natalSign:     string;
  favorable:     boolean;
  meaning:       string;
  windowDays:    number;
  daysLeft:      number;
};

const TRACKED_PLANETS: Array<{ name: string; body: Astronomy.Body; priority: number }> = [
  { name: "Saturn",  body: Astronomy.Body.Saturn,  priority: 10 },
  { name: "Jowisz",  body: Astronomy.Body.Jupiter, priority: 10 },
  { name: "Mars",    body: Astronomy.Body.Mars,    priority: 8  },
  { name: "Uran",    body: Astronomy.Body.Uranus,  priority: 6  },
];

const PERSONAL_NATAL = new Set(["Słońce", "Księżyc", "Wenus", "Mars", "Merkury"]);

const ASPECT_ANGLES: Record<string, number> = {
  conjunction: 0, sextile: 60, trine: 120, square: 90, opposition: 180,
};

const FAVORABLE_ASPECTS    = new Set(["sextile", "trine"]);
const CONJUNCTION_FAVORABLE: Record<string, boolean> = { "Jowisz": true, "Wenus": true, "Merkury": true, "Saturn": false, "Mars": false };


function getEclipticLon(body: Astronomy.Body, date: Date): number {
  const geo = Astronomy.GeoVector(body, date, false);
  const ecl = Astronomy.Ecliptic(geo);
  return ((ecl.elon % 360) + 360) % 360;
}

const WINDOW_ORB = 2.0;

function computeWindow(body: Astronomy.Body, natalLon: number, angle: number, peakIdx: number, fromDate: Date): { windowDays: number; daysLeft: number } {
  const ms = fromDate.getTime();
  let endDay = peakIdx;
  for (let d = peakIdx + 1; d <= peakIdx + 90; d++) {
    const lon = getEclipticLon(body, new Date(ms + d * 86400000));
    let diff = Math.abs(lon - natalLon) % 360;
    if (diff > 180) diff = 360 - diff;
    if (Math.abs(diff - angle) > WINDOW_ORB) break;
    endDay = d;
  }
  let startDay = peakIdx;
  for (let d = peakIdx - 1; d >= peakIdx - 90; d--) {
    const lon = getEclipticLon(body, new Date(ms + d * 86400000));
    let diff = Math.abs(lon - natalLon) % 360;
    if (diff > 180) diff = 360 - diff;
    if (Math.abs(diff - angle) > WINDOW_ORB) break;
    startDay = d;
  }
  return { windowDays: endDay - startDay + 1, daysLeft: Math.max(0, endDay) };
}

function computeEvents(chart: NatalChart, fromDate: Date, lookahead: number): PersonalEvent[] {
  const events: PersonalEvent[] = [];
  const seen = new Set<string>();
  const personalPlanets = chart.planets.filter(p => PERSONAL_NATAL.has(p.name));

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
              const favorable = typeName === "conjunction"
                ? (CONJUNCTION_FAVORABLE[tName] ?? true)
                : FAVORABLE_ASPECTS.has(typeName);
              const peakIdx = d - 1;
              const { windowDays, daysLeft } = computeWindow(body, natal.longitude, angle, peakIdx, fromDate);
              events.push({
                daysFromNow:  peakIdx,
                date:         new Date(fromDate.getTime() + peakIdx * 86400000).toISOString().slice(0, 10),
                peakDate:     new Date(fromDate.getTime() + peakIdx * 86400000).toISOString().slice(0, 10),
                transitPlanet: tName,
                transitSign:   tSign,
                aspectType:    typeName,
                natalPlanet:   natal.name,
                natalSign:     natal.sign,
                favorable,
                meaning: getWindowDescription(tName, typeName, natal.name, `upcoming_${natal.name}`),
                windowDays,
                daysLeft,
              });
              void priority; // referenced to keep TS happy
            }
          }
          if (orb > 3) prevOrb = Infinity; else prevOrb = orb;
        }
      }
    }
  }

  return events
    .sort((a, b) => a.daysFromNow - b.daysFromNow)
    .slice(0, 3); // max 3 per spec
}

function durationLabel(e: PersonalEvent): string {
  const today = new Date().toISOString().slice(0, 10);
  if (e.daysLeft === 0) return "Wygasa dziś";
  if (e.date === today)  return `Peak dziś · jeszcze ${e.daysLeft}d`;
  if (e.daysFromNow > 0) return `Peak ${formatShortDate(e.peakDate)} · ${e.windowDays}d razem`;
  return `Słabnie · ${e.daysLeft}d zostało`;
}

type Props = { chart: NatalChart; onDaySelect?: (date: string) => void };

export default function UpcomingEvents({ chart, onDaySelect }: Props) {
  const events = useMemo(() => computeEvents(chart, new Date(), 60), [chart]);
  if (events.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl p-4 border border-white/10">
      <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Twoje nadchodzące okna</h3>
      <ul className="space-y-4">
        {events.map((e, i) => (
          <li key={i}>
            <button
              className="w-full flex gap-3 items-start text-left group"
              onClick={() => {
                import("posthog-js").then(({ default: ph }) => ph?.capture("upcoming_window_clicked", { planet: e.transitPlanet, date: e.date }));
                onDaySelect?.(e.peakDate);
              }}
            >
              {/* Date */}
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
                <p className="text-sm text-slate-200 leading-snug group-hover:text-white transition-colors">
                  {formatTransit({ transitPlanet: e.transitPlanet, transitSign: e.transitSign, aspectType: e.aspectType, natalPoint: e.natalPlanet, natalSign: e.natalSign })}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{e.meaning}</p>
                <p className="text-[11px] text-slate-600 mt-1">{durationLabel(e)}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
