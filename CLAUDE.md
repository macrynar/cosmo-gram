# Cosmogram — instrukcja dla Claude Code

Cosmogram to mobilna appka **AI + astrologia** dla rynku PL (domena **www.cosmo-gram.com**). Kosmogram natalny jako centrum wartości; kalendarz tranzytów, Cosmo Match, Cosmo Chat i Listy od Astrei budują retencję; monetyzacja = subskrypcja premium (Stripe) + pakiety czatu.

**Zanim zaczniesz:** przeczytaj `docs/PROJECT-STATUS.md` — żywe źródło prawdy (stack, wdrożone funkcje, schemat DB, env vars, znane ograniczenia, release log, priorytety). Ten plik (CLAUDE.md) to tylko reguły pracy.

## Stack (decyzje podjęte, NIE re-litygować)

- **Frontend:** Next.js 16 **App Router** + React 19 + TypeScript + Tailwind 4 + Framer Motion. Mobile-first PWA.
- **Backend:** **Next.js API routes** (`src/app/api/*`, ~70 endpointów) — brak osobnego serwera, brak Supabase Edge Functions.
- **Dane/Auth:** Supabase (Postgres + Auth + **RLS**). Migracje w `supabase/migrations/`.
- **AI:** Anthropic — **Haiku 4.5** (`claude-haiku-4-5-20251001`, szybkie) + **Sonnet 4.6** (`claude-sonnet-4-6`, jakość). Klucz `ANTHROPIC_API_KEY` **tylko server-side**. Każdy endpoint AI ma deterministyczny fallback.
- **Astro:** `astronomy-engine` + `tz-lookup`. System domów: **Equal House** (`calculateEqualHouses()` w `src/lib/chart-engine.ts`).
- **Reszta:** Stripe (subskrypcja + webhook), Resend (`hello@cosmo-gram.com`), PostHog, Sentry, Upstash (rate limit). Hosting + Cron: **Vercel**.

## Gdzie co jest

- `src/app/*` — routes (kebab-case); `src/app/app/*` — strefa zalogowana; `src/app/api/*` — backend.
- `src/lib/*` — logika: `chart-engine.ts`, `astro/`, `calendar/`, `letters/`, `prompts/`, walidatory, `supabase*.ts`.
- `src/components/*` — UI (PascalCase). `src/emails/*` — szablony React Email.
- **Prompty AI** żyją w rejestrze w DB (resolwowane przez `src/lib/promptResolver.ts`, edytowane w panelu admina + `/api/admin-prompt`) — NIE hardcoduj ich w kodzie.

## Konwencje

- Komponenty/typy: PascalCase. Hooki: `useCoś`. API routes/foldery: kebab-case. DB: snake_case. Env: SCREAMING_SNAKE_CASE.
- **Całe copy w UI: polski.** Głos „Astrei" — gender-neutral, ciepły, „symboliczne lustro", nie wyrocznia.
- Output AI renderuj `react-markdown`. Zapis readingu zawsze z `ai_prompt_version`. Daily reading cache 24h (nie generuj 2× w 24h).
- Commity krótkie, po polsku („Dodaj onboarding flow", „Fix paywall trigger"). Nowa migracja zamiast edycji wdrożonej.

## Jak pracować z Makiem (skrót)

Big picture przed detalami, bez ścian tekstu. **Kwestionuj wprost** gdy plan ma dziurę. Przy trade-offach daj 2-3 opcje, nie jedną drogę. Update po kroku: `✓ zrobione / → teraz / ? pytanie`.

## Always / Ask / Never

- **Zawsze sam:** implementacja w ramach stacku, naming, struktura folderów, wybór biblioteki, **jakość interpretacji astro** (pisz wg best practices: trafnie, angażująco, personalnie — astrolog nie jest w procesie, kontrolę jakości Mac robi poza Claude).
- **Pytaj Maca:** zmiana produktu (dodanie/usunięcie feature), spec niezgodny z rzeczywistością techniczną.
- **NIGDY bez zgody Maca:** zmiana **pricingu / logiki Stripe**; zmiana **copy / głosu** widocznego dla usera.

## Gotchas — tu Claude już poległ (żywa lista, dopisuj)

- **Auth/redirecty:** używaj domeny **www** (apex → www psuł Google login). Linki w mailach: **zawsze prod URL** `www.cosmo-gram.com`, nigdy `localhost`.
- **JSON z AI bywa zepsuty** — przepuść przez `src/lib/jsonRepair.ts`, retry + deterministyczny fallback. Nie zakładaj poprawnego JSON.
- **Walidatory tekstu** muszą obsłużyć cudzysłowy typograficzne (`„ "`), nie tylko `"`.
- **iOS:** inputy `date`/`time` wystają bez resetu `appearance`. Sprawdzaj na mobile.
- **Czas urodzenia nieznany** → ASC/domy liczone na południe, `house = null`. Nie prezentuj domów jako pewnych.
- **Astro ≠ Astro.com?** Pokaż Macowi tabelę porównawczą zanim ruszysz dalej (zwykle system domów / timezone / wersja efemeryd).
- **Słaby output AI** → nie zmieniaj kodu, **zmień prompt**. Chat to structured prompting z kontekstem natal+tranzyty, **nie** „RAG".

## Weryfikacja (definicja „done")

1. Przed większą zmianą: w 1-2 zdaniach opisz **jak ją zweryfikujesz**.
2. Zanim powiesz „działa": **`npm run typecheck` + `npm run lint` + `npm run test` (vitest) zielone.** Zmiana w astro/walidatorach → dopisz/odpal test.
3. Kryterium gotowości: zielone checki, feature działa w przeglądarce, zero nowych błędów w konsoli.

## Utrzymanie

CLAUDE.md ewoluuje — jeśli coś tu jest złe lub trafiasz na nowy gotcha, **dopisz go**. Stan funkcji/DB/release trzymaj w `docs/PROJECT-STATUS.md`, nie tutaj.
