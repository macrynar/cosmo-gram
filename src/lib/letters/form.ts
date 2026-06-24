// Forma gramatyczna (rodzaj) dla listów. Konwencja jak w natalu (moduleSpecs).
export type GrammaticalForm = "kobieta" | "mezczyzna" | "neutralna";

export const DEFAULT_FORM: GrammaticalForm = "mezczyzna";

export function asForm(v: unknown): GrammaticalForm {
  return v === "kobieta" || v === "neutralna" ? v : "mezczyzna";
}

// Instrukcja wstrzykiwana na początek danych promptu (i do korekty).
export function formDirective(f: GrammaticalForm): string {
  if (f === "kobieta")
    return `Forma gramatyczna: ŻEŃSKA. Pisz konsekwentnie w rodzaju żeńskim 2. osoby — także przymiotniki i imiesłowy o czytelniczce (np. „jesteś gotowa”, „poczułaś”, „byłaś widoczna i niepowtarzalna”).`;
  if (f === "neutralna")
    return `Forma gramatyczna: BEZOSOBOWA/NEUTRALNA. Unikaj rodzaju — czas teraźniejszy i rzeczowniki zamiast rodzajowych przymiotników (np. „w gotowości”, „czujesz”, „widoczność i niepowtarzalność”).`;
  return `Forma gramatyczna: MĘSKA. Pisz konsekwentnie w rodzaju męskim 2. osoby — także przymiotniki i imiesłowy o czytelniku (np. „jesteś gotowy”, „poczułeś”, „byłeś widoczny i niepowtarzalny”).`;
}
