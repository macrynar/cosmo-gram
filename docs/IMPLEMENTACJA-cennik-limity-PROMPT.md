# Prompt wdrożeniowy dla Claude Code — globalne wdrożenie cennika, limitów i zasad freemium

> Wklej całość jako zadanie w Claude Code (VS). To spec, nie luźny opis — trzymaj się go.
> Źródło prawdy modelu: `docs/PROJECT-STATUS.md` → sekcja „Model biznesowy" + `docs/Cosmogram_model_biznesowy.xlsx`.

---

## 0. Kontekst i cel

Wdrażamy finalny model monetyzacji Cosmogramu. Cel: **maksymalizować liczbę płatnych userów** przy **bezpiecznym koszcie AI** (marża blended ≥60%, realnie ~80%/mc, ~71%/rok). Zasada przewodnia freemium: **free = częściowy, prawdziwy wow interpretacji AI (3/8), płatny payload generowany i gatowany po stronie serwera.** Nigdy „generuj pełne i schowaj przed userem".

Decyzje są **zatwierdzone przez Maca** — nie re-litygujesz cen ani limitów. Implementujesz mechanikę. Każdy widoczny dla usera **copy** (cennik, paywalle, CTA) zostaw jako placeholder oznaczony `// TODO COPY (Mac)` — finalny tekst zatwierdza Mac.

---

## 1. Decyzje zatwierdzone

**Cennik:**
- Premium miesięczny: **24,99 zł** (z 19,99).
- Premium roczny: **199 zł/rok** (nowy plan; ~16,58/mc; ~33% taniej).
- Paczki czatu: Small **12,99 zł**/50 wiad. · Medium **34,99 zł**/150 · Large **199 zł**/500.
- **Bez triala.**

**Limity free vs premium:**

| Funkcja | FREE | PREMIUM |
|---|---|---|
| Kosmogram dorosłego | 1 karta własna, **3/8 modułów** + share | pełne 8 + cudze karty, **5/mc** |
| Kosmogram dziecka | **2/6 modułów** | pełne 6, biblioteka, **5/mc** |
| Cosmo Match | 1 match, **3/8 modułów** | pełne 8 + czat o relacji, **5/mc** |
| Cosmo Chat | 3 wiad. łącznie | **50/mc** + paczki |
| Kalendarz (interpr. dnia) | siatka + klasy + 1 teaser | bez limitu (fair-use 60/mc) |
| Listy Astrei | 1 list teaser | drip 1/tydz. |

Capy 5/mc liczone **od utworzeń w miesiącu kalendarzowym, delete-proof** (NIE od aktywnych rekordów).

---

## 2. Zakres zmian — po obszarach

Dla każdego: pliki → zmiana → kryteria akceptacji.

### 2.1 Cennik subskrypcji + Stripe (roczny plan)
**Pliki:** `src/app/pricing/page.tsx`, `src/app/api/create-checkout-session/route.ts`, `src/context/SubscriptionContext*`, `src/components/FAQSection.tsx`, env.
- Zmień miesięczny na **24,99 zł**. Dodaj **plan roczny 199 zł** (nowy Stripe Price, recurring `year`).
- Nowy env: `NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY` (= obecny, przemianuj dla jasności) i `NEXT_PUBLIC_STRIPE_PRICE_ID_ANNUAL`. Zostaw wsteczną zgodność z `NEXT_PUBLIC_STRIPE_PRICE_ID` jeśli używane gdziekolwiek.
- `create-checkout-session` przyjmuje `plan: "monthly" | "annual"` i wybiera właściwy `priceId`.
- Pricing UI: przełącznik Miesięczny/Roczny, badge „~33% taniej / 2 miesiące gratis" na rocznym. Copy = `// TODO COPY (Mac)`.
- **Stripe (Mac/dashboard):** utwórz 2 nowe Price (24,99/mc, 199/rok) + zaktualizuj 3 Price paczek. ID wpisać do env. NIE twórz Price z kodu.
- **Done:** checkout dla obu planów działa end-to-end (test mode), webhook (`stripe-webhook`) poprawnie zapisuje `current_period_start/end` dla rocznego, `SubscriptionContext` widzi aktywną sub.

### 2.2 Cosmo Chat — limit 50/mc
**Pliki:** `src/app/api/chat/message/route.ts`, `src/app/api/chat/status/route.ts`.
- `PREMIUM_MONTHLY_LIMIT`: **150 → 50**. `FREE_CHAT_MESSAGES`: zostaje **3**.
- Wyciągnij obie stałe do jednego współdzielonego configu (np. `src/lib/chatLimits.ts`), żeby `message` i `status` nie rozjechały się.
- **Done:** po 50 wiad. w okresie rozliczeniowym premium dostaje `MONTHLY_LIMIT`/`NEED_TOPUP`; modal paczek się pokazuje; licznik w `CreditMeter` pokazuje 50.

### 2.3 Paczki czatu — reprice
**Pliki:** `src/components/ChatPackModal.tsx` (ceny wyświetlane), `src/app/api/chat/buy-pack/route.ts`, env `STRIPE_PRICE_CHAT_PACK_*`.
- `ChatPackModal` PACKS: Small **12,99 zł**, Medium **34,99 zł**, Large **199,00 zł**. Credits bez zmian (50/150/500).
- Zaktualizuj Stripe Price ID paczek (Mac w dashboardzie). 
- **Done:** kwoty w modalu = kwoty w Stripe Checkout; zakup dolicza właściwe `chat_credit_balance`.

### 2.4 Kosmogram dorosłego — cap 5/mc (free 3/8 już działa)
**Pliki:** `src/app/api/natal-karta/route.ts`, `src/services/natalGenerator.ts`, `src/lib/moduleSpecs.ts`.
- Split modułowy 3 free / 5 premium **już istnieje** (`FREE_MODULE_IDS`, `PREMIUM_MODULE_IDS`) — nie ruszaj logiki gatowania modułów.
- Free: **1 karta własna** (już jest limit 1). Premium: dodaj **cap 5 utworzeń/mc** (patrz §2.6 licznik). Po przekroczeniu → `402 MONTHLY_LIMIT`.
- Upewnij się, że dla free generują się **tylko `FREE_MODULE_IDS`** (3 moduły), nie wszystkie 8 (kontrola kosztu).
- **Done:** free widzi 3 moduły + 5 zablokowanych z tytułami; premium generuje 8; 6. karta w miesiącu → blok.

### 2.5 Cosmo Match — FIX leak + free 3/8 + cap 5/mc  ⚠️ KRYTYCZNE
**Pliki:** `src/app/api/astro-match/route.ts`, `src/components/astro-match/CompatibilityResult.tsx`.
- **Problem dziś:** route generuje **pełne 8 modułów Sonnet (~$0,10) dla każdego, też free, bez limitu free** (cap 10/mc tylko dla płatnych, linia ~168). To leak kosztowy i wektor abuse.
- **Zmiana:**
  - Free: generuj **tylko 3 moduły** (`Ogólne/summary` + `Przyciąganie i chemia` + `Komunikacja i zrozumienie`) — mniejszy prompt + niższy `max_tokens` (~4500 zamiast 12000). Zablokowane (płatne): Wyzwania i napięcia, Trwałość i przyszłość, Przeznaczenie i lekcja, Więź emocjonalna, Wartości. Score'y deterministyczne pokazuj wszystkie (są darmowe).
  - Free **limit: 1 match** (serwerowo, delete-proof). Premium: **cap 5/mc** (zmień obecne `>= 10` na `>= 5`).
  - Przy upgrade: dogeneruj brakujące 5 modułów (osobny call) albo pełną kartę.
- **Done:** free user nie odpala generacji 8 modułów; free match ≈ $0,05; 2. free match → paywall; premium 6. match/mc → blok; w `CompatibilityResult` zablokowane moduły mają lock + CTA.

### 2.6 Kosmogram dziecka — FIX leak + premium-gate + free 2/6 + cap 5/mc  ⚠️ KRYTYCZNE
**Pliki:** `src/app/api/ai-child/route.ts`, `src/components/generate/KartaDziecka.tsx`, `src/app/app/library/page.tsx`, `src/app/app/cosmogram/page.tsx`.
- **Problem dziś:** `ai-child` nie ma **żadnego gatowania subskrypcji ani limitu** — każdy zalogowany generuje pełny Sonnet ($0,09) bez końca.
- **Zmiana:**
  - Dodaj sprawdzenie subskrypcji (`hasActiveSubscription`/`resolveActiveSubscription`).
  - Free: generuj **tylko 2 moduły** (np. „kim jest dziecko" + „potrzeby emocjonalne"), reszta zablokowana. Free **limit: 1 dziecko**.
  - Premium: pełne 6 modułów, **cap 5/mc**.
- **Done:** free generuje 2 moduły dla 1 dziecka; 2. dziecko/free → paywall; premium pełne 6 + biblioteka; 6. dziecko/mc → blok.

### 2.7 Licznik anty-abuse (delete-proof, miesięczny)  ⚠️ wspólny mechanizm
**Problem:** liczenie aktywnych rekordów (`readings`/`children`/`matches`) jest omijalne (delete + add). `ai_call_logs` **nie ma `user_id`**.
- **Rozwiązanie (rekomendowane):** nowa tabela `usage_counters(user_id, kind, period_ym, count)` z RLS owner-read, inkrementowana **serwerowo przy każdej generacji** (`kind` ∈ `natal|child|match`, `period_ym` = `YYYY-MM`). Nie dekrementuj przy delete.
  - Helper `src/lib/usageLimits.ts`: `incrementAndCheck(userId, kind, limit)` → `{ allowed, used }`.
  - Migracja: `supabase/migrations/<data>_usage_counters.sql` (+ RLS + indeks `(user_id, kind, period_ym)`).
- **Alternatywa:** dorzuć `user_id` do `ai_call_logs` i licz z logu po `task` — ale to obciąża hot-path logowania; preferuj dedykowaną tabelę.
- **Done:** delete + ponowne utworzenie **nie** resetuje licznika; cap działa per `YYYY-MM`.

### 2.8 Monitoring kosztu AI per user
**Pliki:** `src/lib/deepseek.ts` (`logAiCall`), tabela `ai_call_logs`.
- Dodaj `user_id` do `logAiCall` i kolumny `ai_call_logs` (migracja). Przekazuj `user_id` ze wszystkich miejsc wywołań (natal, match, child, chat, crony).
- Dodaj prosty widok/zapytanie „tygodniowy koszt AI / aktywny płatnik" (admin) — wystarczy SQL + ewentualnie panel w `/app/admin`.
- **Done:** da się policzyć koszt $/user/tydzień z `ai_call_logs`. Po 4–6 tyg. retuninguj capy/limit czatu.

### 2.9 Sprzątanie legacy
**Pliki:** `src/app/api/interpret/route.ts`, `src/app/generate/page.tsx`.
- `/api/interpret` (Haiku, single-call) to **stara ścieżka** — live natal idzie przez `/api/natal-karta` (Sonnet moduły). Potwierdź, że `/app/generate` nie jest już linkowane w nawigacji; jeśli martwe — usuń route + stronę (albo przekieruj na `/app/cosmogram`). Jeśli wciąż używane gdzieś — ujednolić na natal-karta.
- **Done:** jedno źródło prawdy generacji natala.

### 2.10 Weryfikacja gatowania reszty (powinno już być OK)
- Kalendarz: free = siatka + klasy + 1 interpretacja teaser; premium = bez limitu + Dni Mocy + tydz./mc/rok. Potwierdź gatowanie w `day-interpretation`/`week`/`month`/`year` + crony (`weekly-horoscope`, `monthly-forecast`, `daily-personal-horoscope` mają być **premium-only**).
- Listy: free 1 teaser → ściana; premium drip. Potwierdź.
- Horoskop dnia (mail): generowany **per-znak (12/dzień)**, nie per-user. Jeśli per-user — przerób na per-znak (oszczędność na free).

---

## 3. Migracje DB (Supabase)
1. `usage_counters` (§2.7) + RLS + indeks.
2. `ALTER TABLE ai_call_logs ADD COLUMN user_id uuid` (§2.8) + indeks `(user_id, created_at)`.
> Nowe migracje, nie edycja wdrożonych. RLS owner-only na `usage_counters`.

## 4. Testy / definicja „done" (per CLAUDE.md)
- `npm run typecheck` + `npm run lint` + `npm run test` (vitest) **zielone**.
- Nowe testy jednostkowe: `usageLimits` (delete-proof, granica miesiąca, cap), limit czatu 50, gatowanie free 3/8 (natal/match) i 2/6 (dziecko), wybór planu w checkout.
- Manualnie: pełen flow free → wow 3/8 → paywall → checkout (mc i rok) → premium odblokowuje pełne moduły + capy działają.
- Zero nowych błędów 5xx i zero błędów w konsoli.

## 5. Kolejność wdrożenia (fazy, za flagą)
1. **Faza A — bezpieczeństwo kosztu (NAJPIERW):** §2.5 i §2.6 (fixy leaków) + §2.7 licznik + §2.8 `user_id`. To zamyka krwawienie zanim cokolwiek innego.
2. **Faza B — cennik:** §2.1 (roczny + 24,99) + §2.3 (paczki) + §2.2 (czat 50).
3. **Faza C — sprzątanie/monitoring:** §2.9, §2.10, panel kosztu.
- Trzymaj zmiany cen/limitów za flagą lub jednym configiem (`src/lib/pricing.ts`), żeby dało się włączyć atomowo i ewentualnie A/B-testować 24,99 vs 19,99.

## 6. Poza zakresem / decyzje Maca
- **Finalny copy** wszystkich powierzchni user-facing (cennik, paywalle, CTA, badge rocznego, locki modułów). Implementuj mechanikę, copy = `// TODO COPY (Mac)`.
- **Tworzenie Stripe Price** (sub mc/rok + 3 paczki) i wklejenie ID do env.
- Ostateczny dobór, które 3 moduły matcha i 2 moduły dziecka są darmowe (propozycja w §2.5/§2.6 — Mac może zmienić).
- Decyzja, czy `/app/generate` + `/api/interpret` usuwamy czy zostawiamy jako fallback.

## 7. Definicja sukcesu wdrożenia
- Żaden free user ani bot nie odpala pełnej generacji Sonnet (match/dziecko) bez limitu.
- Koszt free usera ograniczony (~$0,26 one-time, 1× każda funkcja).
- Marża blended płatnika ≥ ~75% (mc) / ~70% (rok) — mierzalna z `ai_call_logs`.
- Capy 5/mc delete-proof; czat 50/mc + paczki działają.
- Cennik 24,99/mc + 199/rok live, oba checkouty + webhook OK.
