// Validators for AI-generated Polish text quality.
// Used by cron and on-demand routes before saving to DB.

// Allows: Latin + Polish diacritics, spaces, punctuation, digits, emoji.
// Blocks: Cyrillic, CJK, Arabic, and other non-Latin scripts.
const FOREIGN_SCRIPT_RE = /[Ѐ-ӿ一-鿿぀-ヿ؀-ۿऀ-ॿ]/;

export function containsForeignScript(text: string): boolean {
  return FOREIGN_SCRIPT_RE.test(text);
}

const SENTENCE_END_RE = /[.!?»")\]…]$/u;

export function endsWithSentence(text: string): boolean {
  const trimmed = text.trimEnd();
  return SENTENCE_END_RE.test(trimmed);
}

export function isValidPolishText(text: string): boolean {
  return !containsForeignScript(text) && endsWithSentence(text);
}

// Concreteness check: calendar AI output must cite ≥1 planet or sign name.
// Prevents generic "energy is strong today" outputs with no astrological anchor.
const PLANET_NAMES = ["Słońce","Księżyc","Merkury","Wenus","Mars","Jowisz","Saturn","Uran","Neptun","Pluton"];
const SIGN_NAMES   = ["Baran","Byk","Bliźnięta","Rak","Lew","Panna","Waga","Skorpion","Strzelec","Koziorożec","Wodnik","Ryby",
                      // locative forms that appear in generated text
                      "Baranie","Byku","Bliźniętach","Raku","Lwie","Pannie","Wadze","Skorpionie","Strzelcu","Koziorożcu","Wodniku","Rybach"];

export function containsPlanetOrSign(text: string): boolean {
  return [...PLANET_NAMES, ...SIGN_NAMES].some(name => text.includes(name));
}
