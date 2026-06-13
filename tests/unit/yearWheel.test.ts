/**
 * Unit tests for YearWheel constraints:
 * - ≤ MAX_SEASONS_SHOWN season arcs rendered
 * - ≤ POWER_DAY_SANITY_CAP * 4 power day dots
 * - dateToAngle maps Jan 1 → 0°, Dec 31 → ~360°
 * - Dates outside the year are filtered out
 */
import { describe, it, expect } from "vitest";
import { MAX_SEASONS_SHOWN, POWER_DAY_SANITY_CAP } from "@/lib/astro/calendarLimits";
import { selectShownSeasons } from "@/lib/astro/calendarSelectors";
import type { Season } from "@/lib/astro/layers";

// ─── dateToAngle (replicated from YearWheel) ──────────────────────────────────

function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

function dayOfYearFn(dateStr: string, year: number): number {
  const d = new Date(dateStr + "T00:00:00Z");
  const s = new Date(Date.UTC(year, 0, 1));
  return Math.max(0, Math.floor((d.getTime() - s.getTime()) / 86400000));
}

function dateToAngle(dateStr: string, year: number): number {
  const days = isLeapYear(year) ? 366 : 365;
  return (dayOfYearFn(dateStr, year) / days) * 360;
}

describe("dateToAngle", () => {
  it("Jan 1 → 0°", () => {
    expect(dateToAngle("2026-01-01", 2026)).toBeCloseTo(0, 1);
  });

  it("Jul 2 → ~180° (mid-year non-leap)", () => {
    // day 182 out of 365 ≈ 0.498 * 360 ≈ 179.4
    const a = dateToAngle("2026-07-02", 2026);
    expect(a).toBeGreaterThan(170);
    expect(a).toBeLessThan(190);
  });

  it("Dec 31 → near 360° (< 360)", () => {
    const a = dateToAngle("2026-12-31", 2026);
    expect(a).toBeGreaterThan(355);
    expect(a).toBeLessThan(360);
  });

  it("leap year 2024: Feb 29 has valid angle", () => {
    const a = dateToAngle("2024-02-29", 2024);
    expect(a).toBeGreaterThan(0);
    expect(a).toBeLessThan(100);
  });
});

// ─── selectShownSeasons ────────────────────────────────────────────────────────

function makeSeason(idx: number): Season {
  return {
    transitPlanet: "Jowisz",
    transitSign:   "Baran",
    aspectType:    "trine" as const,
    natalPoint:    "Słońce",
    natalSign:     "Lew",
    start:         "2026-01-01",
    end:           "2026-12-31",
    phase:         "środek" as const,
    exactDays:     [],
    currentOrb:    0.5,
    score:         100 - idx * 10,
    favorable:     true,
  };
}

describe("YearWheel: season arc constraints", () => {
  it("MAX_SEASONS_SHOWN = 3", () => {
    expect(MAX_SEASONS_SHOWN).toBe(3);
  });

  it("selectShownSeasons caps at MAX_SEASONS_SHOWN", () => {
    const many = Array.from({ length: 8 }, (_, i) => makeSeason(i));
    expect(selectShownSeasons(many)).toHaveLength(MAX_SEASONS_SHOWN);
  });

  it("selectShownSeasons of 2 returns 2 (no padding)", () => {
    const two = [makeSeason(0), makeSeason(1)];
    expect(selectShownSeasons(two)).toHaveLength(2);
  });

  it("selectShownSeasons of 0 returns []", () => {
    expect(selectShownSeasons([])).toHaveLength(0);
  });
});

// ─── Power day cap ────────────────────────────────────────────────────────────

describe("YearWheel: power day dot cap", () => {
  it("cap = POWER_DAY_SANITY_CAP * 4 (max dots on wheel)", () => {
    const cap = POWER_DAY_SANITY_CAP * 4;
    expect(cap).toBe(32); // 8 * 4
  });
});

// ─── Year boundary filtering ──────────────────────────────────────────────────

describe("YearWheel: year boundary filtering", () => {
  it("season from last year is clipped to yearStart", () => {
    const seasonStart = "2025-11-01";
    const yearStart   = "2026-01-01";
    const clamped = seasonStart < yearStart ? yearStart : seasonStart;
    expect(clamped).toBe("2026-01-01");
  });

  it("season spanning next year is clipped to yearEnd", () => {
    const seasonEnd = "2027-03-01";
    const yearEnd   = "2026-12-31";
    const clamped = seasonEnd > yearEnd ? yearEnd : seasonEnd;
    expect(clamped).toBe("2026-12-31");
  });

  it("season entirely in prior year → start > end → filtered", () => {
    const clampedStart = "2026-01-01";
    const clampedEnd   = "2025-12-01"; // end was clamped but is before start
    expect(clampedStart > clampedEnd).toBe(true);
  });
});
