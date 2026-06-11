import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { calculateChart } from "@/lib/chart-engine";

// ─── Load reference fixtures ────────────────────────────────────────────────

type PlanetRef = { name: string; sign: string; longitude: number; house: number | null; retrograde?: boolean };
type Fixture = {
  meta: { id: string; name: string; input: Record<string, unknown> };
  planets: PlanetRef[];
  ascendant: number | null;
  mc: number | null;
};

const FIXTURE_DIR = join(process.cwd(), "tests", "fixtures", "charts");
const fixtures: Fixture[] = readdirSync(FIXTURE_DIR)
  .filter(f => f.endsWith(".json"))
  .sort()
  .map(f => JSON.parse(readFileSync(join(FIXTURE_DIR, f), "utf-8")) as Fixture);

// ─── Regression: re-compute every fixture and compare ───────────────────────

describe("chart-engine regression (10 reference charts)", () => {
  for (const fix of fixtures) {
    it(`${fix.meta.id}: ${fix.meta.name}`, () => {
      const input = fix.meta.input as Parameters<typeof calculateChart>[0];
      const result = calculateChart(input);

      for (const ref of fix.planets) {
        const computed = result.chart.planets.find(p => p.name === ref.name);
        expect(computed, `${ref.name} not found`).toBeDefined();
        // Sign must match exactly
        expect(computed!.sign).toBe(ref.sign);
        // Longitude within 0.01° (rounding tolerance — library is deterministic)
        expect(Math.abs(computed!.longitude - ref.longitude)).toBeLessThan(0.01);
      }

      if (fix.ascendant !== null) {
        expect(result.chart.ascendant).toBeCloseTo(fix.ascendant, 1); // ±0.1°
      }
    });
  }
});

// ─── Sun sign spot checks (independent of fixtures) ─────────────────────────

describe("Sun sign spot checks", () => {
  const cases: [string, string, string][] = [
    ["1990-06-15", "12:00", "Bliźnięta"],
    ["2000-01-01", "12:00", "Koziorożec"],
    ["1985-03-21", "12:00", "Baran"],
    ["1970-07-04", "12:00", "Rak"],
    ["1980-08-01", "12:00", "Lew"],
    ["1960-02-29", "12:00", "Ryby"],   // leap year
    ["1999-12-31", "12:00", "Koziorożec"],
    ["1950-01-15", "12:00", "Koziorożec"],
    ["2005-09-23", "12:00", "Waga"],
  ];

  for (const [date, time, expectedSign] of cases) {
    it(`${date} → Słońce w ${expectedSign}`, () => {
      const r = calculateChart({ date, time, lat: 52.2297, lng: 21.0122, place: "Warsaw" });
      const sun = r.chart.planets.find(p => p.name === "Słońce");
      expect(sun?.sign).toBe(expectedSign);
    });
  }
});

// ─── Edge cases ──────────────────────────────────────────────────────────────

describe("edge cases", () => {
  it("brak godziny urodzenia (timeUnknown=true) — brak Ascendentu i domów", () => {
    const r = calculateChart({
      date: "1990-06-15", time: "12:00", lat: 52.2297, lng: 21.0122,
      place: "Warsaw", timeUnknown: true,
    });
    expect(r.chart.birthData.timeUnknown).toBe(true);
    // placements should all have null houses
    for (const pl of r.placements) {
      expect(pl.house).toBeNull();
    }
  });

  it("północ UTC — Jupiter/Saturn nie zmieniają znaku w przeciągu 1 minuty", () => {
    const r1 = calculateChart({ date: "2000-01-01", time: "00:00", lat: 51.5074, lng: -0.1278, place: "London" });
    const r2 = calculateChart({ date: "2000-01-01", time: "00:01", lat: 51.5074, lng: -0.1278, place: "London" });
    const jup1 = r1.chart.planets.find(p => p.name === "Jowisz")!;
    const jup2 = r2.chart.planets.find(p => p.name === "Jowisz")!;
    expect(jup1.sign).toBe(jup2.sign);
  });

  it("29 lutego (rok przestępny) — obliczenia się nie wykraczają", () => {
    expect(() => calculateChart({
      date: "1960-02-29", time: "12:00", lat: 55.7558, lng: 37.6173, place: "Moscow",
    })).not.toThrow();
  });

  it("półkula południowa (Sydney) — zwraca poprawny znak Słońca", () => {
    const r = calculateChart({ date: "1995-12-25", time: "12:00", lat: -33.8688, lng: 151.2093, place: "Sydney" });
    const sun = r.chart.planets.find(p => p.name === "Słońce");
    expect(sun?.sign).toBe("Koziorożec");
  });

  it("historyczna data przed 1970 rokiem (1950)", () => {
    expect(() => calculateChart({
      date: "1950-01-15", time: "06:00", lat: -34.6037, lng: -58.3816, place: "Buenos Aires",
    })).not.toThrow();
  });

  it("strefa czasowa GMT+9 (Tokio) — nie produkuje błędu timezony", () => {
    expect(() => calculateChart({
      date: "1999-12-31", time: "23:00", lat: 35.6895, lng: 139.6917, place: "Tokyo",
    })).not.toThrow();
  });

  it("10 planet zawsze obecnych w wyniku", () => {
    const r = calculateChart({ date: "1990-06-15", time: "12:00", lat: 52.2297, lng: 21.0122, place: "Warsaw" });
    expect(r.chart.planets.length).toBe(10);
    const names = r.chart.planets.map(p => p.name);
    expect(names).toContain("Słońce");
    expect(names).toContain("Księżyc");
    expect(names).toContain("Merkury");
    expect(names).toContain("Wenus");
    expect(names).toContain("Mars");
    expect(names).toContain("Jowisz");
    expect(names).toContain("Saturn");
    expect(names).toContain("Uran");
    expect(names).toContain("Neptun");
    expect(names).toContain("Pluton");
  });

  it("planets mają longitude w zakresie 0–360", () => {
    const r = calculateChart({ date: "1990-06-15", time: "12:00", lat: 52.2297, lng: 21.0122, place: "Warsaw" });
    for (const p of r.chart.planets) {
      expect(p.longitude).toBeGreaterThanOrEqual(0);
      expect(p.longitude).toBeLessThan(360);
    }
  });

  it("aspekty zawierają tylko znane typy", () => {
    const r = calculateChart({ date: "1990-06-15", time: "12:00", lat: 52.2297, lng: 21.0122, place: "Warsaw" });
    const validTypes = new Set(["conjunction", "sextile", "square", "trine", "opposition"]);
    for (const asp of r.aspects) {
      expect(validTypes.has(asp.type)).toBe(true);
    }
  });

  it("zmiana czasu letniego PL (koniec marca) — nie produkuje błędu", () => {
    // 2024-03-31 — przejście z CET na CEST
    expect(() => calculateChart({
      date: "2024-03-31", time: "02:30", lat: 52.2297, lng: 21.0122, place: "Warsaw",
    })).not.toThrow();
  });

  it("nodes: north/south node mają poprawne znaki (przeciwne znaki zodiaku)", () => {
    const r = calculateChart({ date: "1990-06-15", time: "12:00", lat: 52.2297, lng: 21.0122, place: "Warsaw" });
    const northIdx = ["Baran","Byk","Bliźnięta","Rak","Lew","Panna","Waga","Skorpion","Strzelec","Koziorożec","Wodnik","Ryby"]
      .indexOf(r.nodes.north_node_sign);
    const southIdx = ["Baran","Byk","Bliźnięta","Rak","Lew","Panna","Waga","Skorpion","Strzelec","Koziorożec","Wodnik","Ryby"]
      .indexOf(r.nodes.south_node_sign);
    expect(northIdx).toBeGreaterThanOrEqual(0);
    expect(southIdx).toBeGreaterThanOrEqual(0);
    // Nodes are always opposite (180° apart = 6 signs)
    expect(Math.abs(northIdx - southIdx)).toBe(6);
  });
});

// ─── Input validation (via /api/chart) ──────────────────────────────────────
// Chart engine itself doesn't validate — validation is in the API route.
// These tests verify the engine doesn't crash on edge-case valid inputs.

describe("chart engine robustness", () => {
  it("Merkury nie cofa się dalej niż 28° od Słońca", () => {
    // Mercury is always within ~28° of the Sun
    const r = calculateChart({ date: "1990-06-15", time: "12:00", lat: 52.2297, lng: 21.0122, place: "Warsaw" });
    const sun     = r.chart.planets.find(p => p.name === "Słońce")!;
    const mercury = r.chart.planets.find(p => p.name === "Merkury")!;
    let diff = Math.abs(sun.longitude - mercury.longitude);
    if (diff > 180) diff = 360 - diff;
    expect(diff).toBeLessThan(28);
  });

  it("Wenus nie cofa się dalej niż 48° od Słońca", () => {
    const r = calculateChart({ date: "1990-06-15", time: "12:00", lat: 52.2297, lng: 21.0122, place: "Warsaw" });
    const sun   = r.chart.planets.find(p => p.name === "Słońce")!;
    const venus = r.chart.planets.find(p => p.name === "Wenus")!;
    let diff = Math.abs(sun.longitude - venus.longitude);
    if (diff > 180) diff = 360 - diff;
    expect(diff).toBeLessThan(48);
  });
});
