import { describe, it, expect } from "vitest";
import {
  matchNeedsUpgrade,
  CATEGORY_NAMES,
  FREE_CATEGORY_NAMES,
  PREMIUM_CATEGORY_NAMES,
  type CompatibilityResult,
} from "@/lib/astro/matchGenerator";

function makeMatch(filled: readonly string[]): CompatibilityResult {
  return {
    overallScore: 70,
    summary: "x",
    categories: CATEGORY_NAMES.map(name => ({
      name,
      score: 70,
      interpretation: filled.includes(name) ? "treść interpretacji…" : "",
      insight: filled.includes(name) ? "insight" : "",
    })),
  };
}

describe("match upgrade detection (§2.5)", () => {
  it("podział kategorii: 2 free + 6 premium = 8", () => {
    expect(FREE_CATEGORY_NAMES.length).toBe(2);
    expect(PREMIUM_CATEGORY_NAMES.length).toBe(6);
    expect(CATEGORY_NAMES.length).toBe(8);
  });

  it("pełny match (8/8 z treścią) → nie wymaga dogenerowania", () => {
    expect(matchNeedsUpgrade(makeMatch(CATEGORY_NAMES))).toBe(false);
  });

  it("free match (tylko 2 wolne moduły z treścią) → wymaga dogenerowania", () => {
    expect(matchNeedsUpgrade(makeMatch(FREE_CATEGORY_NAMES))).toBe(true);
  });

  it("brak/puste categories → false (bez pętli)", () => {
    expect(matchNeedsUpgrade({ overallScore: 0, summary: "", categories: [] })).toBe(false);
  });
});
