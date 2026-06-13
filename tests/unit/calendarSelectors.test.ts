import { describe, it, expect } from "vitest";
import { selectShownSeasons, selectUpcoming, selectGridBands } from "@/lib/astro/calendarSelectors";
import type { Season, TransitWindow } from "@/lib/astro/layers";
import { MAX_SEASONS_SHOWN, MAX_UPCOMING_ITEMS, MAX_BAND_COVERAGE } from "@/lib/astro/calendarLimits";

// ─── Fixtures ───────────────────────────────────────────────────────────────────

function makeSeason(overrides: Partial<Season> = {}): Season {
  return {
    transitPlanet: "Jowisz",
    transitSign:   "Baran",
    aspectType:    "trine",
    natalPoint:    "Słońce",
    natalSign:     "Lew",
    start:         "2026-01-01",
    end:           "2026-12-31",
    phase:         "środek",
    exactDays:     [],
    currentOrb:    1.5,
    score:         50,
    favorable:     true,
    ...overrides,
  };
}

function makeWindow(overrides: Partial<TransitWindow> = {}): TransitWindow {
  return {
    transitPlanet: "Mars",
    transitSign:   "Baran",
    aspectType:    "trine",
    natalPoint:    "Księżyc",
    natalSign:     "Lew",
    start:         "2026-06-01",
    peak:          "2026-06-05",
    end:           "2026-06-09",
    peakOrb:       0.3,
    score:         30,
    lengthDays:    9,
    category:      "energia",
    character:     "wspierające",
    favorable:     true,
    ...overrides,
  };
}

// ─── selectShownSeasons ──────────────────────────────────────────────────────────

describe("selectShownSeasons", () => {
  it("returns all seasons when count ≤ MAX_SEASONS_SHOWN", () => {
    const seasons = [makeSeason(), makeSeason({ score: 40 })];
    expect(selectShownSeasons(seasons)).toHaveLength(2);
  });

  it(`caps at MAX_SEASONS_SHOWN (${MAX_SEASONS_SHOWN})`, () => {
    const seasons = Array.from({ length: 6 }, (_, i) => makeSeason({ score: 60 - i * 5 }));
    const result  = selectShownSeasons(seasons);
    expect(result).toHaveLength(MAX_SEASONS_SHOWN);
  });

  it("preserves input order (layers already sorts)", () => {
    const a = makeSeason({ score: 60 });
    const b = makeSeason({ score: 40 });
    const c = makeSeason({ score: 20 });
    expect(selectShownSeasons([a, b, c])[0]).toBe(a);
  });

  it("returns empty array for empty input", () => {
    expect(selectShownSeasons([])).toEqual([]);
  });
});

// ─── selectUpcoming ──────────────────────────────────────────────────────────────

describe("selectUpcoming", () => {
  it(`caps at MAX_UPCOMING_ITEMS (${MAX_UPCOMING_ITEMS})`, () => {
    const windows = Array.from({ length: 6 }, (_, i) =>
      makeWindow({ peak: `2026-07-${String(i + 1).padStart(2, "0")}` })
    );
    expect(selectUpcoming(windows, "2026-06-01")).toHaveLength(MAX_UPCOMING_ITEMS);
  });

  it("excludes past peaks", () => {
    const past   = makeWindow({ peak: "2026-05-01" });
    const future = makeWindow({ peak: "2026-07-01" });
    const result = selectUpcoming([past, future], "2026-06-15");
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(future);
  });

  it("includes peak on today", () => {
    const today = makeWindow({ peak: "2026-06-13" });
    const result = selectUpcoming([today], "2026-06-13");
    expect(result).toHaveLength(1);
  });

  it("sorts by peak date ascending", () => {
    const later  = makeWindow({ peak: "2026-08-01" });
    const sooner = makeWindow({ peak: "2026-07-01" });
    const result = selectUpcoming([later, sooner], "2026-06-01");
    expect(result[0]).toBe(sooner);
    expect(result[1]).toBe(later);
  });

  it("returns empty for empty input", () => {
    expect(selectUpcoming([], "2026-06-01")).toEqual([]);
  });
});

// ─── selectGridBands ─────────────────────────────────────────────────────────────

describe("selectGridBands", () => {
  it("respects MAX_BAND_COVERAGE", () => {
    const totalDays = 30;
    const maxDays   = Math.floor(totalDays * MAX_BAND_COVERAGE);
    // Each window covers 8 days; 3 windows = 24 days > max (12 for 40%)
    const windows = [
      makeWindow({ lengthDays: 8, score: 60 }),
      makeWindow({ lengthDays: 8, score: 50 }),
      makeWindow({ lengthDays: 8, score: 40 }),
    ];
    const result   = selectGridBands(windows, totalDays);
    const covered  = result.reduce((s, w) => s + w.lengthDays, 0);
    expect(covered).toBeLessThanOrEqual(maxDays);
  });

  it("picks highest-score windows first", () => {
    const totalDays = 30;
    const high  = makeWindow({ score: 80, lengthDays: 5 });
    const mid   = makeWindow({ score: 50, lengthDays: 5 });
    const low   = makeWindow({ score: 10, lengthDays: 5 });
    const result = selectGridBands([low, mid, high], totalDays);
    expect(result[0]).toBe(high);
    expect(result[1]).toBe(mid);
  });

  it("skips windows that would exceed cap", () => {
    // totalDays=10, cap=4 days (40%). A window of 5 days won't fit.
    const large = makeWindow({ score: 100, lengthDays: 5 });
    const small = makeWindow({ score: 50,  lengthDays: 4 });
    const result = selectGridBands([large, small], 10);
    expect(result).not.toContain(large);
    expect(result).toContain(small);
  });

  it("returns empty for empty input", () => {
    expect(selectGridBands([], 30)).toEqual([]);
  });
});
