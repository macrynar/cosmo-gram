import type { Season, TransitWindow } from "./layers";
import { MAX_SEASONS_SHOWN, MAX_UPCOMING_ITEMS, MAX_BAND_COVERAGE } from "./calendarLimits";

/** Top seasons (layers.ts already sorts: active first, then by score) */
export function selectShownSeasons(seasons: Season[]): Season[] {
  return seasons.slice(0, MAX_SEASONS_SHOWN);
}

/** Upcoming window peaks on or after today, capped at MAX_UPCOMING_ITEMS */
export function selectUpcoming(windows: TransitWindow[], todayISO: string): TransitWindow[] {
  return windows
    .filter(w => w.peak >= todayISO)
    .sort((a, b) => a.peak.localeCompare(b.peak))
    .slice(0, MAX_UPCOMING_ITEMS);
}

/**
 * Filter windows so total covered days ≤ MAX_BAND_COVERAGE × totalDays.
 * Picks highest-score windows first.
 */
export function selectGridBands(windows: TransitWindow[], totalDays: number): TransitWindow[] {
  const sorted = [...windows].sort((a, b) => b.score - a.score);
  const cap    = Math.floor(totalDays * MAX_BAND_COVERAGE);
  let covered  = 0;
  const result: TransitWindow[] = [];
  for (const w of sorted) {
    if (covered + w.lengthDays > cap) continue;
    covered += w.lengthDays;
    result.push(w);
  }
  return result;
}
