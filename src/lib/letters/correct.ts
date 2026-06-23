// Korekta językowa listu (Haiku) — wzór z natalu (correctModuleWithHaiku).
// Poprawia WYŁĄCZNIE formy rodzajowe i drobne błędy; treść/struktura/Markdown bez zmian.

import { aiComplete } from "@/lib/deepseek";
import { STYLE_BLOCK } from "@/lib/moduleSpecs";

const LETTER_CORRECTION_SYSTEM = `Jesteś korektorem osobistego listu astrologicznego po polsku.
Popraw WYŁĄCZNIE naruszenia stylu bezrodzajowego i oczywiste błędy językowe.
NIE zmieniaj treści, sensu, struktury, długości ani układu. Zachowaj wszystkie **pogrubienia**,
*kursywy* i akapity. Zachowaj podpis fundamentu (ostatnia linia kursywą) bez zmian.

${STYLE_BLOCK}

ZWRÓĆ: tylko poprawiony list w Markdown. Zero komentarza, zero ograniczników bloków kodu.`;

export async function correctLetterText(md: string): Promise<string> {
  if (process.env.AI_DISABLED === "true" || process.env.AI_MOCK === "true") return md;
  if (!md.trim()) return md;

  try {
    const corrected = await aiComplete({
      model: "claude-haiku-4-5-20251001",
      system: LETTER_CORRECTION_SYSTEM,
      messages: [{ role: "user", content: md }],
      maxTokens: 2400,
      task: "letter-correction",
    });
    const out = (corrected ?? "").trim();
    // Sanity: nie pozwól drastycznie skrócić/rozdąć ani zwrócić pustego.
    if (!out || out.length < md.length * 0.6 || out.length > md.length * 1.7) return md;
    return out;
  } catch {
    return md; // best-effort — nigdy nie wywracaj generacji przez korektę
  }
}
