// Korekta językowa listu (Haiku) — wzór z natalu (correctModuleWithHaiku).
// Poprawia WYŁĄCZNIE formy rodzajowe i drobne błędy; treść/struktura/Markdown bez zmian.
// Pętla: powtarza, aż detektor potwierdzi brak form rodzajowych (maks. 2 przebiegi).

import { aiComplete } from "@/lib/deepseek";
import { STYLE_BLOCK } from "@/lib/moduleSpecs";
import { hasGenderedForm } from "@/lib/letters/validate";

const LETTER_CORRECTION_SYSTEM = `Jesteś korektorem osobistego listu astrologicznego po polsku.
Popraw WYŁĄCZNIE naruszenia stylu bezrodzajowego i oczywiste błędy językowe.
NIE zmieniaj treści, sensu, struktury, długości ani układu. Zachowaj wszystkie **pogrubienia**,
*kursywy* i akapity. Zachowaj podpis fundamentu (ostatnia linia kursywą) bez zmian.

NAJWAŻNIEJSZE: każda forma rodzajowa w 2. osobie musi zniknąć. Zamień czas przeszły/tryb
przypuszczający na czas teraźniejszy 2. osoby (np. „zbudowałeś" → „budujesz", „nauczyłaś się"
→ „uczysz się", „przeszedłeś" → „przechodzisz", „czułeś/czułaś" → „czujesz", „gdybyś chciał"
→ „kiedy chcesz"). Przymiotniki rodzajowe → rzeczownik („gotowy/gotowa" → „w gotowości").

${STYLE_BLOCK}

ZWRÓĆ: tylko poprawiony list w Markdown. Zero komentarza, zero ograniczników bloków kodu.`;

async function onePass(md: string): Promise<string | null> {
  const corrected = await aiComplete({
    model: "claude-haiku-4-5-20251001",
    system: LETTER_CORRECTION_SYSTEM,
    messages: [{ role: "user", content: md }],
    maxTokens: 2400,
    task: "letter-correction",
  });
  const out = (corrected ?? "").trim();
  // Sanity: odrzuć pusty / drastycznie skrócony / rozdęty.
  if (!out || out.length < md.length * 0.5 || out.length > md.length * 1.8) return null;
  return out;
}

export async function correctLetterText(md: string): Promise<string> {
  if (process.env.AI_DISABLED === "true" || process.env.AI_MOCK === "true") return md;
  if (!md.trim()) return md;

  let cur = md;
  for (let i = 0; i < 2; i++) {
    try {
      const out = await onePass(cur);
      if (!out) break;          // zła odpowiedź — zostaw poprzednią wersję
      cur = out;
      if (!hasGenderedForm(cur)) break; // neutralny — koniec
    } catch {
      break; // best-effort — nigdy nie wywracaj generacji przez korektę
    }
  }
  return cur;
}
