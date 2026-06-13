/**
 * Unit tests for whenBest.ts — pure selector functions.
 * Tests use pre-built window arrays; no real astronomical computation.
 */
import { describe, it, expect } from "vitest";
import { findBestFromWindows } from "@/lib/astro/whenBest";
import type { TransitWindow } from "@/lib/astro/layers";

const TODAY = "2026-06-13";

function makeWindow(overrides: Partial<TransitWindow> = {}): TransitWindow {
  return {
    transitPlanet: "Mars",
    transitSign:   "Baran",
    aspectType:    "trine",
    natalPoint:    "Słońce",
    natalSign:     "Lew",
    start:         "2026-06-10",
    peak:          "2026-06-15",
    end:           "2026-06-20",
    peakOrb:       0.5,
    score:         30,
    lengthDays:    11,
    category:      "energia",
    character:     "wspierające",
    favorable:     true,
    ...overrides,
  };
}

// ─── Kariera ───────────────────────────────────────────────────────────────────

describe("findBestFromWindows – Kariera", () => {
  it("matches category=kariera window", () => {
    const w = makeWindow({ category: "kariera", peak: "2026-07-01" });
    const r = findBestFromWindows([w], "Kariera", TODAY);
    expect(r?.peakDate).toBe("2026-07-01");
  });

  it("matches energia+MC as Kariera refinement", () => {
    const w = makeWindow({ category: "energia", natalPoint: "MC", peak: "2026-07-05" });
    const r = findBestFromWindows([w], "Kariera", TODAY);
    expect(r?.peakDate).toBe("2026-07-05");
  });

  it("ignores unfavorable Kariera window", () => {
    const w = makeWindow({ category: "kariera", favorable: false, peak: "2026-07-01" });
    const r = findBestFromWindows([w], "Kariera", TODAY);
    expect(r).toBeNull();
  });

  it("picks earliest peak when multiple match", () => {
    const a = makeWindow({ category: "kariera", peak: "2026-08-01", favorable: true });
    const b = makeWindow({ category: "kariera", peak: "2026-07-01", favorable: true });
    const r = findBestFromWindows([a, b], "Kariera", TODAY);
    expect(r?.peakDate).toBe("2026-07-01");
  });
});

// ─── Relacje ───────────────────────────────────────────────────────────────────

describe("findBestFromWindows – Relacje", () => {
  it("matches category=miłość", () => {
    const w = makeWindow({ category: "miłość", peak: "2026-07-10", favorable: true });
    const r = findBestFromWindows([w], "Relacje", TODAY);
    expect(r?.kind).toBe("window");
    expect(r?.peakDate).toBe("2026-07-10");
  });

  it("matches category=intuicja", () => {
    const w = makeWindow({ category: "intuicja", peak: "2026-07-15", favorable: true });
    const r = findBestFromWindows([w], "Relacje", TODAY);
    expect(r?.peakDate).toBe("2026-07-15");
  });
});

// ─── Finanse ───────────────────────────────────────────────────────────────────

describe("findBestFromWindows – Finanse", () => {
  it("matches Jowisz favorable window", () => {
    const w = makeWindow({ transitPlanet: "Jowisz", favorable: true, category: "energia", peak: "2026-07-20" });
    const r = findBestFromWindows([w], "Finanse", TODAY);
    expect(r?.peakDate).toBe("2026-07-20");
  });

  it("matches Wenus favorable window", () => {
    const w = makeWindow({ transitPlanet: "Wenus", favorable: true, category: "miłość", peak: "2026-07-22" });
    const r = findBestFromWindows([w], "Finanse", TODAY);
    expect(r?.peakDate).toBe("2026-07-22");
  });

  it("ignores unfavorable Jowisz window", () => {
    const w = makeWindow({ transitPlanet: "Jowisz", favorable: false, category: "energia", peak: "2026-07-20" });
    const r = findBestFromWindows([w], "Finanse", TODAY);
    expect(r).toBeNull();
  });
});

// ─── Decyzje ───────────────────────────────────────────────────────────────────

describe("findBestFromWindows – Decyzje", () => {
  it("matches category=komunikacja", () => {
    const w = makeWindow({ category: "komunikacja", peak: "2026-06-25", favorable: true });
    const r = findBestFromWindows([w], "Decyzje", TODAY);
    expect(r?.peakDate).toBe("2026-06-25");
  });
});

// ─── Uważaj ────────────────────────────────────────────────────────────────────

describe("findBestFromWindows – Uważaj", () => {
  it("returns challenging window regardless of favorable", () => {
    const w = makeWindow({ character: "wymagające", favorable: false, peak: "2026-06-20" });
    const r = findBestFromWindows([w], "Uważaj", TODAY);
    expect(r?.peakDate).toBe("2026-06-20");
    expect(r?.domain).toBe("Uważaj");
  });

  it("ignores supporting windows for Uważaj", () => {
    const w = makeWindow({ character: "wspierające", peak: "2026-06-20" });
    const r = findBestFromWindows([w], "Uważaj", TODAY);
    expect(r).toBeNull();
  });
});

// ─── Past peaks filtered out ────────────────────────────────────────────────────

describe("findBestFromWindows – past filtering", () => {
  it("ignores windows with peak before fromDateISO", () => {
    const past = makeWindow({ peak: "2026-06-01", category: "kariera", favorable: true });
    const r    = findBestFromWindows([past], "Kariera", TODAY);
    expect(r).toBeNull();
  });

  it("includes window with peak = fromDateISO", () => {
    const today = makeWindow({ peak: TODAY, category: "kariera", favorable: true });
    const r     = findBestFromWindows([today], "Kariera", TODAY);
    expect(r?.peakDate).toBe(TODAY);
  });
});

// ─── Empty / no-match ─────────────────────────────────────────────────────────

describe("findBestFromWindows – null cases", () => {
  it("returns null for empty windows array", () => {
    expect(findBestFromWindows([], "Kariera", TODAY)).toBeNull();
  });

  it("returns null when no window matches domain", () => {
    const w = makeWindow({ category: "komunikacja", favorable: true, peak: "2026-07-01" });
    expect(findBestFromWindows([w], "Kariera", TODAY)).toBeNull();
  });
});
