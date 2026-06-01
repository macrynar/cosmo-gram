"use client";

import { useMemo } from "react";
import * as Astronomy from "astronomy-engine";
import { longitudeToSign } from "@/lib/astro-types";
import type { NatalChart } from "@/lib/astro-types";

type Event = {
  daysFromNow: number;
  planet: string;
  newSign: string;
  date: string;
};

const TRACKED_PLANETS: Array<{ name: string; body: Astronomy.Body }> = [
  { name: "Mars",    body: Astronomy.Body.Mars    },
  { name: "Jowisz", body: Astronomy.Body.Jupiter },
  { name: "Saturn",  body: Astronomy.Body.Saturn  },
  { name: "Wenus",   body: Astronomy.Body.Venus   },
  { name: "Merkury", body: Astronomy.Body.Mercury },
];

function getEclipticLon(body: Astronomy.Body, date: Date): number {
  const geo = Astronomy.GeoVector(body, date, false);
  const ecl = Astronomy.Ecliptic(geo);
  return ((ecl.elon % 360) + 360) % 360;
}

function computeUpcoming(fromDate: Date, days: number): Event[] {
  const events: Event[] = [];
  const today = new Date(fromDate);

  for (const { name, body } of TRACKED_PLANETS) {
    let prevSign = longitudeToSign(getEclipticLon(body, today)).name;

    for (let d = 1; d <= days; d++) {
      const date = new Date(today.getTime() + d * 86400000);
      const sign = longitudeToSign(getEclipticLon(body, date)).name;
      if (sign !== prevSign) {
        events.push({
          daysFromNow: d,
          planet: name,
          newSign: sign,
          date: date.toISOString().slice(0, 10),
        });
        prevSign = sign;
      }
    }
  }

  return events.sort((a, b) => a.daysFromNow - b.daysFromNow).slice(0, 5);
}

type Props = { chart: NatalChart };

export default function UpcomingEvents({ chart: _ }: Props) {
  const events = useMemo(() => computeUpcoming(new Date(), 60), []);

  if (events.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl p-4 border border-white/10">
      <h3 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wide">Nadchodzące zdarzenia</h3>
      <ul className="space-y-2">
        {events.map((e) => (
          <li key={`${e.planet}-${e.date}`} className="flex items-center gap-3 text-sm">
            <span className="text-amber-400 font-medium w-16 shrink-0">
              {e.daysFromNow === 1 ? "Jutro" : `Za ${e.daysFromNow} dni`}
            </span>
            <span className="text-slate-300">
              <span className="text-white font-medium">{e.planet}</span> wchodzi w <span className="text-amber-200">{e.newSign}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
