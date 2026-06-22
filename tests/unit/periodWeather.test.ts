import { describe, it, expect } from "vitest";
import {
  summarizePeriodWeather,
  orbOpacity,
  intensityOrb,
  intensityLabel,
  characterLine,
  plOkno,
  plSezon,
  type WeatherItem,
} from "@/lib/astro/periodWeather";

const win = (score: number, favorable: boolean): WeatherItem => ({ score, favorable });

describe("summarizePeriodWeather — coherence", () => {
  it("empty period → calm, lowest intensity", () => {
    const w = summarizePeriodWeather([]);
    expect(w.intensity).toBe(1);
    expect(w.tone).toBe("calm");
  });

  it("a single WEAK window never screams tense — reads calm at intensity 1 (the reported bug)", () => {
    // peak 16 / refMax 90 = 0.18 → intensity 1 → forced calm, regardless of favourability
    const w = summarizePeriodWeather([win(16, false)]);
    expect(w.intensity).toBe(1);
    expect(w.tone).toBe("calm");
  });

  it("a strong supportive window → loud + good", () => {
    const w = summarizePeriodWeather([win(85, true)]);
    expect(w.intensity).toBeGreaterThanOrEqual(4);
    expect(w.tone).toBe("good");
  });

  it("a strong demanding window → loud + tense", () => {
    const w = summarizePeriodWeather([win(85, false)]);
    expect(w.intensity).toBeGreaterThanOrEqual(4);
    expect(w.tone).toBe("tense");
  });

  it("an even split → mixed", () => {
    const w = summarizePeriodWeather([win(70, true), win(65, false)]);
    expect(w.tone).toBe("mixed");
  });

  it("a clear demanding majority leans tense, not mixed (June: 9 vs 6)", () => {
    const items = [
      ...Array.from({ length: 9 }, () => win(50, false)),
      ...Array.from({ length: 6 }, () => win(50, true)),
    ];
    const w = summarizePeriodWeather(items, { refMax: 90, denseAt: 6 });
    expect(w.tone).toBe("tense");
  });

  it("only a near-even split stays mixed (8 vs 7)", () => {
    const items = [
      ...Array.from({ length: 8 }, () => win(50, false)),
      ...Array.from({ length: 7 }, () => win(50, true)),
    ];
    expect(summarizePeriodWeather(items, { refMax: 90, denseAt: 6 }).tone).toBe("mixed");
  });

  it("density bumps intensity for busy periods", () => {
    const sparse = summarizePeriodWeather([win(45, true)]);
    const dense  = summarizePeriodWeather(
      [win(45, true), win(44, true), win(43, true), win(42, true)], // 4 ≥ denseAt
    );
    expect(dense.intensity).toBe(Math.min(5, sparse.intensity + 1));
  });

  it("seasons use a higher reference max (slow planets score higher)", () => {
    // score 90 is loud for a window but mid for a season
    const asWindow = summarizePeriodWeather([win(90, false)], { refMax: 90, denseAt: 4 });
    const asSeason = summarizePeriodWeather([win(90, false)], { refMax: 150, denseAt: 3 });
    expect(asWindow.intensity).toBeGreaterThan(asSeason.intensity);
  });

  it("intensity is always clamped to 1..5", () => {
    for (const score of [0, 10, 30, 50, 80, 120, 999]) {
      const w = summarizePeriodWeather([win(score, true)]);
      expect(w.intensity).toBeGreaterThanOrEqual(1);
      expect(w.intensity).toBeLessThanOrEqual(5);
    }
  });
});

describe("orbOpacity — vividness tracks intensity", () => {
  it("is monotonic and always visible (floor), vivid at 5", () => {
    const vals = [1, 2, 3, 4, 5].map(orbOpacity);
    for (let i = 1; i < vals.length; i++) expect(vals[i]).toBeGreaterThan(vals[i - 1]);
    expect(vals[0]).toBeGreaterThanOrEqual(0.45); // visible floor, never looks broken
    expect(vals[4]).toBeGreaterThan(0.75);        // clearly vivid
  });

  it("clamps out-of-range intensities", () => {
    expect(orbOpacity(0)).toBe(orbOpacity(1));
    expect(orbOpacity(9)).toBe(orbOpacity(5));
  });
});

describe("intensityOrb — one artwork per intensity level (1..5)", () => {
  it("maps each level to its own image", () => {
    expect(intensityOrb(1)).toBe("/assets/prognoza/intensity-1.png");
    expect(intensityOrb(3)).toBe("/assets/prognoza/intensity-3.png");
    expect(intensityOrb(5)).toBe("/assets/prognoza/intensity-5.png");
  });

  it("is keyed to level, not tone — a good and a demanding loud period share the orb", () => {
    const good = summarizePeriodWeather([win(85, true)]);
    const bad  = summarizePeriodWeather([win(85, false)]);
    expect(intensityOrb(good.intensity)).toBe(intensityOrb(bad.intensity));
  });

  it("clamps out-of-range levels", () => {
    expect(intensityOrb(0)).toBe("/assets/prognoza/intensity-1.png");
    expect(intensityOrb(9)).toBe("/assets/prognoza/intensity-5.png");
  });
});

describe("intensityLabel — the gauge word names the LEVEL, matching the bars", () => {
  it("escalates with intensity, one label per level", () => {
    expect(intensityLabel(1)).toBe("minimalna");
    expect(intensityLabel(3)).toBe("średnia");
    expect(intensityLabel(5)).toBe("maksymalna");
  });

  it("the level word is tone-neutral (same for a good vs demanding loud period)", () => {
    const good = summarizePeriodWeather([win(85, true)]);
    const bad  = summarizePeriodWeather([win(85, false)]);
    expect(intensityLabel(good.intensity)).toBe(intensityLabel(bad.intensity));
  });

  it("clamps out-of-range values", () => {
    expect(intensityLabel(0)).toBe("minimalna");
    expect(intensityLabel(9)).toBe("maksymalna");
  });
});

describe("characterLine — deterministic, never a fake loader", () => {
  it("returns a real sentence for every tone, never 'Ładowanie…'", () => {
    for (const items of [[], [win(16, false)], [win(85, true)], [win(85, false)], [win(70, true), win(65, false)]]) {
      const line = characterLine(summarizePeriodWeather(items), items.length);
      expect(line.length).toBeGreaterThan(10);
      expect(line).not.toContain("Ładowanie");
    }
  });
});

describe("Polish pluralisation", () => {
  it("okno", () => {
    expect(plOkno(1)).toBe("okno");
    expect(plOkno(2)).toBe("okna");
    expect(plOkno(3)).toBe("okna");
    expect(plOkno(5)).toBe("okien");
    expect(plOkno(12)).toBe("okien");
    expect(plOkno(22)).toBe("okna");
  });
  it("sezon", () => {
    expect(plSezon(1)).toBe("sezon");
    expect(plSezon(2)).toBe("sezony");
    expect(plSezon(3)).toBe("sezony");
    expect(plSezon(5)).toBe("sezonów");
  });
});
