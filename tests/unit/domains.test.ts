import { describe, it, expect } from "vitest";
import { windowToDomain, DOMAIN_META, WHEN_BEST_CHIPS, type UIDomain } from "@/lib/astro/domains";
import type { TransitWindow } from "@/lib/astro/layers";

function makeWindow(overrides: Partial<TransitWindow> = {}): TransitWindow {
  return {
    transitPlanet: "Mars",
    transitSign:   "Baran",
    aspectType:    "trine",
    natalPoint:    "Słońce",
    natalSign:     "Lew",
    start:         "2026-06-01",
    peak:          "2026-06-05",
    end:           "2026-06-09",
    peakOrb:       0.4,
    score:         35,
    lengthDays:    9,
    category:      "energia",
    character:     "wspierające",
    favorable:     true,
    ...overrides,
  };
}

// ─── DOMAIN_META completeness ─────────────────────────────────────────────────

describe("DOMAIN_META", () => {
  const ALL_DOMAINS: UIDomain[] = ["Kariera", "Relacje", "Finanse", "Energia", "Decyzje"];

  it("has an entry for every UIDomain", () => {
    for (const d of ALL_DOMAINS) {
      expect(DOMAIN_META[d], `DOMAIN_META missing: ${d}`).toBeDefined();
    }
  });

  it("every domain has label, color, iconName", () => {
    for (const d of ALL_DOMAINS) {
      const meta = DOMAIN_META[d];
      expect(meta.label).toBe(d);
      expect(meta.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(meta.iconName.length).toBeGreaterThan(0);
    }
  });

  it("colors contain no violet/purple hues (design system constraint)", () => {
    const PURPLE_HUE_RE = /^#[6-9A-Fa-f][0-7][0-9A-Fa-f]{4}$/; // crude check
    for (const d of ALL_DOMAINS) {
      // Decyzje uses a blue; Relacje uses rose — both OK; just exclude hard violet
      const color = DOMAIN_META[d].color.toUpperCase();
      expect(color).not.toMatch(/^#[89AB][0-5][0-9A-F]{4}$/); // no dark violet
    }
  });
});

// ─── windowToDomain ────────────────────────────────────────────────────────────

describe("windowToDomain", () => {
  it("miłość → Relacje", () => {
    const w = makeWindow({ category: "miłość" });
    expect(windowToDomain(w)).toBe("Relacje");
  });

  it("kariera → Kariera", () => {
    const w = makeWindow({ category: "kariera" });
    expect(windowToDomain(w)).toBe("Kariera");
  });

  it("komunikacja → Decyzje", () => {
    const w = makeWindow({ category: "komunikacja" });
    expect(windowToDomain(w)).toBe("Decyzje");
  });

  it("transformacja → Energia", () => {
    const w = makeWindow({ category: "transformacja" });
    expect(windowToDomain(w)).toBe("Energia");
  });

  it("intuicja → Relacje", () => {
    const w = makeWindow({ category: "intuicja" });
    expect(windowToDomain(w)).toBe("Relacje");
  });

  it("energia + natalPoint=Słońce → Energia", () => {
    const w = makeWindow({ category: "energia", natalPoint: "Słońce" });
    expect(windowToDomain(w)).toBe("Energia");
  });

  it("energia + natalPoint=MC → Kariera (career refinement)", () => {
    const w = makeWindow({ category: "energia", natalPoint: "MC" });
    expect(windowToDomain(w)).toBe("Kariera");
  });

  it("returns null for unknown categories", () => {
    // @ts-expect-error testing unknown category
    const w = makeWindow({ category: "unknown" });
    expect(windowToDomain(w)).toBeNull();
  });
});

// ─── WHEN_BEST_CHIPS ──────────────────────────────────────────────────────────

describe("WHEN_BEST_CHIPS", () => {
  it("contains 6 chips", () => {
    expect(WHEN_BEST_CHIPS).toHaveLength(6);
  });

  it("exactly one chip is premium-only", () => {
    const premium = WHEN_BEST_CHIPS.filter(c => c.premium);
    expect(premium).toHaveLength(1);
    expect(premium[0].domain).toBe("Uważaj");
  });

  it("Finanse chip is present (even though windowToDomain can't return it yet)", () => {
    expect(WHEN_BEST_CHIPS.some(c => c.domain === "Finanse")).toBe(true);
  });

  it("all chips have non-empty labels", () => {
    for (const chip of WHEN_BEST_CHIPS) {
      expect(chip.label.length).toBeGreaterThan(0);
    }
  });
});
