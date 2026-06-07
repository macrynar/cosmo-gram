---
title: Karta Zawodnika — gamified natal interpretation (DeepSeek refactor)
created: 2026-05-26
project: cosmogram
type: claude-code-prompt
status: ready-to-paste
design_system: Mystic Crystal
ai_provider: DeepSeek
---

# Karta Zawodnika — refactor natal generation flow

> Wklej do Claude Code. Refactor `src/lib/deepseek.ts` + nowy service warstwa generowania modułów. Cel: zamiana monolitycznej generacji w strukturalny prompt-chaining z Zod schema, gamifikacją (tagi, visualMeters), premium gating, i ścisłą jakością PL.

---

Act as a Senior TypeScript/Next.js Developer and AI Architect for Cosmogram — Polish astrology app for women 25-40 spiritual-curious segment. We're refactoring our monolithic DeepSeek calls into structured prompt-chaining architecture that powers our new "Karta Astrologiczna" UI — player-card style natal interpretation inspired by FC26 / Pokemon stats aesthetic, executed elegantly in our **Mystic Crystal** design system (deep navy bg #0a0a1f, gold accents #D4AF37, purple gradients dla glyfów, serif headlines, crystal-clear typography).

The visualization layer will render: progress bars with gradient fills + animated roll-up on load, floating tag chips, archetypal anchor labels, premium-locked modules with paywall blur. Backend musi dostarczyć structured data dla tego UI.

## Task Objective

Refactor `src/lib/deepseek.ts` into prompt-chaining service that generates 8 modules of natal interpretation in 3 parallel batches, validated against strict Zod schema, with Polish quality guardrails, safety constraints, and confidence scoring.

## Architecture decisions (lock these)

1. **3 batched parallel calls** via `Promise.all` per batch — minimizes latency vs single monolithic call AND vs sequential 8 calls. Batches:
   - **Batch 1 (Hook — free)**: Core, Superpowers, Childhood (in this order — empowerment before vulnerability)
   - **Batch 2 (Premium pull)**: Love, Career
   - **Batch 3 (Premium deep)**: Shadows, Roots, Purpose
   
2. **Strict Zod schema validation** on every module response. Malformed → retry with feedback.

3. **Anti-hallucination guardrails**: explicit ban list for astro jargon + slash-form + diagnostic language + length constraints + idiomatic PL.

4. **Cache by hash**: `cache_key = sha256(user_chart_id + module_id + prompt_version + grammatical_form)`. Re-generation cheap (DeepSeek tani) ale konsystencja per user.

## Zod Schema (single source of truth)

```typescript
// src/lib/schemas/astroModule.ts

import { z } from 'zod';

export const TAG_REGEX = /^[a-ząćęłńóśźż]+$/;  // PL lowercase, single word

export const VisualMeterSchema = z.object({
  label: z.string().min(3).max(40),
  value: z.number().int().min(0).max(100),
  archetype: z.string().min(3).max(80),  // "poziom przedsiębiorcy", "twórca rzemieślniczy"
  category: z.enum(['action', 'emotion', 'mind', 'soul', 'social']),
});

export const AstroModuleSchema = z.object({
  id: z.enum(['core', 'superpowers', 'childhood', 'love', 'career', 'shadows', 'roots', 'purpose']),
  title: z.string().min(3).max(60),
  
  quote: z.string()
    .min(20).max(120)
    .refine(s => s.split(/\s+/).length <= 14, 'Max 14 słów')
    .refine(s => !/twój\/twoja|swój\/swoja|ąłeś\/ąłaś|łeś\/łaś/i.test(s), 'No slash-form'),
  
  content: z.string()
    .refine(s => s.split(/\s+/).length >= 200, 'Too short, min 200 words')
    .refine(s => s.split(/\s+/).length <= 550, 'Too long, max 550 words')
    .refine(s => !/\b(IC|MC|ASC|DSC|orb|dyspozytor|retrogradacj|kwadratura|trygon|sekstyl|koniunkcja|opozycja)\b/i.test(s), 'No astro jargon'),
  
  tactics: z.array(z.string().min(20).max(140)).length(3),
  
  tags: z.array(z.string()
    .regex(TAG_REGEX, 'PL lowercase letters only')
    .min(3).max(20)
  ).length(4),
  
  visualMeters: z.array(VisualMeterSchema).length(3),
  
  confidenceScore: z.number().int().min(40).max(100),
  isPremium: z.boolean(),
  cacheKey: z.string(),
  promptVersion: z.string(),
});

export type AstroModule = z.infer<typeof AstroModuleSchema>;

export const BatchResponseSchema = z.array(AstroModuleSchema);
```

## Tag taxonomy guidance

Schemat nie hardkoduje listy tagów (bo to ograniczałoby AI), ale **system prompt zawiera explicit guidance + examples** plus post-validation regex.

Kategorie z przykładami (DAJ w prompcie jako anchors):

```
TOŻSAMOŚĆ (kim jesteś): wytrwały, intuicyjny, refleksyjny, dynamiczny, kontemplacyjny, 
zdecydowany, wrażliwy, magnetyczny, niezależny, lojalny, opiekuńczy, ambitny, dociekliwy

DOMENY SIŁY (w czym jesteś silny): wizjoner, strateg, opiekun, lider, twórca, mediator, 
nauczyciel, analityk, uzdrowiciel, mistrz, budowniczy, eksplorator

TRYBY DZIAŁANIA (jak działasz): intensywny, metodyczny, spontaniczny, cierpliwy, 
eksperymentalny, dyplomatyczny, bezpośredni, subtelny, systematyczny, intuicyjny

CIENIE (empowering framing): wymagający, perfekcjonista, samotnik, idealistyczny, 
krytyczny, niespokojny, ostrożny — NIE: uparty, narcystyczny, leniwy, słaby

DĄŻENIA: poszukiwacz, budowniczy, marzyciel, realizator, ambasador, pionier
```

Tagi **invented przez AI** w obrębie tych ram, post-validated regex'em + length check'em + slash-form check'em.

## Module generation rules (system prompt fragment)

```typescript
const SYSTEM_PROMPT_BASE = `Jesteś ekspertem astrologii psychologicznej tworzącym głębokie 
interpretacje kart natalnych dla polskich użytkowniczek aplikacji Cosmogram (segment kobiet 
25-40, zainteresowanych rozwojem osobistym).

Twój styl: literacki ale konkretny, evocative ale niemistyczny, głęboki ale czytelny. 
Pomiędzy Yuval Noah Harari a Carl Jung — z polską wrażliwością.

═══ KRYTYCZNE ZASADY ═══

1. JĘZYK
   - Idiomatyczny polski, NIE tłumaczony angielski
   - ZAKAZ: "Posiadasz wyjątkową zdolność..." (translation feel)
   - TAK: "Twoja wrażliwość jest narzędziem, nie obciążeniem."
   - Forma gramatyczna: ${grammatical_form}
   - ZAKAZ slash-form: "zauważyłeś/aś", "twój/twoja"
   - Dla 'neutralna' — bezosobowe konstrukcje ("warto zauważyć", "często się zdarza")

2. ŻARGON ASTROLOGICZNY — ABSOLUTNY ZAKAZ:
   - Skróty: IC, MC, ASC, DSC, AC, DC
   - Łacina: Imum Coeli, Medium Coeli, Ascendens, Descendens
   - Techniczne: orb, dyspozytor, retrogradacja, retrograde, kwadratura, trygon, sekstyl, koniunkcja, opozycja, aspekt (w sensie technicznym)
   - Numery domów technicznie: "twój 4. dom" → źle. "twój wewnętrzny dom emocjonalny" → ok.
   - Zamiast skrótów używaj opisowych konstrukcji:
     * IC → "korzenie, fundament wewnętrznego domu"
     * MC → "szczyt widoczności zawodowej"
     * trygon → "harmonijny przepływ między"
     * kwadratura → "twórcze napięcie między"

3. BEZPIECZEŃSTWO PSYCHOLOGICZNE (szczególnie dla shadows, roots):
   - ZAKAZ diagnostycznego języka: "masz depresję", "narcyz", "borderline" — NIGDY
   - ZAKAZ deterministyczne ramy: "zawsze będziesz", "nigdy nie zdołasz", "skazany na"
   - Frame shadows jako integration challenges, nie wyroki
   - Frame childhood patterns jako origin, nie trauma
   - Jeśli pattern wskazuje na ciężki temat (porzucenie, przemoc), dorzuć soft suggestion: 
     "Jeśli to rezonuje bardzo silnie, narzędzia astrologiczne pomagają zobaczyć, 
      ale nie zastępują rozmowy z terapeutą — rozważ ją jeśli odczuwasz ciężar."

4. QUOTE FIELD (the hook):
   - Max 12-14 słów po polsku
   - Drugi osobie present tense
   - ZAKAZ: "Posiadasz...", "Jesteś osobą która..."
   - TAK: "Twoja domena to ruch w czasie ciszy."
   - 1 metafora dozwolona, nie 3
   - Bez żargonu
   - To jest share-asset — musi być chwytliwe i emocjonalne

5. TACTICS (3 sztuki, działania nie wglądy):
   - Imperatywy: "Zrób X", "Zadzwoń do Y", "Przez 7 dni..."
   - Konkret behawioralny, NIE insight
     * ŹLE: "Otwórz się na nowe doświadczenia"
     * DOBRZE: "Zacznij każdy poranek 10 minutami pisania bez celu — co przychodzi"
   - 12-20 słów per taktyka
   - Bez "Może warto..." (passive-recommendational)
   - Każda taktyka odpowiada na "co dziś, jutro, w tym tygodniu mogę zrobić"

6. TAGS (4 sztuki):
   - Po polsku, jedno słowo, lowercase (regex: /^[a-ząćęłńóśźż]+$/)
   - Empowering framing: "wytrwały" NIE "uparty", "wrażliwy" NIE "przewrażliwiony"
   - Mix archetypów (nie 4 podobne synonimy w jednym module)
   - Bez wieku, płci, wyglądu, etyki religijnej
   - Bez żargonu astro ("marsowy", "słoneczny" → ZAKAZ)
   - Anchors do kategorii: tożsamość, domeny siły, tryby działania, cienie (positive), dążenia

7. VISUAL METERS (3 sztuki):
   - label: po polsku, 3-40 znaków, opisuje wymiar (NIE trait — to robią tagi)
     * DOBRZE: "Siła przebicia", "Poziom empatii", "Tempo regeneracji"
     * ŹLE: "Lojalność" (to tag), "Mars" (to żargon)
   - value: integer 0-100, kalibrowany jako:
     * 30 = poniżej średniej populacji
     * 50 = średnia populacja
     * 70 = wyraźnie powyżej średniej
     * 85 = top 15% populacji
     * 95 = ekstremalny, top 1%
   - archetype: 3-80 znaków, anchor który konkretyzuje liczbę
     * "poziom przedsiębiorcy serialnego" (dla wysokiego Marsa)
     * "wrażliwość terapeuty" (dla wysokiego Neptuna)
     * "wytrwałość maratończyka" (dla wysokiego Saturna)
   - category: jeden z [action, emotion, mind, soul, social]
   - Visual meters opisują DOMENY, tags opisują TRAITS — NIE DUBLUJ tematu między tag a meter w jednym module
   - Każdy moduł ma 3 metry pasujące do natywnej karty usera + tonalności modułu

8. LENGTH:
   - quote: 12-14 słów
   - content: zależy od modułu (patrz niżej per moduł)
   - tactics: 12-20 słów per szt, 3 sztuki
   - tags: 1 słowo, 4 sztuki
   - visualMeters: label 3-40 zn, archetype 3-80 zn, 3 sztuki

9. MARKDOWN w content:
   - Użyj **pogrubienia** na kluczowych konceptach (2-4 razy per content)
   - Krótkie akapity (40-80 słów)
   - Bez nagłówków H1/H2/H3 (UI doda)
   - Bez list bullet (jedynie w tactics array)
`;
```

## Per-module rules (mergeable per batch)

```typescript
const MODULE_SPECS = {
  core: {
    title_pl: 'Rdzeń tożsamości',
    length_words: { min: 280, max: 380 },
    primary_planets: ['Sun', 'Moon', 'Ascendant'],
    tone: 'foundational, empowering, anchoring',
    instruction: `Opisz Słońce + Księżyc + Ascendent jako trójkąt tożsamości. 
                  Co tworzą razem? Gdzie spotkasz konflikt między nimi, gdzie synergiczność?
                  To pierwszy moduł który user widzi — musi natychmiast rezonować jako "to o mnie".`,
  },
  
  superpowers: {
    title_pl: 'Twoje supermoce',
    length_words: { min: 280, max: 380 },
    primary_planets: 'strongest planets in chart (by dignity + aspects)',
    tone: 'celebratory, specific, archetype-anchored',
    instruction: `Zidentyfikuj 2-3 najmocniejsze konfiguracje w karcie — najlepiej w 
                  pozytywnej manifestacji. To nie lista cech, to konkret z odniesieniem 
                  ("twoja zdolność widzenia 5 kroków naprzód w sytuacji konfliktu" — 
                  nie "jesteś inteligentna").
                  Każda supermoc musi mieć POPRAWNE użycie ("to robi") i SHADOW use 
                  ("to też potrafi się stać").`,
  },
  
  childhood: {
    title_pl: 'Twoje korzenie',
    length_words: { min: 280, max: 380 },
    primary_planets: ['Moon', '4th house', 'IC'],
    tone: 'gentle, integrating, non-pathologizing',
    instruction: `Opisz emocjonalny krajobraz dzieciństwa: jaka była atmosfera, jaką 
                  rolę grało ciało emocjonalne, jaki wzorzec relacyjny się formował.
                  KRYTYCZNE: bez patologizowania. To origin story, nie trauma diagnosis.
                  Pokaż jak ten wzorzec dziś służy LUB ogranicza — z opcją integracji.`,
  },
  
  love: {
    title_pl: 'Miłość i intymność',
    length_words: { min: 400, max: 550 },
    primary_planets: ['Venus', 'Mars', '5th house', '7th house', 'Moon'],
    tone: 'sensual but psychological, mature, specific',
    instruction: `Opisz dwie warstwy: (a) co przyciąga (Venus + 5th), (b) co buduje 
                  partnerstwo długofalowo (7th + Moon). Często to dwa różne profile osób.
                  Pokaż wzorzec relacyjny — co user szuka świadomie, co przyciąga 
                  nieświadomie. Konkret: typy osób z którymi ma chemię vs z którymi 
                  ma stabilność.`,
  },
  
  career: {
    title_pl: 'Powołanie zawodowe',
    length_words: { min: 400, max: 550 },
    primary_planets: ['Sun', 'MC/10th', '6th house', 'Saturn', 'Jupiter'],
    tone: 'pragmatic, ambitious, ROI-aware',
    instruction: `Pokaż JAKI rodzaj pracy/biznesu/roli rezonuje z chartem. NIE konkretne 
                  zawody ("jesteś prawnikiem") tylko archetypiczne tryby ("budowniczy 
                  systemów", "tłumacz między światami", "rzemieślnik precyzji").
                  Pokaż gdzie user marnuje energię (Saturn wyzwania) i gdzie ma 
                  naturalną przewagę (Jowisz domena).`,
  },
  
  shadows: {
    title_pl: 'Cienie do integracji',
    length_words: { min: 350, max: 450 },
    primary_planets: ['12th house', 'hard aspects', 'Chiron', 'Pluto natal placement'],
    tone: 'compassionate, integration-focused, non-pathologizing',
    instruction: `Najtrudniejszy moduł psychologicznie — wymaga maximum care.
                  Pokaż 2-3 wzorce cienia jako INTEGRACJA NEEDED, nie wyrok.
                  KAŻDY shadow musi mieć "co z tym zrobić" — actionable integration step.
                  Jeśli chart wskazuje na ciężkie tematy (porzucenie, przemoc, addykcja) 
                  — soft suggestion o terapeucie w ostatnim akapicie.`,
  },
  
  roots: {
    title_pl: 'Duchowe korzenie',
    length_words: { min: 280, max: 380 },
    primary_planets: ['South Node', 'past patterns', 'family karma signatures'],
    tone: 'mythic, transgenerational, gentle',
    instruction: `Opisz pattern który user "przynosi ze sobą" — wzorzec rodzinny/
                  ancestralny / dawne dispositions. Czego się uczy odpuszczać.
                  Nie reinkarnacja explicit (PL audience tego nie kupuje) — ale 
                  "wzorzec rodu", "transgeneracyjna tendencja".`,
  },
  
  purpose: {
    title_pl: 'Misja życia',
    length_words: { min: 350, max: 450 },
    primary_planets: ['North Node', 'Saturn return prep', 'Sun house meaning'],
    tone: 'directional, aspirational, grounded',
    instruction: `Pokaż w którą stronę chart "ciągnie" usera — to nie predeterminacja 
                  ale rozwojowy wektor.
                  Konkret co znaczy "iść w stronę X" w codzienności (nie "spełniaj swoją 
                  misję" — to puste). Pokaż gdzie user przeskakuje przez North Node 
                  do strefy komfortu South Node, i jak temu się sprzeciwiać.`,
  },
};
```

## Confidence score logic (richer than just hasExactTime)

```typescript
function computeConfidenceScore(
  module_id: ModuleId,
  context: {
    hasExactTime: boolean;
    birthYear: number;
    locationPrecisionKm: number;  // ile km precyzji miejsca
    hasStrongStellium: boolean;  // 3+ planets w tym module's primary house
  }
): number {
  let score = 100;
  
  // Time-dependent modules
  const TIME_DEPENDENT = ['childhood', 'career', 'love', 'purpose'];  // używają ASC/MC/houses
  if (!context.hasExactTime && TIME_DEPENDENT.includes(module_id)) {
    score -= 30;
  }
  
  // Historical accuracy
  if (context.birthYear < 1900) score -= 10;
  if (context.birthYear < 1850) score -= 20;
  
  // Location precision
  if (context.locationPrecisionKm > 50) score -= 5;
  
  // Stellium boost
  if (context.hasStrongStellium) score += 5;
  
  return Math.max(40, Math.min(100, score));
}
```

W prompcie do AI też przekaż: `confidence_target: 70` — wtedy AI wie czy może być pewna w sformułowaniach czy ma używać "być może", "często się zdarza", itp.

Dla modułów time-dependent bez exact time: **inject instruction explicit**:
```
UWAGA: Brak dokładnego czasu urodzenia. NIE używaj Ascendentu, Midheaven ani analizy domów.
Pracuj wyłącznie na pozycjach planet w znakach. Jeśli moduł wymagałby domu (4./10. itd.), 
pivot na natywną planetę rządzącą tym obszarem (np. zamiast 4. domu → Księżyc w znaku).
W tekście używaj subtle hedging "często się zdarza", "u osób z taką konfiguracją".
```

## DeepSeek wrapper z retry + parsing

```typescript
// src/lib/deepseek.ts

import OpenAI from 'openai';  // DeepSeek API jest OpenAI-compatible
import { z } from 'zod';
import { AstroModuleSchema, AstroModule } from './schemas/astroModule';

const deepseek = new OpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

const MAX_RETRIES = 2;
const BACKOFF_MS = [1000, 3000];  // exponential

async function generateModuleWithRetry(
  systemPrompt: string,
  userPrompt: string,
  expectedModuleId: string,
  attempt = 0
): Promise<AstroModule> {
  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      temperature: 0.7,
      max_tokens: 2500,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });
    
    const rawText = response.choices[0]?.message?.content ?? '';
    const parsed = JSON.parse(rawText);
    
    // Validate against Zod schema
    const validated = AstroModuleSchema.parse({
      ...parsed,
      id: expectedModuleId,  // wymuś że AI nie zmieni ID
    });
    
    return validated;
  } catch (err) {
    if (attempt < MAX_RETRIES) {
      console.warn(`Module ${expectedModuleId} attempt ${attempt + 1} failed:`, err);
      
      // Retry z explicit feedback jeśli to Zod error
      let retryUserPrompt = userPrompt;
      if (err instanceof z.ZodError) {
        const errors = err.errors.map(e => `- ${e.path.join('.')}: ${e.message}`).join('\n');
        retryUserPrompt += `\n\nPOPRZEDNIA PRÓBA MIAŁA BŁĘDY VALIDATION:\n${errors}\n\nPopraw i wygeneruj ponownie zgodnie z OUTPUT_SCHEMA.`;
      }
      
      await new Promise(r => setTimeout(r, BACKOFF_MS[attempt]));
      return generateModuleWithRetry(systemPrompt, retryUserPrompt, expectedModuleId, attempt + 1);
    }
    
    throw new Error(`Failed to generate module ${expectedModuleId} after ${MAX_RETRIES} retries: ${err}`);
  }
}
```

## Batched generation service

```typescript
// src/services/natalGenerator.ts

import { AstroModule } from '@/lib/schemas/astroModule';
import { generateModuleWithRetry } from '@/lib/deepseek';
import { MODULE_SPECS } from '@/lib/moduleSpecs';
import { computeConfidenceScore } from '@/lib/confidence';

type GenerationContext = {
  user_id: string;
  chart_id: string;
  natal_data: NatalData;  // planet positions, houses, aspects
  grammatical_form: 'kobieta' | 'mezczyzna' | 'neutralna';
  hasExactTime: boolean;
  birthYear: number;
  locationPrecisionKm: number;
};

const BATCH_DEFINITIONS = [
  { ids: ['core', 'superpowers', 'childhood'], isPremium: false },
  { ids: ['love', 'career'],                    isPremium: true },
  { ids: ['shadows', 'roots', 'purpose'],       isPremium: true },
];

export async function generateNatalKarta(ctx: GenerationContext): Promise<AstroModule[]> {
  // 1. Check cache for all 8 modules
  const cacheKeys = ALL_MODULES.map(id => computeCacheKey(ctx, id));
  const cached = await loadCachedModules(cacheKeys);
  
  // 2. Determine which need generation
  const toGenerate = ALL_MODULES.filter(id => !cached.has(id));
  if (toGenerate.length === 0) return ALL_MODULES.map(id => cached.get(id)!);
  
  // 3. Group by batch (preserve isPremium flag from batch def)
  const batches = BATCH_DEFINITIONS.map(batch => ({
    ids: batch.ids.filter(id => toGenerate.includes(id)),
    isPremium: batch.isPremium,
  })).filter(b => b.ids.length > 0);
  
  // 4. Execute each batch in sequence, modules in batch in parallel
  const generated: AstroModule[] = [];
  for (const batch of batches) {
    const batchResults = await Promise.all(
      batch.ids.map(async (moduleId) => {
        const spec = MODULE_SPECS[moduleId];
        const confidenceScore = computeConfidenceScore(moduleId, ctx);
        
        const systemPrompt = buildSystemPrompt(ctx);
        const userPrompt = buildUserPrompt(ctx, moduleId, spec, confidenceScore);
        
        const module = await generateModuleWithRetry(systemPrompt, userPrompt, moduleId);
        
        return {
          ...module,
          confidenceScore,
          isPremium: batch.isPremium,
          cacheKey: computeCacheKey(ctx, moduleId),
          promptVersion: process.env.NATAL_PROMPT_VERSION ?? 'v1',
        };
      })
    );
    
    // Cache batch results (don't block next batch on cache write)
    Promise.all(batchResults.map(m => saveModuleCache(m))).catch(console.error);
    
    generated.push(...batchResults);
  }
  
  // 5. Merge with cached and return in canonical order
  return ALL_MODULES.map(id => 
    generated.find(m => m.id === id) ?? cached.get(id)!
  );
}

const ALL_MODULES: ModuleId[] = ['core', 'superpowers', 'childhood', 'love', 'career', 'shadows', 'roots', 'purpose'];
```

## buildSystemPrompt / buildUserPrompt

```typescript
function buildSystemPrompt(ctx: GenerationContext): string {
  return SYSTEM_PROMPT_BASE.replace('${grammatical_form}', ctx.grammatical_form);
}

function buildUserPrompt(
  ctx: GenerationContext,
  moduleId: ModuleId,
  spec: typeof MODULE_SPECS[ModuleId],
  confidence: number
): string {
  return `
═══ MODUŁ DO WYGENEROWANIA ═══
ID: ${moduleId}
TYTUŁ: ${spec.title_pl}
TON: ${spec.tone}
DŁUGOŚĆ CONTENT: ${spec.length_words.min}-${spec.length_words.max} słów
CONFIDENCE LEVEL: ${confidence}/100 ${confidence < 70 ? '(używaj soft hedging w stwierdzeniach)' : '(możesz być pewna w sformułowaniach)'}

INSTRUKCJA SPECYFICZNA DLA TEGO MODUŁU:
${spec.instruction}

${!ctx.hasExactTime && ['childhood', 'career', 'love', 'purpose'].includes(moduleId) ? `
⚠️ UWAGA: User nie podał dokładnego czasu urodzenia. NIE używaj Ascendentu, Midheaven 
ani analizy domów. Pracuj wyłącznie na pozycjach planet w znakach. Soft hedging 
("często się zdarza", "u osób z taką konfiguracją").
` : ''}

═══ DANE KARTY NATALNEJ USERA ═══

${formatNatalDataForPrompt(ctx.natal_data, spec.primary_planets, ctx.hasExactTime)}

═══ OUTPUT SCHEMA (JSON) ═══

Wygeneruj OBIEKT JSON z następującymi polami (wszystkie wymagane):

{
  "id": "${moduleId}",
  "title": "${spec.title_pl}",  // możesz pozostawić lub spersonalizować subtelnie
  "quote": "<12-14 słów po polsku, hook, present tense, NIE 'Posiadasz...'>",
  "content": "<${spec.length_words.min}-${spec.length_words.max} słów, markdown z **bold** 2-4x>",
  "tactics": ["<taktyka 1, 12-20 słów, imperatyw>", "<taktyka 2>", "<taktyka 3>"],
  "tags": ["<tag1>", "<tag2>", "<tag3>", "<tag4>"],  // 4 tagi, PL lowercase, empowering
  "visualMeters": [
    {"label": "<3-40 zn>", "value": <0-100>, "archetype": "<3-80 zn anchor>", "category": "<one of action|emotion|mind|soul|social>"},
    {... 3 visual meters łącznie}
  ]
}

WAŻNE: confidenceScore, isPremium, cacheKey, promptVersion BĘDĄ DODANE PRZEZ BACKEND. 
Nie dodawaj ich do JSON output.

ZWRÓĆ TYLKO JSON, bez prologue, bez ```json``` markdown wrap. Tylko sam obiekt.
`;
}
```

## DB additions

```sql
-- Cache modułów (replace istniejący system jeśli był)
CREATE TABLE IF NOT EXISTS natal_modules_cache (
  cache_key TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  chart_id UUID NOT NULL,  -- może referencować library_profiles albo birth_data
  module_id TEXT NOT NULL,
  module_data JSONB NOT NULL,  -- full AstroModule object
  prompt_version TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_modules_by_user ON natal_modules_cache(user_id, chart_id);
CREATE INDEX idx_modules_by_version ON natal_modules_cache(prompt_version);
```

## Visualization hooks (frontend kontrakt — backend gwarantuje)

Frontend renderuje Karta Zawodnika z otrzymanych modułów. Backend gwarantuje:

1. **Każdy moduł ma `quote`** → hero stat per module card (serif italic, duży)
2. **Każdy moduł ma 3 `visualMeters`** → progress bars z gradient fill + archetype label pod każdym
3. **Każdy moduł ma 4 `tags`** → floating chips, share-ready
4. **Każdy moduł ma 3 `tactics`** → bullet list z imperatywami
5. **`isPremium` flag** → frontend rozróżnia free vs paywall
6. **`confidenceScore`** → frontend pokazuje "Ten moduł jest na X% — dokładny czas urodzenia podniósłby do 100%" jako tooltip

Frontend implementation jest OSOBNYM ticketem (kolejny prompt). Backend musi dostarczyć ten kontrakt bezbłędnie.

## Visualization aesthetic hints (Mystic Crystal compatible)

Frontend będzie używał (FYI dla decyzji backend'owych):
- Progress bars: gradient fill (deep purple #5B2C8F → gold #D4AF37 dla wysokich wartości)
- Tags: chips z subtle gradient border, gold text on dark bg
- Quote: serif italic, biały, duży (Cormorant Garamond albo podobny)
- Cards: deep navy bg #0a0a1f z subtle border #D4AF37 30% opacity
- Animacja roll-up na load: 800ms ease-out od 0 do target value (gamification cue)

Backend nie robi nic specjalnego pod te decyzje — po prostu zwraca clean data, frontend dba o crystal aesthetic.

## Test akceptacyjny

1. **Schema validation:** każda generacja modułu przechodzi przez `AstroModuleSchema.parse()`. Malformed → retry 2x. Final fail → throw.

2. **Tag quality:** dla 5 sample chartów wygeneruj wszystkie moduły. Sprawdź wszystkie tagi:
   - 100% match regex `/^[a-ząćęłńóśźż]+$/`
   - 100% są empowering (no "uparty", "leniwy", "narcystyczny")
   - 0 duplicates w obrębie 1 modułu
   - 0 żargonu astro

3. **Quote quality:** dla 5 sample chartów sprawdź quotes:
   - 100% ≤ 14 słów
   - 0 zaczyna się od "Posiadasz", "Jesteś osobą", "Ty"
   - 100% drugiej osobie present tense

4. **Content quality:** dla 5 sample chartów sprawdź content:
   - Wszystkie w zakresie length_words specyfikacji
   - 0 wystąpień: IC, MC, ASC, DSC, Imum Coeli, Medium Coeli, orb, dyspozytor, retrogradacja, trygon, kwadratura, sekstyl, koniunkcja, opozycja
   - 0 slash-form: "/aś", "/oś"
   - Min 2 **bold** markdown bolds per content

5. **VisualMeters quality:** dla 5 chartów:
   - Każdy moduł ma dokładnie 3 metry
   - 0 label dubluje tag w tym samym module
   - 100% archetype field jest sensowny anchor (sprawdzaj eyeball: czy "poziom przedsiębiorcy" pasuje do value 87)

6. **Safety check (shadows module):** wygeneruj shadows dla 3 chartów z różnymi placement patternami (np. Pluton w 12. domu, Saturn-Moon hard aspect). Sprawdź:
   - 0 diagnostycznego języka ("masz X", "narcyz", "borderline")
   - 0 deterministycznego: "zawsze", "nigdy", "skazany"
   - Każdy shadow ma actionable integration step
   - Jeśli pattern wskazuje ciężki temat — terapy suggestion present

7. **Confidence score:**
   - User bez exact time: childhood, career, love, purpose mają score 70 (100-30)
   - Core, superpowers, shadows mają 100
   - Roots ma 100 (bazuje na nodes, nie houses)

8. **Cache hit:** 2-gi request dla tego samego (user, chart, prompt_version, grammatical_form) returns z cache w <100ms, no DeepSeek call.

9. **Batch parallelism:** w logach widać 3 fazy. Batch 1 (3 modules) startują w t=0, finish ~t=4-6s. Batch 2 startuje po batch 1, finish ~t=8-12s. Batch 3 po batch 2.

10. **Promise.all parallelism w batch:** w batch 2 (2 modules) i batch 3 (3 modules) — równoległe execution, nie sequential. Sprawdź w network tab.

11. **Retry on schema failure:** sztucznie zmuś DeepSeek do błędnego output (np. tag z dużymi literami). Sprawdź że system retry'uje z explicit feedback i drugi raz przechodzi.

12. **Polish quality eyeball test:** wygeneruj komplet 8 modułów dla 1 reference chart. Wyślij do mnie. Powinno czytać się jak napisał to polski autor (nie translation feel). Każdy moduł powinien rezonować emocjonalnie i być konkretny do tego chartu.

Jeśli któreś z 12 nie przechodzi — nie commituj, wróć z error i sample output.

## Po skończeniu

Wklej do `docs/PROGRESS.md`:
- 8 sample wygenerowanych modułów (1 reference chart, wszystkie 8 modules)
- Network log z timing'iem batches (czas total + per batch)
- Cache hit rate test (1st gen vs 2nd gen czasy)
- Average tokens consumed per module (DeepSeek pricing tracking)
- Lista wszystkich tag'ów wygenerowanych w 5 sample chartów (sanity check diversity)
- Pytania do mnie (np. "DeepSeek czasem ignoruje `response_format: json_object` — czy mam dodać explicit fallback parser?")

## Co NIE robimy w tym promcie

- Bez frontend UI implementacji — to osobny prompt (Karta Zawodnika React components)
- Bez share card generation — osobny feature
- Bez A/B testing infrastruktury — prompt_version pole jest tu placeholder dla późniejszej integracji z prompt registry
- Bez integracji z istniejącym `ai-natal` endpoint — jeśli istnieje, deprecate (wszystko idzie przez nowy service)
- Bez generowania kart dla profili z biblioteki — tylko user's own chart na razie (P1)
