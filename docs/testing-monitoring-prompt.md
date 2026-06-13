# PROMPT DLA CLAUDE CODE — P0.5: Testy end-to-end i monitoring

> Skopiuj całość poniżej do Claude Code w repo cosmo-gram.

---

Pracujesz w repo aplikacji Cosmogram (www.cosmo-gram.com): Next.js 16 App Router, TypeScript, Supabase (Postgres + Auth + RLS), Stripe, Resend, PostHog, Vercel + Vercel Cron. Endpointy AI (Anthropic + Google Gemini) z fallbackami offline. Istnieją: panel admina z golden testami/evalami AI, testy bezpieczeństwa w CI (RLS, payloady, liczniki — z wcześniejszego audytu), signup wizard 3-krokowy z autostartem kosmogramu po potwierdzeniu e-maila.

Cel: pełna siatka testów e2e dla krytycznych flow + monitoring produkcji (błędy, jakość AI, dostępność, backupy). Zasada: **testy mają być deterministyczne i tanie** — żadnych prawdziwych wywołań płatnych API AI w testach.

Pracuj fazami. Po każdej fazie: build + testy zielone, commit. Rzeczy niemożliwe do zrobienia z kodu (konta w zewnętrznych usługach, ustawienia dashboardów) zbierz w `docs/MONITORING-SETUP.md` jako checklistę kroków manualnych dla właściciela.

---

## FAZA 0 — Strategia środowiska testowego (fundament, zrób porządnie)

1. **Lokalny stack testowy**: Supabase local (CLI) z migracjami z repo + seed testowy (userzy: free, premium, admin). Testy NIE dotykają produkcji.
2. **Mock AI**: warstwa providerów AI dostaje tryb `AI_MOCK=true` — deterministyczne fixtures per zadanie (natal 8 modułów, child, match, chat, horoskop) zwracane z plików. Fixtures wygeneruj raz prawdziwymi modelami i zapisz w repo (`tests/fixtures/ai/`). Dodaj fixture błędu i pustej odpowiedzi (do testów fallbacków).
3. **E-mail w testach**: potwierdzanie adresu przez Supabase Admin API (auto-confirm w testach) lub lokalny Inbucket/Mailpit z Supabase CLI — wybierz prostsze, udokumentuj.
4. **Stripe**: test mode + karty testowe; webhook lokalnie przez `stripe listen` / w CI przez bezpośrednie POST-y z podpisanymi payloadami testowymi.
5. Konfiguracja Playwright: projekt `e2e/`, retry=1, trace on failure, screenshoty przy błędzie, równoległość bezpieczna dla bazy (izolowani userzy per test).

## FAZA 1 — Cztery krytyczne flow e2e (Playwright)

**Flow A — rejestracja → kosmogram (najważniejszy test w repo):**
dane urodzenia w kroku 1 → konto w kroku 2 (checkbox regulaminu) → potwierdzenie e-maila → `/auth/callback` → autostart `?autostart=true` → wygenerowany kosmogram: 3 moduły widoczne, 5 zablokowanych (free). Asercje: treść modułów z fixtures obecna, payload API nie zawiera treści zablokowanych, karta astrologiczna się renderuje, brak błędów konsoli.

**Flow B — upgrade premium:**
free user → paywall → checkout Stripe (test card) → webhook → konto premium → 8 modułów widocznych natychmiast → liczniki (chat 150, match 10) aktywne. Plus wariant: anulowanie subskrypcji → dostęp do końca okresu → powrót do free.

**Flow C — Cosmo Match:**
premium user → formularz 2 osób (jedna z zapisanego kosmogramu, druga ręcznie z geocodingiem) → wynik (score, sekcje) → zapis → historia → share link działa bez logowania i nie zawiera danych wrażliwych → licznik matchy -1.

**Flow D — logowanie → dzienny horoskop:**
istniejący user loguje się → `/app/horoscope` → free widzi horoskop znaku (z `daily_sign_horoscopes`), premium widzi personalny → toggle e-maila horoskopu w settings zapisuje preferencję.

**Dodatkowo (krótkie):** Google OAuth callback bez zapisanej akceptacji regulaminu → ekran zgód; chat: 3 wiadomości free → 4. = paywall.

## FAZA 2 — Testy jednostkowe obliczeń astrologicznych (`/api/chart`)

Obliczenia są deterministyczne — testuj przeciwko znanym wartościom referencyjnym (pozycje z publicznych efemeryd):
1. Przypadki brzegowe: brak godziny urodzenia (kosmogram słoneczny — bez ascendentu/domów), urodzenie o północy i w południe, granice znaków (cusp ±1 minuta), 29 lutego, zmiana czasu letni/zimowy w PL, historyczne strefy czasowe (np. lata 70.), półkula południowa, miejscowości o tej samej nazwie (test geocodingu z disambiguacją), daty przed 1950 i po 2020.
2. Minimum 10 kosmogramów referencyjnych z oczekiwanymi pozycjami planet (±0,1°) i ascendentem (±1°) w `tests/fixtures/charts/`.
3. Walidacja wejścia: nonsensowne daty/współrzędne → czytelny błąd 400, nie 500.

## FAZA 3 — Sentry (błędy produkcyjne)

1. `@sentry/nextjs`: frontend + API routes + edge, source maps w deploy Vercel, release tagging (commit SHA).
2. **Scrubbing PII**: e-maile, daty urodzenia, treści czatu i współrzędne nie mogą trafiać do Sentry (beforeSend + serverside scrubbing). Przetestuj na sztucznym błędzie.
3. Filtry szumu: błędy rozszerzeń przeglądarki, anulowane requesty, znane nieistotne.
4. Alert rules (opisz w MONITORING-SETUP.md): nowy typ błędu na endpointach AI/checkout → e-mail natychmiast; reszta digest.
5. Tunel `/monitoring` (sentry tunnel), żeby adblocki nie wycinały raportów.

## FAZA 4 — Obserwowalność AI (jakość i koszty)

1. Tabela `ai_call_logs` (lub rozszerzenie istniejącego logowania): task, model, tokens_in/out, latency_ms, status (ok | retry | fallback_model | fallback_offline | error), prompt_version, user_id (hash), created_at. Zapis w każdym wywołaniu providera. RLS: tylko service role/admin.
2. Widok w panelu admina: failure rate i fallback rate per task/model/dzień, średnie tokeny i koszt (ceny modeli w configu).
3. **Alert AI**: cron (np. co godzinę) sprawdza fallback rate z ostatniej godziny; > 5% → e-mail przez Resend na adres właściciela + event do Sentry. Dead-man's-switch: jeśli cron horoskopów nie zapisał dziś 12 wierszy w `daily_sign_horoscopes` do 7:00 UTC → alert.
4. Walidacja outputu w runtime: każda odpowiedź AI przechodzi walidację schematu (zod) przed zapisem; nieprzechodzące = status `error` w logach (to jest źródło prawdy dla KPI „AI failure rate").

## FAZA 5 — Health check i uptime

1. Endpoint `/api/health`: status aplikacji + ping Supabase (lekki SELECT) + wersja (SHA). Bez danych wrażliwych, bez auth, rate-limitowany.
2. Endpoint `/api/health/cron`: data ostatniego udanego przebiegu cronów (horoskopy, e-maile) — do monitorowania z zewnątrz.
3. W `MONITORING-SETUP.md`: instrukcja konfiguracji zewnętrznego monitoringu (UptimeRobot/BetterStack — darmowy plan wystarczy): landing, `/api/health`, `/api/health/cron`, interwał 5 min, alert e-mail/push.

## FAZA 6 — Backupy i runbook awaryjny

1. Sprawdź w konfiguracji/dokumentacji projektu plan Supabase i opisz w `docs/RUNBOOK.md`: jaki backup jest aktywny (daily / PITR), jak długo trzymany, jak zrobić restore krok po kroku.
2. Dodaj skrypt `scripts/backup-verify.ts`: eksport logiczny kluczowych tabel (pg_dump przez connection string z env) do pliku lokalnego — jako dodatkowy backup manualny przed ryzykownymi migracjami + instrukcja użycia.
3. W RUNBOOK.md opisz też procedury: rotacja sekretów (Supabase, Stripe, AI, Resend), co robić przy podejrzeniu wycieku, jak wyłączyć endpointy AI awaryjnie (env flag `AI_DISABLED` — dodaj taki bezpiecznik zwracający fallback offline).
4. Pozycję „wykonaj testowy restore na projekcie scratch" dodaj do checklisty manualnej (tego nie da się zrobić z repo).

## FAZA 7 — CI/CD gating (warunek zakończenia)

1. GitHub Actions: pipeline `lint → typecheck → unit (chart + entitlements) → testy bezpieczeństwa (istniejące) → e2e (Playwright, AI_MOCK, Supabase local) → build`. Merge do `main` zablokowany bez zielonego pipeline'u (branch protection — opisz w checkliście manualnej).
2. Smoke test post-deploy: GitHub Action po deployu produkcyjnym odpytuje `/api/health` i landing; fail → e-mail.
3. Czas pipeline'u < 10 min (cache zależności, równoległość e2e); jeśli dłużej — zoptymalizuj.
4. Zaktualizuj README (jak odpalić testy lokalnie jedną komendą) i dokument statusu projektu.

## Zasady ogólne

- Testy muszą przechodzić deterministycznie 5× z rzędu (`--repeat-each=5` na koniec) — flaky test to gorszy niż brak testu.
- Żadnych prawdziwych kluczy API w testach i CI; fixtures zamiast wywołań modeli.
- Nie zmieniaj logiki produkcyjnej poza: warstwą mock AI, health endpoints, logowaniem AI, bezpiecznikiem `AI_DISABLED` i scrubbingiem.
- Wszystko, czego nie da się skonfigurować z repo (Sentry projekt, UptimeRobot, branch protection, restore drill) → checklista w `docs/MONITORING-SETUP.md` z dokładnymi krokami.
