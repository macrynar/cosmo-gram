/**
 * "Kiedy najlepiej…?" engine — Faza 3.
 * Pure functions: no I/O, no AI, fully deterministic.
 * External entry-point: bestWindowForDomain().
 *
 * Architecture:
 *   bestWindowForDomain → getWindowsInHorizon (calls getFastWindows per month)
 *                       → findBestFromWindows (pure, exposed for tests)
 *   Special case: domain="Energia" (Odpoczynek chip) → findQuietPeriod
 */

import type { NatalChart } from "@/lib/astro-types";
import { getFastWindows, type TransitWindow } from "./layers";
import { WINDOW_MIN_SCORE } from "./calendarLimits";
import type { UIDomain } from "./domains";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type WhenBestResult = {
  kind:       "window";
  domain:     UIDomain | "Uważaj";
  window:     TransitWindow;
  peakDate:   string;   // ISO
  rangeStart: string;   // ISO
  rangeEnd:   string;   // ISO
};

export type QuietResult = {
  kind:  "quiet";
  start: string;        // ISO
  end:   string;        // ISO
  days:  number;
};

export type WhenBestAnswer = WhenBestResult | QuietResult | null;

// ─── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_HORIZON_DAYS = 90;
const QUIET_MIN_DAYS       = 5;   // minimum stretch of days without high-score windows

// ─── Helpers ───────────────────────────────────────────────────────────────────

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(date: Date, n: number): Date {
  return new Date(date.getTime() + n * 86_400_000);
}

// ─── Domain matchers ────────────────────────────────────────────────────────────
// Heuristic v1 — §7 of koncepcja v6, pending astrologer verification.

type Matcher = (w: TransitWindow) => boolean;

const MATCHERS: Record<UIDomain | "Uważaj", Matcher> = {
  Kariera: w => w.category === "kariera" || (w.category === "energia" && w.natalPoint === "MC"),
  Relacje: w => w.category === "miłość"  || w.category === "intuicja",
  Finanse: w => (w.transitPlanet === "Jowisz" || w.transitPlanet === "Wenus") && w.favorable,
  Decyzje: w => w.category === "komunikacja",
  Energia: w => w.category === "energia" && w.natalPoint !== "MC", // direct Energia (not Odpoczynek path)
  Uważaj:  w => w.character === "wymagające",
};

// ─── findBestFromWindows (pure — exposed for unit tests) ───────────────────────

/**
 * Given a pre-computed list of windows (already filtered to a date range),
 * find the earliest-peak window matching the domain.
 * For "Uważaj" we want challenging windows; for all others we want supporting ones.
 */
export function findBestFromWindows(
  windows:    TransitWindow[],
  domain:     UIDomain | "Uważaj",
  fromDateISO: string,
): WhenBestResult | null {
  const matcher    = MATCHERS[domain];
  const wantGood   = domain !== "Uważaj";

  const candidates = windows.filter(w => {
    if (w.peak < fromDateISO) return false;      // past peaks
    if (!matcher(w)) return false;
    if (wantGood && !w.favorable) return false;  // for positive domains, only favorable
    return true;
  });

  // Sort: earliest peak first; on tie pick highest score
  candidates.sort((a, b) => {
    const d = a.peak.localeCompare(b.peak);
    return d !== 0 ? d : b.score - a.score;
  });

  const best = candidates[0];
  if (!best) return null;

  return {
    kind:       "window",
    domain,
    window:     best,
    peakDate:   best.peak,
    rangeStart: best.start,
    rangeEnd:   best.end,
  };
}

// ─── getWindowsInHorizon (fetches multiple months) ─────────────────────────────

function getWindowsInHorizon(
  chart:       NatalChart,
  fromDate:    Date,
  horizonDays: number,
): TransitWindow[] {
  const endDate  = addDays(fromDate, horizonDays);
  const toISO    = isoDate(endDate);
  const fromISO  = isoDate(fromDate);
  const seen     = new Set<string>();
  const result: TransitWindow[] = [];

  // Scan month by month
  let cursor = new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), 1));

  while (cursor <= endDate) {
    const year  = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth() + 1;

    for (const w of getFastWindows(chart, year, month)) {
      const key = `${w.transitPlanet}-${w.aspectType}-${w.natalPoint}-${w.peak}`;
      if (!seen.has(key) && w.peak >= fromISO && w.peak <= toISO) {
        seen.add(key);
        result.push(w);
      }
    }

    // Advance to next month
    cursor = new Date(Date.UTC(year, month, 1));
  }

  return result;
}

// ─── findQuietPeriod — first run of ≥ QUIET_MIN_DAYS with no active windows ───

function findQuietPeriod(
  chart:       NatalChart,
  fromDate:    Date,
  horizonDays: number,
): QuietResult | null {
  const windows = getWindowsInHorizon(chart, fromDate, horizonDays);

  // Build busy-date set (every calendar day covered by any window meeting threshold)
  const busy = new Set<string>();
  for (const w of windows) {
    if (w.score < WINDOW_MIN_SCORE) continue;
    let d = new Date(w.start + "T12:00:00Z");
    const wEnd = new Date(w.end + "T12:00:00Z");
    while (d <= wEnd) {
      busy.add(isoDate(d));
      d = addDays(d, 1);
    }
  }

  // Scan for first quiet stretch
  const endDate = addDays(fromDate, horizonDays);
  let quietStart: string | null = null;
  let quietLen = 0;

  for (let d = new Date(fromDate); d <= endDate; d = addDays(d, 1)) {
    const ds = isoDate(d);
    if (!busy.has(ds)) {
      if (!quietStart) quietStart = ds;
      quietLen++;
      if (quietLen >= QUIET_MIN_DAYS) {
        return {
          kind:  "quiet",
          start: quietStart,
          end:   isoDate(addDays(new Date(quietStart + "T12:00:00Z"), quietLen - 1)),
          days:  quietLen,
        };
      }
    } else {
      quietStart = null;
      quietLen   = 0;
    }
  }

  return null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Find the best upcoming window (or quiet period) for the given UI domain.
 *
 * domain="Energia" → "Odpoczynek" chip → finds nearest quiet period.
 * domain="Uważaj" → finds nearest challenging window.
 * Everything else → finds nearest favorable window matching the domain heuristic.
 *
 * Returns null if nothing found within horizonDays.
 */
export function bestWindowForDomain(
  chart:       NatalChart,
  domain:      UIDomain | "Uważaj",
  horizonDays: number  = DEFAULT_HORIZON_DAYS,
  fromDate:    Date    = new Date(),
): WhenBestAnswer {
  if (domain === "Energia") {
    // "Odpoczynek" chip: find quiet period, not a busy Energia window
    return findQuietPeriod(chart, fromDate, horizonDays);
  }

  const windows = getWindowsInHorizon(chart, fromDate, horizonDays);
  return findBestFromWindows(windows, domain, isoDate(fromDate));
}
