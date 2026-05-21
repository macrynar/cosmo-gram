export type ReadingType = "natal" | "daily" | "synastry" | "child";

const WORD_LIMITS: Record<ReadingType, { min: number; max: number; hard: number }> = {
  natal:    { min: 700,  max: 1100, hard: 1320 },
  daily:    { min: 80,   max: 150,  hard: 180  },
  synastry: { min: 350,  max: 550,  hard: 660  },
  child:    { min: 1100, max: 1500, hard: 1800 },
};

export function checkLength(text: string, type: ReadingType): { ok: boolean; wordCount: number; hard: number } {
  const wordCount = text.trim().split(/\s+/).length;
  const { hard } = WORD_LIMITS[type];
  return { ok: wordCount <= hard, wordCount, hard };
}

export function validateReading(text: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Slash-formy
  if (/\b\w+\/\w+\b/.test(text)) issues.push("SLASH_FORM");

  // Stopnie minut w outputcie
  if (/\d+°\d+['′]/.test(text)) issues.push("DEGREE_MINUTES");

  // Żargon nieprzetłumaczony
  const jargonTerms = ["dyspozytor", "retrograde", "retrograd", "applying", "separating", "orb "];
  for (const term of jargonTerms) {
    if (text.toLowerCase().includes(term.toLowerCase())) {
      issues.push(`JARGON_${term.trim().toUpperCase()}`);
    }
  }

  // Meta-leak
  const metaPatterns = [
    /należy go nazwać wprost/i,
    /\bopieram się\b/i,
    /\bbez (dostępu|godziny) (do|urodzenia)/i,
    /\bpomijam\b/i,
    /\bw tej karcie pokazuje\b/i,
    /\bnależy zaznaczyć\b/i,
    /\bworkflow\b/i,
    /\bwstępny\b.*\bkrok\b/i,
  ];
  for (const p of metaPatterns) {
    if (p.test(text)) issues.push(`META_LEAK`);
  }

  // Banned phrases
  const banned = [
    "wodne podłoże", "ognista energia", "ziemska stabilność", "powietrzna lekkość",
    "fundament duchowy", "naturalna mądrość", "wewnętrzny kompas",
    "zaufaj sobie", "zaufaj procesowi", "twoje przeczucie",
    "kosmiczna podróż", "energie wszechświata",
    "intuicja strukturalna", "wzorcowe myślenie",
    "twoje 'x' jest darem",
  ];
  for (const phrase of banned) {
    if (text.toLowerCase().includes(phrase)) {
      issues.push(`BANNED_PHRASE`);
    }
  }

  return { valid: issues.length === 0, issues };
}

export function buildRetryInstruction(issues: string[]): string {
  const descriptions: Record<string, string> = {
    "SLASH_FORM": "slash-formy (np. 'byłeś/aś') — użyj jednej formy gramatycznej",
    "DEGREE_MINUTES": "stopnie i minuty łuku w outputcie (np. '19°55'') — podaj tylko znak zodiaku",
    "JARGON_DYSPOZYTOR": "termin 'dyspozytor' — zastąp lub pomiń",
    "JARGON_RETROGRADE": "termin 'retrograde'/'retrograd' — zastąp lub pomiń",
    "JARGON_APPLYING": "termin 'applying'/'separating' — zastąp lub pomiń",
    "JARGON_ORB": "termin 'orb' — nie używaj, powiedz 'bliski aspekt' lub pomiń",
    "META_LEAK": "meta-komentarze AI widoczne w outputcie — usuń zdania mówiące o tym co robisz",
    "BANNED_PHRASE": "zakazane frazy (coaching-banał, ezo-cliché) — zastąp konkretem",
  };

  const unique = [...new Set(issues)];
  const descs = unique.map(i => descriptions[i] ?? i).join("; ");
  return `Poprzednia wersja zawierała błędy: ${descs}. Wygeneruj ponownie — popraw te problemy, zachowaj całą resztę struktury.`;
}
