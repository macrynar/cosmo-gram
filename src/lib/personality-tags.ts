import type { NatalChart } from "@/lib/astro-types";

const SIGN_TRAITS: Record<string, [string, string, string]> = {
  "Baran":      ["Pionierski",    "Odważny",        "Bezpośredni"],
  "Byk":        ["Wytrwały",      "Zmysłowy",       "Stabilny"],
  "Bliźnięta":  ["Ciekawski",     "Komunikatywny",  "Zwinny"],
  "Rak":        ["Empatyczny",    "Intuicyjny",     "Opiekuńczy"],
  "Lew":        ["Kreatywny",     "Charyzmatyczny", "Hojny"],
  "Panna":      ["Analityczny",   "Precyzyjny",     "Praktyczny"],
  "Waga":       ["Harmonijny",    "Dyplomatyczny",  "Sprawiedliwy"],
  "Skorpion":   ["Intensywny",    "Przenikliwy",    "Transformacyjny"],
  "Strzelec":   ["Filozoficzny",  "Optymistyczny",  "Wolny"],
  "Koziorożec": ["Ambitny",       "Zdyscyplinowany","Odpowiedzialny"],
  "Wodnik":     ["Nowatorski",    "Niezależny",     "Humanitarny"],
  "Ryby":       ["Wrażliwy",      "Duchowy",        "Empatyczny"],
};

const ELEMENT_TRAIT: Record<string, string> = {
  "Ogień":     "Energiczny",
  "Ziemia":    "Pragmatyczny",
  "Powietrze": "Intelektualny",
  "Woda":      "Głęboko czujący",
};

const MODALITY_TRAIT: Record<string, string> = {
  "Baran": "Inicjatywny", "Rak": "Inicjatywny", "Waga": "Inicjatywny", "Koziorożec": "Inicjatywny",
  "Byk": "Zdeterminowany", "Lew": "Zdeterminowany", "Skorpion": "Zdeterminowany", "Wodnik": "Zdeterminowany",
  "Bliźnięta": "Elastyczny", "Panna": "Elastyczny", "Strzelec": "Elastyczny", "Ryby": "Elastyczny",
};

const ELEMENTS: Record<string, string> = {
  "Baran": "Ogień", "Lew": "Ogień", "Strzelec": "Ogień",
  "Byk": "Ziemia", "Panna": "Ziemia", "Koziorożec": "Ziemia",
  "Bliźnięta": "Powietrze", "Waga": "Powietrze", "Wodnik": "Powietrze",
  "Rak": "Woda", "Skorpion": "Woda", "Ryby": "Woda",
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
  const tags: string[] = [];
  const used = new Set<string>();

  const add = (tag: string) => {
    if (!used.has(tag)) { used.add(tag); tags.push(tag); }
  };

  const sun  = chart.planets.find(p => p.name === "Słońce");
  const moon = chart.planets.find(p => p.name === "Księżyc");

  // 2 traits from Sun sign
  if (sun) {
    const traits = SIGN_TRAITS[sun.sign];
    if (traits) { add(traits[0]); add(traits[1]); }
  }

  // 1 trait from Moon sign (3rd trait to avoid Sun duplicate)
  if (moon) {
    const traits = SIGN_TRAITS[moon.sign];
    if (traits) {
      const pick = traits.find(t => !used.has(t));
      if (pick) add(pick);
    }
  }

  // 1 trait from Ascendant sign if available
  if (chart.ascendant != null) {
    const ascSign = signFromDegree(chart.ascendant);
    const traits = SIGN_TRAITS[ascSign];
    if (traits) {
      const pick = traits.find(t => !used.has(t));
      if (pick) add(pick);
    }
  }

  // Modality from Sun sign
  if (sun) {
    const mod = MODALITY_TRAIT[sun.sign];
    if (mod) add(mod);
  }

  // Dominant element trait
  const domEl = getDominantElement(chart);
  const elTrait = ELEMENT_TRAIT[domEl];
  if (elTrait) add(elTrait);

  return tags.slice(0, 6);
}
