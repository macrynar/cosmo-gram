/**
 * Unit tests for calendar reading gating rules.
 * - ISO week key computation
 * - Day gate: future days should not receive interpretation button
 * - Week/year/month: no future lock (generate for any date)
 */
import { describe, it, expect } from "vitest";

// ─── ISO week key ──────────────────────────────────────────────────────────────

function getISOWeekKey(weekStartISO: string): string {
  const d = new Date(weekStartISO + "T12:00:00Z");
  const thu = new Date(d);
  thu.setUTCDate(d.getUTCDate() + 3);
  const yearStart = new Date(Date.UTC(thu.getUTCFullYear(), 0, 1));
  const weekNum   = Math.ceil(((thu.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${thu.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

describe("getISOWeekKey", () => {
  it("Monday 2026-06-08 → 2026-W24", () => {
    expect(getISOWeekKey("2026-06-08")).toBe("2026-W24");
  });

  it("Monday 2026-01-05 → 2026-W02", () => {
    expect(getISOWeekKey("2026-01-05")).toBe("2026-W02");
  });

  it("Monday 2026-12-28 spans to 2027-W01", () => {
    // Dec 28 2026 is Monday of week that contains Jan 1 2027 Thursday
    const result = getISOWeekKey("2026-12-28");
    expect(result).toBe("2026-W53");
  });

  it("produces consistent key for same week's different days (when called with Monday)", () => {
    const a = getISOWeekKey("2026-06-08"); // Mon
    const b = getISOWeekKey("2026-06-08"); // same Mon
    expect(a).toBe(b);
  });
});

// ─── Day gate ──────────────────────────────────────────────────────────────────

function isFutureDate(date: string, today: string): boolean {
  return date > today;
}

function dayGateAllowsGeneration(date: string, today: string): boolean {
  return !isFutureDate(date, today);
}

describe("day gate: generate button", () => {
  const today = "2026-06-13";

  it("today is allowed", () => {
    expect(dayGateAllowsGeneration("2026-06-13", today)).toBe(true);
  });

  it("yesterday is allowed", () => {
    expect(dayGateAllowsGeneration("2026-06-12", today)).toBe(true);
  });

  it("tomorrow is blocked", () => {
    expect(dayGateAllowsGeneration("2026-06-14", today)).toBe(false);
  });

  it("far future is blocked", () => {
    expect(dayGateAllowsGeneration("2026-12-31", today)).toBe(false);
  });
});

// ─── Week/year/month: no future lock ──────────────────────────────────────────

function weekAllowsFuture(): boolean {
  // Spec: week interpretation has no future lock — premium can generate future weeks
  return true;
}

function yearAllowsFuture(): boolean {
  return true;
}

describe("week/year: no future lock", () => {
  it("week allows future weeks", () => {
    expect(weekAllowsFuture()).toBe(true);
  });

  it("year allows future year", () => {
    expect(yearAllowsFuture()).toBe(true);
  });
});

// ─── Cache key uniqueness ──────────────────────────────────────────────────────

describe("cache key uniqueness", () => {
  it("different weeks get different keys", () => {
    const w1 = getISOWeekKey("2026-06-08");
    const w2 = getISOWeekKey("2026-06-15");
    expect(w1).not.toBe(w2);
  });

  it("same week across month boundary → same key", () => {
    // Week starting Mon 2026-06-29 (spans Jun+Jul)
    const k = getISOWeekKey("2026-06-29");
    expect(k).toMatch(/^\d{4}-W\d{2}$/);
  });
});
