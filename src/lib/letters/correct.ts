// Korekta językowa listu (Haiku): ujednolica RODZAJ do wybranej formy gramatycznej
// i usuwa slash-formy oraz drobne błędy. Treść/struktura/Markdown bez zmian.

import { aiComplete } from "@/lib/deepseek";
import { formDirective, type GrammaticalForm } from "@/lib/letters/form";

function system(form: GrammaticalForm): string {
  return `Jesteś korektorem osobistego listu astrologicznego po polsku.
Popraw WYŁĄCZNIE rodzaj gramatyczny i oczywiste błędy językowe. NIE zmieniaj treści,
sensu, struktury, długości ani układu. Zachowaj **pogrubienia**, *kursywy*, akapity
i podpis fundamentu (ostatnia linia kursywą).

${formDirective(form)}

Zadanie:
- Cały list musi być KONSEKWENTNIE w tym jednym rodzaju — czasowniki, przymiotniki
  i imiesłowy o czytelniku. Popraw każde słowo w niewłaściwym rodzaju.
- Usuń slash-formy (np. „gotowy/a", „byłeś/aś") — zostaw jedną, właściwą formę.
- Cytaty wypowiedzi czytelnika („…") zostają w 1. osobie bez zmian.

ZWRÓĆ: tylko poprawiony list w Markdown. Zero komentarza, zero ograniczników bloków kodu.`;
}

export async function correctLetterText(md: string, form: GrammaticalForm): Promise<string> {
  if (process.env.AI_DISABLED === "true" || process.env.AI_MOCK === "true") return md;
  if (!md.trim()) return md;

  try {
    const corrected = await aiComplete({
      model: "claude-haiku-4-5-20251001",
      system: system(form),
      messages: [{ role: "user", content: md }],
      maxTokens: 2400,
      task: "letter-correction",
    });
    const out = (corrected ?? "").trim();
    // Sanity: odrzuć pusty / drastycznie skrócony / rozdęty.
    if (!out || out.length < md.length * 0.5 || out.length > md.length * 1.8) return md;
    return out;
  } catch {
    return md; // best-effort — nigdy nie wywracaj generacji przez korektę
  }
}
