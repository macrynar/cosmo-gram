import type { ChartPlacement, NatalAspect, ChartNodes } from "@/lib/chart-engine";
import { calcAgeYears, getAgeGroup } from "./child-v1";

export { calcAgeYears, getAgeGroup };

// ─────────────────────────────────────────────────────────────────────────────
// child-v2: structured JSON — 6 modules
// ─────────────────────────────────────────────────────────────────────────────

export const CHILD_V2_SYSTEM = `Jesteś ciepłym, uważnym astrologiem dziecięcym, piszącym dla rodziców (28-45 lat).

PERSPEKTYWA:
• Dziecko opisujesz w 3. osobie: "[Imię] łączy…", "[Imię] ma tendencję do…"
• Taktyki dla rodzica w 2. osobie: "Dawaj mu przestrzeń…", "Kiedy X — spróbuj Y…"
• Język ciepły, wspierający — NIGDY oceniający, NIGDY diagnoza medyczna
• ZAKAZ: "ADHD", "autyzm", "zaburzenia" — opisuj wzorzec zachowania, nie etykietuj

ZAKAZ ŻARGONU w polach content/quote:
Nie używaj: Ascendent, ASC, MC, IC, orb, retrogradacja, kwadratura, trygon, sekstyl, koniunkcja, opozycja, dom 1-12.
Tłumacz na zachowanie i potrzeby dziecka.

QUOTE: 40-90 znaków, bez kropki na końcu, bez znaku zapytania, konkretna esencja tego dziecka.

UNIKAJ znaków cudzysłowu (") w polach quote/content/tactics. Jeśli chcesz coś zaakcentować, parafrazuj bez cytowania.

TACTICS: dokładnie 3, 20-140 znaków każda, format "Kiedy [sytuacja] — spróbuj [działanie]".

TAGS: dokładnie 4, 1 słowo, PL małe litery z polskimi znakami. Empowering: "wytrwały" nie "uparty".

VISUAL METERS: dokładnie 3, value 0-100, archetype 8-15 słów, category: action|emotion|mind|soul|social.

MARKDOWN w content: **pogrubienie** 2-4x per moduł, krótkie akapity oddzielone pustą linią.`;


// ─── Helpers ─────────────────────────────────────────────────────────────────

const ASPECT_PL: Record<string, string> = {
  conjunction: "koniunkcja (0°)",
  sextile:     "sekstyl (60°)",
  square:      "kwadrat (90°)",
  trine:       "trygon (120°)",
  opposition:  "opozycja (180°)",
};

const PERSONAL_PLANETS = new Set([
  "Słońce", "Księżyc", "Merkury", "Wenus", "Mars", "Ascendent",
]);

const SIGN_ELEMENT: Record<string, string> = {
  "Baran": "Ogień", "Lew": "Ogień",   "Strzelec":  "Ogień",
  "Byk":   "Ziemia", "Panna": "Ziemia", "Koziorożec": "Ziemia",
  "Bliźnięta": "Powietrze", "Waga": "Powietrze", "Wodnik": "Powietrze",
  "Rak":   "Woda",  "Skorpion": "Woda", "Ryby":      "Woda",
};

// Sort aspects: conjunctions/squares between personal planets first
function sortAspects(aspects: NatalAspect[]): NatalAspect[] {
  const TYPE_WEIGHT: Record<string, number> = {
    conjunction: 0,
    opposition:  1,
    square:      2,
    trine:       3,
    sextile:     4,
  };
  return [...aspects].sort((a, b) => {
    const aPersonal = PERSONAL_PLANETS.has(a.planet_a) && PERSONAL_PLANETS.has(a.planet_b) ? 0 : 1;
    const bPersonal = PERSONAL_PLANETS.has(b.planet_a) && PERSONAL_PLANETS.has(b.planet_b) ? 0 : 1;
    if (aPersonal !== bPersonal) return aPersonal - bPersonal;
    return (TYPE_WEIGHT[a.type] ?? 5) - (TYPE_WEIGHT[b.type] ?? 5);
  });
}

function formatPlacements(
  placements: ChartPlacement[],
  aspects: NatalAspect[],
  nodes: ChartNodes,
  hasTime: boolean,
): string {
  const pLines = placements.map(p => {
    const h = hasTime && p.house ? `, Dom ${p.house}` : "";
    const r = p.retrograde ? " [ruch wsteczny]" : "";
    return `- ${p.planet}: ${p.sign}${h}${r}`;
  }).join("\n");

  // Element distribution for personal planets
  const elementCount: Record<string, number> = {};
  for (const p of placements) {
    if (PERSONAL_PLANETS.has(p.planet)) {
      const el = SIGN_ELEMENT[p.sign];
      if (el) elementCount[el] = (elementCount[el] ?? 0) + 1;
    }
  }
  const elementSummary = Object.entries(elementCount)
    .sort((a, b) => b[1] - a[1])
    .map(([el, n]) => `${el}×${n}`)
    .join(", ");

  // Key signatures: conjunctions/squares between personal planets
  const keyAspects = aspects.filter(
    a => PERSONAL_PLANETS.has(a.planet_a) && PERSONAL_PLANETS.has(a.planet_b)
      && (a.type === "conjunction" || a.type === "square" || a.type === "opposition"),
  );

  const keySigLines = keyAspects.length > 0
    ? `\nKLUCZOWE SYGNATURY (planety osobiste — zacznij od nich):\n${keyAspects.map(a => `⚡ ${a.planet_a} — ${a.planet_b}: ${ASPECT_PL[a.type] ?? a.type}`).join("\n")}\n`
    : "";

  const sortedAspects = sortAspects(aspects);
  const aLines = sortedAspects.length > 0
    ? sortedAspects.map(a => `- ${a.planet_a} — ${a.planet_b}: ${ASPECT_PL[a.type] ?? a.type}`).join("\n")
    : "- brak głównych aspektów";

  const nLines = hasTime
    ? `Węzeł Północny: ${nodes.north_node_sign} (Dom ${nodes.north_node_house ?? "?"})\nWęzeł Południowy: ${nodes.south_node_sign} (Dom ${nodes.south_node_house ?? "?"})`
    : `Węzeł Północny: ${nodes.north_node_sign}\nWęzeł Południowy: ${nodes.south_node_sign}`;

  return `POZYCJE PLANET:\n${pLines}\n\nŻYWIOŁY (planety osobiste): ${elementSummary || "brak danych"}
${keySigLines}
WSZYSTKIE ASPEKTY (od najważniejszych):\n${aLines}\n\nWĘZŁY:\n${nLines}`;
}

// ─── Module config ────────────────────────────────────────────────────────────

const MODULE_INSTRUCTIONS: Record<string, string> = {
  temperament: `Zidentyfikuj 2 sygnatury kombinacyjne (pary planet) które razem tworzą UNIKALNY temperament tego dziecka. Zacznij od konkretnej scenki którą rodzic rozpozna ("kiedy wchodzi nowe dziecko do grupy…", "kiedy skończy się zabawa…"). Opisz jak charakter przejawia się w codziennych sytuacjach TEGO wieku. 200-350 słów.`,
  emotions:    `Znajdź kombinację planet która wyjaśnia WZORZEC emocjonalny — nie "jest wrażliwe" ale "kiedy X się dzieje, czuje Y i reaguje Z". Co uruchamia spokój, co rozregulowuje? Konkretne rytuały i sytuacje dla tego wieku. 200-350 słów.`,
  learning:    `Opisz konkretny wzorzec poznawczy z kombinacji planet — co się dzieje kiedy nauka idzie dobrze (konkretna sytuacja), co ją blokuje i DLACZEGO (mechanizm, nie etykieta). Nie "styl uczenia" w teorii, ale co rodzic obserwuje przy odrabianiu zadań lub zabawie. 200-350 słów.`,
  talents:     `Maksymalnie 2-3 talenty, ale każdy opisany z detalem — nie lista słów-kluczy, ale obraz: co rodzic może obserwować JUŻ TERAZ w zachowaniu dziecka, który sugeruje ten talent. Każdy talent wynika z konkretnej kombinacji w wykresie. 200-350 słów.`,
  parenting:   `Wskazówki specyficznie dla TEGO dziecka. Każda zaczyna się od konkretnej sytuacji: "Kiedy [sytuacja typowa dla tej konfiguracji] — zamiast [instynktowna reakcja rodzica] spróbuj [alternatywa]". Wyjaśnij DLACZEGO ta alternatywa działa lepiej dla dziecka z tą konfiguracją. 200-350 słów.`,
  peers:       `Opisz jak konkretna konfiguracja planet wpływa na funkcjonowanie w grupie. Nie ogólniki — konkretny wzorzec: jak dziecko wchodzi w nowe środowisko, co się dzieje przy konflikcie z rówieśnikami, jak wygląda przyjaźń przy tej konfiguracji w tym wieku. 200-350 słów.`,
};

const METERS_BY_MODULE: Record<string, [string, string, string]> = {
  temperament: ["Ciekawość",             "Wrażliwość",           "Niezależność"],
  emotions:    ["Głębia emocji",         "Potrzeba bliskości",   "Regulacja"],
  learning:    ["Skupienie",             "Kreatywność",          "Wytrwałość"],
  talents:     ["Energia twórcza",       "Precyzja",             "Entuzjazm"],
  parenting:   ["Wrażliwość na granice", "Potrzeba struktury",   "Autonomia"],
  peers:       ["Otwartość",             "Lojalność",            "Asertywność"],
};

// ─── User prompt builder ──────────────────────────────────────────────────────

const ALL_MODULE_IDS = ["temperament", "emotions", "learning", "talents", "parenting", "peers"] as const;

export function buildChildV2UserPrompt(params: {
  name: string;
  birthDate: string;
  placements: ChartPlacement[];
  aspects: NatalAspect[];
  nodes: ChartNodes;
  /** Które moduły wygenerować. Domyślnie wszystkie 6 (premium). Free przekazuje 2 (kontrola kosztu). */
  moduleIds?: readonly string[];
}): string {
  const { name, birthDate, placements, aspects, nodes } = params;
  const moduleIds = (params.moduleIds && params.moduleIds.length > 0)
    ? ALL_MODULE_IDS.filter(id => params.moduleIds!.includes(id))
    : ALL_MODULE_IDS;
  const ageYears  = calcAgeYears(birthDate);
  const ageGroup  = getAgeGroup(ageYears);
  const hasTime   = placements.some(p => p.house !== null && p.house !== undefined);
  const childName = name || "Dziecko";

  const timeNote = !hasTime
    ? "\n⚠️ Brak godziny urodzenia — pomiń Ascendent i domy. Opieraj się wyłącznie na pozycjach planet w znakach.\n"
    : "";

  const moduleInstructions = moduleIds.map((id, i) => {
    const meters      = METERS_BY_MODULE[id];
    const instruction = MODULE_INSTRUCTIONS[id];
    return `MODUŁ ${i + 1} — id="${id}"
${instruction}
Mierniki (visualMeters): "${meters[0]}", "${meters[1]}", "${meters[2]}"`;
  }).join("\n\n");

  return `Imię dziecka: ${childName}
Wiek: ${ageYears} lat (${ageGroup})
${timeNote}
${formatPlacements(placements, aspects, nodes, hasTime)}

═══ ZADANIE ═══
Wywołaj narzędzie output_child_modules. Wygeneruj DOKŁADNIE ${moduleIds.length} ${moduleIds.length === 1 ? "moduł" : "moduły/-ów"} (TYLKO o id: ${moduleIds.map(id => `"${id}"`).join(", ")}) dla ${childName} (${ageGroup}). Nie dodawaj innych modułów:

${moduleInstructions}

Zasady dla wszystkich modułów:
• Opieraj się na KOMBINACJACH planet (⚡ kluczowe sygnatury powyżej), nie pojedynczych pozycjach
• Dziecko w 3. osobie ("${childName} jest…"), taktyki do rodzica w 2. osobie ("Dawaj mu…")
• quote: 40-90 znaków, bez kropki na końcu
• tactics: dokładnie 3, format "Kiedy X — spróbuj Y"
• tags: dokładnie 4 słowa, PL małe litery
• visualMeters: dokładnie 3, value 0-100`;
}
