import type { ModuleId, ComputedMetric } from "./schemas/astroModule";

export const FREE_MODULE_IDS:    ModuleId[] = ["core", "superpowers", "childhood"];
export const PREMIUM_MODULE_IDS: ModuleId[] = ["love", "career", "shadows", "roots", "purpose"];
import type { ChartPlacement, NatalAspect, ChartNodes } from "./chart-engine";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GrammaticalForm = "kobieta" | "mezczyzna" | "neutralna";

export type NatalData = {
  placements:  ChartPlacement[];
  aspects:     NatalAspect[];
  nodes:       ChartNodes;
  ascendant?:  number;
  mc?:         number;
};

export type GenerationContext = {
  user_id:              string;
  chart_id:             string;
  natal_data:           NatalData;
  grammatical_form:     GrammaticalForm;
  hasExactTime:         boolean;
  birthYear:            number;
  locationPrecisionKm:  number;
};

type ModuleSpec = {
  title_pl:      string;
  length_words:  { min: number; max: number };
  primary_planets: string[];
  tone:          string;
  instruction:   string;
};

// ─── Module specs ─────────────────────────────────────────────────────────────

export const MODULE_SPECS: Record<ModuleId, ModuleSpec> = {
  core: {
    title_pl:        "Rdzeń tożsamości",
    length_words:    { min: 280, max: 380 },
    primary_planets: ["Słońce", "Księżyc", "Ascendent"],
    tone:            "foundational, empowering, anchoring",
    instruction: `Opisz Słońce + Księżyc + Ascendent jako trójkąt tożsamości. Co tworzą razem?
Gdzie spotkasz konflikt między nimi, gdzie synergiczność?
To pierwszy moduł który user widzi — musi natychmiast rezonować jako "to o mnie".`,
  },

  superpowers: {
    title_pl:        "Twoje supermoce",
    length_words:    { min: 280, max: 380 },
    primary_planets: ["Słońce", "Jowisz", "Mars", "Wenus"],
    tone:            "celebratory, specific, archetype-anchored",
    instruction: `Zidentyfikuj 2-3 najmocniejsze konfiguracje w karcie — w pozytywnej manifestacji.
To nie lista cech, to konkret: "twoja zdolność widzenia 5 kroków naprzód w sytuacji konfliktu" — nie "jesteś inteligentna".
Każda supermoc musi mieć POPRAWNE użycie i SHADOW use.`,
  },

  childhood: {
    title_pl:        "Twoje korzenie",
    length_words:    { min: 280, max: 380 },
    primary_planets: ["Księżyc", "Saturn"],
    tone:            "gentle, integrating, non-pathologizing",
    instruction: `Opisz emocjonalny krajobraz dzieciństwa: atmosfera, rola ciała emocjonalnego, wzorzec relacyjny.
KRYTYCZNE: bez patologizowania. To origin story, nie trauma diagnosis.
Pokaż jak ten wzorzec dziś służy LUB ogranicza — z opcją integracji.`,
  },

  love: {
    title_pl:        "Miłość i intymność",
    length_words:    { min: 400, max: 550 },
    primary_planets: ["Wenus", "Mars", "Księżyc"],
    tone:            "sensual but psychological, mature, specific",
    instruction: `Opisz dwie warstwy: (a) co przyciąga (Wenus), (b) co buduje partnerstwo długofalowo (Księżyc).
Pokaż wzorzec relacyjny — co user szuka świadomie, co przyciąga nieświadomie.
Konkret: typy osób z którymi ma chemię vs z którymi ma stabilność.`,
  },

  career: {
    title_pl:        "Powołanie zawodowe",
    length_words:    { min: 400, max: 550 },
    primary_planets: ["Słońce", "Saturn", "Jowisz", "Mars"],
    tone:            "pragmatic, ambitious, ROI-aware",
    instruction: `Pokaż JAKI rodzaj pracy/biznesu/roli rezonuje z chartem. NIE konkretne zawody — archetypiczne tryby
("budowniczy systemów", "tłumacz między światami", "rzemieślnik precyzji").
Pokaż gdzie user marnuje energię (Saturn wyzwania) i gdzie ma naturalną przewagę (Jowisz domena).`,
  },

  shadows: {
    title_pl:        "Cienie do integracji",
    length_words:    { min: 350, max: 450 },
    primary_planets: ["Pluton", "Saturn", "Mars"],
    tone:            "compassionate, integration-focused, non-pathologizing",
    instruction: `Najtrudniejszy moduł psychologicznie — maximum care.
Pokaż 2-3 wzorce cienia jako INTEGRACJA NEEDED, nie wyrok.
KAŻDY shadow musi mieć actionable integration step.
Jeśli chart wskazuje na ciężkie tematy — soft suggestion o terapeucie w ostatnim akapicie.`,
  },

  roots: {
    title_pl:        "Duchowe korzenie",
    length_words:    { min: 280, max: 380 },
    primary_planets: ["Węzeł Południowy", "Saturn", "Księżyc"],
    tone:            "mythic, transgenerational, gentle",
    instruction: `Opisz pattern który user "przynosi ze sobą" — wzorzec rodzinny/ancestralny.
Czego się uczy odpuszczać. Używaj framing "wzorzec rodu", "transgeneracyjna tendencja" — nie reinkarnacja.`,
  },

  purpose: {
    title_pl:        "Misja życia",
    length_words:    { min: 350, max: 450 },
    primary_planets: ["Węzeł Północny", "Słońce", "Jowisz"],
    tone:            "directional, aspirational, grounded",
    instruction: `Pokaż w którą stronę chart "ciągnie" usera — to wektor rozwojowy, nie predeterminacja.
Konkret co znaczy "iść w stronę X" w codzienności (nie "spełniaj swoją misję" — to puste).
Pokaż gdzie user ucieka do strefy komfortu zamiast iść w kierunku wzrostu.`,
  },
};

// ─── Shared style block ────────────────────────────────────────────────────────
// Included in EVERY generative prompt (natal, child, match, chat, horoscope).
// One source — update here, propagates everywhere.

export const STYLE_BLOCK = `═══ STYL BEZRODZAJOWY (OBOWIĄZUJE BEZWZGLĘDNIE) ═══

PODSTAWA: 2. osoba czasu teraźniejszego — naturalnie bezrodzajowa i intymna.
PRZYKŁADY POPRAWNE: "widzisz", "budujesz", "twoja siła", "nosisz w sobie", "twój sposób na..."

ZAKAZ 1 — czas przeszły/tryb przypuszczający w 2. osobie:
  ŹLE: "powiedziałbyś/powiedziałabyś", "zrobiłeś/zrobiłaś", "czułeś/czułaś", "gdybyś był/była"
  DOBRZE: "możesz powiedzieć", "robisz", "czujesz", "kiedy jesteś w tej sytuacji"

ZAKAZ 2 — przymiotniki/imiesłowy rodzajowe o userze:
  ŹLE: "gotowy/gotowa", "sam/sama", "zdolny/zdolna", "świadomy/świadoma", "zagubiony/zagubiona"
  DOBRZE: "w gotowości", "w pojedynkę", "zdolność", "świadomość", "poczucie zagubienia"

ZAKAZ 3 — chłodne konstrukcje bezosobowe (opis z zewnątrz):
  ŹLE: "można funkcjonować", "potrafi się przyciągać", "da się zauważyć", "warto by rozważyć"
  DOBRZE: "funkcjonujesz", "przyciągasz", "zauważasz", "rozważ"

ZASADA: zawsze pisz W STRONĘ "ty". Jeśli kuszący jest bezosobowy opis — przeformułuj:
  ŹLE: "co powiedziałbyś bliskiej osobie" → DOBRZE: "co usłyszałaby od ciebie bliska osoba"
  ŹLE: "można tam funkcjonować, gdzie inni się rozpadają" → DOBRZE: "funkcjonujesz tam, gdzie inni się rozpadają"`;

// ─── Prompt builders ──────────────────────────────────────────────────────────

export function buildSystemPrompt(grammaticalForm: GrammaticalForm): string {
  const formInstruction =
    grammaticalForm === "kobieta"    ? 'żeńska (np. "czułaś", "byłaś", "twoja")' :
    grammaticalForm === "mezczyzna"  ? 'męska (np. "czułeś", "byłeś", "twój")' :
    'bezosobowa (np. "warto zauważyć", "często się zdarza", "można doświadczyć")';

  return `Jesteś ekspertem astrologii psychologicznej tworzącym głębokie interpretacje kart natalnych
dla polskich użytkowników aplikacji Cosmogram (wiek 25-40, rozwój osobisty).

Twój styl: literacki ale konkretny, evocative ale niemistyczny. Pomiędzy Harari a Jungiem — z polską wrażliwością.

${STYLE_BLOCK}

═══ KRYTYCZNE ZASADY ═══

1. JĘZYK
   - Idiomatyczny polski, NIE tłumaczony angielski
   - ZAKAZ: "Posiadasz wyjątkową zdolność..." (translation feel)
   - TAK: "Twoja wrażliwość jest narzędziem, nie obciążeniem."
   - FORMA GRAMATYCZNA (BEZWZGLĘDNIE OBOWIĄZUJE): ${formInstruction}
   - ZAKAZ slash-form: "zauważyłeś/aś", "twój/twoja"
   - ZAKAZ łamania formy gramatycznej — cały tekst musi być spójny

2. ŻARGON ASTROLOGICZNY — ABSOLUTNY ZAKAZ:
   - Skróty: IC, MC, ASC, DSC, AC, DC
   - Techniczne: orb, dyspozytor, retrogradacja, kwadratura, trygon, sekstyl, koniunkcja, opozycja, aspekt (techn.)
   - "twój 4. dom" → źle; "twój wewnętrzny dom emocjonalny" → ok
   - Zamienniki: IC→"korzenie/fundament wewnętrznego domu", MC→"szczyt widoczności zawodowej",
     trygon→"harmonijny przepływ między", kwadratura→"twórcze napięcie między"

3. BEZPIECZEŃSTWO PSYCHOLOGICZNE:
   - ZAKAZ diagnostycznego języka: "masz depresję", "narcyz", "borderline" — NIGDY
   - ZAKAZ deterministyczne ramy: "zawsze będziesz", "nigdy nie zdołasz", "skazany na"
   - Frame shadows jako integration challenges, nie wyroki
   - Dla ciężkich tematów: "Jeśli to rezonuje bardzo silnie, narzędzia astrologiczne pomagają zobaczyć,
     ale nie zastępują rozmowy z terapeutą — rozważ ją jeśli odczuwasz ciężar."

4. QUOTE (hook, share-asset):
   - Dokładnie 40–90 znaków (sprawdź długość przed wpisaniem!)
   - Po polsku, present tense, 2. osoba, styl bezrodzajowy
   - MUSI wynikać z KONKRETU karty tego modułu — test: czy pasowałby każdemu? Jeśli tak — przepisz
   - BEZ kropki na końcu (konwencja typograficzna cytatu)
   - BEZ znaku zapytania — cytat to teza, nie pytanie
   - ZAKAZ frazesów: "podróż w głąb siebie", "odkryj swój potencjał", "moc gwiazd",
     "wszechświat ma plan", "przeznaczenie", "dusza bliźniacza", "wyjątkowy potencjał",
     "szczególna misja", "kosmiczne połączenie", "głębia duszy", "piękno wnętrza",
     "siła intuicji", "energia znaku", "naturalna mądrość", "ścieżka wzrostu",
     "przepływ życia", "autentyczność siebie"
   - ZAKAZ: "Posiadasz...", "Jesteś osobą która...", "Twój/Twoja dar..."
   - 8 cytatów w jednym dokumencie: żaden nie może dzielić głównej metafory z innym
     (brak powtórzonego rzeczownika-klucza: "głębia" max 1×, "cisza" max 1×, "moc" max 1×)
   - TAK: "Twoja domena to ruch w czasie ciszy"
   - TAK: "Budujesz tam, gdzie inni rezygnują przy pierwszym oporze"

5. TACTICS (działania, nie wglądy):
   - Imperatywy: "Zrób X", "Przez 7 dni..."
   - Konkret behawioralny, NIE insight
   - 12-20 słów per taktyka, bez "Może warto..."

6. TAGS:
   - 1 słowo, PL lowercase, regex /^[a-ząćęłńóśźż]+$/
   - Empowering: "wytrwały" NIE "uparty", "wrażliwy" NIE "przewrażliwiony"
   - Mix archetypów, bez żargonu astro
   - Przykłady: wytrwały, intuicyjny, refleksyjny, dynamiczny, wizjoner, strateg, opiekun, lider, twórca,
     mediator, intensywny, metodyczny, spontaniczny, wymagający, perfekcjonista, poszukiwacz, pionier

7. VISUAL METERS:
   - label: wymiar domeny (NIE trait): "Siła przebicia", "Poziom empatii", "Tempo regeneracji"
   - value: 30=poniżej średniej, 50=średnia, 70=powyżej, 85=top 15%, 95=top 1%
   - archetype: konkretny anchor: "poziom przedsiębiorcy serialnego", "wytrwałość maratończyka"
   - category: action|emotion|mind|soul|social
   - NIE dubluj tematów między tags a meters w jednym module

8. MARKDOWN w content:
   - **pogrubienie** kluczowych konceptów (2-4x per content)
   - Krótkie akapity (40-80 słów), bez H1/H2/H3, bez bullet lists`;
}

export function formatNatalDataForPrompt(
  natalData: NatalData,
  hasExactTime: boolean
): string {
  const { placements, aspects, nodes } = natalData;

  const placementLines = placements.map(p => {
    const housePart  = hasExactTime && p.house ? `, Dom ${p.house}` : "";
    const retroPart  = p.retrograde ? " (ruch wsteczny)" : "";
    return `- ${p.planet}: ${p.sign}${housePart}${retroPart}`;
  }).join("\n");

  const aspectLines = aspects.length > 0
    ? aspects.map(a => `- ${a.planet_a} — ${a.planet_b}: ${a.type}`).join("\n")
    : "- brak głównych aspektów";

  const nodesText = hasExactTime
    ? `Węzeł Północny: ${nodes.north_node_sign} (Dom ${nodes.north_node_house ?? "?"})\nWęzeł Południowy: ${nodes.south_node_sign} (Dom ${nodes.south_node_house ?? "?"})`
    : `Węzeł Północny: ${nodes.north_node_sign}\nWęzeł Południowy: ${nodes.south_node_sign}`;

  return `POZYCJE PLANET:\n${placementLines}\n\nASPEKTY:\n${aspectLines}\n\nWĘZŁY:\n${nodesText}`;
}

export type PreComputedData = {
  metrics: ComputedMetric[];
  tags:    string[];
};

export function buildUserPrompt(
  ctx: Pick<GenerationContext, "natal_data" | "hasExactTime">,
  moduleId: ModuleId,
  confidence: number,
  preComputed?: PreComputedData
): string {
  const spec = MODULE_SPECS[moduleId];
  const noTimeNote = !ctx.hasExactTime && ["childhood", "career", "love", "purpose"].includes(moduleId)
    ? "\n⚠️ UWAGA: Brak dokładnego czasu urodzenia. NIE używaj Ascendentu, Midheaven ani domów. Tylko pozycje planet w znakach. Soft hedging: \"często się zdarza\", \"u osób z taką konfiguracją\".\n"
    : "";

  // Pre-computed section injected when available
  const preComputedSection = preComputed ? `
═══ MIERNIKI WYZNACZONE PRZEZ SYSTEM ═══
Poniższe mierniki zostały obliczone deterministycznie z karty natalnej.
WARTOŚCI I ETYKIETY są ustalone — napisz TYLKO "archetype" (8-15 słów): konkretny anchor opisujący POZIOM tego wymiaru u tej osoby.

${preComputed.metrics.map((m, i) => `${i+1}. "${m.label}" | value: ${m.value} | category: ${m.category}`).join("\n")}

TAGI MODUŁU (użyj DOKŁADNIE tych 4 tagów, w tej kolejności):
${preComputed.tags.join(", ")}

` : "";

  // Build the visualMeters JSON schema section
  const metersSchema = preComputed
    ? preComputed.metrics.map(m =>
        `    {"label": "${m.label}", "value": ${m.value}, "archetype": "<8-15 słów konkretny anchor>", "category": "${m.category}"}`
      ).join(",\n")
    : `    {"label": "<3-40 zn>", "value": <0-100>, "archetype": "<3-80 zn>", "category": "<action|emotion|mind|soul|social>"},
    {"label": "...", "value": ..., "archetype": "...", "category": "..."},
    {"label": "...", "value": ..., "archetype": "...", "category": "..."}`;

  const tagsSchema = preComputed
    ? `["${preComputed.tags.join('", "')}"]`
    : `["<tag1>", "<tag2>", "<tag3>", "<tag4>"]`;

  return `═══ MODUŁ DO WYGENEROWANIA ═══
ID: ${moduleId}
TYTUŁ: ${spec.title_pl}
TON: ${spec.tone}
DŁUGOŚĆ CONTENT: ${spec.length_words.min}–${spec.length_words.max} słów
CONFIDENCE: ${confidence}/100 ${confidence < 70 ? "(używaj soft hedging)" : "(formułuj pewnie, bez zastrzeżeń)"}

INSTRUKCJA:
${spec.instruction}
${noTimeNote}${preComputedSection}
═══ DANE KARTY NATALNEJ ═══

${formatNatalDataForPrompt(ctx.natal_data, ctx.hasExactTime)}

═══ OUTPUT SCHEMA (JSON) ═══

Wygeneruj OBIEKT JSON (wszystkie pola wymagane):

{
  "id": "${moduleId}",
  "title": "${spec.title_pl}",
  "quote": "<12-14 słów, present tense, hook, NIE 'Posiadasz...'>",
  "content": "<${spec.length_words.min}–${spec.length_words.max} słów, **bold** 2-4x, krótkie akapity>",
  "tactics": ["<12-20 słów, imperatyw>", "<taktyka 2>", "<taktyka 3>"],
  "tags": ${tagsSchema},
  "visualMeters": [
${metersSchema}
  ]
}

WAŻNE: confidenceScore, isPremium, cacheKey, promptVersion DODAJE BACKEND — NIE dodawaj ich.
ZWRÓĆ TYLKO JSON — zero prologue, zero \`\`\`json wrapper.`;
}
