import { describe, it, expect } from "vitest";
import { getPowerDays } from "@/lib/astro/powerDays";
import { calculateChart } from "@/lib/chart-engine";

const WARSAW_90 = calculateChart({ date: "1990-06-15", time: "12:00", lat: 52.2297, lng: 21.0122, place: "Warsaw" });
const LONDON_00 = calculateChart({ date: "2000-01-01", time: "00:00", lat: 51.5074, lng: -0.1278, place: "London" });

const SLOW_PLANETS = new Set(["Jowisz", "Saturn", "Uran", "Neptun", "Pluton"]);

describe("getPowerDays", () => {
  it("zwraca max 5 dni na miesiąc", () => {
    const days = getPowerDays(WARSAW_90.chart, 2026, 6);
    expect(days.length).toBeLessThanOrEqual(5);
  });

  it("zwraca min 1 dzień — w 2026 zawsze są aktywne tranzyty wolnych planet", () => {
    const days = getPowerDays(WARSAW_90.chart, 2026, 6);
    expect(days.length).toBeGreaterThanOrEqual(1);
  });

  it("wszystkie topTransit.transitPlanet to wolne planety", () => {
    const days = getPowerDays(WARSAW_90.chart, 2026, 6);
    for (const d of days) {
      expect(
        SLOW_PLANETS.has(d.topTransit.transitPlanet),
        `Oczekiwano wolnej planety, dostano: ${d.topTransit.transitPlanet}`,
      ).toBe(true);
    }
  });

  it("dni posortowane chronologicznie (rosnąco)", () => {
    const days = getPowerDays(WARSAW_90.chart, 2026, 6);
    for (let i = 1; i < days.length; i++) {
      expect(days[i].date >= days[i - 1].date).toBe(true);
    }
  });

  it("format daty YYYY-MM-DD", () => {
    const days = getPowerDays(WARSAW_90.chart, 2026, 6);
    for (const d of days) {
      expect(d.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("wszystkie score > 0", () => {
    const days = getPowerDays(WARSAW_90.chart, 2026, 6);
    for (const d of days) {
      expect(d.score).toBeGreaterThan(0);
    }
  });

  it("brak duplikatów dat", () => {
    const days = getPowerDays(WARSAW_90.chart, 2026, 6);
    const dates = days.map(d => d.date);
    expect(new Set(dates).size).toBe(dates.length);
  });

  it("wszystkie daty mieszczą się w podanym miesiącu (2026-06)", () => {
    const days = getPowerDays(WARSAW_90.chart, 2026, 6);
    for (const d of days) {
      expect(d.date.startsWith("2026-06")).toBe(true);
    }
  });

  it("wyniki dla czerwca i lipca nie mają wspólnych dat", () => {
    const june = getPowerDays(WARSAW_90.chart, 2026, 6);
    const july = getPowerDays(WARSAW_90.chart, 2026, 7);
    const juneDates = new Set(june.map(d => d.date));
    const overlap = july.filter(d => juneDates.has(d.date));
    expect(overlap).toHaveLength(0);
  });

  it("różne kosmogramy dają różne Dni Mocy", () => {
    const warsaw = getPowerDays(WARSAW_90.chart, 2026, 6);
    const london = getPowerDays(LONDON_00.chart, 2026, 6);
    // It's astronomically near-impossible for two different charts to have identical top-5 sets
    const warsawDates = warsaw.map(d => d.date).sort().join(",");
    const londonDates = london.map(d => d.date).sort().join(",");
    expect(warsawDates).not.toBe(londonDates);
  });

  it("topTransit ma orbDegrees w zakresie orbu wolnych planet", () => {
    const days = getPowerDays(WARSAW_90.chart, 2026, 6);
    for (const d of days) {
      // Max orb for any aspect is 3° (conjunction/opposition)
      expect(d.topTransit.orbDegrees).toBeLessThanOrEqual(3.0);
      expect(d.topTransit.orbDegrees).toBeGreaterThanOrEqual(0);
    }
  });

  it("topTransit ma natalPoint będący planetą lub punktem kosmogramu", () => {
    const KNOWN_POINTS = new Set([
      "Słońce","Księżyc","Merkury","Wenus","Mars","Jowisz","Saturn","Uran","Neptun","Pluton","ASC","MC"
    ]);
    const days = getPowerDays(WARSAW_90.chart, 2026, 6);
    for (const d of days) {
      expect(KNOWN_POINTS.has(d.topTransit.natalPoint),
        `Nieznany punkt natalny: ${d.topTransit.natalPoint}`).toBe(true);
    }
  });
});
