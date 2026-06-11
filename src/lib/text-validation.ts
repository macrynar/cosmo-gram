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
