/**
 * Transit windows — continuous date ranges where a significant transit stays within orb.
 * Replaces getPowerDays + dayClasses. One model: windows with a single peak day each.
 */
import { getTransitsForDate } from "./transits";
import type { Transit, AspectType } from "./transits";
import type { NatalChart } from "@/lib/astro-types";

export type WindowCategory = "miłość" | "kariera" | "energia" | "komunikacja" | "transformacja" | "intuicja";
export type WindowCharacter = "wspierające" | "wymagające";

export type TransitWindow = {
  transitPlanet: string;
  transitSign:   string;
  aspectType:    AspectType;
  natalPoint:    string;
  natalSign:     string;
  start:         string;        // ISO date "YYYY-MM-DD"
  peak:          string;        // ISO date — day of tightest orb, exactly ONE per window
  end:           string;        // ISO date
  peakOrb:       number;
  score:         number;        // score at peak
  lengthDays:    number;
  category:      WindowCategory;
  character:     WindowCharacter;
  favorable:     boolean;
};

// Only outer/slow planets generate meaningful multi-day windows
const WINDOW_PLANETS = new Set(["Jowisz", "Saturn", "Uran", "Neptun", "Pluton", "Mars"]);
const MIN_SCORE = 15;

function windowCategory(transitPlanet: string, natalPoint: string): WindowCategory {
  if (transitPlanet === "Wenus" || natalPoint === "Wenus") return "miłość";
  if (transitPlanet === "Saturn" || natalPoint === "MC")    return "kariera";
  if (transitPlanet === "Mars"   || natalPoint === "Słońce") return "energia";
  if (transitPlanet === "Merkury") return "komunikacja";
  if (transitPlanet === "Pluton") return "transformacja";
  if (transitPlanet === "Neptun" || transitPlanet === "Uran") return "intuicja";
  if (natalPoint === "Księżyc" || natalPoint === "ASC") return "intuicja";
  return "energia";
}

type WindowKey = string; // `${transitPlanet}-${aspectType}-${natalPoint}`
type ActiveWindow = {
  key:       WindowKey;
  start:     string;
  peakDate:  string;
  peakOrb:   number;
  peakScore: number;
  lastDate:  string;
  transit:   Transit;
};

export function getWindowsForMonth(
  natalChart: NatalChart,
  year:       number,
  month:      number,
): TransitWindow[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const active = new Map<WindowKey, ActiveWindow>();
  const closed: TransitWindow[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const date    = new Date(Date.UTC(year, month - 1, d, 12, 0, 0));
    const dateStr = date.toISOString().slice(0, 10);

    const dayTransits = getTransitsForDate(natalChart, date).filter(
      t => WINDOW_PLANETS.has(t.transitPlanet) && t.score >= MIN_SCORE
    );

    const seenKeys = new Set<WindowKey>();

    for (const t of dayTransits) {
      const key: WindowKey = `${t.transitPlanet}-${t.aspectType}-${t.natalPoint}`;
      seenKeys.add(key);

      if (active.has(key)) {
        const w = active.get(key)!;
        w.lastDate = dateStr;
        if (t.orbDegrees < w.peakOrb) {
          w.peakOrb  = t.orbDegrees;
          w.peakDate = dateStr;
          w.peakScore = t.score;
          w.transit  = t;
        }
      } else {
        active.set(key, {
          key,
          start:     dateStr,
          peakDate:  dateStr,
          peakOrb:   t.orbDegrees,
          peakScore: t.score,
          lastDate:  dateStr,
          transit:   t,
        });
      }
    }

    // Close windows that are no longer active this day
    for (const [key, w] of active) {
      if (!seenKeys.has(key)) {
        const t = w.transit;
        const start = w.start;
        const end   = w.lastDate;
        const len   = Math.round(
          (new Date(end + "T12:00:00Z").getTime() - new Date(start + "T12:00:00Z").getTime()) / 86_400_000
        ) + 1;
        closed.push({
          transitPlanet: t.transitPlanet,
          transitSign:   t.transitSign,
          aspectType:    t.aspectType,
          natalPoint:    t.natalPoint,
          natalSign:     t.natalSign,
          start,
          peak:          w.peakDate,
          end,
          peakOrb:       w.peakOrb,
          score:         w.peakScore,
          lengthDays:    len,
          category:      windowCategory(t.transitPlanet, t.natalPoint),
          character:     t.favorable ? "wspierające" : "wymagające",
          favorable:     t.favorable,
        });
        active.delete(key);
      }
    }
  }

  // Flush still-open windows (extend to end of month)
  for (const w of active.values()) {
    const t     = w.transit;
    const start = w.start;
    const end   = w.lastDate;
    const len   = Math.round(
      (new Date(end + "T12:00:00Z").getTime() - new Date(start + "T12:00:00Z").getTime()) / 86_400_000
    ) + 1;
    closed.push({
      transitPlanet: t.transitPlanet,
      transitSign:   t.transitSign,
      aspectType:    t.aspectType,
      natalPoint:    t.natalPoint,
      natalSign:     t.natalSign,
      start,
      peak:          w.peakDate,
      end,
      peakOrb:       w.peakOrb,
      score:         w.peakScore,
      lengthDays:    len,
      category:      windowCategory(t.transitPlanet, t.natalPoint),
      character:     t.favorable ? "wspierające" : "wymagające",
      favorable:     t.favorable,
    });
  }

  return closed.sort((a, b) => b.score - a.score);
}

// Top-5 windows by score — their peak dates are "Dni Mocy"
export function getPowerWindows(
  natalChart: NatalChart,
  year:       number,
  month:      number,
): TransitWindow[] {
  return getWindowsForMonth(natalChart, year, month)
    .slice(0, 5);
}

// Map from date string → windows that include that date (for CalendarGrid)
export function buildWindowDateMap(windows: TransitWindow[]): Map<string, TransitWindow[]> {
  const map = new Map<string, TransitWindow[]>();
  for (const w of windows) {
    const start = new Date(w.start + "T12:00:00Z");
    const end   = new Date(w.end   + "T12:00:00Z");
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      const arr = map.get(key) ?? [];
      arr.push(w);
      map.set(key, arr);
    }
  }
  return map;
}
