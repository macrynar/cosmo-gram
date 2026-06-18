import { describe, it, expect } from "vitest";
import { repairJson } from "@/lib/jsonRepair";

const parse = (s: string) => JSON.parse(repairJson(s));

describe("repairJson", () => {
  it("escapuje niezescapowany cudzysłów w wartości (crash synastrii)", () => {
    // Odtworzenie produkcyjnego błędu: model wstawił "działaj teraz" w interpretacji.
    const broken =
      '{ "overallScore": 70, "summary": "Para z chemią.", "categories": [ ' +
      '{ "name": "Komunikacja i zrozumienie", "score": 71, ' +
      '"interpretation": "Mars mówi "działaj teraz", a Saturn każe czekać.", ' +
      '"insight": "Rozmawiajcie zanim napięcie urośnie." } ] }';

    // Sanity: surowy JSON faktycznie się wywala tak jak na produkcji.
    expect(() => JSON.parse(broken)).toThrow();

    const obj = parse(broken);
    expect(obj.overallScore).toBe(70);
    expect(obj.categories[0].interpretation).toBe(
      'Mars mówi "działaj teraz", a Saturn każe czekać.'
    );
    expect(obj.categories[0].insight).toBe("Rozmawiajcie zanim napięcie urośnie.");
  });

  it("radzi sobie z cudzysłowem tuż przed przecinkiem w treści", () => {
    const broken =
      '{ "summary": "Wątek wolności i kontroli", to oś tej relacji." }';
    // Cudzysłów po "kontroli" — po nim przecinek + litera, więc to NIE koniec stringa.
    const obj = parse(broken);
    expect(obj.summary).toBe('Wątek wolności i kontroli", to oś tej relacji.');
  });

  it("usuwa trailing comma przed } i ]", () => {
    const broken = '{ "a": 1, "list": [1, 2, 3,], "b": "x", }';
    const obj = parse(broken);
    expect(obj).toEqual({ a: 1, list: [1, 2, 3], b: "x" });
  });

  it("escapuje dosłowne znaki nowej linii w stringu", () => {
    const broken = '{ "interpretation": "Akapit jeden.\n\nAkapit dwa." }';
    const obj = parse(broken);
    expect(obj.interpretation).toBe("Akapit jeden.\n\nAkapit dwa.");
  });

  it("domyka ucięty output (max_tokens)", () => {
    const broken =
      '{ "overallScore": 70, "categories": [ { "name": "Komunikacja", "interpretation": "Tekst urwany w poł';
    const obj = parse(broken);
    expect(obj.overallScore).toBe(70);
    expect(obj.categories[0].name).toBe("Komunikacja");
    expect(typeof obj.categories[0].interpretation).toBe("string");
  });

  it("nie psuje poprawnego JSON-a (idempotentny escape)", () => {
    const valid =
      '{ "summary": "Tekst z \\"poprawnym\\" cytatem.", "score": 71, "ok": true }';
    expect(repairJson(valid)).toBe(valid);
    expect(parse(valid)).toEqual({
      summary: 'Tekst z "poprawnym" cytatem.',
      score: 71,
      ok: true,
    });
  });
});
