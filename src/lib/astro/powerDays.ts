/**
 * Personalne Dni Mocy — top 5 dni miesią rankowane tranzytami wolnych planet
 * do pozycji natalnych usera. Pure functions, zero I/O.
 */
import { getTransitsForDate } from "./transits";
import type { NatalChart } from "@/lib/astro-types";
import type { Transit } from "./transits";

export type PowerDay = {
  date:       string;      // "2026-06-15"
  score:      number;
  topTransit: Transit;     // tranzyt który czyni dzień mocnym
};

// Tylko wolne planety → Dni Mocy (szybkie są codzienne, bez wartości jako "mocny dzień")
const SLOW_PLANETS = new Set(["Jowisz", "Saturn", "Uran", "Neptun", "Pluton"]);

export function getPowerDays(natalChart: NatalChart, year: number, month: number): PowerDay[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const candidates: PowerDay[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const date    = new Date(Date.UTC(year, month - 1, d, 12, 0, 0));
    const dateStr = date.toISOString().slice(0, 10);

    const transits  = getTransitsForDate(natalChart, date);
    const slowOnes  = transits.filter(t => SLOW_PLANETS.has(t.transitPlanet));

    if (slowOnes.length === 0) continue;

    const top     = slowOnes[0]; // already sorted by score desc
    const score   = slowOnes.slice(0, 3).reduce((s, t) => s + t.score, 0);

    candidates.push({ date: dateStr, score, topTransit: top });
  }

  // Top 5 highest score days in the month
  return candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .sort((a, b) => a.date.localeCompare(b.date)); // sort by date for display
}
