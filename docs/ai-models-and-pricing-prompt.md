# PROMPT DLA CLAUDE CODE — Migracja modeli AI + nowy model biznesowy (freemium/premium/add-ony)

> Skopiuj całość poniżej do Claude Code w repo cosmo-gram.

---

Pracujesz w repo aplikacji Cosmogram (www.cosmo-gram.com): Next.js 16 App Router (client-rendered PWA), TypeScript, Supabase (Postgres + Auth + RLS), Stripe Subscriptions, Resend, PostHog, Vercel + Vercel Cron. Wszystkie endpointy AI to Next.js API Routes. Obecnie wszystkie funkcje generatywne (natal 8 modułów, kosmogram dziecka, match, chat, dzienny horoskop) używają DeepSeek (`deepseek-chat`) przez `DEEPSEEK_API_KEY`. Prompty są wersjonowane w tabeli `ai_prompts` i zarządzane w panelu admina (`/app/admin/*`), gdzie są też golden testy i evale.

Zrealizuj DWIE powiązane zmiany: (A) pełną migrację z DeepSeek na architekturę wielomodelową Anthropic + Google, (B) nowy model biznesowy freemium/premium/add-ony z limitami egzekwowanymi server-side.

Pracuj fazami w podanej kolejności. Po każdej fazie: build przechodzi, testy przechodzą, commit. Niczego nie wdrażaj na produkcję bez zielonych testów e2e.

---

## FAZA 1 — Warstwa abstrakcji AI i routing modeli

### 1.1 Provider layer

Stwórz `src/lib/ai/` z jednolitym interfejsem dla dwóch providerów:

- **Anthropic** (oficjalny SDK `@anthropic-ai/sdk`): modele `claude-sonnet-4-6` i `claude-haiku-4-5-20251001`.
- **Google Gemini** (oficjalny SDK `@google/genai`): model `gemini-3.1-flash-lite` (zweryfikuj dokładny identyfikator w aktualnej dokumentacji Google przed implementacją).

Interfejs musi wspierać: completion zwykły i streaming, tryb JSON (structured output), retry z exponential backoff (max 3), timeout, oraz **fallback chain**: jeśli model podstawowy zawiedzie → spróbuj modelu zapasowego → dopiero potem istniejący fallback offline. Zachowaj istniejące fallbacki offline bez zmian.

### 1.2 Rejestr modeli per zadanie

Konfiguracja w jednym miejscu (`src/lib/ai/models.ts`), czytana także przez panel admina:

| Zadanie | Model podstawowy | Fallback |
|---|---|---|
| `natal` (8 modułów) | claude-sonnet-4-6 | claude-haiku-4-5 |
| `child` | claude-haiku-4-5 | gemini-3.1-flash-lite |
| `match` | claude-haiku-4-5 | gemini-3.1-flash-lite |
| `chat` | claude-haiku-4-5 | gemini-3.1-flash-lite |
| `daily-horoscope` | gemini-3.1-flash-lite | claude-haiku-4-5 |

Dodaj kolumnę/pole `model` do rekordów w `ai_prompts`, żeby panel admina pokazywał i pozwalał nadpisać model per prompt (do evali porównawczych).

### 1.3 Prompt caching (Anthropic)

W chacie i w generacji natal używaj `cache_control` na stałej części system promptu (kontekst kosmogramu, instrukcje). Kontekst kosmogramu usera w chacie to idealny kandydat — jest identyczny w każdej wiadomości sesji.

### 1.4 Pseudonimizacja promptów (wymóg RODO — krytyczne)

Przeaudytuj WSZYSTKIE endpointy AI i wymuś zasadę: **do modelu nigdy nie trafia imię użytkownika/dziecka ani surowe dane urodzenia (data, godzina, miejscowość)**. Model dostaje wyłącznie dane astrologiczne: pozycje planet, domy, aspekty, znaki (liczone lokalnie przez Swiss Ephemeris / astronomy-engine — to już istnieje). Imiona wstawiaj do wygenerowanej treści po stronie aplikacji (placeholder `{{name}}` w outputach, interpolacja przy renderze i zapisie). W chacie: dodaj krótkie ostrzeżenie w UI nad polem tekstowym („Nie podawaj w rozmowie danych wrażliwych") — treści wpisane przez usera idą do modelu as-is, tego nie filtrujemy.

### 1.5 Usunięcie DeepSeek

Po przełączeniu wszystkich endpointów: usuń klienta DeepSeek, `DEEPSEEK_API_KEY` i `DEEPSEEK_MODEL` z kodu, `.env.example` i dokumentacji. Nowe zmienne: `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY`.

### 1.6 Cache interpretacji natal

Dodaj cache wygenerowanych interpretacji natal w Supabase: klucz = hash(pozycje planet + wersja promptu + model). Ten sam kosmogram przy tej samej wersji promptu nie generuje się ponownie (dotyczy też share pages i regeneracji bez zmiany promptu).

---

## FAZA 2 — Plany, limity i licznik użycia (server-side)

### 2.1 Definicja planów

Konfiguracja w `src/lib/plans.ts` (jedno źródło prawdy dla backendu, UI i strony cennika):

**FREE:**
- 1 kosmogram natalny: generowane wszystkie 8 modułów (Sonnet), ale **odsłonięte tylko 3** (wybierz 3 najbardziej angażujące, np. Słońce/tożsamość, Księżyc/emocje, Ascendent). Pozostałe 5 renderuj jako zablurowane karty z widocznymi tytułami + CTA premium. Blur i blokada egzekwowane server-side: API zwraca free userowi wyłącznie 3 moduły + listę tytułów zablokowanych (treść zablokowanych NIE może być w odpowiedzi API ani w localStorage).
- Karta astrologiczna: pełna.
- Dzienny horoskop: **generyczny dla znaku Słońca** — patrz 3.1.
- Kalendarz: ogólne Dni Mocy (obecna logika), bez personalizacji.
- Cosmo Match: 1 match — widoczny score + pierwsza sekcja, reszta zablurowana (server-side jak wyżej).
- Cosmo Chat: **3 wiadomości lifetime** (nie miesięcznie).
- Kosmogram dziecka: brak (paywall — bez zmian).

**PREMIUM (subskrypcja):**
- Pełny natal (8 modułów) + regeneracja przy nowej wersji promptu.
- Personalny dzienny horoskop (obecna personalizacja; silnik tranzytowy to osobne zadanie — przygotuj tylko czyste miejsce w architekturze).
- Kosmogramy dzieci: limit 3 profili.
- Cosmo Match: 10 pełnych analiz / miesiąc kalendarzowy.
- Cosmo Chat: 150 wiadomości / miesiąc.
- Personalne Dni Mocy: feature flag `personal_power_days` (wyłączony — zadanie P1.3 osobno).

### 2.2 Tabele

- `usage_counters`: user_id, period (YYYY-MM lub 'lifetime'), counter_type (chat_messages | matches), used, limit_snapshot. RLS: user czyta swoje, pisze wyłącznie service role.
- `purchases`: user_id, type (chat_pack_100 | single_match_report | extra_child_slot), stripe_payment_intent_id, status, created_at. RLS jak wyżej.
- Entitlements licz z: subscriptions + purchases + plans.ts — jedna funkcja `getEntitlements(userId)` używana przez wszystkie endpointy. Żadnych rozproszonych ifów po kodzie.

### 2.3 Egzekwowanie

Każdy endpoint AI na początku: auth → `getEntitlements` → sprawdzenie i inkrementacja licznika **atomowo** (Postgres function, nie read-then-write). Przekroczenie → 402 z kodem błędu, który UI mapuje na właściwy paywall/upsell. Dodatkowo rate limiting per user i per IP na wszystkich endpointach AI (jeśli nie istnieje — dodaj, np. Upstash Ratelimit).

---

## FAZA 3 — Horoskop dzienny: rozdzielenie free/premium

### 3.1 Free: horoskop współdzielony per znak

Nowa tabela `daily_sign_horoscopes` (date, sign, content). Cron o 4:00 UTC generuje 12 horoskopów (gemini-3.1-flash-lite) — 12 wywołań dziennie łącznie, niezależnie od liczby userów. Free user dostaje horoskop swojego znaku z tej tabeli (zero wywołań AI per user). Pod horoskopem: zajawka premium („To horoskop wszystkich Baranów. Twój osobisty, liczony z Twojego kosmogramu — w premium").

### 3.2 Premium: horoskop personalny

Istniejący personalizowany horoskop zostaje benefitem premium, generowany przez gemini-3.1-flash-lite. Cron emailowy (6:00 UTC) wysyła: free userom wersję znaku, premium — personalną. Przygotuj batching crona (przetwarzanie w partiach po N userów) — to już zidentyfikowane ryzyko.

---

## FAZA 4 — Stripe: plan roczny i add-ony

### 4.1 Plan roczny

Nowy Price w Stripe: **149 zł/rok** (env: `NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY`; obecny miesięczny zostaje pod `NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY` z aliasem wstecznym). Toggle miesięczny/roczny na stronie pricing i w checkout, z badge „2 miesiące gratis".

### 4.2 Add-ony (Stripe Checkout mode=payment, one-time)

| Add-on | Cena | Efekt po webhooku |
|---|---|---|
| `chat_pack_100` | 9,99 zł | +100 do limitu wiadomości w bieżącym okresie (kumulują się, nie przepadają na koniec miesiąca) |
| `single_match_report` | 9,99 zł | odblokowanie pełnego raportu konkretnego matcha — **dostępne także dla FREE** (upsell na zablurowanym raporcie) |
| `extra_child_slot` | 4,99 zł | +1 slot dziecka ponad 3 (tylko premium) |

Rozszerz webhook Stripe o `checkout.session.completed` dla płatności jednorazowych → zapis do `purchases` (idempotentnie po payment_intent_id). Przy odstąpieniu/refundzie (`charge.refunded`) cofnij entitlement.

### 4.3 Zgodność konsumencka (wymóg prawny)

W checkout (subskrypcja i add-ony) dodaj checkbox: zgoda na natychmiastowe dostarczenie treści cyfrowych + przyjęcie do wiadomości utraty prawa odstąpienia. Bez zaznaczenia — brak przejścia do płatności. Zapisz timestamp zgody.

---

## FAZA 5 — UI: paywalle, cennik, upsell

- Komponent `LockedSection` (blur + tytuł + CTA) używany w natal i match — jeden komponent, spójny wygląd.
- Chat: licznik pozostałych wiadomości widoczny dyskretnie; po wyczerpaniu — ekran z dwiema opcjami: premium (jeśli free) / chat_pack_100 (jeśli premium).
- Strona `/pricing` i landing: zaktualizuj do nowej struktury planów (free / premium miesięczny / premium roczny) + sekcja add-onów. Spójnie z tonem „symbolicznego lustra", bez agresywnej sprzedaży.
- PostHog eventy lejka: `paywall_viewed` (z property: które miejsce), `paywall_cta_clicked`, `checkout_started`, `checkout_completed`, `addon_purchased`, `chat_limit_reached`, `match_limit_reached`.

---

## FAZA 6 — Jakość i testy (warunek zakończenia)

1. **Golden testy:** przegeneruj golden testy w panelu admina na nowych modelach (natal/child/match na Haiku+Sonnet, horoskop na Flash-Lite). Dodaj do evali check pseudonimizacji: w promptach wysyłanych do modeli nie może wystąpić imię ani data/miejsce urodzenia (test automatyczny na payloadach).
2. **Testy jednostkowe:** `getEntitlements`, liczniki atomowe (konkurencyjne inkrementacje), mapowanie webhooków, cache interpretacji.
3. **E2E (Playwright):** (a) free user widzi 3 moduły + 5 zablurowanych i API nie zwraca treści zablokowanych, (b) 4. wiadomość w chacie free → paywall, (c) zakup chat_pack → licznik +100, (d) free kupuje single_match_report → pełny raport widoczny, (e) upgrade free→premium → natychmiastowe odblokowanie 8 modułów, (f) downgrade/anulowanie → powrót do limitów free po końcu okresu.
4. **Test regresji kosztów:** zaloguj w PostHog (lub tabeli) liczbę tokenów in/out per wywołanie i model — dashboard kosztów od dnia 1.
5. Zaktualizuj `.env.example`, README i dokument statusu projektu (sekcje: Stack AI, Płatności, Wdrożone funkcje).

## Zasady ogólne

- Żadnych decyzji cenowych/limitowych poza tym dokumentem — jeśli coś jest niejasne, zatrzymaj się i zapytaj.
- Wszystkie limity i treści premium egzekwowane wyłącznie server-side; UI to tylko prezentacja.
- Każda nowa tabela: RLS od razu, z testem negatywnym (user A nie czyta danych usera B).
- Migracje Supabase jako pliki SQL w repo, idempotentne.
- Nie zmieniaj treści promptów astrologicznych (poza pseudonimizacją zmiennych) — tuning treści to osobny proces przez panel admina.
