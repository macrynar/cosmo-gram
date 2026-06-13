# PROMPT DLA CLAUDE CODE — P0.4: Audyt i utwardzenie bezpieczeństwa

> Skopiuj całość poniżej do Claude Code w repo cosmo-gram.

---

Pracujesz w repo aplikacji Cosmogram (www.cosmo-gram.com): Next.js 16 App Router, TypeScript, Supabase (Postgres + Auth + RLS), Stripe (subskrypcje + płatności jednorazowe), Resend, PostHog, Vercel + Vercel Cron. Endpointy AI: natal, child, match, chat, daily-horoscope (Anthropic + Google Gemini). Istnieje panel admina (`/app/admin/*`), publiczne share pages (`/share/reading/[id]`, `/share/match/[id]`), webhook Stripe i cron endpoints zabezpieczone `CRON_SECRET`.

Przeprowadź pełny audyt bezpieczeństwa i wdroż poprawki. Część mechanizmów (rate limiting, server-side limity planów, liczniki atomowe) mogła już powstać przy wcześniejszej migracji AI/paywalli — **najpierw sprawdź co istnieje, weryfikuj i uzupełniaj, nie dubluj**.

Pracuj fazami. Po każdej fazie: build + testy zielone, commit. Na końcu wygeneruj raport `docs/SECURITY-AUDIT.md`: co znalazłeś (z oceną wagi: krytyczne/wysokie/średnie/niskie), co naprawiłeś, co wymaga decyzji człowieka.

---

## FAZA 1 — Audyt RLS (najwyższy priorytet)

1. Zinwentaryzuj WSZYSTKIE tabele w schemacie i ich polityki RLS (wygeneruj zestawienie do raportu): `saved_readings`, `children`, `astro_matches`, `calendar_notes`, `user_preferences`, `subscriptions`, `usage_counters`, `purchases`, `user_consents`, `ai_prompts`, `daily_sign_horoscopes` + wszystko, co znajdziesz ponadto.
2. Dla każdej tabeli zdefiniuj oczekiwany model dostępu i zweryfikuj politykę dla każdej operacji (SELECT/INSERT/UPDATE/DELETE) osobno:
   - tabele userów: user widzi i modyfikuje wyłącznie swoje wiersze (`auth.uid()`),
   - `subscriptions`, `usage_counters`, `purchases`, `user_consents`: user czyta swoje, zapis WYŁĄCZNIE service role,
   - `ai_prompts`: wyłącznie admin (patrz Faza 4),
   - `daily_sign_horoscopes`: publiczny odczyt, zapis tylko service role,
   - anon (niezalogowany): zero dostępu do tabel userów.
3. Napisz **automatyczny test RLS** (skrypt uruchamialny w CI na bazie testowej): tworzy userów A i B + klienta anon, dla każdej tabeli próbuje przeczytać/zmodyfikować/usunąć dane cudzego usera i jako anon. Każda udana operacja krzyżowa = fail testu. Test ma być odpalany po każdej migracji (podepnij do CI).
4. Sprawdź funkcje Postgres (`security definer`!) i widoki — czy nie omijają RLS.

## FAZA 2 — Rate limiting i ochrona kosztów

1. Jeśli rate limiting istnieje — zweryfikuj pokrycie; jeśli nie — wdroż (Upstash Ratelimit lub odpowiednik działający na Vercel). Limity per user ID **i** per IP, osobne budżety:
   - endpointy AI generatywne (natal, child, match): niskie (np. 5/min, 30/h),
   - chat: średni (np. 10/min),
   - horoskop/odczyty: wyższy,
   - auth-adjacent (signup, login, reset hasła, geocoding): osobny limit anty-abuse.
2. Odpowiedź 429 z nagłówkami `Retry-After`; UI pokazuje przyjazny komunikat.
3. Zweryfikuj, że limity planów (1 natal free, 1 match free, wiadomości chat, liczniki miesięczne) są egzekwowane **server-side i atomowo** (funkcja Postgres, nie read-then-write). Testy na wyścigi: dwa równoległe requesty nie mogą obejść limitu.
4. Zweryfikuj, że treści premium nigdy nie opuszczają serwera dla free usera (zablokowane moduły natal, pełny raport match): przejrzyj response payloady, localStorage i cache — blur w UI to nie zabezpieczenie.
5. Globalny bezpiecznik kosztów: dzienny budżet wywołań AI per user (np. twardy sufit 200/dzień niezależnie od planu) + alert (log/PostHog) przy przekroczeniu progów globalnych.

## FAZA 3 — Share pages i ekspozycja danych

1. Audyt payloadu `/share/reading/[id]` i `/share/match/[id]`: publiczna strona NIE może zawierać dokładnej godziny i miejsca urodzenia ani danych konta właściciela (e-mail, user_id w czytelnej formie). Pokazuj co najwyżej: imię/pseudonim podany przez usera, znaki, treść interpretacji.
2. ID share linków: nieprzewidywalne (UUID v4 lub dłuższy token), brak enumeracji (404 identyczne dla „nie istnieje" i „nie udostępniono").
3. Dodaj możliwość cofnięcia udostępnienia (revoke) w UI właściciela, jeśli nie istnieje.
4. Sprawdź nagłówki cache na share pages (publiczny cache OK, ale nie dla treści po revoke).

## FAZA 4 — Panel admina

1. Dostęp wyłącznie po roli w bazie (np. tabela `admin_users` lub claim w `app_metadata` Supabase) — **żadnych e-maili hardcodowanych w kodzie**. Jeśli znajdziesz hardcode — wymień i wpisz do raportu jako krytyczne.
2. Każdy endpoint API panelu admina (prompty, evale, golden testy) weryfikuje rolę server-side niezależnie od UI. Przetestuj: zwykły zalogowany user wywołuje endpoint admina bezpośrednio → 403.
3. Operacje na promptach (`ai_prompts`) zostawiają ślad: kto, kiedy, która wersja (jeśli audit log nie istnieje — dodaj proste kolumny `updated_by`, `updated_at`).

## FAZA 5 — Walidacja inputów i prompt injection

1. Zod na WSZYSTKICH API routes: typy, zakresy dat (np. rok urodzenia 1900–obecny), długości stringów (imię ≤ 50 znaków, notatka kalendarza ≤ 2000, wiadomość chat ≤ 2000), współrzędne geo w zakresach.
2. Prompt injection: pola tekstowe usera trafiające do promptów (imię dziecka, imiona w match, notatki) — po pseudonimizacji imiona nie powinny w ogóle iść do modelu; zweryfikuj to. Treść chatu idzie do modelu z definicji — zabezpiecz system prompt (instrukcje odporności na „ignoruj poprzednie instrukcje", brak ujawniania promptu systemowego, brak zmiany roli).
3. Output AI renderowany przez React Markdown: upewnij się, że HTML jest escapowany / `rehype-sanitize`, brak `dangerouslySetInnerHTML` na treściach z modelu lub od userów (sprawdź wszystkie wystąpienia w repo).
4. Geocoding endpoint: limit + walidacja, żeby nie był darmowym proxy do zewnętrznego API.

## FAZA 6 — Webhooki, cron, sekrety, nagłówki

1. Webhook Stripe: weryfikacja podpisu (`STRIPE_WEBHOOK_SECRET`) PRZED parsowaniem, idempotencja po event ID, brak logowania pełnych payloadów z danymi osobowymi.
2. Endpointy cron: porównanie `CRON_SECRET` w constant-time, 401 bez treści diagnostycznej.
3. Sekrety: przeskanuj repo i bundle klienta — `SUPABASE_SERVICE_ROLE_KEY`, klucze AI i Stripe secret nie mogą występować w kodzie klienckim ani w żadnym `NEXT_PUBLIC_*`. Sprawdź też historię: czy `.env*` jest w `.gitignore`; jeśli sekret kiedykolwiek trafił do gita — wpisz do raportu „do rotacji".
4. Nagłówki bezpieczeństwa w `next.config` (lub middleware): `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (kamera/mikrofon off), `X-Frame-Options: DENY` (z wyjątkiem jeśli coś wymaga embedu). CSP wdroż najpierw w trybie `Report-Only`, dopracuj listę źródeł (Stripe, PostHog, Supabase, Google OAuth), po tygodniu bez raportów przełącz na egzekwowanie — w raporcie opisz dokładnie, co zostało w Report-Only.
5. Komunikaty błędów: API zwraca generyczne błędy (bez stack trace, bez SQL, bez nazw tabel); szczegóły tylko do Sentry. W Sentry włącz scrubbing danych osobowych (e-maile, daty urodzenia).

## FAZA 7 — Zależności i higiena

1. `npm audit` — napraw krytyczne i wysokie; resztę wypisz w raporcie.
2. Usuń nieużywane endpointy, feature flagi debug, console.logi z danymi userów.
3. Sprawdź uploadowane/nieużywane zależności o znanych podatnościach; zablokuj wersje (lockfile commitowany).

## FAZA 8 — Testy bezpieczeństwa w CI (warunek zakończenia)

Dodaj do CI stały zestaw testów bezpieczeństwa (osobny job):
1. Test RLS z Fazy 1.
2. E2E: free user nie dostaje treści premium w żadnym response (asercja na payloadach API, nie na UI).
3. E2E: bezpośrednie wywołanie endpointu admina jako zwykły user → 403; jako anon → 401.
4. E2E: share page nie zawiera godziny/miejsca urodzenia (asercja na HTML).
5. Test wyścigów na licznikach limitów.
6. Test: request bez/ze złym podpisem Stripe → 400; cron bez sekretu → 401.

## Zasady ogólne

- Niczego nie wyłączaj „na chwilę" (RLS, weryfikacji podpisów) — jeśli coś blokuje, zatrzymaj się i opisz problem.
- Każda poprawka = osobny, opisowy commit (raport ma się mapować na commity).
- Nie zmieniaj logiki biznesowej (ceny, limity planów) — wyłącznie egzekwowanie i bezpieczeństwo.
- Jeśli znajdziesz aktywną podatność krytyczną (np. wyciek service role key do klienta, brak RLS na tabeli z danymi userów) — napraw ją NAJPIERW, przed kontynuowaniem faz, i oznacz w raporcie.
- Na koniec zaktualizuj dokument statusu projektu (sekcja ryzyk) i `.env.example` o nowe zmienne (np. Upstash).
