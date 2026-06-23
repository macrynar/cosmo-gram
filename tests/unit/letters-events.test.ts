import { describe, it, expect } from "vitest";
import { detectEvents } from "@/lib/letters/events";
import { calculateChart } from "@/lib/chart-engine";

// Realny wykres (z planetami) — detectEvents używa getTransitsForDate, który czyta chart.planets.
const chart = calculateChart({ date: "1990-06-15", time: "14:30", lat: 52.2297, lng: 21.0122, place: "Warszawa" }).chart;

describe("detectEvents", () => {
  it("wykrywa Solar Return w okolicy urodzin (transit Słońce → natal Słońce)", () => {
    const events = detectEvents(chart, new Date("2026-06-15T12:00:00Z"));
    const solar = events.find((e) => e.slug === "twoj-rok");
    expect(solar).toBeTruthy();
    expect(solar!.event_key).toBe("solar:2026");
    expect(solar!.title).toBe("Twój rok");
    expect(solar!.context).toContain("Słońce wraca");
  });

  it("NIE wykrywa Solar Return pół roku od urodzin", () => {
    const events = detectEvents(chart, new Date("2026-12-15T12:00:00Z"));
    expect(events.some((e) => e.slug === "twoj-rok")).toBe(false);
  });

  it("zwraca eventy posortowane po priorytecie malejąco", () => {
    const events = detectEvents(chart, new Date("2026-06-15T12:00:00Z"));
    for (let i = 1; i < events.length; i++) {
      expect(events[i - 1].priority).toBeGreaterThanOrEqual(events[i].priority);
    }
  });

  it("event_key sezonu koduje planetę, aspekt i punkt natalny", () => {
    // skan kilku dat — jeśli sezon aktywny, event_key ma poprawny kształt
    for (const d of ["2026-01-15", "2026-03-15", "2026-09-15"]) {
      const sezon = detectEvents(chart, new Date(`${d}T12:00:00Z`)).find((e) => e.slug === "sezon-przemiany");
      if (sezon) {
        expect(sezon.event_key).toMatch(/^sezon:(Pluton|Saturn|Uran)-(conjunction|square|opposition)-/);
        expect(sezon.context).toContain("Wyzwalacz");
      }
    }
  });
});
