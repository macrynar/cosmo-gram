/**
 * Calendar v4: three-layer transit engine.
 *   Layer 1 — SEASONS:  slow planets (Jupiter–Pluto) → getSeasons()
 *   Layer 2 — WINDOWS:  fast planets (Mars–Sun)      → getFastWindows()
 *   Layer 3 — RHYTHM:   Moon + collective events      → getMoonRhythm(), getSkyEvents()
 *
 * All functions are pure (no I/O). All times in UTC; tz param converts display times only.
 */

import * as Astronomy from "astronomy-engine";
import { longitudeToSign, type NatalChart } from "@/lib/astro-types";
import { getTransitsForDate, type Transit, type AspectType } from "./transits";
import { WINDOW_MIN_SCORE } from "./calendarLimits";

// ─── Planet sets ───────────────────────────────────────────────────────────────

const SEASON_PLANET_BODIES: Record<string, Astronomy.Body> = {
  "Jowisz": Astronomy.Body.Jupiter,
  "Saturn":  Astronomy.Body.Saturn,
  "Uran":    Astronomy.Body.Uranus,
  "Neptun":  Astronomy.Body.Neptune,
  "Pluton":  Astronomy.Body.Pluto,
};

const FAST_PLANET_NAMES = new Set(["Mars", "Wenus", "Merkury", "Słońce"]);
const RETRO_PLANET_BODIES: Record<string, Astronomy.Body> = {
  "Merkury": Astronomy.Body.Mercury,
  "Wenus":   Astronomy.Body.Venus,
  "Mars":    Astronomy.Body.Mars,
};

// ─── Shared helpers ────────────────────────────────────────────────────────────

function getEclLon(body: Astronomy.Body, date: Date): number {
  const geo = Astronomy.GeoVector(body, date, false);
  const ecl = Astronomy.Ecliptic(geo);
  return ((ecl.elon % 360) + 360) % 360;
}

function angularDiff(a: number, b: number): number {
  let d = (a - b + 360) % 360;
  if (d > 180) d -= 360;
  return d; // signed: positive = a is ahead of b (direct motion)
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function utcDay(dateStr: string): Date {
  return new Date(dateStr + "T12:00:00Z");
}

function addDays(date: Date, n: number): Date {
  return new Date(date.getTime() + n * 86_400_000);
}

// ─── LAYER 2: FAST WINDOWS ────────────────────────────────────────────────────
//  Identical algorithm to getWindowsForMonth (windows.ts) but restricted to fast planets.

export type WindowCategory = "miłość" | "kariera" | "energia" | "komunikacja" | "transformacja" | "intuicja";
export type WindowCharacter = "wspierające" | "wymagające";

export type TransitWindow = {
  transitPlanet: string;
  transitSign:   string;
  aspectType:    AspectType;
  natalPoint:    string;
  natalSign:     string;
  start:         string;
  peak:          string;
  end:           string;
  peakOrb:       number;
  score:         number;
  lengthDays:    number;
  category:      WindowCategory;
  character:     WindowCharacter;
  favorable:     boolean;
};

function windowCategory(transitPlanet: string, natalPoint: string): WindowCategory {
  if (transitPlanet === "Wenus" || natalPoint === "Wenus") return "miłość";
  if (natalPoint === "MC")                                  return "kariera";
  if (transitPlanet === "Mars"  || natalPoint === "Słońce") return "energia";
  if (transitPlanet === "Merkury")                          return "komunikacja";
  if (natalPoint === "Księżyc" || natalPoint === "ASC")     return "intuicja";
  return "energia";
}

type ActiveWin = {
  key:       string;
  start:     string;
  peakDate:  string;
  peakOrb:   number;
  peakScore: number;
  lastDate:  string;
  transit:   Transit;
};

export function getFastWindows(
  natalChart: NatalChart,
  year:       number,
  month:      number,
): TransitWindow[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const active = new Map<string, ActiveWin>();
  const closed: TransitWindow[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const date    = new Date(Date.UTC(year, month - 1, d, 12, 0, 0));
    const dateStr = isoDate(date);

    const dayTransits = getTransitsForDate(natalChart, date).filter(
      t => FAST_PLANET_NAMES.has(t.transitPlanet) && t.score >= WINDOW_MIN_SCORE
    );

    const seenKeys = new Set<string>();

    for (const t of dayTransits) {
      const key = `${t.transitPlanet}-${t.aspectType}-${t.natalPoint}`;
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
          key, start: dateStr, peakDate: dateStr,
          peakOrb: t.orbDegrees, peakScore: t.score,
          lastDate: dateStr, transit: t,
        });
      }
    }

    for (const [key, w] of active) {
      if (!seenKeys.has(key)) {
        closed.push(closeWindow(w));
        active.delete(key);
      }
    }
  }

  for (const w of active.values()) closed.push(closeWindow(w));

  return closed.sort((a, b) => b.score - a.score);
}

function closeWindow(w: ActiveWin): TransitWindow {
  const t   = w.transit;
  const len = Math.round(
    (utcDay(w.lastDate).getTime() - utcDay(w.start).getTime()) / 86_400_000
  ) + 1;
  return {
    transitPlanet: t.transitPlanet,
    transitSign:   t.transitSign,
    aspectType:    t.aspectType,
    natalPoint:    t.natalPoint,
    natalSign:     t.natalSign,
    start:         w.start,
    peak:          w.peakDate,
    end:           w.lastDate,
    peakOrb:       w.peakOrb,
    score:         w.peakScore,
    lengthDays:    len,
    category:      windowCategory(t.transitPlanet, t.natalPoint),
    character:     t.favorable ? "wspierające" : "wymagające",
    favorable:     t.favorable,
  };
}

/** Map from date string → windows that include that date (for CalendarGrid). */
export function buildWindowDateMap(windows: TransitWindow[]): Map<string, TransitWindow[]> {
  const map = new Map<string, TransitWindow[]>();
  for (const w of windows) {
    const start = utcDay(w.start);
    const end   = utcDay(w.end);
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      const key = isoDate(d);
      const arr = map.get(key) ?? [];
      arr.push(w);
      map.set(key, arr);
    }
  }
  return map;
}

// ─── LAYER 1: SEASONS ─────────────────────────────────────────────────────────
//  One season = continuous (with retrograde gaps ≤ MAX_GAP_DAYS) period of a
//  slow-planet transit aspect within orb. Phase = position relative to exact days.

const EXACT_ORB = 0.3;  // degrees
const MAX_GAP_DAYS = 70; // retrograde gap tolerance

export type SeasonPhase = "początek" | "środek" | "domykanie";

export type Season = {
  transitPlanet: string;
  transitSign:   string;
  aspectType:    AspectType;
  natalPoint:    string;
  natalSign:     string;
  start:         string;        // ISO date of first orb entry
  end:           string;        // ISO date of last orb exit (may extend into future)
  phase:         SeasonPhase;
  exactDays:     string[];      // all days with orb < EXACT_ORB
  currentOrb:    number;        // orb at the queried date (0 if not in orb)
  score:         number;
  favorable:     boolean;
};

export function getSeasons(natalChart: NatalChart, date: Date): Season[] {
  // Scan ±18 months around the requested date, sampling every 3 days for speed
  const scanStart = addDays(date, -548);
  const scanEnd   = addDays(date, 548);

  // Map: transitKey → list of {date, orb, score, favorable, transitSign, natalSign}
  type DayOrbEntry = { dateStr: string; orb: number; score: number; favorable: boolean; transitSign: string; natalSign: string };
  const keyDays = new Map<string, DayOrbEntry[]>();

  // Step 1: coarse scan every 3 days
  for (let d = new Date(scanStart); d <= scanEnd; d = addDays(d, 3)) {
    const dayTransits = getTransitsForDate(natalChart, d).filter(
      t => t.transitPlanet in SEASON_PLANET_BODIES && t.score >= WINDOW_MIN_SCORE
    );
    for (const t of dayTransits) {
      const key = `${t.transitPlanet}-${t.aspectType}-${t.natalPoint}`;
      const arr = keyDays.get(key) ?? [];
      arr.push({
        dateStr: isoDate(d),
        orb:     t.orbDegrees,
        score:   t.score,
        favorable: t.favorable,
        transitSign: t.transitSign,
        natalSign:   t.natalSign,
      });
      keyDays.set(key, arr);
    }
  }

  // Step 2: for each transit key, group consecutive/nearby dates into seasons
  const seasons: Season[] = [];
  const queryDateStr = isoDate(date);

  for (const [keyRaw, days] of keyDays) {
    if (days.length === 0) continue;

    // Sort by date
    days.sort((a, b) => a.dateStr.localeCompare(b.dateStr));

    // Group into seasons: gap > MAX_GAP_DAYS = new season
    const groups: DayOrbEntry[][] = [];
    let current: DayOrbEntry[] = [days[0]];

    for (let i = 1; i < days.length; i++) {
      const prev = utcDay(days[i - 1].dateStr);
      const curr = utcDay(days[i].dateStr);
      const gapDays = (curr.getTime() - prev.getTime()) / 86_400_000;

      if (gapDays > MAX_GAP_DAYS) {
        groups.push(current);
        current = [days[i]];
      } else {
        current.push(days[i]);
      }
    }
    groups.push(current);

    // Step 3: convert each group to a Season
    for (const group of groups) {
      const start = group[0].dateStr;
      const end   = group[group.length - 1].dateStr;

      // Only include seasons that are active at or near the query date
      // (active = query date within season range, or season within ±3 months future)
      const startMs = utcDay(start).getTime();
      const endMs   = utcDay(end).getTime();
      const queryMs = utcDay(queryDateStr).getTime();
      const threeMonthsMs = 90 * 86_400_000;

      if (endMs < queryMs - threeMonthsMs) continue;   // too far in the past
      if (startMs > queryMs + threeMonthsMs) continue; // too far in the future

      // Find exact days (orb < EXACT_ORB)
      const exactDays = group
        .filter(e => e.orb < EXACT_ORB)
        .map(e => e.dateStr);

      // Current orb at query date (0 if query date not in season)
      const closestEntry = group.reduce((best, e) => {
        const distBest = Math.abs(utcDay(best.dateStr).getTime() - queryMs);
        const distCurr = Math.abs(utcDay(e.dateStr).getTime()    - queryMs);
        return distCurr < distBest ? e : best;
      });
      const isActive = queryMs >= startMs && queryMs <= endMs;
      const currentOrb = isActive ? closestEntry.orb : 0;

      // Determine phase
      const phase = computePhase(queryDateStr, exactDays, start, end);

      // Pick representative entry for metadata
      const rep = group.find(e => e.orb === Math.min(...group.map(x => x.orb))) ?? group[0];
      const [planet, aspect, natalPt] = keyRaw.split("-") as [string, AspectType, string];

      // Find natal sign from the natalChart
      const natalPlanet = natalChart.planets.find(p => p.name === natalPt);
      const natalSign   = natalPlanet?.sign ?? rep.natalSign;

      seasons.push({
        transitPlanet: planet,
        transitSign:   rep.transitSign,
        aspectType:    aspect,
        natalPoint:    natalPt,
        natalSign,
        start,
        end,
        phase,
        exactDays,
        currentOrb,
        score:     rep.score,
        favorable: rep.favorable,
      });
    }
  }

  // Return max 3 by score, rest still available via "pokaż wszystkie"
  return seasons
    .sort((a, b) => {
      // Active seasons first, then by score
      const aActive = utcDay(queryDateStr) >= utcDay(a.start) && utcDay(queryDateStr) <= utcDay(a.end);
      const bActive = utcDay(queryDateStr) >= utcDay(b.start) && utcDay(queryDateStr) <= utcDay(b.end);
      if (aActive !== bActive) return aActive ? -1 : 1;
      return b.score - a.score;
    });
}

function computePhase(queryDate: string, exactDays: string[], start: string, end: string): SeasonPhase {
  if (exactDays.length === 0) {
    // No exact days found (coarse scan may have missed them) — use position in season
    const startMs = utcDay(start).getTime();
    const endMs   = utcDay(end).getTime();
    const qMs     = utcDay(queryDate).getTime();
    const progress = (qMs - startMs) / (endMs - startMs);
    if (progress < 0.33) return "początek";
    if (progress < 0.66) return "środek";
    return "domykanie";
  }

  const firstExact = exactDays[0];
  const lastExact  = exactDays[exactDays.length - 1];

  if (queryDate < firstExact) return "początek";
  if (queryDate > lastExact)  return "domykanie";
  return "środek";
}

/** Returns dates in the given month where Moon changes sign (noon-to-noon comparison). */
export function getMoonSignChangeDatesForMonth(year: number, month: number): Set<string> {
  const result = new Set<string>();
  const daysInMonth = new Date(year, month, 0).getDate();
  // Day 0 of the month = last day of previous month (UTC)
  const prevDate = new Date(Date.UTC(year, month - 1, 0, 12, 0, 0));
  let prevSign = longitudeToSign(getEclLon(Astronomy.Body.Moon, prevDate)).name;
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(Date.UTC(year, month - 1, d, 12, 0, 0));
    const sign = longitudeToSign(getEclLon(Astronomy.Body.Moon, date)).name;
    if (sign !== prevSign) result.add(isoDate(date));
    prevSign = sign;
  }
  return result;
}

/** Returns ◆ exact-day dates for a set of seasons — used by CalendarGrid. */
export function getExactDaysForMonth(
  seasons: Season[],
  year:    number,
  month:   number,
): Set<string> {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  const result = new Set<string>();
  for (const s of seasons) {
    for (const d of s.exactDays) {
      if (d.startsWith(prefix)) result.add(d);
    }
  }
  return result;
}

// ─── LAYER 3a: MOON RHYTHM ────────────────────────────────────────────────────

export type MoonPhaseName = "new_moon" | "first_quarter" | "full_moon" | "last_quarter";

export type MoonRhythm = {
  sign:           string;
  nextSignChangeISO: string | null; // ISO datetime when Moon enters next sign (UTC)
  phase:          MoonPhaseName;
  phaseAngle:     number;           // 0–360° moon elongation
  isEclipse?:     boolean;          // true if this new/full moon is an eclipse
  natalHouse?:    number;           // premium: which natal house Moon transits
};

function getMoonElongation(date: Date): number {
  const moonGeo = Astronomy.GeoVector(Astronomy.Body.Moon, date, false);
  const sunGeo  = Astronomy.GeoVector(Astronomy.Body.Sun,  date, false);
  const moonEcl = Astronomy.Ecliptic(moonGeo);
  const sunEcl  = Astronomy.Ecliptic(sunGeo);
  return ((moonEcl.elon - sunEcl.elon + 360) % 360);
}

function elongationToPhase(angle: number): MoonPhaseName {
  if (angle < 45 || angle >= 315) return "new_moon";
  if (angle < 135) return "first_quarter";
  if (angle < 225) return "full_moon";
  return "last_quarter";
}

function findNextMoonSignChange(date: Date): Date | null {
  const lon0 = getEclLon(Astronomy.Body.Moon, date);
  const currentSignBoundary = Math.ceil(lon0 / 30) * 30;
  const target = currentSignBoundary === lon0
    ? currentSignBoundary + 30  // already exactly on boundary
    : currentSignBoundary;

  // Binary search: Moon moves ~13°/day; max wait ≈ 2.5 days
  let lo = date;
  let hi = addDays(date, 3);

  // Make sure hi is past the sign change
  if (getEclLon(Astronomy.Body.Moon, hi) % 30 > 5 &&
      Math.floor(getEclLon(Astronomy.Body.Moon, hi) / 30) === Math.floor(lon0 / 30)) {
    hi = addDays(date, 4);
  }

  // Binary search to 1-minute precision
  for (let i = 0; i < 40; i++) {
    const mid = new Date((lo.getTime() + hi.getTime()) / 2);
    const lonMid = getEclLon(Astronomy.Body.Moon, mid);
    const passedTarget = ((lonMid - lon0 + 360) % 360) >= ((target - lon0 + 360) % 360);
    if (passedTarget) hi = mid;
    else lo = mid;
    if (hi.getTime() - lo.getTime() < 60_000) break;
  }

  return hi;
}

function getNatalHouse(longitude: number, natalChart: NatalChart): number | undefined {
  if (!natalChart.houses?.length || natalChart.birthData.timeUnknown) return undefined;
  const cusps = [...natalChart.houses].sort((a, b) => a.house - b.house);
  for (let i = 0; i < cusps.length; i++) {
    const next = cusps[(i + 1) % cusps.length];
    const start = cusps[i].longitude;
    const end   = next.longitude;
    // Handle wrap-around at 360°
    if (end > start) {
      if (longitude >= start && longitude < end) return cusps[i].house;
    } else {
      if (longitude >= start || longitude < end) return cusps[i].house;
    }
  }
  return undefined;
}

export function getMoonRhythm(date: Date, natalChart?: NatalChart): MoonRhythm {
  const moonLon    = getEclLon(Astronomy.Body.Moon, date);
  const sign       = longitudeToSign(moonLon).name;
  const elongation = getMoonElongation(date);
  const phase      = elongationToPhase(elongation);

  let nextSignChangeISO: string | null = null;
  try {
    const changeDate = findNextMoonSignChange(date);
    nextSignChangeISO = changeDate?.toISOString() ?? null;
  } catch { /* fallback: omit */ }

  const natalHouse = natalChart
    ? getNatalHouse(moonLon, natalChart)
    : undefined;

  return {
    sign,
    nextSignChangeISO,
    phase,
    phaseAngle: Math.round(elongation * 10) / 10,
    natalHouse,
  };
}

// ─── LAYER 3b: SKY EVENTS ─────────────────────────────────────────────────────
//  Retrogrades (Merkury, Wenus, Mars) and eclipses in a date range.
//  Fully deterministic — zero AI.

export type SkyEventType =
  | "retro_start"    // station retrograde
  | "retro_end"      // station direct
  | "lunar_eclipse"
  | "solar_eclipse";

export type SkyEvent = {
  type:       SkyEventType;
  planet?:    string;       // for retro events
  date:       string;       // ISO date
  dateISO:    string;       // full ISO datetime (UTC)
  natalHouse?: number;      // premium: which natal house
};

function geocentricVelocitySign(body: Astronomy.Body, date: Date): 1 | -1 {
  const dt    = 12 * 3600_000; // 12 hours in ms
  const lon1  = getEclLon(body, new Date(date.getTime() - dt));
  const lon2  = getEclLon(body, new Date(date.getTime() + dt));
  const diff  = angularDiff(lon2, lon1);
  return diff >= 0 ? 1 : -1;
}

function findStationDate(body: Astronomy.Body, after: Date, before: Date): Date {
  // Binary search for sign change in geocentric velocity
  let lo = new Date(after);
  let hi = new Date(before);
  for (let i = 0; i < 50; i++) {
    const mid = new Date((lo.getTime() + hi.getTime()) / 2);
    const signMid  = geocentricVelocitySign(body, mid);
    const signAfter = geocentricVelocitySign(body, hi);
    if (signMid !== signAfter) lo = mid;
    else hi = mid;
    if (hi.getTime() - lo.getTime() < 3_600_000) break; // 1-hour precision
  }
  return new Date((lo.getTime() + hi.getTime()) / 2);
}

function getRetrogradePeriods(planetName: string, start: Date, end: Date): Array<{ type: SkyEventType; date: Date }> {
  const body   = RETRO_PLANET_BODIES[planetName];
  if (!body) return [];

  const events: Array<{ type: SkyEventType; date: Date }> = [];
  const STEP_MS = 5 * 86_400_000; // 5-day steps

  let prevSign = geocentricVelocitySign(body, start);
  let cursor   = new Date(start.getTime() + STEP_MS);

  while (cursor <= end) {
    const sign = geocentricVelocitySign(body, cursor);
    if (sign !== prevSign) {
      // Found a velocity sign change — binary search for exact station
      const stationDate = findStationDate(body, addDays(cursor, -5), cursor);
      events.push({
        type: prevSign === 1 ? "retro_start" : "retro_end",
        date: stationDate,
      });
    }
    prevSign = sign;
    cursor   = new Date(cursor.getTime() + STEP_MS);
  }

  return events;
}

function getEclipseEvents(start: Date, end: Date): Array<{ type: SkyEventType; date: Date }> {
  const events: Array<{ type: SkyEventType; date: Date }> = [];

  // Lunar eclipses
  try {
    let lunarCursor = new Date(start);
    for (let i = 0; i < 6; i++) {
      const eclipse = Astronomy.SearchLunarEclipse(lunarCursor);
      if (!eclipse || eclipse.peak.date > end) break;
      // Skip penumbral-only eclipses (not astrologically significant)
      if (eclipse.kind !== Astronomy.EclipseKind.Penumbral) {
        events.push({ type: "lunar_eclipse", date: eclipse.peak.date });
      }
      lunarCursor = addDays(eclipse.peak.date, 25); // skip past this eclipse
    }
  } catch { /* astronomy-engine may throw if date out of range */ }

  // Solar eclipses
  try {
    let solarCursor = new Date(start);
    for (let i = 0; i < 6; i++) {
      const eclipse = Astronomy.SearchGlobalSolarEclipse(solarCursor);
      if (!eclipse || eclipse.peak.date > end) break;
      events.push({ type: "solar_eclipse", date: eclipse.peak.date });
      solarCursor = addDays(eclipse.peak.date, 25);
    }
  } catch { /* fallback */ }

  return events;
}

export function getSkyEvents(
  start:       Date,
  end:         Date,
  natalChart?: NatalChart,
): SkyEvent[] {
  const raw: Array<{ type: SkyEventType; date: Date; planet?: string }> = [];

  // Retrogrades
  for (const planetName of Object.keys(RETRO_PLANET_BODIES)) {
    const periods = getRetrogradePeriods(planetName, start, end);
    for (const p of periods) raw.push({ ...p, planet: planetName });
  }

  // Eclipses
  const eclipses = getEclipseEvents(start, end);
  for (const e of eclipses) raw.push(e);

  // Convert to SkyEvent, optionally attach natal house
  return raw
    .filter(e => e.date >= start && e.date <= end)
    .map(e => {
      let natalHouse: number | undefined;
      if (natalChart && !natalChart.birthData.timeUnknown) {
        // For retrogrades: house where the planet currently stands
        if (e.planet && e.planet in RETRO_PLANET_BODIES) {
          const body   = RETRO_PLANET_BODIES[e.planet];
          const lon    = getEclLon(body, e.date);
          natalHouse   = getNatalHouse(lon, natalChart);
        }
        // For eclipses: house of Sun (solar) or Moon (lunar)
        if (e.type === "solar_eclipse") {
          const lon  = getEclLon(Astronomy.Body.Sun, e.date);
          natalHouse = getNatalHouse(lon, natalChart);
        }
        if (e.type === "lunar_eclipse") {
          const lon  = getEclLon(Astronomy.Body.Moon, e.date);
          natalHouse = getNatalHouse(lon, natalChart);
        }
      }
      return {
        type:       e.type,
        planet:     e.planet,
        date:       isoDate(e.date),
        dateISO:    e.date.toISOString(),
        natalHouse,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ─── Moon rhythm text maps ────────────────────────────────────────────────────
//  Zero AI — deterministic text for TodayBar "1 sentence of rhythm"

const MOON_SIGN_SENTENCE: Record<string, string> = {
  "Baran":      "Dziś sprzyjają inicjatywa i szybkie decyzje.",
  "Byk":        "Dobry czas na spokój, ciało i rzeczy, które trwają.",
  "Bliźnięta":  "Rozmowy i informacje niosą dziś więcej niż zwykle.",
  "Rak":        "Emocje są bliżej powierzchni — daj im przestrzeń.",
  "Lew":        "Dziś dobre warunki na widoczność i wyrażanie siebie.",
  "Panna":      "Skupienie na detalach i porządkowaniu przynosi efekt.",
  "Waga":       "Relacje i estetyka są dziś w centrum.",
  "Skorpion":   "Intuicja i głębsze warstwy emocji są aktywne.",
  "Strzelec":   "Dobry czas na szersze perspektywy i odwagę.",
  "Koziorożec": "Skupienie i wytrwałość przynoszą dziś realne rezultaty.",
  "Wodnik":     "Nowe idee i nieoczekiwane połączenia są w obiegu.",
  "Ryby":       "Wrażliwość i wyobraźnia są dziś wzmocnione.",
};

const MOON_HOUSE_SUFFIX: Record<number, string> = {
  1: " Księżyc w Twoim 1. domu — dzień tożsamości.",
  2: " Księżyc w Twoim 2. domu — uwaga na finanse i wartości.",
  3: " Księżyc w Twoim 3. domu — komunikacja i bliskie otoczenie.",
  4: " Księżyc w Twoim 4. domu — dom i rodzina są bliżej.",
  5: " Księżyc w Twoim 5. domu — dobry czas na radość i kreatywność.",
  6: " Księżyc w Twoim 6. domu — ciało i codzienność wymagają uwagi.",
  7: " Księżyc w Twoim 7. domu — relacje, partnerstwo, spotkania.",
  8: " Księżyc w Twoim 8. domu — głębsze tematy emocji i zasobów.",
  9: " Księżyc w Twoim 9. domu — szerszy horyzont, ekspansja.",
  10: " Księżyc w Twoim 10. domu — zawodowa widoczność.",
  11: " Księżyc w Twoim 11. domu — społeczność i grupowe myślenie.",
  12: " Księżyc w Twoim 12. domu — wyciszenie i introspekcja.",
};

export function moonRhythmSentence(rhythm: MoonRhythm): string {
  const base   = MOON_SIGN_SENTENCE[rhythm.sign] ?? "";
  const suffix = rhythm.natalHouse ? (MOON_HOUSE_SUFFIX[rhythm.natalHouse] ?? "") : "";
  return base + suffix;
}

// ─── Retro text maps ──────────────────────────────────────────────────────────

const RETRO_PLANET_TEXT: Record<string, { start: string; end: string }> = {
  "Merkury": {
    start: "Merkury retrograduje — sprawdzaj szczegóły, unikaj kluczowych podpisów.",
    end:   "Merkury wraca do biegu prostego — komunikacja się klaruje.",
  },
  "Wenus": {
    start: "Wenus retrograduje — czas na rewizję relacji i wartości.",
    end:   "Wenus znów w biegu prostym — powrót do harmonii.",
  },
  "Mars": {
    start: "Mars retrograduje — energia wymaga cierpliwości, nie pchnięcia.",
    end:   "Mars wychodzi z retrogradu — inicjatywa wraca do łask.",
  },
};

export function skyEventText(event: SkyEvent): string {
  if (event.type === "retro_start" && event.planet) {
    return RETRO_PLANET_TEXT[event.planet]?.start ?? "";
  }
  if (event.type === "retro_end" && event.planet) {
    return RETRO_PLANET_TEXT[event.planet]?.end ?? "";
  }
  if (event.type === "solar_eclipse") return "Zaćmienie Słońca — moment przełomowych początków.";
  if (event.type === "lunar_eclipse") return "Zaćmienie Księżyca — kulminacja i głębokie zwroty.";
  return "";
}
