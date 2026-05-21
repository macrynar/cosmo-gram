import type { NatalChart } from "./astro-types";

type PlanetName =
  | "Słońce" | "Księżyc" | "Merkury" | "Wenus" | "Mars"
  | "Jowisz" | "Saturn" | "Uran" | "Neptun" | "Pluton";

type AspectType = "conjunction" | "sextile" | "trine" | "square" | "opposition";

export type SynastryAspect = {
  planet_a: PlanetName;
  sign_a: string;
  planet_b: PlanetName;
  sign_b: string;
  type: AspectType;
  orb_degrees: number;
  person_a_name: string;
  person_b_name: string;
};

export type SynastryScores = {
  overall: number;
  communication: number;
  passion: number;
  values: number;
  challenge: number;
};

const PLANET_WEIGHT: Record<PlanetName, number> = {
  "Słońce": 1.5, "Księżyc": 1.5, "Wenus": 1.2, "Mars": 1.2, "Merkury": 0.9,
  "Jowisz": 1.0, "Saturn": 1.1, "Uran": 0.6, "Neptun": 0.5, "Pluton": 0.8,
};

const CONJUNCTION_PAIR_SCORE: Record<string, number> = {
  "Wenus-Mars": 8, "Mars-Wenus": 8,
  "Słońce-Księżyc": 6, "Księżyc-Słońce": 6,
  "Słońce-Wenus": 4, "Wenus-Słońce": 4,
  "Księżyc-Wenus": 5, "Wenus-Księżyc": 5,
  "Mars-Mars": 2,
  "Saturn-Mars": -5, "Mars-Saturn": -5,
  "Saturn-Wenus": -3, "Wenus-Saturn": -3,
  "Saturn-Słońce": -2, "Słońce-Saturn": -2,
  "Saturn-Księżyc": -3, "Księżyc-Saturn": -3,
  "Pluton-Wenus": 3, "Wenus-Pluton": 3,
  "Pluton-Mars": 1, "Mars-Pluton": 1,
  "Neptun-Wenus": 2, "Wenus-Neptun": 2,
  "Neptun-Księżyc": 1, "Księżyc-Neptun": 1,
};

const ASPECT_ANGLES: Record<AspectType, number> = {
  conjunction: 0,
  sextile: 60,
  trine: 120,
  square: 90,
  opposition: 180,
};

const ORB_LIMITS: Record<AspectType, number> = {
  conjunction: 8,
  sextile: 6,
  trine: 8,
  square: 8,
  opposition: 8,
};

function angleDiff(a: number, b: number): number {
  let diff = Math.abs(a - b) % 360;
  if (diff > 180) diff = 360 - diff;
  return diff;
}

function detectAspect(lon1: number, lon2: number): { type: AspectType; orb: number } | null {
  const diff = angleDiff(lon1, lon2);
  for (const [type, angle] of Object.entries(ASPECT_ANGLES) as [AspectType, number][]) {
    const orb = Math.abs(diff - angle);
    if (orb <= ORB_LIMITS[type]) {
      return { type, orb };
    }
  }
  return null;
}

export function computeSynastryAspects(
  chart1: NatalChart,
  name1: string,
  chart2: NatalChart,
  name2: string,
): SynastryAspect[] {
  const aspects: SynastryAspect[] = [];
  const relevant: PlanetName[] = ["Słońce", "Księżyc", "Merkury", "Wenus", "Mars", "Jowisz", "Saturn", "Uran", "Neptun", "Pluton"];

  for (const p1 of chart1.planets) {
    if (!relevant.includes(p1.name as PlanetName)) continue;
    for (const p2 of chart2.planets) {
      if (!relevant.includes(p2.name as PlanetName)) continue;
      const asp = detectAspect(p1.longitude, p2.longitude);
      if (asp) {
        aspects.push({
          planet_a: p1.name as PlanetName,
          sign_a: p1.sign,
          planet_b: p2.name as PlanetName,
          sign_b: p2.sign,
          type: asp.type,
          orb_degrees: asp.orb,
          person_a_name: name1,
          person_b_name: name2,
        });
      }
    }
  }

  return aspects;
}

function computeAspectScore(a: SynastryAspect): number {
  if (a.orb_degrees > 6) return 0;
  const orbWeight = a.orb_degrees < 2 ? 1.0 : a.orb_degrees < 4 ? 0.7 : 0.4;
  const pw = ((PLANET_WEIGHT[a.planet_a] ?? 0.8) + (PLANET_WEIGHT[a.planet_b] ?? 0.8)) / 2;

  let baseScore: number;
  if (a.type === "trine" || a.type === "sextile") {
    baseScore = 5;
  } else if (a.type === "square" || a.type === "opposition") {
    baseScore = -4;
  } else {
    const key = `${a.planet_a}-${a.planet_b}`;
    baseScore = CONJUNCTION_PAIR_SCORE[key] ?? 2;
  }

  return baseScore * orbWeight * pw;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function computeSynastryScore(aspects: SynastryAspect[]): SynastryScores {
  let overall = 50;
  let communication = 50;
  let passion = 50;
  let values = 50;
  let challenge = 50;

  for (const a of aspects) {
    const s = computeAspectScore(a);
    overall += s;

    if (a.planet_a === "Merkury" || a.planet_b === "Merkury") {
      communication += s * 1.5;
    }
    if (["Wenus", "Mars"].includes(a.planet_a) || ["Wenus", "Mars"].includes(a.planet_b)) {
      passion += s * 1.5;
    }
    if (["Jowisz", "Saturn", "Słońce"].includes(a.planet_a) || ["Jowisz", "Saturn", "Słońce"].includes(a.planet_b)) {
      values += s * 1.2;
    }
    if ((a.type === "square" || a.type === "opposition") && a.orb_degrees < 3) {
      challenge -= Math.abs(s);
    }
  }

  return {
    overall: clamp(Math.round(overall), 30, 92),
    communication: clamp(Math.round(communication), 30, 92),
    passion: clamp(Math.round(passion), 30, 92),
    values: clamp(Math.round(values), 30, 92),
    challenge: clamp(Math.round(challenge), 30, 92),
  };
}
