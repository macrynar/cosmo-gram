/**
 * Transit engine — pure functions, no I/O, no AI.
 * All planetary positions via astronomy-engine (same lib as chart-engine).
 */
import * as Astronomy from "astronomy-engine";
import { longitudeToSign, type NatalChart } from "@/lib/astro-types";

// ─── Planet definitions ────────────────────────────────────────────────────

const PLANET_DEFS = [
  { name: "Słońce",  body: Astronomy.Body.Sun     },
  { name: "Księżyc", body: Astronomy.Body.Moon    },
  { name: "Merkury", body: Astronomy.Body.Mercury },
  { name: "Wenus",   body: Astronomy.Body.Venus   },
  { name: "Mars",    body: Astronomy.Body.Mars    },
  { name: "Jowisz",  body: Astronomy.Body.Jupiter },
  { name: "Saturn",  body: Astronomy.Body.Saturn  },
  { name: "Uran",    body: Astronomy.Body.Uranus  },
  { name: "Neptun",  body: Astronomy.Body.Neptune },
  { name: "Pluton",  body: Astronomy.Body.Pluto   },
] as const;

// ─── Orbs from spec ────────────────────────────────────────────────────────

const ASPECT_ORBS: Record<string, number> = {
  conjunction: 3,
  opposition:  3,
  square:      2.5,
  trine:       2.5,
  sextile:     2,
};

const ASPECT_ANGLES: Record<string, number> = {
  conjunction: 0,
  sextile:     60,
  square:      90,
  trine:       120,
  opposition:  180,
};

// ─── Weights from spec ─────────────────────────────────────────────────────

// Transit planet weight — slow > fast
const TRANSIT_PLANET_WEIGHT: Record<string, number> = {
  "Pluton":  10,
  "Neptun":   9,
  "Uran":     8,
  "Saturn":   8,
  "Jowisz":   7,
  "Mars":     4,
  "Wenus":    3,
  "Merkury":  2,
  "Słońce":   2,
  "Księżyc":  1,
};

// Aspect weight
const ASPECT_WEIGHT: Record<string, number> = {
  conjunction: 5,
  opposition:  4,
  square:      3,
  trine:       2,
  sextile:     1,
};

// Natal point weight: Słońce/Księżyc/ASC/MC > osobiste > pozostałe
const NATAL_POINT_WEIGHT: Record<string, number> = {
  "Słońce":  5,
  "Księżyc": 5,
  "ASC":     5,
  "MC":      5,
  "Merkury": 3,
  "Wenus":   3,
  "Mars":    3,
  "Jowisz":  2,
  "Saturn":  2,
  "Uran":    1,
  "Neptun":  1,
  "Pluton":  1,
};

const FAVORABLE_ASPECTS = new Set(["trine", "sextile"]);
const CONJUNCTION_FAVORABLE: Record<string, boolean> = {
  "Jowisz": true, "Wenus": true, "Słońce": true,
  "Saturn": false, "Mars": false, "Neptun": false, "Pluton": false, "Uran": false,
  "Księżyc": true, "Merkury": true,
};

// ─── Types ─────────────────────────────────────────────────────────────────

export type AspectType = "conjunction" | "sextile" | "square" | "trine" | "opposition";

export type Transit = {
  transitPlanet:    string;
  transitSign:      string;
  transitLongitude: number;
  aspectType:       AspectType;
  natalPoint:       string;  // planet name or "ASC"/"MC"
  natalSign:        string;
  natalLongitude:   number;
  orbDegrees:       number;  // always positive, 0 = exact
  applying:         boolean; // true = getting closer (applying), false = separating
  favorable:        boolean;
  score:            number;  // composite importance score
};

export type DayWeather = {
  intensity:  1 | 2 | 3 | 4 | 5;
  element:    "Ogień" | "Ziemia" | "Powietrze" | "Woda" | "Mieszany";
  character:  string;   // single Polish word, e.g. "dynamiczny"
  dominantTransit: Transit | null;
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function getEclipticLongitude(body: Astronomy.Body, date: Date): number {
  const geo = Astronomy.GeoVector(body, date, false);
  const ecl = Astronomy.Ecliptic(geo);
  return ((ecl.elon % 360) + 360) % 360;
}

function angularDistance(a: number, b: number): number {
  let d = Math.abs(a - b) % 360;
  if (d > 180) d = 360 - d;
  return d;
}

function isApplying(transitLon: number, natalLon: number, aspectAngle: number, date: Date, body: Astronomy.Body): boolean {
  // Check if orb is decreasing (applying) by comparing tomorrow's orb
  const tomorrow = new Date(date.getTime() + 86_400_000);
  const lonTomorrow = getEclipticLongitude(body, tomorrow);
  const orbToday    = Math.abs(angularDistance(transitLon, natalLon) - aspectAngle);
  const orbTomorrow = Math.abs(angularDistance(lonTomorrow,  natalLon) - aspectAngle);
  return orbTomorrow < orbToday; // getting closer = applying
}

function isFavorable(aspectType: AspectType, transitPlanet: string): boolean {
  if (aspectType === "conjunction") return CONJUNCTION_FAVORABLE[transitPlanet] ?? true;
  if (FAVORABLE_ASPECTS.has(aspectType)) return true;
  return false;
}

function computeScore(transit: Pick<Transit, "transitPlanet" | "aspectType" | "natalPoint" | "orbDegrees">): number {
  const maxOrb = ASPECT_ORBS[transit.aspectType] ?? 2;
  const orbFactor = (maxOrb - transit.orbDegrees) / maxOrb; // 1 = exact, 0 = edge of orb
  return (
    (TRANSIT_PLANET_WEIGHT[transit.transitPlanet] ?? 1) *
    (ASPECT_WEIGHT[transit.aspectType] ?? 1) *
    (NATAL_POINT_WEIGHT[transit.natalPoint] ?? 1) *
    orbFactor
  );
}

// ─── Core: getNatalPoints ──────────────────────────────────────────────────
// Returns natal points to check against, respecting timeUnknown.

type NatalPoint = { name: string; longitude: number; sign: string };

function getNatalPoints(natalChart: NatalChart): NatalPoint[] {
  const timeUnknown = natalChart.birthData.timeUnknown;

  const points: NatalPoint[] = natalChart.planets
    // Exclude Moon when time unknown — position uncertain by ±7°
    .filter(p => !(timeUnknown && p.name === "Księżyc"))
    .map(p => ({ name: p.name, longitude: p.longitude, sign: p.sign }));

  if (!timeUnknown) {
    const ascSign = longitudeToSign(natalChart.ascendant);
    const mcSign  = longitudeToSign(natalChart.mc);
    points.push({ name: "ASC", longitude: natalChart.ascendant, sign: ascSign.name });
    points.push({ name: "MC",  longitude: natalChart.mc,        sign: mcSign.name });
  }

  return points;
}

// ─── FAZA 1.1: getTransitsForDate ─────────────────────────────────────────

export function getTransitsForDate(natalChart: NatalChart, date: Date): Transit[] {
  const natalPoints = getNatalPoints(natalChart);
  const transits: Transit[] = [];

  for (const { name: planetName, body } of PLANET_DEFS) {
    const transitLon = getEclipticLongitude(body, date);
    const transitSign = longitudeToSign(transitLon).name;

    for (const natal of natalPoints) {
      const diff = angularDistance(transitLon, natal.longitude);

      for (const [aspectName, angle] of Object.entries(ASPECT_ANGLES)) {
        const orb = Math.abs(diff - angle);
        const maxOrb = ASPECT_ORBS[aspectName];
        if (orb > maxOrb) continue;

        const aspectType = aspectName as AspectType;
        const favorable  = isFavorable(aspectType, planetName);
        const applying   = isApplying(transitLon, natal.longitude, angle, date, body);

        const partial = { transitPlanet: planetName, aspectType, natalPoint: natal.name, orbDegrees: orb };
        const score   = computeScore(partial);

        transits.push({
          transitPlanet:    planetName,
          transitSign,
          transitLongitude: transitLon,
          aspectType,
          natalPoint:       natal.name,
          natalSign:        natal.sign,
          natalLongitude:   natal.longitude,
          orbDegrees:       Math.round(orb * 100) / 100,
          applying,
          favorable,
          score,
        });
      }
    }
  }

  return transits.sort((a, b) => b.score - a.score);
}

// ─── FAZA 1.3: getDayWeather ───────────────────────────────────────────────

const SIGN_ELEMENT: Record<string, "Ogień" | "Ziemia" | "Powietrze" | "Woda"> = {
  "Baran": "Ogień", "Lew": "Ogień", "Strzelec": "Ogień",
  "Byk": "Ziemia", "Panna": "Ziemia", "Koziorożec": "Ziemia",
  "Bliźnięta": "Powietrze", "Waga": "Powietrze", "Wodnik": "Powietrze",
  "Rak": "Woda", "Skorpion": "Woda", "Ryby": "Woda",
};

// Day character by dominant transit type + planet
function resolveCharacter(topTransit: Transit | null): string {
  if (!topTransit) return "spokojny";

  const { transitPlanet, aspectType, favorable } = topTransit;

  if (transitPlanet === "Mars" && !favorable) return "konfliktowy";
  if (transitPlanet === "Mars" && favorable)  return "dynamiczny";
  if (transitPlanet === "Saturn" && !favorable) return "wymagający";
  if (transitPlanet === "Saturn" && favorable)  return "koncentracyjny";
  if (transitPlanet === "Jowisz" && favorable)  return "ekspansywny";
  if (transitPlanet === "Jowisz" && !favorable) return "nadmiarowy";
  if (transitPlanet === "Wenus"  && favorable)  return "harmonijny";
  if (transitPlanet === "Wenus"  && !favorable) return "napięty";
  if (transitPlanet === "Merkury" && favorable) return "analityczny";
  if (transitPlanet === "Merkury" && !favorable) return "chaotyczny";
  if (transitPlanet === "Księżyc") return "emocjonalny";
  if (transitPlanet === "Słońce" && favorable)  return "wyrazisty";
  if (transitPlanet === "Pluton") return "transformacyjny";
  if (transitPlanet === "Neptun") return "refleksyjny";
  if (transitPlanet === "Uran")   return "niespodziewany";

  return aspectType === "trine" || aspectType === "sextile" ? "sprzyjający" : "intensywny";
}

export function getDayWeather(transits: Transit[]): DayWeather {
  if (transits.length === 0) {
    return { intensity: 1, element: "Mieszany", character: "spokojny", dominantTransit: null };
  }

  // Intensity: sum of top-5 scores, scaled to 1–5
  const topScore = transits.slice(0, 5).reduce((s, t) => s + t.score, 0);
  // Max realistic score: Pluton koniunkcja Słońce exact = 10 * 5 * 5 * 1 = 250
  const intensity = Math.max(1, Math.min(5, Math.round((topScore / 150) * 4) + 1)) as 1|2|3|4|5;

  // Dominant element: from sign of the highest-score transit planet
  const top = transits[0];
  const elementCounts: Record<string, number> = {};
  for (const t of transits.slice(0, 5)) {
    const el = SIGN_ELEMENT[t.transitSign] ?? "Mieszany";
    elementCounts[el] = (elementCounts[el] ?? 0) + t.score;
  }
  const dominantEl = Object.entries(elementCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as DayWeather["element"] ?? "Mieszany";

  return {
    intensity,
    element:   dominantEl,
    character: resolveCharacter(top),
    dominantTransit: top,
  };
}

// ─── FAZA 1.4: getUpcomingSignificantTransits ──────────────────────────────

// Only slow/outer planets create meaningful upcoming windows
const SIGNIFICANT_PLANETS = new Set(["Saturn", "Jowisz", "Mars", "Pluton", "Neptun", "Uran"]);
const SIGNIFICANT_MIN_SCORE = 20; // filter noise

export type UpcomingTransit = Transit & { date: string };

export function getUpcomingSignificantTransits(
  natalChart: NatalChart,
  days = 14,
  fromDate: Date = new Date(),
): UpcomingTransit[] {
  const results: UpcomingTransit[] = [];
  const seen = new Set<string>(); // deduplicate same aspect across consecutive days

  for (let i = 0; i < days; i++) {
    const date = new Date(Date.UTC(
      fromDate.getUTCFullYear(),
      fromDate.getUTCMonth(),
      fromDate.getUTCDate() + i,
      12, 0, 0,
    ));
    const dateStr = date.toISOString().slice(0, 10);

    const transits = getTransitsForDate(natalChart, date)
      .filter(t =>
        SIGNIFICANT_PLANETS.has(t.transitPlanet) &&
        t.score >= SIGNIFICANT_MIN_SCORE
      );

    for (const t of transits) {
      const key = `${t.transitPlanet}-${t.aspectType}-${t.natalPoint}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({ ...t, date: dateStr });
      }
    }
  }

  return results.sort((a, b) => b.score - a.score);
}
