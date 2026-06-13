import type { NatalChart } from "@/lib/astro-types";
import { longitudeToSign } from "@/lib/astro-types";

export type AspectType = "conjunction" | "sextile" | "trine" | "square" | "opposition";
export type AspectHarmony = "harmonious" | "tense" | "intense";

export type SynastryAspect = {
  planet_a:    string;
  sign_a:      string;
  lon_a:       number;   // ecliptic longitude — needed for SynastryWheel
  planet_b:    string;
  sign_b:      string;
  lon_b:       number;
  type:        AspectType;
  orb_degrees: number;
  harmony:     AspectHarmony;
  importance:  number;   // 0–1, higher = more significant
};

export type SynastryScores = {
  overall:       number; // 30–95
  communication: number;
  passion:       number;
  emotional:     number;
  values:        number;
  independence:  number;
  challenge:     number;
  longevity:     number;
  destiny:       number;
};

export type SynastryResult = {
  aspects: SynastryAspect[];
  scores:  SynastryScores;
};

// ─── Tight orbs per spec ──────────────────────────────────────────────────────
const MAX_ORB: Record<AspectType, number> = {
  conjunction: 3.0,
  opposition:  3.0,
  square:      2.5,
  trine:       2.5,
  sextile:     2.0,
};

const ASPECT_ANGLES: Record<AspectType, number> = {
  conjunction: 0,
  sextile:     60,
  square:      90,
  trine:       120,
  opposition:  180,
};

const PLANET_WEIGHT: Record<string, number> = {
  "Słońce":    1.00,
  "Księżyc":   0.90,
  "Wenus":     0.85,
  "Mars":      0.85,
  "Saturn":    0.80,
  "Ascendent": 0.90,
  "Merkury":   0.75,
  "Jowisz":    0.70,
  "Pluton":    0.65,
  "Uran":      0.50,
  "Neptun":    0.45,
};

const ASPECT_WEIGHT: Record<AspectType, number> = {
  conjunction: 1.00,
  opposition:  0.90,
  trine:       0.85,
  square:      0.80,
  sextile:     0.70,
};

function angleDiff(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function classifyHarmony(type: AspectType, pA: string, pB: string): AspectHarmony {
  if (type === "trine" || type === "sextile") return "harmonious";
  if (type === "square" || type === "opposition") return "tense";
  // Conjunction — harsh planets make it tense
  const harsh = new Set(["Saturn", "Mars", "Pluton", "Uran"]);
  if (harsh.has(pA) || harsh.has(pB)) return "tense";
  return "intense";
}

type PlanetPoint = { name: string; longitude: number; sign: string };

export function getSynastryAspects(
  chartA: NatalChart,
  chartB: NatalChart,
): SynastryAspect[] {
  const noTimeA = chartA.birthData.timeUnknown === true;
  const noTimeB = chartB.birthData.timeUnknown === true;

  const personal = new Set([
    "Słońce", "Księżyc", "Merkury", "Wenus", "Mars",
    "Jowisz", "Saturn", "Uran", "Neptun", "Pluton",
  ]);

  const pointsA: PlanetPoint[] = [
    ...chartA.planets
      .filter(p => personal.has(p.name))
      .filter(p => !(p.name === "Księżyc" && noTimeA))
      .map(p => ({ name: p.name, longitude: p.longitude, sign: p.sign })),
    ...(!noTimeA ? [{
      name: "Ascendent",
      longitude: chartA.ascendant,
      sign: longitudeToSign(chartA.ascendant).name,
    }] : []),
  ];

  const pointsB: PlanetPoint[] = [
    ...chartB.planets
      .filter(p => personal.has(p.name))
      .filter(p => !(p.name === "Księżyc" && noTimeB))
      .map(p => ({ name: p.name, longitude: p.longitude, sign: p.sign })),
    ...(!noTimeB ? [{
      name: "Ascendent",
      longitude: chartB.ascendant,
      sign: longitudeToSign(chartB.ascendant).name,
    }] : []),
  ];

  const aspects: SynastryAspect[] = [];

  for (const pA of pointsA) {
    for (const pB of pointsB) {
      const diff = angleDiff(pA.longitude, pB.longitude);

      let best: { type: AspectType; orb: number } | null = null;
      for (const [type, angle] of Object.entries(ASPECT_ANGLES) as [AspectType, number][]) {
        const orb = Math.abs(diff - angle);
        if (orb > MAX_ORB[type]) continue;
        if (!best || orb < best.orb) best = { type, orb };
      }
      if (!best) continue;

      const pwA = PLANET_WEIGHT[pA.name] ?? 0.5;
      const pwB = PLANET_WEIGHT[pB.name] ?? 0.5;
      const importance = ((pwA + pwB) / 2) * ASPECT_WEIGHT[best.type] * (1 - best.orb / MAX_ORB[best.type]);

      aspects.push({
        planet_a:    pA.name,
        sign_a:      pA.sign,
        lon_a:       pA.longitude,
        planet_b:    pB.name,
        sign_b:      pB.sign,
        lon_b:       pB.longitude,
        type:        best.type,
        orb_degrees: Math.round(best.orb * 10) / 10,
        harmony:     classifyHarmony(best.type, pA.name, pB.name),
        importance,
      });
    }
  }

  return aspects.sort((a, b) => b.importance - a.importance);
}

// ─── Score computation ────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

export function getSynastryScore(aspects: SynastryAspect[]): SynastryScores {
  let overall = 50, communication = 50, passion = 50, emotional = 50,
      values = 50, independence = 50, challenge = 50, longevity = 50, destiny = 50;

  for (const a of aspects) {
    const sign = a.harmony === "tense" ? -1 : 1;
    const c    = sign * a.importance * 12;

    overall += c * 0.5;

    // Communication: Mercury + Sun/Moon cross-aspects
    if (a.planet_a === "Merkury" || a.planet_b === "Merkury") communication += c * 1.3;
    if (["Słońce","Księżyc"].includes(a.planet_a) && ["Słońce","Księżyc"].includes(a.planet_b))
      communication += c * 0.5;

    // Passion/attraction: Venus-Mars, Pluto-Venus
    if (["Wenus","Mars"].includes(a.planet_a) || ["Wenus","Mars"].includes(a.planet_b))
      passion += c * 1.4;

    // Emotional bond: Moon-Moon, Moon-Venus, Moon-Sun, Venus-Venus
    if (["Księżyc","Wenus"].includes(a.planet_a) && ["Księżyc","Wenus"].includes(a.planet_b))
      emotional += c * 1.5;
    if (
      (a.planet_a === "Słońce" && a.planet_b === "Księżyc") ||
      (a.planet_a === "Księżyc" && a.planet_b === "Słońce")
    ) emotional += c * 1.2;

    // Values/direction: Jupiter, Saturn, Sun
    if (["Jowisz","Saturn","Słońce"].includes(a.planet_a) || ["Jowisz","Saturn","Słońce"].includes(a.planet_b))
      values += c * 1.1;

    // Independence: Uranus aspects with personal planets
    if (a.planet_a === "Uran" || a.planet_b === "Uran") {
      const personal = ["Wenus","Księżyc","Słońce","Mars"];
      const wgt = personal.includes(a.planet_a) || personal.includes(a.planet_b) ? 1.1 : 0.6;
      independence += c * wgt;
    }

    // Challenges: tension
    if (a.harmony === "tense") challenge += c * 1.5;
    else challenge -= Math.abs(c) * 0.3;

    // Longevity: Saturn, Sun-Moon, harmonious aspects
    if (a.planet_a === "Saturn" || a.planet_b === "Saturn") longevity += c * 1.2;
    if (
      (a.planet_a === "Słońce" && a.planet_b === "Księżyc") ||
      (a.planet_a === "Księżyc" && a.planet_b === "Słońce")
    ) longevity += c * 1.5;
    if (a.harmony === "harmonious") longevity += c * 0.4;

    // Destiny/karma: Pluto, Saturn deep cross-aspects
    if (a.planet_a === "Pluton" || a.planet_b === "Pluton") destiny += c * 1.1;
    if (a.planet_a === "Saturn" || a.planet_b === "Saturn") destiny += c * 0.5;
  }

  return {
    overall:       clamp(Math.round(overall), 30, 95),
    communication: clamp(Math.round(communication), 30, 95),
    passion:       clamp(Math.round(passion), 30, 95),
    emotional:     clamp(Math.round(emotional), 30, 95),
    values:        clamp(Math.round(values), 30, 95),
    independence:  clamp(Math.round(independence), 30, 95),
    challenge:     clamp(Math.round(challenge), 30, 95),
    longevity:     clamp(Math.round(longevity), 30, 95),
    destiny:       clamp(Math.round(destiny), 30, 95),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export type PlanetPos = { name: string; lon: number; sign: string };

export function extractPlanetPositions(chart: NatalChart): PlanetPos[] {
  const personal = ["Słońce","Księżyc","Merkury","Wenus","Mars","Jowisz","Saturn","Uran","Neptun","Pluton"];
  const planets = chart.planets
    .filter(p => personal.includes(p.name))
    .map(p => ({ name: p.name, lon: p.longitude, sign: p.sign }));
  if (!chart.birthData.timeUnknown) {
    planets.push({
      name: "Ascendent",
      lon: chart.ascendant,
      sign: longitudeToSign(chart.ascendant).name,
    });
  }
  return planets;
}
