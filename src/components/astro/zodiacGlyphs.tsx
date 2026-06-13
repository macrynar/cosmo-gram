import type { CSSProperties, ReactElement } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Autorski zestaw glifów zodiaku (24×24, stroke 1.6, currentColor).
// Źródło prawdy = landing (NatalWheelDemo / docs/landing-v2/zodiac-glyphs.svg).
// Zasada DS §7: w UI NIGDY surowe znaki Unicode (renderują się jako emoji) —
// zawsze ten zestaw. Węzły renderowane inline (bez <symbol>/<use>), więc nie
// powstają kolizje id przy wielu instancjach na stronie.
// ─────────────────────────────────────────────────────────────────────────────

export type SignKey =
  | "aries" | "taurus" | "gemini" | "cancer" | "leo" | "virgo"
  | "libra" | "scorpio" | "sagittarius" | "capricorn" | "aquarius" | "pisces";

/** Kolejność zodiakalna (indeks = znak od Barana). */
export const SIGN_KEYS: SignKey[] = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
];

/** Polska nazwa → klucz pliku/glifu. */
export const SIGN_TO_KEY: Record<string, SignKey> = {
  "Baran": "aries",
  "Byk": "taurus",
  "Bliźnięta": "gemini",
  "Rak": "cancer",
  "Lew": "leo",
  "Panna": "virgo",
  "Waga": "libra",
  "Skorpion": "scorpio",
  "Strzelec": "sagittarius",
  "Koziorożec": "capricorn",
  "Wodnik": "aquarius",
  "Ryby": "pisces",
};

/** Żywioł znaku (etykieta PL). */
export const SIGN_ELEMENT: Record<string, "Ogień" | "Ziemia" | "Powietrze" | "Woda"> = {
  "Baran": "Ogień", "Lew": "Ogień", "Strzelec": "Ogień",
  "Byk": "Ziemia", "Panna": "Ziemia", "Koziorożec": "Ziemia",
  "Bliźnięta": "Powietrze", "Waga": "Powietrze", "Wodnik": "Powietrze",
  "Rak": "Woda", "Skorpion": "Woda", "Ryby": "Woda",
};

/** Ścieżka do portretu znaku w public/. */
export function portraitSrc(sign: string): string {
  return `/assets/zodiac/sign-${SIGN_TO_KEY[sign] ?? "aries"}.png`;
}

/** Indeks zodiakalny (0–11) z długości ekliptycznej. */
export function signIndexFromLon(lon: number): number {
  return Math.floor(((lon % 360) + 360) % 360 / 30);
}

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Wewnętrzne węzły glifu (<g>…). Wklejane do <svg viewBox="0 0 24 24">. */
export const GLYPH_NODES: Record<SignKey, ReactElement> = {
  aries: <g {...STROKE}><path d="M12 20V8 M12 8C12 4.6 9.6 3.4 7.9 4.7C6.1 6.1 6.2 9 7.9 10.7 M12 8C12 4.6 14.4 3.4 16.1 4.7C17.9 6.1 17.8 9 16.1 10.7" /></g>,
  taurus: <g {...STROKE}><path d="M5.5 4C7 7.4 9.3 8.8 12 8.8C14.7 8.8 17 7.4 18.5 4" /><circle cx="12" cy="14.2" r="5.2" /></g>,
  gemini: <g {...STROKE}><path d="M9 6.8V17.2 M15 6.8V17.2 M5.2 4.6C8 6.4 16 6.4 18.8 4.6 M5.2 19.4C8 17.6 16 17.6 18.8 19.4" /></g>,
  cancer: <g {...STROKE}><circle cx="8.1" cy="9.3" r="2.6" /><circle cx="15.9" cy="14.7" r="2.6" /><path d="M8.1 6.7C13 6.7 16.9 8.4 18.7 11 M15.9 17.3C11 17.3 7.1 15.6 5.3 13" /></g>,
  leo: <g {...STROKE}><circle cx="7.4" cy="15.8" r="2.5" /><path d="M7.4 13.3C7.4 8.2 9.8 5.4 12.8 5.4C15.7 5.4 17.2 7.6 17.2 9.8C17.2 12.4 15.2 13.8 15.2 16.4C15.2 18.2 16.4 19 17.9 18.5" /></g>,
  virgo: <g {...STROKE}><path d="M4.4 6.2C5.7 6.2 6.5 7.1 6.5 8.6V16.8 M6.5 8.6C6.5 6.9 7.6 6 8.8 6C10.1 6 10.9 7 10.9 8.6V16.8 M10.9 8.6C10.9 6.9 12 6 13.2 6C14.5 6 15.3 7 15.3 8.6V14.2C15.3 17.6 17.2 19 19.6 18.4 M18.9 12.9C16.8 13.8 15.6 15.9 15.3 19.6" /></g>,
  libra: <g {...STROKE}><path d="M4.8 18.6H19.2 M4.8 14.6H8.6C8.6 11 9.9 8.4 12 8.4C14.1 8.4 15.4 11 15.4 14.6H19.2" /></g>,
  scorpio: <g {...STROKE}><path d="M4.4 6.2C5.7 6.2 6.5 7.1 6.5 8.6V16.8 M6.5 8.6C6.5 6.9 7.6 6 8.8 6C10.1 6 10.9 7 10.9 8.6V16.8 M10.9 8.6C10.9 6.9 12 6 13.2 6C14.5 6 15.3 7 15.3 8.6V13.6C15.3 16.5 16.9 18.2 19.6 18.2 M19.6 18.2L17.5 16.5 M19.6 18.2L17.6 19.9" /></g>,
  sagittarius: <g {...STROKE}><path d="M5.4 18.6L18.6 5.4 M18.6 5.4H13.9 M18.6 5.4V10.1 M8.6 11.6L12.4 15.4" /></g>,
  capricorn: <g {...STROKE}><path d="M4.2 6.6C5.6 4.9 7.7 5.4 8.2 7.5C8.9 10.4 9.7 13.3 10.5 15.6 M10.5 15.6C11.2 12.1 12.2 8.2 13.7 7C15.2 5.9 16.4 6.9 16.4 8.6C16.4 10.3 15.1 11.1 15.1 13.1C15.1 15.4 16.7 16.4 18.1 15.7C19.6 15 19.8 12.9 18.6 12" /></g>,
  aquarius: <g {...STROKE}><path d="M4.6 9.6L8.1 6.6L11.6 9.6L15.1 6.6L18.6 9.6 M4.6 16.8L8.1 13.8L11.6 16.8L15.1 13.8L18.6 16.8" /></g>,
  pisces: <g {...STROKE}><path d="M7.2 4.6C9.9 7.6 9.9 16.4 7.2 19.4 M16.8 4.6C14.1 7.6 14.1 16.4 16.8 19.4 M5.6 12H18.4" /></g>,
};

interface ZodiacGlyphProps {
  /** klucz znaku lub polska nazwa */
  sign: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

/** Glif znaku do kontekstów HTML (chipy, etykiety). Kolor przez `color`/currentColor. */
export function ZodiacGlyph({ sign, size = 16, className, style }: ZodiacGlyphProps) {
  const key = (SIGN_TO_KEY[sign] ?? (sign as SignKey)) as SignKey;
  const node = GLYPH_NODES[key];
  if (!node) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      style={style}
    >
      {node}
    </svg>
  );
}

// ─── Glify żywiołów (alchemiczne trójkąty, ten sam ryt) ─────────────────────

export type ElementName = "Ogień" | "Ziemia" | "Powietrze" | "Woda";

export const ELEMENT_NODES: Record<ElementName, ReactElement> = {
  "Ogień":     <g {...STROKE}><path d="M12 5 L19.5 18 L4.5 18 Z" /></g>,
  "Woda":      <g {...STROKE}><path d="M12 19 L4.5 6 L19.5 6 Z" /></g>,
  "Powietrze": <g {...STROKE}><path d="M12 5 L19.5 18 L4.5 18 Z M8 13 H16" /></g>,
  "Ziemia":    <g {...STROKE}><path d="M12 19 L4.5 6 L19.5 6 Z M8 11 H16" /></g>,
};

export function ElementGlyph({ element, size = 14, className, style }: {
  element: string; size?: number; className?: string; style?: CSSProperties;
}) {
  const node = ELEMENT_NODES[element as ElementName];
  if (!node) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      aria-hidden="true" className={className} style={style}>
      {node}
    </svg>
  );
}
