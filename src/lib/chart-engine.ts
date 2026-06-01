import * as Astronomy from "astronomy-engine";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const tzLookup = require("tz-lookup") as (lat: number, lng: number) => string;
import { longitudeToSign, ZODIAC_SIGNS, type NatalChart, type Planet, type HouseCusp } from "@/lib/astro-types";

const PLANET_DEFS = [
  { name: "Słońce",   symbol: "☉", body: Astronomy.Body.Sun     },
  { name: "Księżyc", symbol: "☽", body: Astronomy.Body.Moon    },
  { name: "Merkury", symbol: "☿", body: Astronomy.Body.Mercury },
  { name: "Wenus",   symbol: "♀", body: Astronomy.Body.Venus   },
  { name: "Mars",    symbol: "♂", body: Astronomy.Body.Mars    },
  { name: "Jowisz",  symbol: "♃", body: Astronomy.Body.Jupiter },
  { name: "Saturn",  symbol: "♄", body: Astronomy.Body.Saturn  },
  { name: "Uran",    symbol: "♅", body: Astronomy.Body.Uranus  },
  { name: "Neptun",  symbol: "♆", body: Astronomy.Body.Neptune },
  { name: "Pluton",  symbol: "♇", body: Astronomy.Body.Pluto   },
];

function getEclipticLongitude(body: Astronomy.Body, date: Date): number {
  const geo = Astronomy.GeoVector(body, date, false);
  const ecl = Astronomy.Ecliptic(geo);
  return ((ecl.elon % 360) + 360) % 360;
}

function isRetrograde(body: Astronomy.Body, date: Date): boolean {
  try {
    if (body === Astronomy.Body.Sun || body === Astronomy.Body.Moon) return false;
    const d1 = date;
    const d2 = new Date(date.getTime() + 24 * 3600 * 1000);
    const lon1 = getEclipticLongitude(body, d1);
    const lon2 = getEclipticLongitude(body, d2);
    let delta = lon2 - lon1;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    return delta < 0;
  } catch { return false; }
}

function calculateAngles(date: Date, lat: number, lng: number): { asc: number; mc: number } {
  const DEG = Math.PI / 180;
  const gast = Astronomy.SiderealTime(date);
  const lst = (gast + lng / 15 + 24) % 24;
  const ramc = (lst * 15) % 360;
  const ramcR = ramc * DEG;
  const latR  = lat * DEG;
  const jd     = Astronomy.MakeTime(date).ut + 2451545.0;
  const T      = (jd - 2451545.0) / 36525;
  const eps    = (23.439291111 - 0.013004167 * T) * DEG;

  let mcRad = Math.atan2(Math.sin(ramcR), Math.cos(ramcR) * Math.cos(eps));
  let mc = ((mcRad / DEG) + 360) % 360;
  if (ramc > 180 && mc < 180) mc += 180;
  if (ramc < 180 && mc > 180) mc -= 180;
  mc = ((mc % 360) + 360) % 360;

  const numerator   = Math.cos(ramcR);
  const denominator = -(Math.sin(ramcR) * Math.cos(eps) + Math.tan(latR) * Math.sin(eps));
  let ascRad = Math.atan2(numerator, denominator);
  let asc = ((ascRad / DEG) + 360) % 360;

  return { asc, mc };
}

function calculateEqualHouses(asc: number): HouseCusp[] {
  return Array.from({ length: 12 }, (_, i) => ({
    house: i + 1,
    longitude: (asc + i * 30) % 360,
  }));
}

function localToUtc(dateStr: string, timeStr: string, tz: string): Date {
  const localIso = `${dateStr}T${timeStr}:00`;
  const tempDate = new Date(localIso + "Z");
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  });
  let candidate = tempDate;
  for (let i = 0; i < 3; i++) {
    const parts = formatter.formatToParts(candidate);
    const p: Record<string, string> = {};
    parts.forEach(({ type, value }) => { p[type] = value; });
    const localAtTz = new Date(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`);
    const diff = tempDate.getTime() - localAtTz.getTime();
    candidate = new Date(tempDate.getTime() + diff);
  }
  return candidate;
}

export type ChartInput = {
  date: string;
  time: string;
  lat: number;
  lng: number;
  place: string;
  timeUnknown?: boolean;
};

export type ChartPlacement = {
  planet: string;
  sign: string;
  house: number | null;
  retrograde?: boolean;
};

export type NatalAspect = {
  planet_a: string;
  planet_b: string;
  type: "conjunction" | "sextile" | "square" | "trine" | "opposition";
};

export type ChartNodes = {
  north_node_sign: string;
  north_node_house: number | null;
  south_node_sign: string;
  south_node_house: number | null;
};

export type ChartResult = {
  chart: NatalChart;
  promptContext: string;
  placements: ChartPlacement[];
  aspects: NatalAspect[];
  nodes: ChartNodes;
};

function getMeanNorthNodeLongitude(utcDate: Date): number {
  const jd = Astronomy.MakeTime(utcDate).ut + 2451545.0;
  const T = (jd - 2451545.0) / 36525;
  return ((125.04452 - 1934.136261 * T) % 360 + 360) % 360;
}

function getPlanetHouse(longitude: number, houses: HouseCusp[]): number {
  for (let i = 0; i < 12; i++) {
    const cur  = houses[i].longitude;
    const next = houses[(i + 1) % 12].longitude;
    if (cur <= next) {
      if (longitude >= cur && longitude < next) return i + 1;
    } else {
      if (longitude >= cur || longitude < next) return i + 1;
    }
  }
  return 1;
}

const ASPECT_DEFS: Array<{ type: NatalAspect["type"]; angle: number; orb: number }> = [
  { type: "conjunction", angle: 0,   orb: 8 },
  { type: "sextile",     angle: 60,  orb: 5 },
  { type: "square",      angle: 90,  orb: 7 },
  { type: "trine",       angle: 120, orb: 8 },
  { type: "opposition",  angle: 180, orb: 8 },
];

function computeNatalAspects(
  bodies: Array<{ name: string; longitude: number }>
): NatalAspect[] {
  const result: NatalAspect[] = [];
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      let diff = Math.abs(bodies[i].longitude - bodies[j].longitude) % 360;
      if (diff > 180) diff = 360 - diff;
      for (const { type, angle, orb } of ASPECT_DEFS) {
        if (Math.abs(diff - angle) <= orb) {
          result.push({ planet_a: bodies[i].name, planet_b: bodies[j].name, type });
          break;
        }
      }
    }
  }
  return result;
}

export function calculateChart(input: ChartInput): ChartResult {
  const { date, lat, lng, place, timeUnknown } = input;
  const effectiveTime = timeUnknown ? "12:00" : input.time;

  const timezone: string = tzLookup(lat, lng) ?? "UTC";
  const utcDate = localToUtc(date, effectiveTime, timezone);

  const planets: Planet[] = PLANET_DEFS.map(({ name, symbol, body }) => {
    const longitude = getEclipticLongitude(body, utcDate);
    const { name: signName, symbol: signSymbol, degree, minute } = longitudeToSign(longitude);
    return {
      name, symbol, longitude,
      sign: signName, signSymbol, degree, minute,
      isRetrograde: isRetrograde(body, utcDate),
    };
  });

  // When time is unknown: still compute ASC/houses for the chart object (using noon)
  // but exclude them from the AI prompt context so the model won't interpret them
  const { asc, mc } = calculateAngles(utcDate, lat, lng);
  const houses: HouseCusp[] = calculateEqualHouses(asc);

  const chart: NatalChart = {
    planets, houses, ascendant: asc, mc,
    birthData: { date, time: effectiveTime, place, lat, lng, timezone, timeUnknown },
  };

  let promptContext: string;

  if (timeUnknown) {
    const planetList = planets.map(
      (p) => `${p.name} ${p.degree}°${p.minute}' ${p.sign}${p.isRetrograde ? " (↺)" : ""}`
    );
    promptContext = `[GODZINA URODZENIA NIEZNANA]
Data i miejsce urodzenia: ${date}, ${place}
Obliczenia wykonano dla godziny 12:00 jako przybliżenia.
Księżyc: pozycja może być nieprecyzyjna (przesuwa się ~12° na dobę) - zaznacz to w interpretacji.
Ascendent, MC i domy: NIEDOSTĘPNE - nie interpretuj ich.

Planety (bez domów):
${planetList.join("\n")}`;
  } else {
    const planetList = planets.map(
      (p) => `${p.name} ${p.degree}°${p.minute}' ${p.sign}${p.isRetrograde ? " (↺)" : ""} – dom ${houses.findIndex((h, i) => {
        const next = houses[(i + 1) % 12].longitude;
        const cur  = h.longitude;
        const lon  = p.longitude;
        if (cur <= next) return lon >= cur && lon < next;
        return lon >= cur || lon < next;
      }) + 1}`
    );
    const ascSign = longitudeToSign(asc);
    const mcSign  = longitudeToSign(mc);
    promptContext = `Data i miejsce urodzenia: ${date} ${input.time}, ${place}
Ascendent: ${ascSign.degree}°${ascSign.minute}' ${ZODIAC_SIGNS[Math.floor(asc/30)].name}
Medium Coeli (MC): ${mcSign.degree}°${mcSign.minute}' ${ZODIAC_SIGNS[Math.floor(mc/30)].name}
Planety:\n${planetList.join("\n")}`;
  }

  // ── Structured data for new AI prompt format ───────────────────────────
  const northNodeLon = getMeanNorthNodeLongitude(utcDate);
  const southNodeLon = (northNodeLon + 180) % 360;

  const northNodeSign = longitudeToSign(northNodeLon);
  const southNodeSign = longitudeToSign(southNodeLon);

  const placements: ChartPlacement[] = planets.map((p) => ({
    planet: p.name,
    sign: p.sign,
    house: timeUnknown ? null : getPlanetHouse(p.longitude, houses),
    ...(p.isRetrograde ? { retrograde: true } : {}),
  }));

  if (!timeUnknown) {
    const ascSign = longitudeToSign(asc);
    placements.unshift({ planet: "Ascendent", sign: ascSign.name, house: 1 });
  }

  const bodiesForAspects = planets.map((p) => ({ name: p.name, longitude: p.longitude }));
  bodiesForAspects.push({ name: "Węzeł Północny", longitude: northNodeLon });

  const aspects = computeNatalAspects(bodiesForAspects);

  const nodes: ChartNodes = {
    north_node_sign: northNodeSign.name,
    north_node_house: timeUnknown ? null : getPlanetHouse(northNodeLon, houses),
    south_node_sign: southNodeSign.name,
    south_node_house: timeUnknown ? null : getPlanetHouse(southNodeLon, houses),
  };

  return { chart, promptContext, placements, aspects, nodes };
}

export type TransitAspect = {
  transit_planet: string;
  transit_sign: string;
  aspect_type: string;
  natal_planet: string;
  natal_sign: string;
  orb_degrees: number;
  favorable: boolean;
};

const ASPECT_ANGLES_TRANSIT: Record<string, number> = {
  conjunction: 0, sextile: 60, trine: 120, square: 90, opposition: 180,
};

const FAVORABLE_ASPECTS = new Set(["conjunction_beneficial", "sextile", "trine"]);
const TENSE_ASPECTS = new Set(["square", "opposition"]);

const CONJUNCTION_FAVORABLE: Record<string, boolean> = {
  "Jowisz": true, "Wenus": true, "Słońce": true,
  "Saturn": false, "Mars": false, "Neptun": false, "Pluton": false,
};

export function computeTopTransits(natalChart: NatalChart, date: Date = new Date()): {
  supporting: TransitAspect | null;
  challenging: TransitAspect | null;
} {
  const transitLongitudes: { name: string; longitude: number; sign: string }[] = PLANET_DEFS.map(({ name, body }) => {
    const longitude = getEclipticLongitude(body, date);
    const { name: signName } = longitudeToSign(longitude);
    return { name, longitude, sign: signName };
  });

  const aspects: TransitAspect[] = [];

  for (const transit of transitLongitudes) {
    for (const natal of natalChart.planets) {
      let diff = Math.abs(transit.longitude - natal.longitude) % 360;
      if (diff > 180) diff = 360 - diff;

      for (const [typeName, angle] of Object.entries(ASPECT_ANGLES_TRANSIT)) {
        const orb = Math.abs(diff - angle);
        if (orb > 5) continue;

        let favorable: boolean;
        if (typeName === "conjunction") {
          favorable = CONJUNCTION_FAVORABLE[transit.name] ?? true;
        } else {
          favorable = FAVORABLE_ASPECTS.has(typeName);
        }

        const aspect_type = typeName === "conjunction"
          ? (favorable ? "spotkanie (harmonia)" : "spotkanie (napięcie)")
          : typeName === "sextile" ? "dobre wsparcie"
          : typeName === "trine" ? "harmonia"
          : typeName === "square" ? "napięcie"
          : "biegunowość";

        aspects.push({
          transit_planet: transit.name,
          transit_sign: transit.sign,
          aspect_type,
          natal_planet: natal.name,
          natal_sign: natal.sign,
          orb_degrees: orb,
          favorable,
        });
      }
    }
  }

  // Weight by planet importance and orb closeness
  const planetPriority: Record<string, number> = {
    "Słońce": 10, "Księżyc": 10, "Wenus": 8, "Mars": 8, "Merkury": 6,
    "Jowisz": 5, "Saturn": 5, "Uran": 2, "Neptun": 2, "Pluton": 2,
  };

  const score = (a: TransitAspect) => {
    const p = (planetPriority[a.transit_planet] ?? 1) + (planetPriority[a.natal_planet] ?? 1);
    const orbScore = (5 - a.orb_degrees) / 5;
    return p * orbScore;
  };

  const supporting = aspects
    .filter(a => a.favorable)
    .sort((a, b) => score(b) - score(a))[0] ?? null;

  const challenging = aspects
    .filter(a => !a.favorable && (TENSE_ASPECTS.has(Object.keys(ASPECT_ANGLES_TRANSIT).find(k =>
      a.aspect_type.includes("napięcie") || a.aspect_type.includes("biegunowość")
    ) ?? "")))
    .sort((a, b) => score(b) - score(a))[0] ?? null;

  // Fallback: if no tense aspect classified above, take lowest-favorable
  const challengingFallback = challenging ?? aspects
    .filter(a => !a.favorable)
    .sort((a, b) => score(b) - score(a))[0] ?? null;

  return { supporting, challenging: challengingFallback };
}

// ── Calendar ───────────────────────────────────────────────────────────────

export type DayData = {
  date: string;               // "2026-06-15"
  score: number;              // 0–10 overall intensity
  positiveScore: number;
  challengingScore: number;
  intentionScores: { love: number; career: number; peace: number };
  topSupporting: TransitAspect | null;
  topChallenging: TransitAspect | null;
};

const LOVE_PLANETS    = new Set(["Wenus", "Księżyc"]);
const CAREER_PLANETS  = new Set(["Słońce", "Saturn", "Mars", "Jowisz"]);
const PEACE_PLANETS   = new Set(["Neptun", "Księżyc", "Jowisz"]);

export function computeDayScore(natalChart: NatalChart, date: Date): DayData {
  const dateStr = date.toISOString().slice(0, 10);

  const transitLongitudes = PLANET_DEFS.map(({ name, body }) => {
    const longitude = getEclipticLongitude(body, date);
    const { name: signName } = longitudeToSign(longitude);
    return { name, longitude, sign: signName };
  });

  const planetPriority: Record<string, number> = {
    "Słońce": 10, "Księżyc": 10, "Wenus": 8, "Mars": 8, "Merkury": 6,
    "Jowisz": 5, "Saturn": 5, "Uran": 2, "Neptun": 2, "Pluton": 2,
  };

  let posRaw = 0, negRaw = 0;
  let loveRaw = 0, careerRaw = 0, peaceRaw = 0;
  const allAspects: TransitAspect[] = [];

  for (const transit of transitLongitudes) {
    for (const natal of natalChart.planets) {
      let diff = Math.abs(transit.longitude - natal.longitude) % 360;
      if (diff > 180) diff = 360 - diff;

      for (const [typeName, angle] of Object.entries(ASPECT_ANGLES_TRANSIT)) {
        const orb = Math.abs(diff - angle);
        if (orb > 5) continue;

        let favorable: boolean;
        if (typeName === "conjunction") {
          favorable = CONJUNCTION_FAVORABLE[transit.name] ?? true;
        } else {
          favorable = FAVORABLE_ASPECTS.has(typeName);
        }

        const aspect_type = typeName === "conjunction"
          ? (favorable ? "spotkanie (harmonia)" : "spotkanie (napięcie)")
          : typeName === "sextile" ? "dobre wsparcie"
          : typeName === "trine" ? "harmonia"
          : typeName === "square" ? "napięcie"
          : "biegunowość";

        const weight = ((planetPriority[transit.name] ?? 1) + (planetPriority[natal.name] ?? 1))
          * ((5 - orb) / 5);

        if (favorable) posRaw += weight;
        else negRaw += weight;

        if (LOVE_PLANETS.has(transit.name)) loveRaw += weight;
        if (CAREER_PLANETS.has(transit.name)) careerRaw += weight;
        if (PEACE_PLANETS.has(transit.name) && favorable) peaceRaw += weight;

        allAspects.push({
          transit_planet: transit.name,
          transit_sign: transit.sign,
          aspect_type,
          natal_planet: natal.name,
          natal_sign: natal.sign,
          orb_degrees: orb,
          favorable,
        });
      }
    }
  }

  const norm = (v: number, max: number) => Math.min(10, Math.round((v / max) * 10));
  const MAX_WEIGHT = 120;

  const score = norm(posRaw + negRaw, MAX_WEIGHT);
  const positiveScore = norm(posRaw, MAX_WEIGHT / 2);
  const challengingScore = norm(negRaw, MAX_WEIGHT / 2);

  const scoreAspect = (a: TransitAspect) => {
    const p = (planetPriority[a.transit_planet] ?? 1) + (planetPriority[a.natal_planet] ?? 1);
    return p * ((5 - a.orb_degrees) / 5);
  };

  const topSupporting = allAspects.filter(a => a.favorable).sort((a, b) => scoreAspect(b) - scoreAspect(a))[0] ?? null;
  const topChallenging = allAspects.filter(a => !a.favorable).sort((a, b) => scoreAspect(b) - scoreAspect(a))[0] ?? null;

  return {
    date: dateStr,
    score,
    positiveScore,
    challengingScore,
    intentionScores: {
      love:    norm(loveRaw, MAX_WEIGHT / 3),
      career:  norm(careerRaw, MAX_WEIGHT / 2),
      peace:   norm(peaceRaw, MAX_WEIGHT / 4),
    },
    topSupporting,
    topChallenging,
  };
}

export function computeMonthData(natalChart: NatalChart, year: number, month: number): DayData[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const result: DayData[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(Date.UTC(year, month - 1, d, 12, 0, 0));
    result.push(computeDayScore(natalChart, date));
  }
  return result;
}
