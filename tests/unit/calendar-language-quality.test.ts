import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

// ─── Load calendar AI fixtures ────────────────────────────────────────────────

const CALENDAR_FIXTURE_DIR = join(process.cwd(), "tests", "fixtures", "ai", "calendar");

type MonthlySummaryFixture = {
  id: string;
  synthesis: string;
  windows: Array<{ key: string; phrase: string; sentence: string | null }>;
};

type SeasonContentFixture = {
  id: string;
  name: string;
  paragraph: string;
};

type CalendarFixture = MonthlySummaryFixture | SeasonContentFixture;

function isMonthlySummary(f: CalendarFixture): f is MonthlySummaryFixture {
  return "windows" in f;
}

const fixtures: CalendarFixture[] = readdirSync(CALENDAR_FIXTURE_DIR)
  .filter(f => f.endsWith(".json"))
  .map(f => JSON.parse(readFileSync(join(CALENDAR_FIXTURE_DIR, f), "utf-8")) as CalendarFixture);

function allText(f: CalendarFixture): string {
  if (isMonthlySummary(f)) {
    return [
      f.synthesis,
      ...f.windows.map(w => w.sentence ?? ""),
      ...f.windows.map(w => w.phrase),
    ].join(" ");
  }
  return [f.name, f.paragraph].join(" ");
}

// ─── Shared language quality regexes (same rules as natal modules) ───────────

const GENDERED_PAST_COND = /\b(?:powiedziałbyś|powiedziałabyś|zrobiłeś|zrobiłaś|czułeś|czułaś|byłeś|byłaś|miałeś|miałaś|wiedziałeś|wiedziałaś|chciałeś|chciałaś|myślałeś|myślałaś|bałeś|bałaś|mogłeś|mogłaś|musiałeś|musiałaś|zdecydowałeś|zdecydowałaś|poczułeś|poczułaś|znalazłeś|znalazłaś|wróciłeś|wróciłaś|dotarłeś|dotarłaś|zbudowałeś|zbudowałaś|stworzyłeś|stworzyłaś|osiągnąłeś|osiągnęłaś|postanowiłeś|postanowiłaś|zdałeś|zdałaś|nauczyłeś|nauczyłaś|poczułbyś|poczułabyś|byłbyś|byłabyś|miałbyś|miałabyś|chciałbyś|chciałabyś|mogłbyś|mogłabyś|zrobiłbyś|zrobiłabyś|wiedziałbyś|wiedziałabyś)\b/gi;

const HYPOTHETICAL_GENDERED = /\b(?:jakbyś|gdybyś|jakbyście|gdybyście)\s+\w+(?:ł|ła|łeś|łaś|łby|łaby|li|ły)\b/gi;

// Calendar-specific: astro jargon should not appear in user-facing calendar sentences
const CALENDAR_JARGON = /\b(?:orb|dyspozytor|trygon|sekstyl|kwadratura|koniunkcja|opozycja|IC\b|DSC\b|AC\b|DC\b)\b/gi;

// Forbidden passive constructs that feel "chłód" (cold/impersonal)
const CHLOD_PATTERNS = /\b(?:można |potrafi się |da się |daje się zauważyć|udaje się jej|udaje się mu)\b/gi;

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("calendar language quality: gender neutrality", () => {
  for (const fixture of fixtures) {
    it(`${fixture.id}: no gendered past/conditional 2nd-person forms`, () => {
      const text = allText(fixture);
      const matches = text.match(GENDERED_PAST_COND) ?? [];
      expect(
        matches,
        `"${fixture.id}" has gendered past/conditional: [${matches.join(", ")}]`
      ).toHaveLength(0);
    });

    it(`${fixture.id}: no slash forms (gotowy/gotowa)`, () => {
      const text = allText(fixture);
      const matches = text.match(/\w+\/\w+/g) ?? [];
      expect(
        matches,
        `"${fixture.id}" has slash forms: [${matches.join(", ")}]`
      ).toHaveLength(0);
    });

    it(`${fixture.id}: no hypothetical + gendered participial`, () => {
      const text = allText(fixture);
      const matches = text.match(HYPOTHETICAL_GENDERED) ?? [];
      expect(
        matches,
        `"${fixture.id}" has hypothetical+gendered: [${matches.join(", ")}]`
      ).toHaveLength(0);
    });
  }
});

describe("calendar language quality: no astro jargon in user text", () => {
  for (const fixture of fixtures) {
    if (!isMonthlySummary(fixture)) continue;
    it(`${fixture.id}: window sentences don't expose raw aspect names`, () => {
      const text = fixture.windows.map(w => w.sentence ?? "").join(" ");
      const matches = text.match(CALENDAR_JARGON) ?? [];
      expect(
        matches,
        `"${fixture.id}" exposes astro jargon in sentences: [${matches.join(", ")}]`
      ).toHaveLength(0);
    });
  }
});

describe("calendar language quality: no cold impersonal framing", () => {
  for (const fixture of fixtures) {
    it(`${fixture.id}: max 1 impersonal construction`, () => {
      const text = allText(fixture);
      const matches = text.match(CHLOD_PATTERNS) ?? [];
      expect(
        matches.length,
        `"${fixture.id}" overuses impersonal framing (${matches.length}x): [${matches.join(", ")}]`
      ).toBeLessThanOrEqual(1);
    });
  }
});

describe("calendar language quality: paragraph non-empty and not too short", () => {
  for (const fixture of fixtures) {
    if (isMonthlySummary(fixture)) continue;
    it(`${fixture.id}: paragraph is at least 100 characters`, () => {
      expect(
        fixture.paragraph.length,
        `"${fixture.id}" paragraph too short (${fixture.paragraph.length} chars)`
      ).toBeGreaterThanOrEqual(100);
    });

    it(`${fixture.id}: name is non-empty`, () => {
      expect(fixture.name.trim().length).toBeGreaterThan(0);
    });
  }
});

describe("calendar language quality: synthesis structure", () => {
  for (const fixture of fixtures) {
    if (!isMonthlySummary(fixture)) continue;
    it(`${fixture.id}: synthesis is at least 80 characters`, () => {
      expect(
        fixture.synthesis.length,
        `"${fixture.id}" synthesis too short`
      ).toBeGreaterThanOrEqual(80);
    });

    it(`${fixture.id}: all window entries have phrase and key`, () => {
      for (const w of fixture.windows) {
        expect(w.key.trim().length, `window missing key`).toBeGreaterThan(0);
        expect(w.phrase.trim().length, `window missing phrase`).toBeGreaterThan(0);
      }
    });
  }
});
