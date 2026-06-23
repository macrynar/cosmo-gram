// Walidacja treści listu/raportu przed zapisem: długość, brak predykcji,
// brak żargonu w ciele (podpis fundamentu wyłączony), struktura, obcy alfabet.

import { containsForeignScript } from "@/lib/text-validation";

// Zdanie zakończone . ! ? … — po których mogą stać cudzysłowy/nawiasy zamykające
// (też typograficzne ” ’ », których używają listy). Bez tego pytanie w cudzysłowie
// na końcu ciała dawało fałszywy alarm „ucięte zdanie".
const SENTENCE_END_PL = /[.!?…][)\]"'»”’]*\s*$/u;
function endsLikeSentence(s: string): boolean {
  return SENTENCE_END_PL.test(s.trimEnd());
}

export interface LetterValidation {
  ok: boolean;
  reasons: string[];
  words: number;
}

// Predykcje konkretnych zdarzeń — zakazane (introspekcja, nie wyrocznia).
const PREDICTION_RE = /\b(spotkasz|zostaniesz|wydarzy się|czeka cię|poznasz kogoś|będziesz mieć)\b/i;

// Formy rodzajowe w 2. osobie — zakazane (forma neutralna). Czasowniki czasu
// przeszłego/trybu przypuszczającego (-łeś/-łaś/-łbyś/-łabyś) + slash-formy.
// Granice słowa przez lookaround na \p{L} — \b zawodzi na polskich diakrytykach (ś, ć…).
const GENDERED_RE = /(?<!\p{L})\p{L}*(łeś|łaś|łbyś|łabyś)(?!\p{L})/u;
const SLASH_FORM_RE = /(?<!\p{L})\p{L}+\/\p{L}+(?!\p{L})/u;

/** Czy tekst zawiera formę rodzajową w 2. osobie (do pętli korekty). */
export function hasGenderedForm(text: string): boolean {
  return GENDERED_RE.test(text) || SLASH_FORM_RE.test(text);
}

// Żargon, którego nie wolno w ciele listu. Podpis fundamentu (kursywa na końcu)
// jest wyłączony z tego sprawdzenia. Słońce/Księżyc świadomie pominięte
// (to też zwykłe słowa polszczyzny — ryzyko fałszywych trafień).
const BODY_JARGON = [
  "Wenus", "Mars", "Merkury", "Jowisz", "Saturn", "Uran", "Neptun", "Pluton",
  "koniunkcj", "opozycj", "trygon", "sekstyl", "kwadrat",
  "Ascendent", "Medium Coeli", "tranzyt", "retrograd", "węzeł północny", "węzeł południowy",
];

function countWords(s: string): number {
  return (s.trim().match(/\S+/g) ?? []).length;
}

// Podpis fundamentu = ostatnia niepusta linia kursywą (np. "*Na podstawie ...*").
export function splitSignature(md: string): { body: string; signature: string | null } {
  const lines = md.trimEnd().split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    const l = lines[i].trim();
    if (!l) continue;
    if (/^\*.*\*$/.test(l) || /^_.*_$/.test(l) || /na podstawie/i.test(l)) {
      return { body: lines.slice(0, i).join("\n"), signature: l };
    }
    break; // ostatnia niepusta linia nie wygląda na podpis
  }
  return { body: md, signature: null };
}

export function validateLetterContent(
  md: string,
  opts: { wordMin: number; wordMax: number; kind: "letter" | "report"; isEvent?: boolean }
): LetterValidation {
  const reasons: string[] = [];
  const text = (md ?? "").trim();
  if (!text) return { ok: false, reasons: ["pusty output"], words: 0 };

  const words = countWords(text);
  const lo = Math.floor(opts.wordMin * 0.85);
  const hi = Math.ceil(opts.wordMax * 1.18);
  if (words < lo) reasons.push(`za krótki (${words} słów, min ~${lo})`);
  if (words > hi) reasons.push(`za długi (${words} słów, max ~${hi})`);

  if (containsForeignScript(text)) reasons.push("obcy alfabet");

  const { body, signature } = splitSignature(text);
  if (!signature) reasons.push("brak podpisu fundamentu");
  if (!endsLikeSentence(body)) reasons.push("ucięte zdanie w ciele");
  if (PREDICTION_RE.test(body)) reasons.push("predykcja konkretnego zdarzenia");
  if (GENDERED_RE.test(body) || SLASH_FORM_RE.test(body)) reasons.push("forma rodzajowa");

  // Listy eventowe muszą cytować tranzyt (np. „Saturn wraca…") — nazwa planety w ciele dozwolona.
  if (!opts.isEvent) {
    const jargonHit = BODY_JARGON.find((j) => new RegExp(`\\b${j}`, "i").test(body));
    if (jargonHit) reasons.push(`żargon w ciele: „${jargonHit}”`);
  }

  return { ok: reasons.length === 0, reasons, words };
}
