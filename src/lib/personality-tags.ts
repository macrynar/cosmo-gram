import type { NatalChart } from "@/lib/astro-types";
import type { NatalData } from "@/lib/moduleSpecs";
import type { ModuleId } from "@/lib/schemas/astroModule";

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

// ─── Module-specific tags ──────────────────────────────────────────────────────
// Each module has 4 layers; each layer maps a sign to a lowercase 1-word tag.
// We pick 1 tag per layer (based on the primary planet's sign), deduplicating.

// prettier-ignore
const MOD_LAYERS: Record<ModuleId, [Record<string,string>, Record<string,string>, Record<string,string>, Record<string,string>]> = {
  core: [
    { Baran:"pionier", Byk:"konserwator", "Bliźnięta":"mediator", Rak:"opiekun", Lew:"lider", Panna:"analityk", Waga:"dyplomata", Skorpion:"strateg", Strzelec:"odkrywca", Koziorożec:"budowniczy", Wodnik:"wizjoner", Ryby:"empath" },
    { Baran:"spontaniczny", Byk:"stabilny", "Bliźnięta":"ciekawski", Rak:"intuicyjny", Lew:"ekspresywny", Panna:"refleksyjny", Waga:"harmonijny", Skorpion:"przenikliwy", Strzelec:"radosny", Koziorożec:"wytrwały", Wodnik:"niezależny", Ryby:"wrażliwy" },
    { Baran:"bezpośredni", Byk:"gruntowny", "Bliźnięta":"wielowątkowy", Rak:"imaginatywny", Lew:"twórczy", Panna:"metodyczny", Waga:"wyważony", Skorpion:"penetrujący", Strzelec:"dalekowzroczny", Koziorożec:"pragmatyczny", Wodnik:"innowacyjny", Ryby:"poetycki" },
    { Baran:"energiczny", Byk:"zmysłowy", "Bliźnięta":"towarzyski", Rak:"ciepły", Lew:"charyzmatyczny", Panna:"precyzyjny", Waga:"estetyczny", Skorpion:"intensywny", Strzelec:"optymistyczny", Koziorożec:"ambitny", Wodnik:"ekscentryczny", Ryby:"subtelny" },
  ],
  superpowers: [
    { Baran:"pionier", Byk:"budowniczy", "Bliźnięta":"komunikator", Rak:"opiekun", Lew:"lider", Panna:"analityk", Waga:"mediator", Skorpion:"detektyw", Strzelec:"mentor", Koziorożec:"strateg", Wodnik:"innowator", Ryby:"uzdrowiciel" },
    { Baran:"wojowniczy", Byk:"wytrwały", "Bliźnięta":"adaptacyjny", Rak:"ochronny", Lew:"honorowy", Panna:"perfekcjonista", Waga:"taktyczny", Skorpion:"intensywny", Strzelec:"entuzjastyczny", Koziorożec:"systematyczny", Wodnik:"rewolucyjny", Ryby:"empatyczny" },
    { Baran:"odważny", Byk:"konsekwentny", "Bliźnięta":"elokwentny", Rak:"oddany", Lew:"magnetyczny", Panna:"dokładny", Waga:"harmonijny", Skorpion:"transformacyjny", Strzelec:"wizjonerski", Koziorożec:"zdeterminowany", Wodnik:"oryginalny", Ryby:"duchowy" },
    { Baran:"dynamiczny", Byk:"cierpliwy", "Bliźnięta":"błyskotliwy", Rak:"intuicyjny", Lew:"kreatywny", Panna:"skrupulatny", Waga:"dyplomatyczny", Skorpion:"przenikliwy", Strzelec:"swobodny", Koziorożec:"ambitny", Wodnik:"futurystyczny", Ryby:"marzycielski" },
  ],
  childhood: [
    { Baran:"spontaniczny", Byk:"stabilny", "Bliźnięta":"ciekawski", Rak:"wrażliwy", Lew:"ekspresywny", Panna:"troskliwy", Waga:"pokojowy", Skorpion:"głęboki", Strzelec:"beztroski", Koziorożec:"odpowiedzialny", Wodnik:"niekonwencjonalny", Ryby:"empatyczny" },
    { Baran:"niezależny", Byk:"cierpliwy", "Bliźnięta":"elastyczny", Rak:"przywiązany", Lew:"lojalny", Panna:"zdyscyplinowany", Waga:"sprawiedliwy", Skorpion:"wytrwały", Strzelec:"wolnomyśliciel", Koziorożec:"obowiązkowy", Wodnik:"buntowniczy", Ryby:"subtelny" },
    { Baran:"bezpośredni", Byk:"gruntowny", "Bliźnięta":"komunikatywny", Rak:"imaginatywny", Lew:"teatralny", Panna:"analityczny", Waga:"wyważony", Skorpion:"przenikliwy", Strzelec:"optymistyczny", Koziorożec:"pragmatyczny", Wodnik:"oryginalny", Ryby:"marzycielski" },
    { Baran:"energiczny", Byk:"wytrwały", "Bliźnięta":"towarzyski", Rak:"intuicyjny", Lew:"charyzmatyczny", Panna:"skrupulatny", Waga:"dyplomatyczny", Skorpion:"magnetyczny", Strzelec:"przygodowy", Koziorożec:"systematyczny", Wodnik:"innowacyjny", Ryby:"mistyczny" },
  ],
  love: [
    { Baran:"żarliwy", Byk:"zmysłowy", "Bliźnięta":"uroczy", Rak:"oddany", Lew:"romantyczny", Panna:"dyskretny", Waga:"czarujący", Skorpion:"namiętny", Strzelec:"swobodny", Koziorożec:"wierny", Wodnik:"przyjacielski", Ryby:"bezwarunkowy" },
    { Baran:"spontaniczny", Byk:"czuły", "Bliźnięta":"kapryśny", Rak:"przywiązany", Lew:"lojalny", Panna:"troskliwy", Waga:"harmonijny", Skorpion:"intensywny", Strzelec:"radosny", Koziorożec:"powściągliwy", Wodnik:"niezależny", Ryby:"wrażliwy" },
    { Baran:"namiętny", Byk:"wytrwały", "Bliźnięta":"zwinny", Rak:"ochronny", Lew:"honorowy", Panna:"metodyczny", Waga:"taktyczny", Skorpion:"nieugięty", Strzelec:"entuzjastyczny", Koziorożec:"cierpliwy", Wodnik:"ekscentryczny", Ryby:"empatyczny" },
    { Baran:"inicjatywny", Byk:"stabilizujący", "Bliźnięta":"komunikatywny", Rak:"opiekuńczy", Lew:"inspirujący", Panna:"wspierający", Waga:"równoważący", Skorpion:"transformujący", Strzelec:"przygodowy", Koziorożec:"budujący", Wodnik:"wolnomyśliciel", Ryby:"uzdrowiciel" },
  ],
  career: [
    { Baran:"przedsiębiorca", Byk:"rzemieślnik", "Bliźnięta":"komunikator", Rak:"budowniczy", Lew:"lider", Panna:"specjalista", Waga:"mediator", Skorpion:"badacz", Strzelec:"mentor", Koziorożec:"strateg", Wodnik:"innowator", Ryby:"wizjoner" },
    { Baran:"dynamiczny", Byk:"systematyczny", "Bliźnięta":"elastyczny", Rak:"opiekuńczy", Lew:"ambitny", Panna:"perfekcjonista", Waga:"dyplomatyczny", Skorpion:"wytrwały", Strzelec:"ekspansywny", Koziorożec:"zdeterminowany", Wodnik:"oryginalny", Ryby:"adaptacyjny" },
    { Baran:"pionier", Byk:"konsekwentny", "Bliźnięta":"błyskotliwy", Rak:"empatyczny", Lew:"inspirujący", Panna:"analityczny", Waga:"harmonijny", Skorpion:"transformacyjny", Strzelec:"optymistyczny", Koziorożec:"pragmatyczny", Wodnik:"futurystyczny", Ryby:"intuicyjny" },
    { Baran:"odważny", Byk:"cierpliwy", "Bliźnięta":"wielozadaniowy", Rak:"troskliwy", Lew:"charyzmatyczny", Panna:"metodyczny", Waga:"taktyczny", Skorpion:"intensywny", Strzelec:"entuzjastyczny", Koziorożec:"nieustraszony", Wodnik:"rewolucyjny", Ryby:"duchowy" },
  ],
  shadows: [
    { Baran:"odważny", Byk:"transformujący", "Bliźnięta":"adaptacyjny", Rak:"głęboki", Lew:"samoświadomy", Panna:"analityczny", Waga:"integracyjny", Skorpion:"przenikliwy", Strzelec:"poszukujący", Koziorożec:"systematyczny", Wodnik:"reformacyjny", Ryby:"wrażliwy" },
    { Baran:"uczący", Byk:"wytrwały", "Bliźnięta":"elastyczny", Rak:"wzrastający", Lew:"dojrzewający", Panna:"refleksyjny", Waga:"równoważący", Skorpion:"transformujący", Strzelec:"eksplorujący", Koziorożec:"integrujący", Wodnik:"ewoluujący", Ryby:"uzdrawiający" },
    { Baran:"świadomy", Byk:"gruntowny", "Bliźnięta":"ekspresywny", Rak:"intuicyjny", Lew:"twórczy", Panna:"skrupulatny", Waga:"wyważony", Skorpion:"odważny", Strzelec:"optymistyczny", Koziorożec:"pragmatyczny", Wodnik:"innowacyjny", Ryby:"empatyczny" },
    { Baran:"spontaniczny", Byk:"stabilny", "Bliźnięta":"ciekawski", Rak:"empatyczny", Lew:"ekspresywny", Panna:"metodyczny", Waga:"harmonijny", Skorpion:"intensywny", Strzelec:"wolnomyśliciel", Koziorożec:"wytrwały", Wodnik:"niezależny", Ryby:"duchowy" },
  ],
  roots: [
    { Baran:"odważny", Byk:"zakorzeniony", "Bliźnięta":"otwarty", Rak:"tradycyjny", Lew:"dumny", Panna:"analityczny", Waga:"harmonijny", Skorpion:"głęboki", Strzelec:"poszukujący", Koziorożec:"strażnik", Wodnik:"niezależny", Ryby:"wrażliwy" },
    { Baran:"wojowniczy", Byk:"trwały", "Bliźnięta":"wielowątkowy", Rak:"opiekuńczy", Lew:"twórczy", Panna:"precyzyjny", Waga:"dyplomatyczny", Skorpion:"transformacyjny", Strzelec:"ekspansywny", Koziorożec:"systematyczny", Wodnik:"reformacyjny", Ryby:"duchowy" },
    { Baran:"niezależny", Byk:"cierpliwy", "Bliźnięta":"komunikatywny", Rak:"empatyczny", Lew:"lojalny", Panna:"skrupulatny", Waga:"sprawiedliwy", Skorpion:"wytrwały", Strzelec:"wizjonerski", Koziorożec:"zdeterminowany", Wodnik:"oryginalny", Ryby:"intuicyjny" },
    { Baran:"aktywny", Byk:"zmysłowy", "Bliźnięta":"ciekawski", Rak:"intuicyjny", Lew:"inspirujący", Panna:"refleksyjny", Waga:"harmonijny", Skorpion:"przenikliwy", Strzelec:"przygodowy", Koziorożec:"pragmatyczny", Wodnik:"wizjonerski", Ryby:"mistyczny" },
  ],
  purpose: [
    { Baran:"pionier", Byk:"budowniczy", "Bliźnięta":"nauczyciel", Rak:"uzdrowiciel", Lew:"twórca", Panna:"służący", Waga:"mediator", Skorpion:"transformator", Strzelec:"mentor", Koziorożec:"architekt", Wodnik:"wizjoner", Ryby:"mistyk" },
    { Baran:"inicjatywny", Byk:"konsekwentny", "Bliźnięta":"ekspresywny", Rak:"empatyczny", Lew:"inspirujący", Panna:"analityczny", Waga:"harmonizujący", Skorpion:"odważny", Strzelec:"optymistyczny", Koziorożec:"ambitny", Wodnik:"futurystyczny", Ryby:"intuicyjny" },
    { Baran:"odważny", Byk:"trwały", "Bliźnięta":"błyskotliwy", Rak:"opiekuńczy", Lew:"charyzmatyczny", Panna:"dokładny", Waga:"sprawiedliwy", Skorpion:"transformacyjny", Strzelec:"wizjonerski", Koziorożec:"pragmatyczny", Wodnik:"innowacyjny", Ryby:"duchowy" },
    { Baran:"dynamiczny", Byk:"systematyczny", "Bliźnięta":"wielowątkowy", Rak:"opiekuńczy", Lew:"magnetyczny", Panna:"metodyczny", Waga:"dyplomatyczny", Skorpion:"intensywny", Strzelec:"ekspansywny", Koziorożec:"strategiczny", Wodnik:"oryginalny", Ryby:"subtelny" },
  ],
};

// Primary planets driving each layer's sign lookup (4 per module)
const MOD_PLANETS: Record<ModuleId, [string, string, string, string]> = {
  core:        ["Słońce", "Księżyc", "Merkury", "Ascendent"],
  superpowers: ["Słońce", "Mars", "Jowisz", "Merkury"],
  childhood:   ["Księżyc", "Saturn", "Merkury", "Słońce"],
  love:        ["Wenus", "Księżyc", "Mars", "Słońce"],
  career:      ["Słońce", "Saturn", "Jowisz", "Mars"],
  shadows:     ["Pluton", "Saturn", "Mars", "Księżyc"],
  roots:       ["Księżyc", "Węzeł Południowy", "Saturn", "Neptun"],
  purpose:     ["Węzeł Północny", "Słońce", "Jowisz", "Saturn"],
};

export function getModuleTags(data: NatalData, moduleId: ModuleId): string[] {
  const layers  = MOD_LAYERS[moduleId];
  const planets = MOD_PLANETS[moduleId];
  const used    = new Set<string>();
  const tags: string[] = [];

  for (let i = 0; i < 4; i++) {
    let sign: string | null = null;
    const planet = planets[i];
    if (planet === "Węzeł Północny")  sign = data.nodes.north_node_sign;
    else if (planet === "Węzeł Południowy") sign = data.nodes.south_node_sign;
    else sign = data.placements.find(p => p.planet === planet)?.sign ?? null;

    const tag = sign ? (layers[i][sign] ?? null) : null;
    if (tag && !used.has(tag)) { used.add(tag); tags.push(tag); }
  }

  // Fallback: fill to 4 from core personality tags if needed
  if (tags.length < 4) {
    const sun = data.placements.find(p => p.planet === "Słońce");
    if (sun) {
      for (const t of SUN_TRAITS[sun.sign] ?? []) {
        if (!used.has(t) && tags.length < 4) { used.add(t); tags.push(t.toLowerCase()); }
      }
    }
  }

  return tags.slice(0, 4);
}
