---
title: Prompt Registry + A/B Routing + Claude-as-Judge — MVP prompt dla Claude Code
created: 2026-05-24
project: cosmogram
type: claude-code-prompt
status: ready-to-paste
---

# Prompt Registry + A/B + Eval Pipeline — prompt do wklejenia

> Wklej całość poniżej (od `Przeczytaj...` do końca) do Claude Code. Anti-overengineering: to internal infra, function > form. Nie buduj fancy UI dla admin dashboardu.

---

Przeczytaj `docs/prompts-v4-audit.md` (znasz aktualne prompty produkcyjne) i `docs/site-structure-and-routing.md` (sekcja o `/app/admin/*` poniżej dodaje pod-strukturę admin). Twoim zadaniem jest zbudować core infrastrukturę quality measurement dla wszystkich AI generations w Cosmogramie.

## Co budujemy

Trzy zsplotowane systemy:

1. **Prompt Registry** — wszystkie prompty (ai-natal, ai-synastry, ai-daily, ai-child, ai-chat, ai-cosmo-map-city) wersjonowane w DB. Edytowalne z admin UI bez deploya.
2. **A/B Routing** — deterministyczne (per user + prompt) przypisanie wersji promptu na bazie rollout %. User dostaje konsystentnie tę samą wersję dopóki ją administrator nie zmieni.
3. **Eval Pipeline** — Claude-as-judge ocenia próbkę readings codziennie na 5 wymiarach. Plus user-facing thumbs rating. Plus golden test suite (50 znanych chartów) jako regression catch.

Cel: każda zmiana w prompcie ma mierzalny wpływ. Żadnego "wydaje się że lepsze", tylko liczby.

## Co NIE robimy w MVP

- Bez fancy admin UI — Tailwind tables i forms, point. To narzędzie dla ciebie, nie produkt.
- Bez auto-promote/auto-rollback logic — admin decyduje ręcznie kiedy zmienić rollout.
- Bez multi-armed bandit — proste A/B z manual rollout%.
- Bez fine-tuningu — to P2 jak będą dane.
- Bez integracji z Anthropic Workbench/PromptHub — własna implementacja w DB.

Jeśli kusi rozszerzenie scope'u → odpowiedz "to backlog P1/P2" i wracaj.

## Pliki do utworzenia

```
supabase/migrations/[timestamp]_prompt_registry.sql

supabase/functions/_shared/prompt-resolver.ts        # Hash-based A/B assignment
supabase/functions/_shared/few-shot-loader.ts        # Inject exemplars do promptu
supabase/functions/_shared/judge.ts                  # Claude-as-judge helper
supabase/functions/eval-readings-daily/index.ts      # Cron: sample 50 readings/day, score them
supabase/functions/golden-test-run/index.ts          # Triggered: run suite na konkretnej wersji
supabase/functions/rate-reading/index.ts             # User thumbs callback

apps/web/src/components/Rating/ThumbsRating.tsx
apps/web/src/pages/admin/AdminLayout.tsx
apps/web/src/pages/admin/PromptsList.tsx
apps/web/src/pages/admin/PromptEditor.tsx
apps/web/src/pages/admin/PromptCompare.tsx
apps/web/src/pages/admin/EvalsDashboard.tsx
apps/web/src/pages/admin/GoldenTests.tsx
apps/web/src/pages/admin/FewShotLibrary.tsx
apps/web/src/lib/adminGuard.ts                       # HOC sprawdzający is_admin

scripts/seed-golden-charts.ts                        # Seed initial 50 charts
scripts/migrate-current-prompts.ts                   # Migracja: hardkodowane prompty → DB jako v1.0
```

## Pliki do modyfikacji

- `supabase/functions/ai-natal/index.ts` — używaj prompt-resolver + few-shot-loader, zapisuj `prompt_version_id` w `readings`
- `supabase/functions/ai-synastry/index.ts` — same
- `supabase/functions/ai-daily/index.ts` — same
- `supabase/functions/ai-child/index.ts` — same
- `supabase/functions/ai-chat/index.ts` — same
- `supabase/functions/cosmo-map-city/index.ts` — same
- `apps/web/src/lib/routes.ts` — dodaj routes admin (patrz sekcja "Routing")
- `apps/web/src/components/layout/AppHeader.tsx` — pokaż link "Admin" tylko gdy `user.is_admin`
- Każda strona z readingiem (Natal.tsx, Match.tsx, etc.) — dodaj komponent `<ThumbsRating readingId={...} />` na dole

## DB migracje

```sql
-- 1. Registry promptów
CREATE TABLE prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_name TEXT NOT NULL,
  version TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  rollout_pct INT NOT NULL DEFAULT 0 CHECK (rollout_pct BETWEEN 0 AND 100),
  notes TEXT,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prompt_name, version)
);

CREATE INDEX idx_prompt_active ON prompt_versions(prompt_name, status, rollout_pct)
  WHERE status = 'active' AND rollout_pct > 0;

-- 2. Constraint: dla danego prompt_name, suma rollout_pct ze status='active' MUSI być 0 lub 100
CREATE OR REPLACE FUNCTION check_rollout_sum() RETURNS TRIGGER AS $$
DECLARE
  total INT;
BEGIN
  SELECT COALESCE(SUM(rollout_pct), 0) INTO total
  FROM prompt_versions
  WHERE prompt_name = NEW.prompt_name AND status = 'active';
  
  IF total NOT IN (0, 100) THEN
    RAISE EXCEPTION 'Rollout sum for % = %, must be 0 or 100', NEW.prompt_name, total;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER tr_rollout_sum
  AFTER INSERT OR UPDATE ON prompt_versions
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION check_rollout_sum();

-- 3. Rozszerzenie tabeli readings
ALTER TABLE readings 
  ADD COLUMN prompt_version_id UUID REFERENCES prompt_versions,
  ADD COLUMN rating_thumbs SMALLINT CHECK (rating_thumbs IN (-1, 1)),
  ADD COLUMN rating_dimensions JSONB,
  ADD COLUMN rated_at TIMESTAMPTZ;

CREATE INDEX idx_readings_version ON readings(prompt_version_id);
CREATE INDEX idx_readings_unrated ON readings(created_at) WHERE rating_thumbs IS NULL;

-- 4. Few-shot exemplar library
CREATE TABLE few_shot_exemplars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_name TEXT NOT NULL,
  input_data JSONB NOT NULL,
  output_markdown TEXT NOT NULL,
  source_reading_id UUID REFERENCES readings,
  quality_score INT CHECK (quality_score BETWEEN 1 AND 5),
  tags TEXT[],
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exemplars_active ON few_shot_exemplars(prompt_name, active);

-- 5. Claude-as-judge evaluations
CREATE TABLE reading_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reading_id UUID REFERENCES readings NOT NULL,
  prompt_version_id UUID REFERENCES prompt_versions NOT NULL,
  scores JSONB NOT NULL,
  reasoning TEXT,
  judge_model TEXT NOT NULL,
  evaluated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reading_id, judge_model)
);

CREATE INDEX idx_evals_version ON reading_evaluations(prompt_version_id);

-- 6. Golden test suite
CREATE TABLE golden_test_charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  birth_data JSONB NOT NULL,
  expected_traits JSONB NOT NULL,
  prompt_names TEXT[] NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE golden_test_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_version_id UUID REFERENCES prompt_versions NOT NULL,
  chart_id UUID REFERENCES golden_test_charts NOT NULL,
  output_markdown TEXT NOT NULL,
  judge_scores JSONB NOT NULL,
  traits_matched INT,
  traits_total INT,
  passed BOOLEAN,
  run_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_golden_runs_version ON golden_test_runs(prompt_version_id, run_at DESC);

-- 7. is_admin flag
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 8. RLS — admin tables tylko dla adminów
ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE few_shot_exemplars ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE golden_test_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE golden_test_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_only ON prompt_versions FOR ALL
  USING ((SELECT is_admin FROM auth.users WHERE id = auth.uid()));
-- powtórz dla pozostałych
```

## prompt-resolver.ts — deterministyczne A/B

```typescript
// supabase/functions/_shared/prompt-resolver.ts

import { createClient } from '@supabase/supabase-js';
import { createHash } from 'https://deno.land/std/crypto/mod.ts';

export type PromptVersion = {
  id: string;
  prompt_name: string;
  version: string;
  system_prompt: string;
  user_prompt_template: string;
  config: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    few_shot_count?: number;
  };
};

export async function resolvePromptVersion(
  db: ReturnType<typeof createClient>,
  promptName: string,
  userId: string
): Promise<PromptVersion> {
  const { data: versions, error } = await db
    .from('prompt_versions')
    .select('*')
    .eq('prompt_name', promptName)
    .eq('status', 'active')
    .gt('rollout_pct', 0)
    .order('version', { ascending: true });

  if (error) throw error;
  if (!versions || versions.length === 0) {
    throw new Error(`No active prompt version for "${promptName}"`);
  }

  // Hash(userId + promptName) → bucket 0-99
  const hashInput = new TextEncoder().encode(`${userId}:${promptName}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', hashInput);
  const hashArray = new Uint8Array(hashBuffer);
  const bucket = ((hashArray[0] << 24) | (hashArray[1] << 16) | (hashArray[2] << 8) | hashArray[3]) >>> 0;
  const bucketPct = bucket % 100;

  // Walk versions sorted, accumulate rollout
  let cumulative = 0;
  for (const v of versions) {
    cumulative += v.rollout_pct;
    if (bucketPct < cumulative) return v as PromptVersion;
  }

  return versions[versions.length - 1] as PromptVersion;
}

export function renderPromptTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}
```

## few-shot-loader.ts — wstrzykuje exemplary

```typescript
// supabase/functions/_shared/few-shot-loader.ts

export async function loadFewShots(
  db: ReturnType<typeof createClient>,
  promptName: string,
  count: number
): Promise<Array<{ input: any; output: string }>> {
  if (count === 0) return [];

  const { data } = await db
    .from('few_shot_exemplars')
    .select('input_data, output_markdown')
    .eq('prompt_name', promptName)
    .eq('active', true)
    .order('quality_score', { ascending: false })
    .limit(count * 3); // pobierz więcej, random sample z top

  if (!data || data.length === 0) return [];

  // Random shuffle, take first N
  const shuffled = [...data].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(e => ({
    input: e.input_data,
    output: e.output_markdown,
  }));
}

export function buildFewShotBlock(exemplars: Array<{ input: any; output: string }>): string {
  if (exemplars.length === 0) return '';
  return `\n\nPrzykłady wzorcowych interpretacji do których powinieneś dążyć jakością:\n\n${
    exemplars.map((e, i) => 
      `--- PRZYKŁAD ${i+1} ---\nInput: ${JSON.stringify(e.input)}\nOutput:\n${e.output}\n`
    ).join('\n')
  }\n---\nTeraz wygeneruj interpretację dla:\n`;
}
```

## judge.ts — Claude-as-judge

```typescript
// supabase/functions/_shared/judge.ts

import Anthropic from 'npm:@anthropic-ai/sdk';

const JUDGE_SYSTEM = `Jesteś krytycznym ewaluatorem astrologicznych interpretacji generowanych przez AI. Oceniasz w skali 1-5 (1=fatalne, 5=znakomite) na pięciu wymiarach:

1. ACCURACY — czy interpretacja faktycznie odzwierciedla podane dane astrologiczne (np. jeśli ktoś ma Marsa w Skorpionie w 8 domu, czy AI to widzi i z tym pracuje, czy generycznie pisze o Marsie)

2. ENGAGEMENT — czy chce się czytać dalej. Czy są mocne metafory, niebanalne obrazy, czy płaska generyka

3. SPECIFICITY — czy konkret do tej osoby vs uogólnienia ("Bliźnięta lubią rozmawiać"). Powinno być widać że to o tej konkretnej karcie, nie o znaku

4. NO_JARGON — czy unika żargonu (orb, dyspozytor, retrograde, MC, IC, trygon, kwadratura, sekstyl). Dozwolone tylko jak natychmiast wytłumaczone w naturalnym języku

5. GRAMMAR — czy nie ma slash-form ("oddałeś/aś"), czy forma gramatyczna spójna z deklarowaną przez usera

Output STRICTLY w JSON:
{
  "accuracy": <1-5>,
  "engagement": <1-5>,
  "specificity": <1-5>,
  "no_jargon": <1-5>,
  "grammar": <1-5>,
  "reasoning": "<2-3 zdania uzasadnienia, po polsku, konkretnie>"
}`;

export async function judgeReading(
  client: Anthropic,
  rawInputData: any,
  generatedOutput: string,
  userGrammaticalForm: string
): Promise<{
  scores: Record<string, number>;
  reasoning: string;
  judge_model: string;
}> {
  const judgePrompt = `Dane astrologiczne osoby (input do AI):
${JSON.stringify(rawInputData, null, 2)}

Deklarowana forma gramatyczna usera: ${userGrammaticalForm}

Wygenerowana interpretacja:
"""
${generatedOutput}
"""

Oceń. Output JSON.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    system: JUDGE_SYSTEM,
    messages: [{ role: 'user', content: judgePrompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Judge did not return JSON');
  
  const parsed = JSON.parse(jsonMatch[0]);
  const { reasoning, ...scores } = parsed;
  
  return {
    scores,
    reasoning,
    judge_model: 'claude-sonnet-4-6',
  };
}
```

## eval-readings-daily — cron sample eval

```typescript
// supabase/functions/eval-readings-daily/index.ts
// Trigger: Supabase pg_cron, daily 03:00 UTC

// 1. Pobierz losowych 50 readings z ostatnich 24h gdzie:
//    - prompt_version_id IS NOT NULL
//    - id NOT IN (SELECT reading_id FROM reading_evaluations WHERE judge_model = 'claude-sonnet-4-6')
// 2. Dla każdego: wywołaj judgeReading
// 3. INSERT do reading_evaluations
// 4. Loguj sumarycznie do PostHog: eval_batch_completed {evaluated: 50, avg_scores: {...}}

// Setup pg_cron w migracji:
-- SELECT cron.schedule(
--   'daily-reading-eval',
--   '0 3 * * *',
--   $$ SELECT net.http_post(url := 'https://[project].supabase.co/functions/v1/eval-readings-daily', headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key'))) $$
-- );
```

## golden-test-run — regression suite

```typescript
// supabase/functions/golden-test-run/index.ts
// POST { prompt_version_id, chart_ids?: uuid[] (optional, default all relevant) }

// 1. Pobierz wersję promptu
// 2. Pobierz golden charts gdzie prompt_versions.prompt_name = ANY(charts.prompt_names)
// 3. Dla każdego chartu:
//    a) Wygeneruj interpretację z tą wersją (call do model)
//    b) judgeReading na output
//    c) Dodatkowo: judge trait matching — drugi judge call:
//       "Z listy expected traits ${chart.expected_traits} ile się pojawia w interpretacji?"
//       Output: traits_matched count
//    d) passed = (avg score >= 3.5) AND (traits_matched / traits_total >= 0.6)
// 4. INSERT każdy do golden_test_runs
// 5. Response: summary { total, passed, failed, avg_score, by_chart: [...] }
```

## rate-reading — user thumbs

```typescript
// POST { reading_id, thumbs: 1 | -1, dimensions?: {...} }
// 1. Sprawdź że reading.user_id = auth.uid()
// 2. UPDATE readings SET rating_thumbs = $thumbs, rating_dimensions = $dim, rated_at = NOW()
// 3. PostHog event: reading_rated {reading_id, thumbs, prompt_version_id}
// 4. (Opcjonalnie P1) Jeśli thumbs === 1 i quality_score = 5 manualnie później — promuj do few_shot_exemplars
```

## Migracja istniejących promptów

```typescript
// scripts/migrate-current-prompts.ts
// One-shot script: bierze hardkodowane prompty z aktualnego kodu edge functions i wrzuca jako v1.0 active 100% rollout

const PROMPTS_TO_MIGRATE = [
  { name: 'ai-natal', file: 'supabase/functions/ai-natal/index.ts' },
  { name: 'ai-synastry', file: 'supabase/functions/ai-synastry/index.ts' },
  { name: 'ai-daily', file: 'supabase/functions/ai-daily/index.ts' },
  { name: 'ai-child', file: 'supabase/functions/ai-child/index.ts' },
  { name: 'ai-chat', file: 'supabase/functions/ai-chat/index.ts' },
  { name: 'ai-cosmo-map-city', file: 'supabase/functions/cosmo-map-city/index.ts' },
];

// Dla każdego:
// 1. Otwórz plik, znajdź const SYSTEM_PROMPT = `...` i const USER_PROMPT = `...`
// 2. INSERT prompt_versions VALUES (gen_random_uuid(), $name, 'v1.0', $system, $user, $config, 'active', 100, 'Migrated from hardcoded', null)
// 3. Po migracji: refactor edge function żeby wczytywała z DB przez resolvePromptVersion
```

## Refactor edge functions — wzór

Każda funkcja `ai-*` po refactorze:

```typescript
// supabase/functions/ai-natal/index.ts (po refactorze)

import { resolvePromptVersion, renderPromptTemplate } from '../_shared/prompt-resolver.ts';
import { loadFewShots, buildFewShotBlock } from '../_shared/few-shot-loader.ts';

Deno.serve(async (req) => {
  const { user_id, birth_data, grammatical_form } = await req.json();
  
  // 1. Resolve which version this user gets
  const version = await resolvePromptVersion(db, 'ai-natal', user_id);
  
  // 2. Load few-shots if config says so
  const fewShotCount = version.config.few_shot_count ?? 0;
  const fewShots = await loadFewShots(db, 'ai-natal', fewShotCount);
  const fewShotBlock = buildFewShotBlock(fewShots);
  
  // 3. Render user prompt template with vars
  const userPrompt = fewShotBlock + renderPromptTemplate(version.user_prompt_template, {
    birth_data: JSON.stringify(birth_data),
    grammatical_form,
    // ... inne placeholdery z templatu
  });
  
  // 4. Call Claude
  const response = await anthropic.messages.create({
    model: version.config.model ?? 'claude-sonnet-4-6',
    max_tokens: version.config.max_tokens ?? 4000,
    temperature: version.config.temperature ?? 0.7,
    system: version.system_prompt,
    messages: [{ role: 'user', content: userPrompt }],
  });
  
  const output = response.content[0].type === 'text' ? response.content[0].text : '';
  
  // 5. Zapisz reading z prompt_version_id
  const { data: reading } = await db.from('readings').insert({
    user_id,
    type: 'natal',
    interpretation_markdown: output,
    prompt_version_id: version.id,
    raw_input: { birth_data, grammatical_form },
  }).select().single();
  
  return new Response(JSON.stringify({ reading_id: reading.id, interpretation: output }));
});
```

## Routing — admin

Dodaj do `apps/web/src/lib/routes.ts`:

```typescript
admin: {
  root:         { path: '/app/admin',                   label: 'Admin' },
  prompts:      { path: '/app/admin/prompts',           label: 'Prompty' },
  promptEdit:   { path: '/app/admin/prompts/:id/edit',  label: 'Edycja promptu' },
  promptNew:    { path: '/app/admin/prompts/new',       label: 'Nowy prompt' },
  promptCompare:{ path: '/app/admin/prompts/compare',   label: 'Porównanie' },
  evals:        { path: '/app/admin/evals',             label: 'Ewaluacje' },
  golden:       { path: '/app/admin/golden',            label: 'Golden tests' },
  fewShots:     { path: '/app/admin/few-shots',         label: 'Few-shot library' },
}
```

Wszystkie pod auth + dodatkowo `<AdminGuard>` HOC sprawdzający `is_admin`.

## Admin UI — szybko i bez ozdóbek

**PromptsList.tsx** — tabela:
| Prompt | Wersja | Status | Rollout | n_readings (7d) | avg_thumbs | avg_score (judge) | Akcje |
|--------|--------|--------|---------|-----------------|------------|-------------------|-------|

Akcje: [Edytuj] [Duplikuj jako nowa wersja] [Aktywuj/Archiwizuj] [Zmień rollout%].

**PromptEditor.tsx** — form:
- prompt_name (dropdown, gdy nowa)
- version (text, gdy nowa)
- system_prompt (textarea, full-height monaco editor jeśli prosto, inaczej zwykły textarea)
- user_prompt_template (textarea, z helperem "dostępne placeholdery: {{birth_data}}, {{grammatical_form}}, ...")
- config (JSON editor): model, temperature, max_tokens, few_shot_count
- notes (textarea)
- status (radio: draft/active/archived)
- rollout_pct (slider 0-100)
- [Zapisz] [Uruchom golden test na tej wersji]

**PromptCompare.tsx** — input: 2 dropdowny wersji. Output: side-by-side:
- liczba readings każdej w 7d
- avg thumbs ratio (positive / total)
- avg judge scores per wymiar
- 5 sample outputs każdej (random)
- 5 sample outputs gdzie one wersje thumbs+ a druga thumbs- na podobnym input (jeśli dane są)

**EvalsDashboard.tsx** — wykres line chart avg_score over time per prompt_name, filterable po wersji. Tabela ostatnich 50 evaluations z reasoningiem judge.

**GoldenTests.tsx** — lista chartów + tabela: rows = charty, cols = wersje promptów, cells = pass/fail + score. Button "Run suite na [wersja]" triggeruje `golden-test-run`.

**FewShotLibrary.tsx** — tabela exemplars + button "Promuj z reading" (input: reading_id, otwiera preview, save jako exemplar z tagami).

## Seed danych — golden charts

```typescript
// scripts/seed-golden-charts.ts
// Insertuje 50 znanych postaci. Birth data z Astro-Databank (Rodden Rating A lub AA).

const GOLDEN_CHARTS = [
  {
    name: 'Albert Einstein',
    birth_data: { date: '1879-03-14', time: '11:30', lat: 48.4, lon: 10.0, tz: 'Europe/Berlin' },
    expected_traits: ['analytical', 'unconventional thinker', 'pacifist', 'humanitarian', 'genius'],
    prompt_names: ['ai-natal'],
  },
  {
    name: 'Maria Skłodowska-Curie',
    birth_data: { date: '1867-11-07', time: '12:00', lat: 52.2, lon: 21.0, tz: 'Europe/Warsaw' },
    expected_traits: ['perseverant', 'scientific mind', 'self-sacrificing', 'pioneering', 'discreet'],
    prompt_names: ['ai-natal'],
  },
  // ...48 kolejnych. Po polsku gdzie sensowne, mix światowych i polskich postaci.
];

// Mix:
// - 20 światowych ikon (Einstein, Curie, Gandhi, Mandela, Churchill, Madonna, Jobs, etc.)
// - 15 polskich postaci historycznych (Wałęsa, Jan Paweł II, Mickiewicz, Chopin, Kopernik, etc.)
// - 10 współczesnych celebrytów (Polski + światowi) z dobrze znanymi rejestrami zachowań
// - 5 fikcyjnych edge cases (godziny graniczne, planeta na cuspie, stellium etc.) do test edge cases
```

## ThumbsRating.tsx — user-facing

```tsx
type Props = { readingId: string };

export function ThumbsRating({ readingId }: Props) {
  const [rated, setRated] = useState<'up' | 'down' | null>(null);
  
  const handleRate = async (thumbs: 1 | -1) => {
    await fetch('/api/rate-reading', {
      method: 'POST',
      body: JSON.stringify({ reading_id: readingId, thumbs }),
    });
    setRated(thumbs === 1 ? 'up' : 'down');
    posthog.capture('reading_thumbs', { reading_id: readingId, thumbs });
  };
  
  if (rated) {
    return <div className="text-sm text-gray-500 mt-8">Dzięki za feedback ✨</div>;
  }
  
  return (
    <div className="flex items-center gap-3 mt-8 pt-6 border-t">
      <span className="text-sm text-gray-600">Pomocne?</span>
      <button onClick={() => handleRate(1)} className="...">👍</button>
      <button onClick={() => handleRate(-1)} className="...">👎</button>
    </div>
  );
}
```

Wsadź na dół każdej strony z readingiem: Natal.tsx, Match.tsx, daily horoscope view, child reading view, city interpretation view w Cosmo Map.

## Test akceptacyjny

1. Migracja działa: `prompt_versions` ma 6 rekordów (po jednej v1.0 dla każdego ai-*), wszystkie active 100%. Existing readings z przeszłości mają `prompt_version_id = NULL` (OK, te nie mają historii).
2. Wygeneruj 10 natalów dla 10 różnych user_id → wszystkie dostają v1.0 (jedyna active 100%). `readings.prompt_version_id` jest wypełnione.
3. Utwórz v1.1 jako draft, edytuj system prompt (drobna zmiana). Activate jako 10%, zmień v1.0 na 90%. Wygeneruj 100 natalów dla 100 różnych user_id → rozkład powinien być ~90/10 (±5).
4. Ten sam user_id wywoła ai-natal 3× → zawsze ta sama wersja (deterministic).
5. Wywołaj golden-test-run na v1.0 dla `ai-natal` → uruchamia się na ~10 chartach z `prompt_names = ['ai-natal']`, każdy ma judge_scores i pass/fail.
6. User klika 👍 na natal page → `readings.rating_thumbs = 1`, `rated_at` ustawione. PostHog event `reading_thumbs` poszedł.
7. Cron `eval-readings-daily` (uruchom manualnie z curl) → loguje 50 evaluations w `reading_evaluations` z scores i reasoning.
8. Admin UI:
   - `/app/admin/prompts` ładuje się tylko dla user gdzie `is_admin = true`, inni → 403.
   - Lista pokazuje 6 promptów z statystykami.
   - Edycja v1.1, zmiana rollout na 30% → trigger DB pozwala (suma 100%).
   - Próba ustawienia v1.0 na 80% gdy v1.1 jest 30% → trigger DB blokuje (suma 110%).
9. PromptCompare wybierz v1.0 vs v1.1 → side-by-side stats się ładują.
10. Few-shot library: dodaj 1 exemplar z reading przez UI → `few_shot_exemplars` ma rekord.
11. W v1.1 set `config.few_shot_count = 2` → nowy natal generation pulluje 2 random exemplars, w request do Claude widzisz blok PRZYKŁAD 1, PRZYKŁAD 2 przed głównym promptem.
12. Grep w kodzie edge functions: żaden hardkodowany `const SYSTEM_PROMPT = ...` ani `const USER_PROMPT = ...` nie powinien istnieć — wszystko przez `resolvePromptVersion`.

Jeśli któreś z 12 nie przechodzi → nie commituj, wróć z błędem.

## Po skończeniu

Dopisz do `docs/PROGRESS.md`:
- 6 promptów zmigrowanych jako v1.0
- 50 golden charts seeded
- Działający flow: prompt edit → save → activate 10% → mierz → rollout 100% albo archive
- Pierwsze evaluacje z eval-readings-daily (wklej przykład 3 reasoning'ów judge dla sanity check)
- Pytania do mnie (np. "is_admin flag set ręcznie czy chcesz UI do nadawania uprawnień?")

## Co odłożone na P1+

Wymienione żebyś nie zaczął tego budować:
- Multi-armed bandit (auto-rollout na podstawie thumbs)
- Auto-rollback gdy avg_score spada o > X%
- Dimension feedback popup po thumbs-down (oprócz prostego thumbs)
- Promuj do few-shot automatycznie po N thumbs-up
- Wersjonowanie samego JUDGE_SYSTEM (judge też może mieć wersje, ale na razie hardkoduj)
- A/B testing modelu (Sonnet vs Haiku) — config.model już to wspiera, ale nie buduj UI selectora dopóki nie masz danych że Haiku jest realnie konkurencyjne
- Eksport readings dataset do fine-tuningu — to P2 jak będzie 1000+ thumbs-up
- Visual diff editora dla porównania dwóch promptów (Monaco diff view) — przyjemne, ale ma być function > form
