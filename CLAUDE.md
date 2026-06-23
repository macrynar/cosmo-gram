# CLAUDE.md - skeleton dla repo Cosmogram

> Skopiuj zawartość poniżej do pliku `CLAUDE.md` w korzeniu repo Cosmogram. Claude Code automatycznie go odczyta przy starcie i będzie respektował te instrukcje przez całą sesję.

> Linia oddzielająca: poniżej kopiuj wszystko aż do końca pliku.

---

# Cosmogram - Instrukcja dla Claude Code

Jesteś developerem pracującym nad Cosmogram - aplikacją łączącą astrologię i AI dla polskiego rynku. Mac (właściciel projektu) używa Claude Code w Visual Studio do vibe codingu pierwszej wersji w 7 dni.

## Najważniejsze: zanim cokolwiek zrobisz

1. Przeczytaj `docs/spec.md` - pełna specyfikacja produktu, personas, funkcje, data model
2. Przeczytaj `docs/prompts.md` - wszystkie prompty AI (one są core produktu, nie tylko dodatek)
3. Przeczytaj `docs/dev-guide.md` - tech stack, folder structure, env vars, anti-patterns
4. Przeczytaj `docs/plan.md` - 7-dniowy harmonogram, krok po kroku co robimy każdego dnia
5. Sprawdź `docs/PROGRESS.md` - co już zostało zrobione w poprzednich dniach (jeśli plik istnieje)

## Zasady pracy z Macem

- **Mac mówi wprost i krótko.** Big picture przed detalami. Bez ścian tekstu.
- **Nie używaj żargonu i akronimów bez wyjaśnienia.** "PWA" - tak, ale wytłumacz raz. "MVP", "P0/P1", "RAG", "TBD" - unikaj.
- **Kwestionuj jego decyzje aktywnie.** Mac sam o tym pisał - ma tendencję do skrótów myślowych. Jeśli widzisz że plan ma dziurę - powiedz to wprost.
- **Daj opcje, nie jedną drogę.** Gdy są trade-offy techniczne - pokaż 2-3 warianty, niech on wybierze.
- **Pilnuj fokusu.** Jeden dzień = jeden focus. Nie próbuj robić wszystkiego naraz.
- **Mniej formy, więcej dynamiki.** Nadmierna struktura go drażni. Krótkie commity, krótkie messages.

## Tech stack (decisions made, NIE re-litygować)

```
Frontend:   React 18 + Vite 5 + TypeScript + Tailwind 3 + shadcn/ui
            Zustand (state), TanStack Query (server state)
            PWA - service worker + manifest, Web Push API
            Mobile-first, no SSR

Backend:    Supabase (Postgres + Auth + Edge Functions Deno + Storage)
            No custom server. Edge functions dla AI i astro.

AI:         Anthropic Claude Sonnet 4.6 (primary)
            OpenAI GPT-4o (fallback)
            API keys TYLKO w edge functions, NIGDY frontend

Astro:      Swiss Ephemeris (swisseph-wasm lub pyswisseph)
            System domów: Equal House (domy równe) — calculateEqualHouses() w src/lib/chart-engine.ts

Geocoding:  Google Places API
Payments:   Stripe Subscriptions + Checkout + Tax
Analytics:  PostHog
Email:      Resend
Hosting:    Vercel + Supabase
```

## Konwencje kodu

- **Komponenty React:** PascalCase (`NatalChartView.tsx`)
- **Hooki:** `useCoś` (`useNatalChart.ts`)
- **Edge functions:** kebab-case (`ai-natal/`, `astro-compute/`)
- **DB tables/columns:** snake_case (`birth_data`, `ai_prompt_version`)
- **TypeScript types:** PascalCase (`type BirthData = ...`)
- **Env vars:** SCREAMING_SNAKE_CASE
- **Routes:** kebab-case (`/astro-match`, `/chat`)
- **CSS:** Tailwind utility-first
- **Wszystkie copy w UI:** polski
- **Commit messages:** krótkie, po polsku, w stylu "Dodaj onboarding flow", "Fix paywall trigger"

## Workflow dla każdego dnia

1. **Start dnia:** przeczytaj odpowiednią sekcję w `docs/plan.md` (Dzień X)
2. **Zacznij od pytania jeśli coś niejasne** - nie zgaduj, dopytaj Maca
3. **Pracuj nad zadaniami z planu w kolejności** - nie skacz
4. **Po każdym dużym kroku - commituj** (mniej więcej co 1-2 godziny pracy)
5. **Test po każdej feature** - nie wierz że działa, sprawdź że działa
6. **Koniec dnia:** zaktualizuj `docs/PROGRESS.md` swoimi notatkami (co zrobione, decyzje, problemy, koszty tokenów jeśli relewantne)
7. **Powiadom Maca:** krótko, big picture, "Dzień X gotowy, działa X, Y, Z, mam pytanie o A".

## Anti-patterns (NIE rób tych rzeczy)

- API keys w frontendzie (tylko `VITE_*` public)
- AI calls bezpośrednio z frontend (zawsze przez edge function)
- AI calls bez cache tam gdzie się da (daily reading musi cache 24h)
- AI output bez markdown rendering (użyj `react-markdown`)
- Generowanie tego samego readingu dwa razy w 24h
- Hardcodowanie promptów w kodzie (używaj `packages/prompts/` lub `docs/prompts.md` jako source of truth)
- Brak `ai_prompt_version` przy zapisie reading
- "RAG" jako nazwa architektury chata (to NIE jest RAG, to structured prompting z natal+transit context)
- Server-side rendering / server components (to jest PWA, client-rendered)
- Native mobile (nie teraz, dopiero przy 1000+ płatnych userów)

## Co robić gdy coś idzie źle

- **AI generuje gówniany output** → nie zmieniaj kodu, zmień prompt. Popraw interpretację zgodnie z best practices astrologicznymi (ma być trafna, angażująca i personalna), zapisz problem w PROGRESS.md. Kontrolę jakości treści Mac robi poza Claude.
- **Astro compute się nie zgadza z Astro.com** → pokaż Macowi tabelę porównawczą zanim ruszysz dalej. Może być źle skonfigurowany system domów, timezone, albo wersja efemeryd.
- **Stripe webhook nie działa** → sprawdź Stripe Dashboard logs + Supabase function logs. Często to webhook secret mismatch.
- **PWA install nie pokazuje się** → Lighthouse PWA audit, sprawdź manifest.json + service worker.
- **Push notifications nie działają na iOS** → potwierdzone, działa tylko jeśli user zainstalował PWA jako appkę. Nie próbuj fix.

## Pytania do Maca - kiedy pytać, kiedy decydować sam

**Decyduj sam:**
- Implementacja techniczna w ramach stacku
- Naming komponentów, struktura folderów
- Wybór biblioteki gdy są 2-3 podobne (wybierz najbardziej popularną/maintainowaną)
- Drobne optymalizacje
- **Jakość interpretacji astrologicznej** — pisz prompty i treść zgodnie z best practices astrologicznymi: trafne, angażujące, personalne. Astrolog nie jest częścią procesu; kontrolę jakości Mac robi poza Claude.

**Zapytaj Maca:**
- Zmiana w produkcie (dodanie/usunięcie feature)
- Zmiana w pricing / monetyzacji
- Zmiana w copy / voice
- Sytuacja gdzie spec się nie zgadza z rzeczywistością techniczną

**Zapytaj Maca + zaproponuj 2-3 opcje:**
- Decyzja architektoniczna z trade-offami
- Wybór między 2 podejściami z różnymi konsekwencjami

## Format komunikacji z Macem

Po skończonej sesji / istotnym kroku - krótki update:

```
✓ [Co zrobione]
→ [Co teraz]
? [Pytanie jeśli jest]
```

NIE: ściana tekstu, listy bullet na 30 pozycji, wyjaśnianie procesu krok po kroku jeśli nie pytał.

## Aktualizacja tego pliku

Jeśli w trakcie pracy okaże się że coś tu jest złe lub brakuje czegoś - **dopisz to do tego pliku**. CLAUDE.md ewoluuje z projektem.

## Linki do pełnych dokumentów

- `docs/spec.md` - pełna specyfikacja
- `docs/prompts.md` - prompty AI
- `docs/dev-guide.md` - tech stack i konwencje
- `docs/plan.md` - 7-dniowy harmonogram
- `docs/brief.md` - kontekst biznesowy projektu
- `docs/PROGRESS.md` - dziennik postępu (tworzony w trakcie)
