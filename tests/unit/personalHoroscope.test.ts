import { describe, it, expect } from "vitest";
import {
  PersonalHoroscopeAIOutputSchema,
  hasConcreteReferences,
} from "@/lib/schemas/personalHoroscope";

// Transit context as produced by the API (used to test hasConcreteReferences)
const SAMPLE_CONTEXT = `Data: 2026-06-15
Kosmogram: Słońce w Bliźniętach, Księżyc w Rybach, Ascendent w Pannie
Tranzyty:
- Pluton w Wodniku trygon do natalnego Merkurego w Bliźniętach (orb 0.39°, aplikacyjny, sprzyjający, score 65)
- Saturn w Rybach koniunkcja do natalnego Marsa w Baranie (orb 2.36°, separacyjny, napięciowy, score 32)`;

const VALID_OUTPUT = {
  headline: "Pluton otwiera drzwi, które myślałeś że są zamknięte",
  main: "Dziś trygon Plutona do Twojego Merkurego w Bliźniętach sprawia, że widzisz sprawy głębiej niż zwykle. To dobry moment na ważną rozmowę lub podjęcie decyzji, którą odkładałeś. Twoje myślenie ma teraz siłę przebicia.",
  reflection: "Co w ostatnich tygodniach chciałeś powiedzieć, ale milczałeś?",
  weather: { intensity: 4, element: "Powietrze", character: "przełomowy" },
};

// ─── Schema validation ────────────────────────────────────────────────────────

describe("PersonalHoroscopeAIOutputSchema — walidacja schematu", () => {
  it("poprawny output przechodzi walidację", () => {
    expect(PersonalHoroscopeAIOutputSchema.safeParse(VALID_OUTPUT).success).toBe(true);
  });

  it("headline powyżej 80 znaków → błąd", () => {
    const out = { ...VALID_OUTPUT, headline: "x".repeat(81) };
    expect(PersonalHoroscopeAIOutputSchema.safeParse(out).success).toBe(false);
  });

  it("main poniżej 100 znaków → błąd", () => {
    const out = { ...VALID_OUTPUT, main: "Za krótkie." };
    expect(PersonalHoroscopeAIOutputSchema.safeParse(out).success).toBe(false);
  });

  it("reflection powyżej 300 znaków → błąd", () => {
    const out = { ...VALID_OUTPUT, reflection: "x".repeat(301) };
    expect(PersonalHoroscopeAIOutputSchema.safeParse(out).success).toBe(false);
  });

  it("intensity = 0 → błąd", () => {
    const out = { ...VALID_OUTPUT, weather: { ...VALID_OUTPUT.weather, intensity: 0 } };
    expect(PersonalHoroscopeAIOutputSchema.safeParse(out).success).toBe(false);
  });

  it("intensity = 6 → błąd", () => {
    const out = { ...VALID_OUTPUT, weather: { ...VALID_OUTPUT.weather, intensity: 6 } };
    expect(PersonalHoroscopeAIOutputSchema.safeParse(out).success).toBe(false);
  });

  it("intensity = 5 → ok", () => {
    const out = { ...VALID_OUTPUT, weather: { ...VALID_OUTPUT.weather, intensity: 5 } };
    expect(PersonalHoroscopeAIOutputSchema.safeParse(out).success).toBe(true);
  });

  it("brak pola headline → błąd", () => {
    const { headline: _h, ...out } = VALID_OUTPUT;
    expect(PersonalHoroscopeAIOutputSchema.safeParse(out).success).toBe(false);
  });

  it("brak pola weather → błąd", () => {
    const { weather: _w, ...out } = VALID_OUTPUT;
    expect(PersonalHoroscopeAIOutputSchema.safeParse(out).success).toBe(false);
  });
});

// ─── hasConcreteReferences — reguła konkretu (≥2 terminów natalnych) ─────────

describe("hasConcreteReferences — reguła konkretu", () => {
  it("output zawierający 2 planety z kontekstu → true", () => {
    const out = {
      ...VALID_OUTPUT,
      main: "Pluton aktywuje Twojego Merkurego — czas na głębsze przemyślenia. Saturn naciska na Twojego Marsa, co przynosi napięcie ale też energię do działania. Skorzystaj z tej wyjątkowej konfiguracji.",
    };
    expect(hasConcreteReferences(out, SAMPLE_CONTEXT)).toBe(true);
  });

  it("output z planetą i znakiem z kontekstu → true", () => {
    const out = {
      ...VALID_OUTPUT,
      headline: "Saturn w Rybach daje Ci strukturę",
      main: "Dziś Bliźnięta aktywowane są przez trygon Plutona. Saturn w Rybach przynosi spowalniające napięcie, ale też możliwość domknięcia czegoś ważnego. Skieruj swoją uwagę na to, co naprawdę się liczy w tej chwili.",
    };
    expect(hasConcreteReferences(out, SAMPLE_CONTEXT)).toBe(true);
  });

  it("output z tylko jednym terminem → false", () => {
    const out = {
      ...VALID_OUTPUT,
      headline: "Dobry dzień na działanie",
      main: "Dziś Pluton daje Ci siłę do pracy i realizacji planów. Skupi się na tym co ważne i nie daj się rozpraszać przez drobnostki. Warto zadbać o priorytety i wyznaczyć cele na najbliższy tydzień.",
    };
    expect(hasConcreteReferences(out, SAMPLE_CONTEXT)).toBe(false);
  });

  it("generyczny output bez terminów natalnych → false", () => {
    const out = {
      ...VALID_OUTPUT,
      headline: "Dobry dzień na skupienie",
      main: "Dziś masz dobrą energię do pracy i realizacji planów. Skupi się na tym co ważne i nie daj się rozpraszać przez drobnostki. Warto zadbać o priorytety i wyznaczyć cele na najbliższy tydzień.",
    };
    expect(hasConcreteReferences(out, SAMPLE_CONTEXT)).toBe(false);
  });

  it("output z 2 aspektami z kontekstu → true", () => {
    const out = {
      ...VALID_OUTPUT,
      main: "Dziś trygon aktywuje Twoje możliwości w obszarze komunikacji. Jednocześnie koniunkcja tworzy pewne napięcie, które możesz przekształcić w motywację do działania. Planetarne wzorce wspierają Cię w podejmowaniu ważnych kroków.",
    };
    expect(hasConcreteReferences(out, SAMPLE_CONTEXT)).toBe(true);
  });
});
