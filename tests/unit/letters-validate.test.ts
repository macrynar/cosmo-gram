import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { validateLetterContent, splitSignature } from "@/lib/letters/validate";

const fix = (name: string) => readFileSync(join(process.cwd(), "tests/fixtures/ai/letters", name), "utf-8");
const LETTER = { wordMin: 250, wordMax: 450, kind: "letter" as const };

describe("validateLetterContent", () => {
  it("przepuszcza poprawny list standardowy", () => {
    const r = validateLetterContent(fix("standard.md"), LETTER);
    expect(r.ok).toBe(true);
    expect(r.reasons).toEqual([]);
  });

  it("przepuszcza list delikatny", () => {
    const r = validateLetterContent(fix("delikatny.md"), LETTER);
    expect(r.ok).toBe(true);
  });

  it("łapie pusty output", () => {
    const r = validateLetterContent("", LETTER);
    expect(r.ok).toBe(false);
    expect(r.reasons).toContain("pusty output");
  });

  it("łapie brak podpisu fundamentu", () => {
    const r = validateLetterContent("Krótki list bez podpisu na końcu zdania.", LETTER);
    expect(r.reasons).toContain("brak podpisu fundamentu");
  });

  it("łapie predykcję konkretnego zdarzenia", () => {
    const md = "Wkrótce spotkasz kogoś wyjątkowego i wszystko się zmieni na lepsze.\n\n*Na podstawie Twojej Wenus.*";
    const r = validateLetterContent(md, LETTER);
    expect(r.reasons).toContain("predykcja konkretnego zdarzenia");
  });

  it("łapie żargon w ciele (poza podpisem)", () => {
    const md = "Twoja Wenus w siódmym domu sprawia, że kochasz głęboko i lojalnie każdego dnia.\n\n*Na podstawie Twojej Wenus.*";
    const r = validateLetterContent(md, LETTER);
    expect(r.reasons.some((x) => x.startsWith("żargon w ciele"))).toBe(true);
  });

  it("łapie zbyt krótki tekst", () => {
    const md = "Jesteś kimś wyjątkowym i masz w sobie światło.\n\n*Na podstawie Twojego Słońca.*";
    const r = validateLetterContent(md, LETTER);
    expect(r.reasons.some((x) => x.startsWith("za krótki"))).toBe(true);
  });

  it("splitSignature wydziela podpis kursywą", () => {
    const { body, signature } = splitSignature("Treść listu.\n\n*Na podstawie Twojego Słońca.*");
    expect(signature).toContain("Na podstawie");
    expect(body).not.toContain("Na podstawie");
  });
});
