import type { ChartPlacement, NatalAspect, ChartNodes } from "@/lib/chart-engine";
import { calcAgeYears, getAgeGroup } from "./child-v1";

export { calcAgeYears, getAgeGroup };

// ─────────────────────────────────────────────────────────────────────────────
// child-v2: structured JSON — 6 modules
// Source of truth: docs/prompts.md §child-v2
// ─────────────────────────────────────────────────────────────────────────────

export const CHILD_V2_SYSTEM = `Jesteś ciepłym, uważnym astrologiem dziecięcym, piszącym dla rodziców (28-45 lat).

═══ TON I PERSPEKTYWA (BEZWZGLĘDNE) ═══
• Dziecko opisujesz w 3. osobie: "[Imię] łączy…", "[Imię] jest…", "ma tendencję do…"
• Taktyki dla rodzica piszesz w 2. osobie: "Dawaj mu przestrzeń…", "Nazywaj przy nim emocje…"
• Język ciepły, wspierający — NIGDY oceniający, NIGDY diagnoza medyczna/psychiatryczna
• ZAKAZ: "ADHD", "autyzm", "zaburzenia", "terapia" — opisuj wzorzec behawioralny, nie etykietuj

═══ ZAKAZ ŻARGONU W content/quote ═══
ZAKAZANE w treści modułów: Ascendent, ASC, MC, IC, DSC, orb, dyspozytor, retrogradacja,
kwadratura, trygon, sekstyl, koniunkcja, opozycja, dom 1–12 (jako cyfra + "dom").
Żargon astrologiczny może się pojawić TYLKO w chipach "na podstawie" — to backend doda z placements.

═══ QUOTE (hook modułu) ═══
• Dokładnie 40–90 znaków
• Jedno zdanie-esencja dziecka w tym module — konkretne, nie ogólnikowe
• BEZ kropki na końcu, BEZ znaku zapytania
• Przykład: "Mały odkrywca z gorącym sercem — myśli po swojemu, a czuje głębiej niż pokazuje"

═══ TACTICS ═══
• Dokładnie 3 taktyki, każda 20–140 znaków
• Imperatyw lub zdanie do rodzica: "Dawaj…", "Kiedy…", "Nie naciskaj…"
• Konkretne działania — NIE ogólne wglądy

═══ TAGS ═══
• Dokładnie 4 tagi, każdy 1 słowo, PL małe litery, bez polskich liter jeśli to problem (ą→a itd. NIE — używaj polskich liter)
• Wzorzec regex: /^[a-ząćęłńóśźż]+$/
• Empowering: "wytrwały" NIE "uparty"

═══ VISUAL METERS ═══
• Dokładnie 3 mierniki, dobrane tematycznie do modułu
• label: wymiar domeny (np. "Ciekawość", "Wrażliwość", "Energia")
• value: 0–100 (30=poniżej średniej, 50=średnia, 70=powyżej, 85=top 15%)
• archetype: 8-15 słów konkretny anchor (np. "poziom ciekawości małego naukowca w laboratorium")
• category: "action" | "emotion" | "mind" | "soul" | "social"

═══ MARKDOWN w content ═══
• **pogrubienie** kluczowych konceptów (2-4x)
• Krótkie akapity (40-80 słów), bez H1/H2/H3, bez list bullet

═══ FORMAT JSON (KRYTYCZNE) ═══
• W string values JSON NIE wstawiaj dosłownych znaków nowej linii
• Separator akapitów zapisuj jako sekwencję \\n\\n (backslash + n, dwa razy) — NIE enter
• Cały output to jedna linia lub kompaktowy JSON bez surowych enterów wewnątrz stringów`;

const MODULE_INSTRUCTIONS: Record<string, string> = {
  temperament: `Opisz dominującą naturę dziecka jako INTEGRALNY obraz — nie listę cech. Jak przejawia się jego charakter w codziennych sytuacjach tego wieku? Zacznij od scenki którą rodzic zna. 200-350 słów.`,
  emotions:    `Opisz jak dziecko CZUJE i czego potrzebuje emocjonalnie. Co uruchamia spokój, co rozregulowuje? Konkretne rytuały i sytuacje. 200-350 słów.`,
  learning:    `Opisz jak dziecko myśli i poznaje świat — nie "styl uczenia" w teorii, ale konkretny wzorzec: co się dzieje gdy nauka idzie dobrze, co ją blokuje. 200-350 słów.`,
  talents:     `Maksymalnie 2-3 talenty, ale opisane z detalem. Nie lista — pogłębione obrazy. Co rodzic może zaobserwować już teraz. 200-350 słów.`,
  parenting:   `Wskazówki i obserwacje specyficznie dla TEGO dziecka i TEGO rodzica. Każda wskazówka zaczyna się od konkretnej sytuacji. Format "Kiedy [X] — zamiast [Y] spróbuj [Z]". 200-350 słów.`,
  peers:       `Jak dziecko funkcjonuje w grupie rówieśniczej? Co przynosi radość w relacjach, co jest wyzwaniem, jak wygląda przyjaźń w tym wieku przy tej konfiguracji. 200-350 słów.`,
};

const METERS_BY_MODULE: Record<string, [string, string, string]> = {
  temperament: ["Ciekawość",   "Wrażliwość",  "Niezależność"],
  emotions:    ["Głębia emocji", "Potrzeba bliskości", "Regulacja"],
  learning:    ["Skupienie",   "Kreatywność", "Wytrwałość"],
  talents:     ["Energia twórcza", "Precyzja", "Entuzjazm"],
  parenting:   ["Wrażliwość na granice", "Potrzeba struktury", "Autonomia"],
  peers:       ["Otwartość",  "Lojalność",   "Asertywność"],
};

function formatPlacements(
  placements: ChartPlacement[],
  aspects: NatalAspect[],
  nodes: ChartNodes,
  hasTime: boolean,
): string {
  const pLines = placements.map(p => {
    const h = hasTime && p.house ? `, Dom ${p.house}` : "";
    const r = p.retrograde ? " (ruch wsteczny)" : "";
    return `- ${p.planet}: ${p.sign}${h}${r}`;
  }).join("\n");

  const aLines = aspects.length > 0
    ? aspects.map(a => `- ${a.planet_a} — ${a.planet_b}: ${a.type}`).join("\n")
    : "- brak głównych aspektów";

  const nLines = hasTime
    ? `Węzeł Północny: ${nodes.north_node_sign} (Dom ${nodes.north_node_house ?? "?"})\nWęzeł Południowy: ${nodes.south_node_sign} (Dom ${nodes.south_node_house ?? "?"})`
    : `Węzeł Północny: ${nodes.north_node_sign}\nWęzeł Południowy: ${nodes.south_node_sign}`;

  return `POZYCJE PLANET:\n${pLines}\n\nASPEKTY:\n${aLines}\n\nWĘZŁY:\n${nLines}`;
}

export function buildChildV2UserPrompt(params: {
  name: string;
  birthDate: string;
  placements: ChartPlacement[];
  aspects: NatalAspect[];
  nodes: ChartNodes;
}): string {
  const { name, birthDate, placements, aspects, nodes } = params;
  const ageYears = calcAgeYears(birthDate);
  const ageGroup = getAgeGroup(ageYears);
  const hasTime  = placements.some(p => p.house !== null && p.house !== undefined);
  const childName = name || "Dziecko";

  const timeNote = !hasTime
    ? "\n⚠️ Brak godziny urodzenia — pomiń Ascendent i domy. Opieraj się wyłącznie na pozycjach planet w znakach.\n"
    : "";

  const moduleSchemas = [
    "temperament", "emotions", "learning", "talents", "parenting", "peers",
  ].map((id, i) => {
    const meters = METERS_BY_MODULE[id];
    const instruction = MODULE_INSTRUCTIONS[id];
    return `
--- MODUŁ ${i + 1}: ${id} ---
Instrukcja: ${instruction}

Schemat JSON:
{
  "id": "${id}",
  "title": "<tytuł modułu po polsku, 3-60 zn>",
  "quote": "<esencja dziecka w tym module, 40-90 zn, BEZ kropki, BEZ ?>",
  "content": "<${instruction.match(/\d+-\d+/)?.[0] ?? "200-350"} słów, **bold** 2-4x, bez żargonu astro>",
  "tactics": [
    "<taktyka 1 dla rodzica, 20-140 zn, imperatyw>",
    "<taktyka 2>",
    "<taktyka 3>"
  ],
  "tags": ["<pl lowercase>", "<tag2>", "<tag3>", "<tag4>"],
  "visualMeters": [
    {"label": "${meters[0]}", "value": <0-100>, "archetype": "<8-15 słów>", "category": "<action|emotion|mind|soul|social>"},
    {"label": "${meters[1]}", "value": <0-100>, "archetype": "<8-15 słów>", "category": "<action|emotion|mind|soul|social>"},
    {"label": "${meters[2]}", "value": <0-100>, "archetype": "<8-15 słów>", "category": "<action|emotion|mind|soul|social>"}
  ]
}`;
  }).join("\n");

  return `Imię dziecka: ${childName}
Wiek: ${ageYears} lat (${ageGroup})
${timeNote}
${formatPlacements(placements, aspects, nodes, hasTime)}

═══ ZADANIE ═══
Wygeneruj tablicę JSON 6 obiektów modułów (w kolejności: temperament, emotions, learning, talents, parenting, peers).
Każdy obiekt opisuje inne oblicze ${childName}.
Dziecko w 3. os. ("${childName} jest…"), taktyki do rodzica w 2. os. ("Dawaj mu…").
Dopasuj treść i przykłady do wieku ${ageGroup}.

FORMATY MODUŁÓW:
${moduleSchemas}

ZWRÓĆ TYLKO tablicę JSON — zero preambuły, zero \`\`\`json, zero komentarzy.
Format: [ {...}, {...}, {...}, {...}, {...}, {...} ]`;
}
