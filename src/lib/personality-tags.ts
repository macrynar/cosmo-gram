import type { NatalChart } from "@/lib/astro-types";

// Sun: 2 core identity traits per sign
const SUN_TRAITS: Record<string, [string, string]> = {
  "Baran":      ["Pionierski",    "Odważny"],
  "Byk":        ["Wytrwały",      "Konsekwentny"],
  "Bliźnięta":  ["Błyskotliwy",   "Komunikatywny"],
  "Rak":        ["Opiekuńczy",    "Wrażliwy"],
  "Lew":        ["Kreatywny",     "Charyzmatyczny"],
  "Panna":      ["Precyzyjny",    "Analityczny"],
  "Waga":       ["Dyplomatyczny", "Estetyczny"],
  "Skorpion":   ["Intensywny",    "Magnetyczny"],
  "Strzelec":   ["Optymistyczny", "Przygodowy"],
  "Koziorożec": ["Ambitny",       "Strategiczny"],
  "Wodnik":     ["Wizjonerski",   "Ekscentryczny"],
  "Ryby":       ["Marzycielski",  "Subtelny"],
};

// Moon: emotional nature — pick first that isn't already in the tag list
const MOON_TRAITS: Record<string, string[]> = {
  "Baran":      ["Spontaniczny",       "Temperamentny",   "Energiczny"],
  "Byk":        ["Stabilizujący",      "Czuły",           "Cierpliwy"],
  "Bliźnięta":  ["Kapryśny",           "Ciekawski",       "Intelektualny"],
  "Rak":        ["Intuicyjny",         "Emocjonalny",     "Przywiązany"],
  "Lew":        ["Lojalny",            "Ekspresywny",     "Teatralny"],
  "Panna":      ["Troskliwy",          "Pomocny",         "Wnikliwy"],
  "Waga":       ["Harmonijny",         "Pokojowy",        "Delikatny"],
  "Skorpion":   ["Głęboki",            "Przenikliwy",     "Czujny"],
  "Strzelec":   ["Beztroski",          "Radosny",         "Swobodny"],
  "Koziorożec": ["Opanowany",          "Powściągliwy",    "Zdystansowany"],
  "Wodnik":     ["Niekonwencjonalny",  "Oryginalny",      "Niezależny"],
  "Ryby":       ["Empatyczny",         "Delikatny",       "Mistyczny"],
};

// Mercury: thinking and communication style
const MERCURY_TRAITS: Record<string, string> = {
  "Baran":      "Bezpośredni",
  "Byk":        "Gruntowny",
  "Bliźnięta":  "Wielowątkowy",
  "Rak":        "Imaginatywny",
  "Lew":        "Twórczy",
  "Panna":      "Drobiazgowy",
  "Waga":       "Wyważony",
  "Skorpion":   "Penetrujący",
  "Strzelec":   "Dalekowzroczny",
  "Koziorożec": "Pragmatyczny",
  "Wodnik":     "Innowacyjny",
  "Ryby":       "Poetycki",
};

// Venus: love and values
const VENUS_TRAITS: Record<string, string> = {
  "Baran":      "Żarliwy",
  "Byk":        "Zmysłowy",
  "Bliźnięta":  "Uroczy",
  "Rak":        "Oddany",
  "Lew":        "Romantyczny",
  "Panna":      "Dyskretny",
  "Waga":       "Czarujący",
  "Skorpion":   "Namiętny",
  "Strzelec":   "Niezobowiązujący",
  "Koziorożec": "Wierny",
  "Wodnik":     "Przyjacielski",
  "Ryby":       "Bezwarunkowy",
};

// Mars: drive and action
const MARS_TRAITS: Record<string, string> = {
  "Baran":      "Wojowniczy",
  "Byk":        "Nieodwołalny",
  "Bliźnięta":  "Zwinny",
  "Rak":        "Ochronny",
  "Lew":        "Honorowy",
  "Panna":      "Metodyczny",
  "Waga":       "Taktyczny",
  "Skorpion":   "Nieugięty",
  "Strzelec":   "Entuzjastyczny",
  "Koziorożec": "Nieustraszony",
  "Wodnik":     "Rewolucyjny",
  "Ryby":       "Duchowy",
};

// Ascendant: outer presentation / first impression
const ASC_TRAITS: Record<string, string> = {
  "Baran":      "Zadziorny",
  "Byk":        "Solidny",
  "Bliźnięta":  "Towarzyski",
  "Rak":        "Ciepły",
  "Lew":        "Okazały",
  "Panna":      "Schludny",
  "Waga":       "Wdzięczny",
  "Skorpion":   "Enigmatyczny",
  "Strzelec":   "Nieformalny",
  "Koziorożec": "Stateczny",
  "Wodnik":     "Niepowtarzalny",
  "Ryby":       "Eteryczny",
};

const ELEMENTS: Record<string, string> = {
  "Baran": "Ogień", "Lew": "Ogień", "Strzelec": "Ogień",
  "Byk": "Ziemia", "Panna": "Ziemia", "Koziorożec": "Ziemia",
  "Bliźnięta": "Powietrze", "Waga": "Powietrze", "Wodnik": "Powietrze",
  "Rak": "Woda", "Skorpion": "Woda", "Ryby": "Woda",
};

const ELEMENT_TRAIT: Record<string, string> = {
  "Ogień":     "Energiczny",
  "Ziemia":    "Pragmatyczny",
  "Powietrze": "Intelektualny",
  "Woda":      "Uczuciowy",
};

const MODALITY_TRAIT: Record<string, string> = {
  "Baran": "Inicjatywny", "Rak": "Inicjatywny", "Waga": "Inicjatywny", "Koziorożec": "Inicjatywny",
  "Byk": "Zdeterminowany", "Lew": "Zdeterminowany", "Skorpion": "Zdeterminowany", "Wodnik": "Zdeterminowany",
  "Bliźnięta": "Elastyczny", "Panna": "Elastyczny", "Strzelec": "Elastyczny", "Ryby": "Elastyczny",
};

function getDominantElement(chart: NatalChart): string {
  const counts: Record<string, number> = { "Ogień": 0, "Ziemia": 0, "Powietrze": 0, "Woda": 0 };
  chart.planets.forEach(p => { const el = ELEMENTS[p.sign]; if (el) counts[el]++; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function signFromDegree(deg: number): string {
  const signs = ["Baran","Byk","Bliźnięta","Rak","Lew","Panna","Waga","Skorpion","Strzelec","Koziorożec","Wodnik","Ryby"];
  return signs[Math.floor(deg / 30) % 12];
}

export function getPersonalityTags(chart: NatalChart): string[] {
  const used = new Set<string>();
  const tags: string[] = [];
  const add = (tag: string) => { if (tag && !used.has(tag)) { used.add(tag); tags.push(tag); } };

  const sun     = chart.planets.find(p => p.name === "Słońce");
  const moon    = chart.planets.find(p => p.name === "Księżyc");
  const mercury = chart.planets.find(p => p.name === "Merkury");
  const venus   = chart.planets.find(p => p.name === "Wenus");
  const mars    = chart.planets.find(p => p.name === "Mars");

  // 1. Sun: 2 core identity traits
  if (sun) {
    const [t0, t1] = SUN_TRAITS[sun.sign] ?? ["", ""];
    add(t0); add(t1);
  }

  // 2. Moon: first unused emotional trait
  if (moon) {
    const pick = (MOON_TRAITS[moon.sign] ?? []).find(t => !used.has(t));
    if (pick) add(pick);
  }

  // 3. Ascendant: outer presentation (if time known)
  if (chart.ascendant != null && !chart.birthData?.timeUnknown) {
    const trait = ASC_TRAITS[signFromDegree(chart.ascendant)];
    if (trait) add(trait);
  }

  // 4. Mercury: thinking/communication
  if (mercury) {
    const trait = MERCURY_TRAITS[mercury.sign];
    if (trait) add(trait);
  }

  // 5. Venus: love & values
  if (venus) {
    const trait = VENUS_TRAITS[venus.sign];
    if (trait) add(trait);
  }

  // 6. Mars: drive & action
  if (mars) {
    const trait = MARS_TRAITS[mars.sign];
    if (trait) add(trait);
  }

  // 7. Special: Sun and Moon in same element → inner consistency tag
  if (sun && moon && ELEMENTS[sun.sign] === ELEMENTS[moon.sign]) {
    add("Spójny");
  }

  // 8. Fallback: dominant element
  if (tags.length < 5) {
    add(ELEMENT_TRAIT[getDominantElement(chart)] ?? "");
  }

  // 9. Fallback: modality
  if (sun && tags.length < 5) {
    add(MODALITY_TRAIT[sun.sign] ?? "");
  }

  return tags.slice(0, 7);
}
