import { describe, it, expect } from "vitest";
import { resolvePlacements } from "@/lib/letters/resolver";
import type { NatalChart } from "@/lib/astro-types";

// Resolver używa wyłącznie birthData (resztę dolicza deterministycznie przez
// calculateChart), więc planety/domy w obiekcie mogą być puste.
const chart: NatalChart = {
  planets: [],
  houses: [],
  ascendant: 0,
  mc: 0,
  birthData: { date: "1990-06-15", time: "14:30", place: "Warszawa", lat: 52.2297, lng: 21.0122, timezone: "Europe/Warsaw" },
};

describe("resolvePlacements", () => {
  it("buduje linie dla planet + punktów (misja)", () => {
    const r = resolvePlacements(chart, { planets: ["Słońce"], points: ["MC", "Węzeł Północny"] });
    expect(r.text).toMatch(/^- Słońce: \p{Lu}/mu);
    expect(r.text).toContain("- Medium Coeli (MC):");
    expect(r.text).toContain("- Węzeł Północny:");
    expect(r.signatureLabel).toBe("Słońce · MC · Węzeł Północny");
    const snap = r.snapshot as { planets: unknown[]; points: unknown[] };
    expect(snap.planets).toHaveLength(1);
    expect(snap.points).toHaveLength(2);
  });

  it("buduje domy + aspekty (jak kochasz)", () => {
    const r = resolvePlacements(chart, {
      planets: ["Wenus", "Mars"], houses: [5, 7], aspects_of: ["Wenus", "Mars"],
    });
    expect(r.text).toContain("- Wenus:");
    expect(r.text).toContain("- Mars:");
    expect(r.text).toMatch(/- Dom 5:/);
    expect(r.text).toMatch(/- Dom 7:/);
    expect(r.signatureLabel).toContain("domy 5, 7");
  });

  it("liczy dominujący żywioł", () => {
    const r = resolvePlacements(chart, { planets: ["Jowisz"], element_balance: true });
    expect(r.text).toMatch(/- Dominujący żywioł: (Ogień|Ziemia|Powietrze|Woda) \(\d+ z 10 planet\)/);
    const snap = r.snapshot as { element: { dominant: string } };
    expect(["Ogień", "Ziemia", "Powietrze", "Woda"]).toContain(snap.element.dominant);
  });

  it("jest deterministyczny", () => {
    const a = resolvePlacements(chart, { planets: ["Słońce"], points: ["MC"] });
    const b = resolvePlacements(chart, { planets: ["Słońce"], points: ["MC"] });
    expect(a.text).toBe(b.text);
  });
});
