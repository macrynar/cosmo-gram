// Declension maps for astrological terms in Polish UI.
// Every sign/planet name in the calendar goes through these — no raw nominatives in text.

// Locative (miejscownik) — used after "w": "Księżyc w Baranie"
export const SIGN_LOCATIVE: Record<string, string> = {
  "Baran":       "Baranie",
  "Byk":         "Byku",
  "Bliźnięta":   "Bliźniętach",
  "Rak":         "Raku",
  "Lew":         "Lwie",
  "Panna":       "Pannie",
  "Waga":        "Wadze",
  "Skorpion":    "Skorpionie",
  "Strzelec":    "Strzelcu",
  "Koziorożec":  "Koziorożcu",
  "Wodnik":      "Wodniku",
  "Ryby":        "Rybach",
};

// Genitive (dopełniacz) — used after "do natalnego": "do natalnego Merkurego"
export const PLANET_GENITIVE: Record<string, string> = {
  "Słońce":  "Słońca",
  "Księżyc": "Księżyca",
  "Merkury": "Merkurego",
  "Wenus":   "Wenus",
  "Mars":    "Marsa",
  "Jowisz":  "Jowisza",
  "Saturn":  "Saturna",
  "Uran":    "Urana",
  "Neptun":  "Neptuna",
  "Pluton":  "Plutona",
  "ASC":     "Ascendentu",
  "MC":      "MC",
};

// Instrumental (narzędnik) — used after "z", "przed": "przed Twoim Saturnem"
export const PLANET_INSTRUMENTAL: Record<string, string> = {
  "Słońce":  "Słońcem",
  "Księżyc": "Księżycem",
  "Merkury": "Merkurym",
  "Wenus":   "Wenus",
  "Mars":    "Marsem",
  "Jowisz":  "Jowiszem",
  "Saturn":  "Saturnem",
  "Uran":    "Uranem",
  "Neptun":  "Neptunem",
  "Pluton":  "Plutonem",
  "ASC":     "Ascendentem",
  "MC":      "MC",
};

// Article before instrumental: "Twoim Saturnem" vs "Twoją Wenus"
const INSTRUMENTAL_ARTICLE: Record<string, string> = { "Wenus": "Twoją", "ASC": "Twoim" };

export function natalInstrumental(planet: string): string {
  const article = INSTRUMENTAL_ARTICLE[planet] ?? "Twoim";
  return `${article} ${PLANET_INSTRUMENTAL[planet] ?? planet}`;
}

// Genitive possessive: "Twojego Słońca", "Twojej Wenus"
const GENITIVE_ARTICLE: Record<string, string> = { "Wenus": "Twojej" };

export function natalGenitive(planet: string): string {
  const article = GENITIVE_ARTICLE[planet] ?? "Twojego";
  return `${article} ${PLANET_GENITIVE[planet] ?? planet}`;
}

// "w [znaku]" — shortcut for the most common pattern
export function inSign(sign: string): string {
  return `w ${SIGN_LOCATIVE[sign] ?? sign}`;
}

// Polish names for aspect types
export const ASPECT_LABEL_PL: Record<string, string> = {
  conjunction: "koniunkcja",
  opposition:  "opozycja",
  square:      "kwadrat",
  trine:       "trygon",
  sextile:     "sekstyl",
};

// ONE canonical transit phrase used everywhere:
// "Mars w Byku · opozycja do Twojej Wenus w Skorpionie"
export function transitPhrase(t: {
  transitPlanet: string;
  transitSign:   string;
  aspectType:    string;
  natalPoint:    string;
  natalSign:     string;
}): string {
  const aspect = ASPECT_LABEL_PL[t.aspectType] ?? t.aspectType;
  return `${t.transitPlanet} ${inSign(t.transitSign)} · ${aspect} do ${natalGenitive(t.natalPoint)} ${inSign(t.natalSign)}`;
}
