import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { SIGN_LOCATIVE, SIGN_GENITIVE } from "@/lib/i18n/astro";

// ─── Load all AI module fixtures ────────────────────────────────────────────

const FIXTURE_DIR = join(process.cwd(), "tests", "fixtures", "ai", "modules");
type ModuleFixture = {
  id: string;
  quote: string;
  content: string;
  tactics: string[];
  tags: string[];
  visualMeters: Array<{ label: string; value: number; archetype: string; category: string }>;
};

const fixtures: ModuleFixture[] = readdirSync(FIXTURE_DIR)
  .filter(f => f.endsWith(".json"))
  .map(f => JSON.parse(readFileSync(join(FIXTURE_DIR, f), "utf-8")) as ModuleFixture);

// Collect all prose text from a module (all output fields)
function allText(m: ModuleFixture): string {
  return [
    m.quote,
    m.content,
    ...m.tactics,
    ...m.tags,
    ...m.visualMeters.map(v => v.archetype),
    ...m.visualMeters.map(v => v.label),
  ].join(" ");
}

// ─── 1. Gender form detector ────────────────────────────────────────────────

// Past tense / conditional in 2nd person — these are gendered forms, forbidden by STYLE_BLOCK
const GENDERED_PAST_COND = /\b(?:powiedziałbyś|powiedziałabyś|zrobiłeś|zrobiłaś|czułeś|czułaś|byłeś|byłaś|miałeś|miałaś|wiedziałeś|wiedziałaś|chciałeś|chciałaś|myślałeś|myślałaś|bałeś|bałaś|mogłeś|mogłaś|musiałeś|musiałaś|zdecydowałeś|zdecydowałaś|poczułeś|poczułaś|znalazłeś|znalazłaś|wróciłeś|wróciłaś|dotarłeś|dotarłaś|zbudowałeś|zbudowałaś|stworzyłeś|stworzyłaś|osiągnąłeś|osiągnęłaś|postanowiłeś|postanowiłaś|zdałeś|zdałaś|nauczyłeś|nauczyłaś|poczułbyś|poczułabyś|byłbyś|byłabyś|miałbyś|miałabyś|chciałbyś|chciałabyś|mogłbyś|mogłabyś|zrobiłbyś|zrobiłabyś|wiedziałbyś|wiedziałabyś)\b/gi;

// Hypothetical + gendered participial (jakbyś stał/stała, gdybyś chciał/chciała, etc.)
// Only matches singular gendered endings (ł/ła/łeś/łaś/łby/łaby) — not plural li/ły which appear in non-gendered futures
const HYPOTHETICAL_GENDERED = /\b(?:jakbyś|gdybyś|jakbyście|gdybyście)\s+\w+(?:łeś|łaś|łaby|łby|ła\b|[a-ząćęńóśźż]ł\b)/gi;

// Gendered predicative adjectives about the user — forbidden
const GENDERED_ADJECTIVES = /\b(?:gotowy|gotowa|sam(?:\s+\w+)?|sama|zdolny|zdolna|świadomy|świadoma|zagubiony|zagubiona|otwarty|otwarta|silny|silna|wolny|wolna|pewny|pewna|spokojny|spokojna|szczęśliwy|szczęśliwa)\b/gi;

describe("gender form detector (STYLE_BLOCK rule)", () => {
  for (const fixture of fixtures) {
    it(`${fixture.id}: no gendered past/conditional 2nd person forms`, () => {
      const text = allText(fixture);
      const matches = text.match(GENDERED_PAST_COND) ?? [];
      expect(
        matches,
        `Module "${fixture.id}" contains gendered past/conditional: [${matches.join(", ")}]`
      ).toHaveLength(0);
    });

    it(`${fixture.id}: no slash-form (e.g. "gotowy/gotowa")`, () => {
      const slashForm = /\w+\/\w+/g;
      const text = allText(fixture);
      const matches = text.match(slashForm) ?? [];
      expect(
        matches,
        `Module "${fixture.id}" contains slash-form: [${matches.join(", ")}]`
      ).toHaveLength(0);
    });

    it(`${fixture.id}: no hypothetical + gendered participial (jakbyś stał, gdybyś chciała)`, () => {
      const text = allText(fixture);
      const matches = text.match(HYPOTHETICAL_GENDERED) ?? [];
      expect(
        matches,
        `Module "${fixture.id}" contains hypothetical+gendered: [${matches.join(", ")}]`
      ).toHaveLength(0);
    });
  }
});

// ─── 1b. Comma-before-który check (metric archetypes) ───────────────────────

// In Polish relative clauses introduced by "który/która/które", a comma is required.
// e.g. "terapeuta który" → "terapeuta, który"
const MISSING_COMMA_KTORY = / [a-ząćęłńóśźż]+ który[a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ]*/g;

describe("comma before który (metric archetypes)", () => {
  for (const fixture of fixtures) {
    it(`${fixture.id}: comma before 'który' in archetype labels`, () => {
      const text = fixture.visualMeters.map(v => v.archetype).join(" ");
      const matches = text.match(MISSING_COMMA_KTORY) ?? [];
      expect(
        matches,
        `Module "${fixture.id}" missing comma before który: [${matches.join(", ")}]`
      ).toHaveLength(0);
    });
  }
});

// ─── 2. Rusycyzm detector ───────────────────────────────────────────────────

// Known rusycyzmy and non-Polish astrological forms
const RUSYCYZMY = [
  "Wenera",          // wrong — should be Wenus (nieodmienna)
  "Wenus'",          // wrong declension — Wenus is indeclinable
  "Wenusem",         // wrong — Wenus is indeclinable
  "Wenerą",          // wrong
  "Wenerze",         // wrong
  "astralny",        // rusycyzm
  "karmowy",         // rusycyzm — should be karmiczny
  "kosmiczny los",   // rusycyzm — fatalistyczny ton
  "sfery",           // often misused: "sfera emocjonalna" → "obszar emocji"
  "obdarowany",      // passive participle rusycyzm feel
  "posiadasz wyjątkową", // forbidden phrase (prompt already bans it)
];

describe("rusycyzm detector", () => {
  for (const fixture of fixtures) {
    it(`${fixture.id}: no known rusycyzmy`, () => {
      const text = allText(fixture).toLowerCase();
      const found = RUSYCYZMY.filter(r => text.includes(r.toLowerCase()));
      expect(
        found,
        `Module "${fixture.id}" contains rusycyzmy: [${found.join(", ")}]`
      ).toHaveLength(0);
    });
  }
});

// ─── 3. Impersonal construction detector ("chłód") ─────────────────────────

// These bezosobowe constructions describe the user from outside — forbidden by STYLE_BLOCK
const CHLOD_PATTERNS = /\b(?:można |potrafi się |da się |warto by |warto było|daje się zauważyć|udaje się jej|udaje się mu|potrafi to być|może być tak że|nierzadko się zdarza|bywa że)\b/gi;

describe("impersonal construction detector (style coldness)", () => {
  for (const fixture of fixtures) {
    it(`${fixture.id}: no impersonal 3rd-party framing`, () => {
      const text = allText(fixture);
      const matches = text.match(CHLOD_PATTERNS) ?? [];
      // Warning only (threshold: >2 hits = issue)
      expect(
        matches.length,
        `Module "${fixture.id}" overuses impersonal constructions (${matches.length}x): [${matches.join(", ")}]`
      ).toBeLessThanOrEqual(2);
    });
  }
});

// ─── 4. Astro jargon detector ───────────────────────────────────────────────

const JARGON = /\b(?:orb|dyspozytor|retrogradacja|kwadratura|trygon|sekstyl|koniunkcja|opozycja|IC\b|ASC\b|DSC\b|MC\b|AC\b|DC\b|twój \d+\. dom)\b/gi;

describe("astro jargon detector", () => {
  for (const fixture of fixtures) {
    it(`${fixture.id}: no technical astro jargon in content`, () => {
      const text = [fixture.content, ...fixture.tactics].join(" ");
      const matches = text.match(JARGON) ?? [];
      expect(
        matches,
        `Module "${fixture.id}" leaks astro jargon: [${matches.join(", ")}]`
      ).toHaveLength(0);
    });
  }
});

// ─── 5. Tag format validator ─────────────────────────────────────────────────

const TAG_REGEX = /^[a-ząćęłńóśźż]+$/;

describe("tag format validator", () => {
  for (const fixture of fixtures) {
    it(`${fixture.id}: 4 tags, all lowercase PL-only`, () => {
      expect(fixture.tags).toHaveLength(4);
      for (const tag of fixture.tags) {
        expect(tag, `tag "${tag}" in ${fixture.id} fails regex`).toMatch(TAG_REGEX);
      }
    });
  }
});

// ─── 6. Declension map completeness ─────────────────────────────────────────

const ALL_SIGNS = ["Baran","Byk","Bliźnięta","Rak","Lew","Panna","Waga","Skorpion","Strzelec","Koziorożec","Wodnik","Ryby"];

describe("declension map completeness", () => {
  it("SIGN_LOCATIVE covers all 12 signs", () => {
    for (const sign of ALL_SIGNS) {
      expect(SIGN_LOCATIVE[sign], `SIGN_LOCATIVE missing: ${sign}`).toBeTruthy();
    }
  });

  it("SIGN_GENITIVE covers all 12 signs", () => {
    for (const sign of ALL_SIGNS) {
      expect(SIGN_GENITIVE[sign], `SIGN_GENITIVE missing: ${sign}`).toBeTruthy();
    }
  });

  it("SIGN_LOCATIVE Baran → Baranie (not Baran)", () => {
    expect(SIGN_LOCATIVE["Baran"]).toBe("Baranie");
  });

  it("SIGN_LOCATIVE Bliźnięta → Bliźniętach", () => {
    expect(SIGN_LOCATIVE["Bliźnięta"]).toBe("Bliźniętach");
  });

  it("SIGN_GENITIVE Lew → Lwa (irregular)", () => {
    expect(SIGN_GENITIVE["Lew"]).toBe("Lwa");
  });

  it("SIGN_GENITIVE Ryby → Ryb (plural genitive)", () => {
    expect(SIGN_GENITIVE["Ryby"]).toBe("Ryb");
  });
});

// ─── 7. Visual meter value range ────────────────────────────────────────────

describe("visual meter value range (30-95, integer)", () => {
  for (const fixture of fixtures) {
    it(`${fixture.id}: all meter values in [30, 95] and integer`, () => {
      for (const meter of fixture.visualMeters) {
        expect(Number.isInteger(meter.value), `value ${meter.value} is not integer`).toBe(true);
        expect(meter.value).toBeGreaterThanOrEqual(30);
        expect(meter.value).toBeLessThanOrEqual(95);
      }
    });
  }
});
