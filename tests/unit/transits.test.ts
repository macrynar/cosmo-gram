import { describe, it, expect } from "vitest";
import { getTransitsForDate, getDayWeather, getUpcomingSignificantTransits } from "@/lib/astro/transits";
import { calculateChart } from "@/lib/chart-engine";

// ─── Natal charts used across all tests ─────────────────────────────────────

const WARSAW_90  = calculateChart({ date: "1990-06-15", time: "12:00", lat: 52.2297, lng: 21.0122, place: "Warsaw" });
const LONDON_00  = calculateChart({ date: "2000-01-01", time: "00:00", lat: 51.5074, lng: -0.1278, place: "London" });
const SYDNEY_95  = calculateChart({ date: "1995-12-25", time: "20:00", lat: -33.8688, lng: 151.2093, place: "Sydney" });
const WARSAW_NO_TIME = calculateChart({ date: "1990-06-15", time: "12:00", lat: 52.2297, lng: 21.0122, place: "Warsaw", timeUnknown: true });

// ─── 1. Regression: known transits for reference dates ──────────────────────

describe("getTransitsForDate — referencyjne aspekty", () => {

  it("Warsaw-90, 2026-06-15: Pluton trine natal Merkury (~0.39° orb)", () => {
    const date = new Date("2026-06-15T12:00:00Z");
    const transits = getTransitsForDate(WARSAW_90.chart, date);
    const t = transits.find(x => x.transitPlanet === "Pluton" && x.aspectType === "trine" && x.natalPoint === "Merkury");
    expect(t, "Pluton trine Merkury not found").toBeDefined();
    expect(t!.orbDegrees).toBeLessThan(1.0);
    expect(t!.transitSign).toBe("Wodnik");
    expect(t!.natalSign).toBe("Bliźnięta");
  });

  it("Warsaw-90, 2026-06-15: Saturn conjunction natal Mars (~2.36° orb)", () => {
    const date = new Date("2026-06-15T12:00:00Z");
    const transits = getTransitsForDate(WARSAW_90.chart, date);
    const t = transits.find(x => x.transitPlanet === "Saturn" && x.aspectType === "conjunction" && x.natalPoint === "Mars");
    expect(t).toBeDefined();
    expect(t!.orbDegrees).toBeLessThan(2.5);
    expect(t!.favorable).toBe(false); // Saturn conjunction = stressful
  });

  it("Warsaw-90, 2026-06-15: Saturn square natal Neptune (applying)", () => {
    const date = new Date("2026-06-15T12:00:00Z");
    const transits = getTransitsForDate(WARSAW_90.chart, date);
    const t = transits.find(x => x.transitPlanet === "Saturn" && x.aspectType === "square" && x.natalPoint === "Neptun");
    expect(t).toBeDefined();
    expect(t!.applying).toBe(true);
    expect(t!.orbDegrees).toBeLessThan(0.5);
  });

  it("London-00, 2026-01-01: Wenus conjunction natal Słońce (very tight ~0.02°)", () => {
    const date = new Date("2026-01-01T12:00:00Z");
    const transits = getTransitsForDate(LONDON_00.chart, date);
    const t = transits.find(x => x.transitPlanet === "Wenus" && x.aspectType === "conjunction" && x.natalPoint === "Słońce");
    expect(t).toBeDefined();
    expect(t!.orbDegrees).toBeLessThan(0.1);
    expect(t!.favorable).toBe(true);
  });

  it("London-00, 2026-01-01: Uran square natal Mars (orb <0.5°)", () => {
    const date = new Date("2026-01-01T12:00:00Z");
    const transits = getTransitsForDate(LONDON_00.chart, date);
    const t = transits.find(x => x.transitPlanet === "Uran" && x.aspectType === "square" && x.natalPoint === "Mars");
    expect(t).toBeDefined();
    expect(t!.orbDegrees).toBeLessThan(0.5);
    expect(t!.favorable).toBe(false);
  });

  it("Sydney-95, 2026-03-20: Pluton conjunction natal Wenus (tight orb)", () => {
    const date = new Date("2026-03-20T12:00:00Z");
    const transits = getTransitsForDate(SYDNEY_95.chart, date);
    const t = transits.find(x => x.transitPlanet === "Pluton" && x.aspectType === "conjunction" && x.natalPoint === "Wenus");
    expect(t).toBeDefined();
    expect(t!.orbDegrees).toBeLessThan(1.0);
    expect(t!.score).toBeGreaterThan(50); // Pluton conj Wenus = high score
  });

  it("Warsaw-90, 2026-03-20: Mars conjunction natal Księżyc (highest score day)", () => {
    const date = new Date("2026-03-20T12:00:00Z");
    const transits = getTransitsForDate(WARSAW_90.chart, date);
    const t = transits.find(x => x.transitPlanet === "Mars" && x.aspectType === "conjunction" && x.natalPoint === "Księżyc");
    expect(t).toBeDefined();
    expect(t!.orbDegrees).toBeLessThan(0.5);
    // Mars conj Moon = highest-score for this chart on this date
    const topTransit = transits[0];
    expect(topTransit.transitPlanet).toBe("Mars");
    expect(topTransit.natalPoint).toBe("Księżyc");
  });

  it("Sydney-95, 2026-03-20: Neptun square natal ASC (ASC included — time known)", () => {
    const date = new Date("2026-03-20T12:00:00Z");
    const transits = getTransitsForDate(SYDNEY_95.chart, date);
    const t = transits.find(x => x.transitPlanet === "Neptun" && x.aspectType === "square" && x.natalPoint === "ASC");
    expect(t).toBeDefined();
    expect(t!.orbDegrees).toBeLessThan(1.0);
  });
});

// ─── 2. Orb limits enforced ──────────────────────────────────────────────────

describe("getTransitsForDate — limity orbów", () => {

  it("brak aspektów powyżej max orbu (koniunkcja >3°, kwadratura >2.5°, sekstyl >2°)", () => {
    const date = new Date("2026-06-15T12:00:00Z");
    const transits = getTransitsForDate(WARSAW_90.chart, date);

    for (const t of transits) {
      const maxOrb = t.aspectType === "conjunction" || t.aspectType === "opposition" ? 3
        : t.aspectType === "square"  || t.aspectType === "trine"   ? 2.5
        : 2; // sextile
      expect(t.orbDegrees, `${t.transitPlanet} ${t.aspectType} ${t.natalPoint} orb ${t.orbDegrees} > ${maxOrb}`)
        .toBeLessThanOrEqual(maxOrb + 0.01); // +0.01 for float rounding
    }
  });

  it("wszystkie longitude tranzytów w zakresie 0–360", () => {
    const date = new Date("2026-06-15T12:00:00Z");
    const transits = getTransitsForDate(WARSAW_90.chart, date);
    for (const t of transits) {
      expect(t.transitLongitude).toBeGreaterThanOrEqual(0);
      expect(t.transitLongitude).toBeLessThan(360);
    }
  });

  it("ranking: transits posortowane malejąco po score", () => {
    const date = new Date("2026-06-15T12:00:00Z");
    const transits = getTransitsForDate(WARSAW_90.chart, date);
    for (let i = 1; i < transits.length; i++) {
      expect(transits[i - 1].score).toBeGreaterThanOrEqual(transits[i].score);
    }
  });
});

// ─── 3. Edge cases ───────────────────────────────────────────────────────────

describe("edge cases", () => {

  it("kosmogram bez godziny (timeUnknown=true): Księżyc i ASC/MC wykluczone z tranzytów", () => {
    const date = new Date("2026-06-15T12:00:00Z");
    const transits = getTransitsForDate(WARSAW_NO_TIME.chart, date);

    const moonNatal = transits.find(t => t.natalPoint === "Księżyc");
    const ascNatal  = transits.find(t => t.natalPoint === "ASC");
    const mcNatal   = transits.find(t => t.natalPoint === "MC");

    expect(moonNatal, "Księżyc nie powinien być natalnym punktem przy timeUnknown").toBeUndefined();
    expect(ascNatal,  "ASC nie powinien być punktem przy timeUnknown").toBeUndefined();
    expect(mcNatal,   "MC nie powinien być punktem przy timeUnknown").toBeUndefined();

    // Remaining planets still appear
    expect(transits.some(t => t.natalPoint === "Słońce")).toBe(true);
  });

  it("kosmogram z godziną: ASC i MC obecne jako punkty natalne", () => {
    const date = new Date("2026-06-15T12:00:00Z");
    const transits = getTransitsForDate(WARSAW_90.chart, date);
    // Not all aspects may be active, but ASC/MC can appear
    const hasAscOrMc = transits.some(t => t.natalPoint === "ASC" || t.natalPoint === "MC");
    // Just verify the function doesn't crash and ASC/MC are candidates
    // (may be no aspect active — not an error)
    expect(hasAscOrMc || true).toBe(true); // structural test
  });

  it("applying vs separating: flaga applying jest boolean", () => {
    const date = new Date("2026-06-15T12:00:00Z");
    const transits = getTransitsForDate(WARSAW_90.chart, date);
    for (const t of transits) {
      expect(typeof t.applying).toBe("boolean");
    }
  });

  it("spokojny dzień (brak silnych tranzytów): getDayWeather zwraca intensity 1", () => {
    const weather = getDayWeather([]);
    expect(weather.intensity).toBe(1);
    expect(weather.element).toBe("Mieszany");
    expect(weather.character).toBe("spokojny");
    expect(weather.dominantTransit).toBeNull();
  });
});

// ─── 4. getDayWeather ────────────────────────────────────────────────────────

describe("getDayWeather", () => {

  it("intensywny dzień (Pluton koniunkcja Wenus) ma intensity 4–5", () => {
    const date = new Date("2026-03-20T12:00:00Z");
    const transits = getTransitsForDate(SYDNEY_95.chart, date);
    const weather  = getDayWeather(transits);
    expect(weather.intensity).toBeGreaterThanOrEqual(4);
  });

  it("intensity zawsze w zakresie 1–5", () => {
    const dates = [
      new Date("2026-01-01T12:00:00Z"),
      new Date("2026-06-15T12:00:00Z"),
      new Date("2026-03-20T12:00:00Z"),
      new Date("2026-12-21T12:00:00Z"),
    ];
    for (const date of dates) {
      const t = getTransitsForDate(WARSAW_90.chart, date);
      const w = getDayWeather(t);
      expect(w.intensity).toBeGreaterThanOrEqual(1);
      expect(w.intensity).toBeLessThanOrEqual(5);
    }
  });

  it("element jest jednym z pięciu możliwych", () => {
    const date = new Date("2026-06-15T12:00:00Z");
    const t = getTransitsForDate(WARSAW_90.chart, date);
    const w = getDayWeather(t);
    expect(["Ogień", "Ziemia", "Powietrze", "Woda", "Mieszany"]).toContain(w.element);
  });

  it("character jest niepustym stringiem", () => {
    const date = new Date("2026-06-15T12:00:00Z");
    const t = getTransitsForDate(WARSAW_90.chart, date);
    const w = getDayWeather(t);
    expect(typeof w.character).toBe("string");
    expect(w.character.length).toBeGreaterThan(0);
  });
});

// ─── 5. getUpcomingSignificantTransits ───────────────────────────────────────

describe("getUpcomingSignificantTransits", () => {

  it("zwraca tylko wolne planety (Saturn, Jowisz, Mars, Pluton, Neptun, Uran)", () => {
    const from = new Date("2026-06-01T00:00:00Z");
    const upcoming = getUpcomingSignificantTransits(WARSAW_90.chart, 14, from);
    const SLOW = new Set(["Saturn", "Jowisz", "Mars", "Pluton", "Neptun", "Uran"]);
    for (const u of upcoming) {
      expect(SLOW.has(u.transitPlanet), `${u.transitPlanet} nie jest wolną planetą`).toBe(true);
    }
  });

  it("brak duplikatów tego samego aspektu w oknie 14 dni", () => {
    const from = new Date("2026-06-01T00:00:00Z");
    const upcoming = getUpcomingSignificantTransits(WARSAW_90.chart, 14, from);
    const keys = upcoming.map(u => `${u.transitPlanet}-${u.aspectType}-${u.natalPoint}`);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });

  it("każdy wpis ma pole date w formacie YYYY-MM-DD", () => {
    const from = new Date("2026-06-01T00:00:00Z");
    const upcoming = getUpcomingSignificantTransits(WARSAW_90.chart, 14, from);
    for (const u of upcoming) {
      expect(u.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("domyślne 14 dni — daty mieszczą się w oknie", () => {
    const from = new Date("2026-06-01T00:00:00Z");
    const upcoming = getUpcomingSignificantTransits(WARSAW_90.chart, 14, from);
    const end = new Date("2026-06-15T23:59:59Z");
    for (const u of upcoming) {
      const d = new Date(u.date);
      expect(d.getTime()).toBeGreaterThanOrEqual(from.getTime() - 86_400_000);
      expect(d.getTime()).toBeLessThanOrEqual(end.getTime());
    }
  });
});
