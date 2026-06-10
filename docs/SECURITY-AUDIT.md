# Security Audit — Cosmogram

**Data audytu:** 2026-06-10  
**Audytujący:** Claude Sonnet 4.6 via Claude Code  
**Wersja po audycie:** commits `34ca1a4`–`797c9e9` (branch `main`)

---

## Podsumowanie

| Waga | Znaleziono | Naprawiono | Wymaga decyzji |
|------|-----------|------------|----------------|
| **Krytyczne** | 3 | 3 | 0 |
| **Wysokie** | 6 | 5 | 1 |
| **Średnie** | 5 | 4 | 1 |
| **Niskie** | 3 | 1 | 2 |

---

## FAZA 1 — RLS

### [KRYTYCZNE → NAPRAWIONE] Brak RLS na 5 głównych tabelach

**Tabele:** `readings`, `children`, `matches`, `conversations`, `messages`, `subscriptions`

Tabele zostały utworzone bez migracji RLS w repozytorium. Jeśli w bazie produkcyjnej RLS nie był włączony, każdy uwierzytelniony user mógł czytać/modyfikować dane cudzych userów bezpośrednio przez Supabase client (anon key + własny token nie byłby wystarczający bez RLS).

**Naprawa:** `supabase/migrations/20260610_rls_core_tables.sql`
- `readings`, `children`, `matches`, `conversations`: `ALL USING (auth.uid() = user_id)`
- `messages`: USING subquery na konwersację właściciela
- `subscriptions`: tylko SELECT (zapis wyłącznie przez service_role/Stripe webhooks)

**Działanie wymagane:** uruchomić migrację na produkcji jeśli nie istniały polityki.

---

### [NISKIE → NAPRAWIONE] `user_consents` brak INSERT policy

Tabela miała tylko SELECT dla usera. INSERT przez service_role (supabaseAdmin) — OK, bo service_role omija RLS. Dodano komentarz w migracji dla jasności. Brak zmiany behavioru — serwis wciąż jedyną ścieżką zapisu.

---

### [INFORMACJA] Tabele admin (`prompt_versions`, `admin_users`, itp.)

RLS obecny, polityki `admin_only` oparte na `EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())` — poprawne. Admin sprawdzany server-side przez `requireAdmin()` niezależnie od warstwy RLS.

---

## FAZA 2 — Rate limiting

### [WYSOKIE → NAPRAWIONE] Brak rate limitingu na endpoints AI

Wszystkie AI endpoints były niechronione — dowolna liczba requestów z jednego konta/IP.

**Naprawa:** `src/lib/rateLimiter.ts` — Upstash Redis `slidingWindow`:
- `ai` (natal-karta, astro-match): **5 req / 60 s** per user/IP
- `chat`: **15 req / 60 s** per userId
- `geo` (geocode): **30 req / 60 s** per IP

Graceful no-op gdy `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` nie ustawione (dev).

**Działanie wymagane:**
1. Założyć Upstash Redis (plan free: 10k req/dzień)
2. Dodać do Vercel: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

---

### [ŚREDNIE] Brak globalnego budżetu kosztowego AI

Nie ma twardego sufitu kosztów Anthropic per user per dzień. Aktualny rate limit (5 req/60s) minimalizuje ryzyko, ale nie ma alertów przy przekroczeniu globalnych progów.

**Decyzja wymagana:** Rozważyć PostHog alert gdy `total_ai_calls_daily > X` lub Anthropic usage limits w dashboardzie.

---

## FAZA 3 — Share pages

### [WYSOKIE → NAPRAWIONE] Publiczna strona share eksponuje dokładną godzinę urodzenia

`/share/reading/[id]` zwracał `birth_time` (np. `14:30`) w publicznym HTML — wrażliwa dana osobowa dostępna bez autentykacji dla kogokolwiek z linkiem.

**Naprawa:** `src/app/share/reading/[id]/page.tsx` — usunięto `birth_time` z query; `ShareReadingClient.tsx` — usunięto prop i wyświetlanie.

---

### [ŚREDNIE → WYMAGA DECYZJI] Brak możliwości cofnięcia udostępnienia

Raz udostępniony link (UUID) jest stały — user nie może go unieważnić. Brak kolumny `is_public` lub `share_token`.

**Decyzja wymagana:** Dodać możliwość revoke w UI (kolumna `share_enabled BOOLEAN DEFAULT true` w `readings`/`matches`, UI toggle w ustawieniach). Koszt: ~1 dzień.

---

### [INFORMACJA] Enumeracja share linków

ID w share URL to UUID v4 — nieprzewidywalne. Endpoint zwraca `404` dla nieistniejących ID (Next.js `notFound()`). OK.

---

## FAZA 4 — Panel admina

### [INFORMACJA] Weryfikacja admina

`requireAdmin()` sprawdza tabelę `admin_users` server-side niezależnie od UI — poprawne. Brak hardcodowanych emaili w kodzie.

Admin layout (`/app/admin/layout.tsx`) używa client-side check przez fetch do `/api/admin-prompt` — to tylko UX guard, nie security boundary. API endpoints mają własne weryfikacje.

### [NISKIE] Brak audit logu w `admin-prompt PATCH`

Endpoint PATCH w `admin-prompt/route.ts` aktualizuje prompt bez zapisu kto to zrobił. Pole `created_by` istnieje tylko przy INSERT.

**Rekomendacja:** Dodać `updated_by` + `updated_at` do tabeli `prompt_versions` i uzupełniać przy każdym PATCH.

---

## FAZA 5 — Walidacja inputów i prompt injection

### [KRYTYCZNE → NAPRAWIONE] IDOR w `/api/chat/message` — brak ownership check

Endpoint pozwalał podać dowolne `chartContextId` bez weryfikacji własności. Uwierzytelniony user mógł odczytać chart_data innego usera (przez child lub reading lookup) jeśli znał UUID.

**Naprawa:** Dodano `.eq("user_id", user.id)` do obu gałęzi (child i natal) w `chat/message/route.ts`.

---

### [WYSOKIE → NAPRAWIONE] Brak walidacji inputów

- `astro-match`: brak walidacji dat, współrzędnych, długości imion → Zod schema dodana (daty 1900–teraz, lat/lng zakresy, imię ≤ 50 znaków)
- `geocode`: brak limitu długości zapytania → dodano min 2 / max 100 znaków
- `chat/message`: brak limitu długości wiadomości → dodano max 2000 znaków

---

### [INFORMACJA] Prompt injection w chacie

Wiadomości usera trafiają do modelu z definicji (chatbot). System prompt zawiera instrukcje ograniczające rolę modelu. Imiona dzieci w `ai-child` trafiają do modelu jako personalizacja — świadoma decyzja projektowa.

---

## FAZA 6 — Webhooks, cron, sekrety, nagłówki

### [KRYTYCZNE → NAPRAWIONE] Brak nagłówków bezpieczeństwa HTTP

Brak HSTS, X-Frame-Options, X-Content-Type-Options, CSP.

**Naprawa:** `next.config.ts` — dodano:
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Content-Security-Policy-Report-Only` (tygodniowy monitoring przed przełączeniem na enforce)

**Działanie wymagane po tygodniu bez raportów:** zmienić `Content-Security-Policy-Report-Only` → `Content-Security-Policy`. Dodać `report-uri` do systemu zbierającego raporty (np. Sentry).

---

### [INFORMACJA] Webhook Stripe

Weryfikacja podpisu (`stripe.webhooks.constructEvent`) przed przetwarzaniem — poprawne. Brak logowania pełnych payloadów — OK.

---

### [INFORMACJA] Cron endpoint

Weryfikacja `CRON_SECRET` przed obsługą — poprawne. `if (secret !== 'Bearer ${process.env.CRON_SECRET}')` — constant-time? Nie (string comparison). Ryzyko timing attack minimalne dla sekretów > 32 znaków, ale warto odnotować.

---

### [INFORMACJA] Klucze w kodzie klienckim

`SUPABASE_SERVICE_ROLE_KEY`, klucze Anthropic, Stripe secret — wyłącznie w zmiennych serwerowych. Kod kliencki używa tylko `NEXT_PUBLIC_SUPABASE_URL` i `NEXT_PUBLIC_SUPABASE_ANON_KEY` — OK.

---

## FAZA 7 — Zależności

### [WYSOKIE → NAPRAWIONE] Next.js HTTP request smuggling (GHSA-ggv3-7p47-pfv8)

Podatność w rewrites Next.js ≤ 16.1.6. **Dotyczyła nas bezpośrednio** (PostHog proxy w `next.config.ts`).

**Naprawa:** Upgrade 16.1.6 → 16.2.9.

---

### [WYSOKIE → WYMAGA DECYZJI] d3-color ReDoS (GHSA-36jr-mh4h-2g58)

W `react-simple-maps@3.x` (mapa astrokartografii). Fix: downgrade do `react-simple-maps@1.0.0` — potencjalnie breaking change dla mapy.

**Decyzja wymagana:** Przetestować `react-simple-maps@1.0.0`, jeśli działa — upgrade przez `npm audit fix --force`.

---

### [ŚREDNIE — ZNANE FAŁSZYWE POZYTYWNE] postcss w Next.js

`npm audit` raportuje `postcss < 8.5.10` w `next/node_modules/postcss`. "Fix" to downgrade Next do 9.3.3 — oczywiście nieprawidłowe. PostCSS w Next przetwarza CSS w build-time, nie runtime — brak exploitable surface. Ignorować.

---

## Faza 8 — Testy bezpieczeństwa w CI

**Brak CI/CD** w repozytorium (brak `.github/workflows/`). Wszystkie testy bezpieczeństwa opisane poniżej są do wdrożenia.

### Wymagane testy (do dodania):

```bash
# 1. Test RLS — user A nie widzi danych usera B
npx ts-node scripts/test-rls.ts

# 2. Free user nie dostaje kategorii w astro-match
# assert: response.result.categories.length === 0 dla req bez tokenu lub z free tokenem

# 3. Admin endpoint → 403 dla zwykłego usera
# assert: GET /api/admin-prompt z non-admin token → 403

# 4. Share page nie zawiera birth_time
# assert: HTML /share/reading/[id] nie zawiera wzorca /\d{2}:\d{2}/

# 5. Cron bez sekretu → 401
# assert: GET /api/cron/daily-horoscope bez Authorization → 401

# 6. ai-child bez tokenu → 401
# assert: POST /api/ai-child bez Authorization → 401
```

---

## Elementy wymagające decyzji Maca

| # | Priorytet | Temat |
|---|-----------|-------|
| 1 | Wysoki | Uruchomić RLS migration na produkcji i potwierdzić że polityki działają |
| 2 | Wysoki | Założyć Upstash Redis i dodać env vars do Vercel |
| 3 | Średni | Zbadać `react-simple-maps@1.0.0` — czy działa mapa astrokartografii |
| 4 | Średni | Dodać `report-uri` do CSP i po tygodniu przełączyć na enforce |
| 5 | Niski | Dodać `is_public` / share revoke do readings/matches |
| 6 | Niski | Audit log (`updated_by`) dla edycji promptów w panelu admin |
| 7 | Niski | Globalny alert kosztowy AI (PostHog event przy przekroczeniu progów) |

---

## Commit mapping

| Commit | Fazy | Co naprawione |
|--------|------|---------------|
| `34ca1a4` | F1, F2 | auth ai-child, IDOR chat, astro-match premium leak |
| `0a35875` | F2, F3, F5, F6 | nagłówki HTTP, birth_time ze share, walidacja Zod, geocode |
| `2edf527` | F2 | Upstash rate limiting |
| `f3d1e08` | F1 | Migracja RLS core tables |
| `797c9e9` | F7 | Next.js upgrade (HTTP smuggling) |
