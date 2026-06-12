import { describe, it, expect } from "vitest";
import {
  getMoonRhythm,
  buildWindowDateMap,
  getExactDaysForMonth,
  getMoonSignChangeDatesForMonth,
  type TransitWindow,
  type Season,
} from "@/lib/astro/layers";

// ── Planet set disjointness ───────────────────────────────────────────────────

const FAST_PLANET_NAMES = new Set(["Mars", "Wenus", "Merkury", "Słońce"]);
const SEASON_PLANET_KEYS = ["Jowisz", "Saturn", "Uran", "Neptun", "Pluton"];
const ALL_ZODIAC_SIGNS = [
  "Baran","Byk","Bliźnięta","Rak","Lew","Panna",
  "Waga","Skorpion","Strzelec","Koziorożec","Wodnik","Ryby",
];

describe("layers: planet set disjointness", () => {
  it("slow-planet keys are not in the fast set", () => {
    for (const planet of SEASON_PLANET_KEYS) {
      expect(FAST_PLANET_NAMES.has(planet), `${planet} must not be in FAST set`).toBe(false);
    }
  });

  it("fast set has exactly 4 planets", () => {
    expect(FAST_PLANET_NAMES.size).toBe(4);
  });

  it("slow set has exactly 5 planets", () => {
    expect(SEASON_PLANET_KEYS.length).toBe(5);
  });
});

// ── getMoonRhythm (reference ephemeris) ──────────────────────────────────────

describe("getMoonRhythm", () => {
  it("returns a valid zodiac sign", () => {
    const rhythm = getMoonRhythm(new Date("2026-06-12T12:00:00Z"));
    expect(ALL_ZODIAC_SIGNS).toContain(rhythm.sign);
  });

  it("returns a valid phase name", () => {
    const rhythm = getMoonRhythm(new Date("2026-06-12T12:00:00Z"));
    expect(["new_moon", "first_quarter", "full_moon", "last_quarter"]).toContain(rhythm.phase);
  });

  it("phaseAngle is within 0–360", () => {
    const rhythm = getMoonRhythm(new Date("2026-06-12T12:00:00Z"));
    expect(rhythm.phaseAngle).toBeGreaterThanOrEqual(0);
    expect(rhythm.phaseAngle).toBeLessThanOrEqual(360);
  });

  it("natalHouse is undefined when no chart provided", () => {
    const rhythm = getMoonRhythm(new Date("2026-06-12T12:00:00Z"));
    expect(rhythm.natalHouse).toBeUndefined();
  });

  it("nextSignChangeISO is in the future", () => {
    const ref = new Date("2026-06-12T12:00:00Z");
    const rhythm = getMoonRhythm(ref);
    if (rhythm.nextSignChangeISO) {
      expect(new Date(rhythm.nextSignChangeISO).getTime()).toBeGreaterThan(ref.getTime());
    }
  });

  it("sign at start of 2024 is a valid zodiac sign (regression)", () => {
    const rhythm = getMoonRhythm(new Date("2024-01-01T12:00:00Z"));
    expect(ALL_ZODIAC_SIGNS).toContain(rhythm.sign);
  });
});

// ── buildWindowDateMap ────────────────────────────────────────────────────────

const FAKE_WINDOW: TransitWindow = {
  transitPlanet: "Mars",
  transitSign:   "Baran",
  aspectType:    "conjunction",
  natalPoint:    "Słońce",
  natalSign:     "Byk",
  start:         "2026-06-10",
  peak:          "2026-06-12",
  end:           "2026-06-15",
  peakOrb:       0.1,
  score:         5,
  lengthDays:    6,
  category:      "energia",
  character:     "wspierające",
  favorable:     true,
};

describe("buildWindowDateMap", () => {
  it("maps all dates from start to end inclusive", () => {
    const map = buildWindowDateMap([FAKE_WINDOW]);
    expect(map.has("2026-06-10")).toBe(true);
    expect(map.has("2026-06-12")).toBe(true);
    expect(map.has("2026-06-15")).toBe(true);
  });

  it("does not map dates outside window range", () => {
    const map = buildWindowDateMap([FAKE_WINDOW]);
    expect(map.has("2026-06-09")).toBe(false);
    expect(map.has("2026-06-16")).toBe(false);
  });

  it("window at peak date carries correct planet", () => {
    const map = buildWindowDateMap([FAKE_WINDOW]);
    expect(map.get("2026-06-12")![0].transitPlanet).toBe("Mars");
  });

  it("overlapping windows stack on shared days", () => {
    const w2: TransitWindow = { ...FAKE_WINDOW, transitPlanet: "Wenus", start: "2026-06-13", peak: "2026-06-14", end: "2026-06-18" };
    const map = buildWindowDateMap([FAKE_WINDOW, w2]);
    expect(map.get("2026-06-13")!.length).toBe(2);
    expect(map.get("2026-06-16")!.length).toBe(1);
  });
});

// ── getExactDaysForMonth ──────────────────────────────────────────────────────

const FAKE_SEASON: Season = {
  transitPlanet: "Jowisz",
  transitSign:   "Baran",
  aspectType:    "conjunction",
  natalPoint:    "Słońce",
  natalSign:     "Byk",
  start:         "2026-05-01",
  end:           "2026-07-31",
  phase:         "środek",
  exactDays:     ["2026-05-15", "2026-06-15", "2026-06-20", "2026-07-10"],
  currentOrb:    0.1,
  score:         8,
  favorable:     true,
};

describe("getExactDaysForMonth", () => {
  it("includes only dates in the queried month", () => {
    const result = getExactDaysForMonth([FAKE_SEASON], 2026, 6);
    expect(result.has("2026-06-15")).toBe(true);
    expect(result.has("2026-06-20")).toBe(true);
  });

  it("excludes dates outside the queried month", () => {
    const result = getExactDaysForMonth([FAKE_SEASON], 2026, 6);
    expect(result.has("2026-05-15")).toBe(false);
    expect(result.has("2026-07-10")).toBe(false);
  });

  it("returns empty set for month with no exact days", () => {
    const result = getExactDaysForMonth([FAKE_SEASON], 2026, 4);
    expect(result.size).toBe(0);
  });

  it("aggregates exact days from multiple seasons", () => {
    const s2: Season = { ...FAKE_SEASON, exactDays: ["2026-06-05"] };
    const result = getExactDaysForMonth([FAKE_SEASON, s2], 2026, 6);
    expect(result.size).toBe(3);
  });
});

// ── getMoonSignChangeDatesForMonth ────────────────────────────────────────────

describe("getMoonSignChangeDatesForMonth", () => {
  it("returns 8–16 sign changes per month (Moon changes sign every ~2.5 days)", () => {
    const changes = getMoonSignChangeDatesForMonth(2026, 6);
    expect(changes.size).toBeGreaterThanOrEqual(8);
    expect(changes.size).toBeLessThanOrEqual(16);
  });

  it("all returned dates are within the queried month", () => {
    const changes = getMoonSignChangeDatesForMonth(2026, 6);
    for (const date of changes) {
      expect(date).toMatch(/^2026-06-\d{2}$/);
    }
  });

  it("handles December–January rollover without throwing", () => {
    expect(() => getMoonSignChangeDatesForMonth(2025, 12)).not.toThrow();
    expect(() => getMoonSignChangeDatesForMonth(2026, 1)).not.toThrow();
  });

  it("different months return different date sets", () => {
    const june = getMoonSignChangeDatesForMonth(2026, 6);
    const july = getMoonSignChangeDatesForMonth(2026, 7);
    // Sets contain different ISO date strings
    let overlap = 0;
    for (const d of june) if (july.has(d)) overlap++;
    expect(overlap).toBe(0);
  });
});
