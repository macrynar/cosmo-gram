"use client";

import { useMemo } from "react";
import * as Astronomy from "astronomy-engine";
import { longitudeToSign } from "@/lib/astro-types";
import type { NatalChart } from "@/lib/astro-types";
import { TrendingUp, AlertTriangle } from "lucide-react";

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
};

const TRACKED_PLANETS: Array<{ name: string; body: Astronomy.Body; priority: number }> = [
  { name: "Jowisz", body: Astronomy.Body.Jupiter, priority: 5 },
  { name: "Saturn",  body: Astronomy.Body.Saturn,  priority: 5 },
  { name: "Mars",    body: Astronomy.Body.Mars,    priority: 8 },
  { name: "Wenus",   body: Astronomy.Body.Venus,   priority: 8 },
  { name: "Merkury", body: Astronomy.Body.Mercury, priority: 6 },
];

// Natal planets we care about for personalized events
const PERSONAL_NATAL = new Set(["Słońce", "Księżyc", "Wenus", "Mars", "Merkury", "Jowisz", "Saturn"]);

const ASPECT_ANGLES: Record<string, number> = {
  conjunction: 0, sextile: 60, trine: 120, square: 90, opposition: 180,
};

const ASPECT_LABEL: Record<string, string> = {
  conjunction: "koniunkcja", sextile: "sekstyl", trine: "trygon",
  square: "kwadrat", opposition: "opozycja",
};

const ASPECT_FRIENDLY: Record<string, string> = {
  conjunction: "spotyka", sextile: "wspiera", trine: "harmonizuje z",
  square: "napina", opposition: "staje naprzeciw",
};

const FAVORABLE_ASPECTS = new Set(["sextile", "trine"]);
const CONJUNCTION_FAVORABLE: Record<string, boolean> = {
  "Jowisz": true, "Wenus": true, "Merkury": true,
  "Saturn": false, "Mars": false,
};

// Plain-language meanings by transit planet × favorable
const MEANINGS: Record<string, { fav: string; tense: string }> = {
  "Wenus":   { fav: "dobry moment na relacje, wyrażanie uczuć i decyzje finansowe", tense: "napięcia w relacjach lub finansach wymagają uwagi" },
  "Mars":    { fav: "energia i napęd — czas na push i realizację planów", tense: "słowa mogą wychodzić ostrzej, świadoma komunikacja" },
  "Merkury": { fav: "jasne myślenie, dobry czas na ważne rozmowy i decyzje", tense: "łatwo o nieporozumienia — sprawdzaj szczegóły" },
  "Jowisz":  { fav: "okno na odważniejszy ruch, nowe możliwości i ekspansję", tense: "nadmierny optymizm może mylić — sprawdzaj realia" },
  "Saturn":  { fav: "dobry czas na zamknięcie zaległości i poważne zobowiązania", tense: "więcej ograniczeń i ciężaru niż zwykle — cierpliwość" },
};

function getEclipticLon(body: Astronomy.Body, date: Date): number {
  const geo = Astronomy.GeoVector(body, date, false);
  const ecl = Astronomy.Ecliptic(geo);
  return ((ecl.elon % 360) + 360) % 360;
}

// Find days where a transit makes an exact aspect (orb < 1°) to a natal planet
// by looking for local orb minima (orb shrinks then grows)
function computePersonalEvents(natalChart: NatalChart, fromDate: Date, lookahead: number): PersonalEvent[] {
  const events: PersonalEvent[] = [];
  const seen = new Set<string>(); // one event per transit-aspect-natal combo

  const personalPlanets = natalChart.planets.filter(p => PERSONAL_NATAL.has(p.name));

  for (const { name: tName, body, priority } of TRACKED_PLANETS) {
    for (const natal of personalPlanets) {
      for (const [typeName, angle] of Object.entries(ASPECT_ANGLES)) {
        // Scan forward to find when this aspect is nearest exact (orb minimum)
        let prevOrb = Infinity;

        for (let d = 0; d <= lookahead; d++) {
          const date = new Date(fromDate.getTime() + d * 86400000);
          const tLon = getEclipticLon(body, date);
          const { name: tSign } = longitudeToSign(tLon);

          let diff = Math.abs(tLon - natal.longitude) % 360;
          if (diff > 180) diff = 360 - diff;
          const orb = Math.abs(diff - angle);

          // Local minimum: orb was decreasing, now starts increasing
          if (orb <= 1.2 && orb > prevOrb && prevOrb <= 1.0) {
            const key = `${tName}-${typeName}-${natal.name}`;
            if (!seen.has(key)) {
              seen.add(key);

              const favorable = typeName === "conjunction"
                ? (CONJUNCTION_FAVORABLE[tName] ?? true)
                : FAVORABLE_ASPECTS.has(typeName);

              const meaning = favorable
                ? (MEANINGS[tName]?.fav ?? "korzystna energia")
                : (MEANINGS[tName]?.tense ?? "wymagający czas");

              events.push({
                daysFromNow: d - 1,
                date: new Date(fromDate.getTime() + (d - 1) * 86400000).toISOString().slice(0, 10),
                transit_planet: tName,
                transit_sign: tSign,
                aspect_label: ASPECT_LABEL[typeName] ?? typeName,
                natal_planet: natal.name,
                favorable,
                meaning,
              });
            }
          }

          // Reset if orb jumped above threshold (planet moved past)
          if (orb > 3) prevOrb = Infinity;
          else prevOrb = orb;
        }
      }
    }
  }

  // Sort by date, then by planet priority (more important first on same day)
  return events
    .sort((a, b) => a.daysFromNow - b.daysFromNow || (TRACKED_PLANETS.find(p => p.name === b.transit_planet)?.priority ?? 0) - (TRACKED_PLANETS.find(p => p.name === a.transit_planet)?.priority ?? 0))
    .slice(0, 6);
}

type Props = { chart: NatalChart };

export default function UpcomingEvents({ chart }: Props) {
  const events = useMemo(() => computePersonalEvents(chart, new Date(), 60), [chart]);

  if (events.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl p-4 border border-white/10">
      <h3 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wide">Twoje nadchodzące okna</h3>
      <ul className="space-y-4">
        {events.map((e, i) => (
          <li key={i} className="flex gap-4 items-start">
            {/* Fixed-width date column — never wraps */}
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
                <span className="text-amber-200">Twojego {e.natal_planet}</span>
              </p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{e.meaning}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
