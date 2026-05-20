---
title: Cosmogram — Goal Instruction dla Claude Code (/goal)
created: 2026-05-20
project: cosmogram
type: claude-code-goal
status: ready-to-paste
related: brief.md, 2026-05-18-spec-v1.md, prompts-v1.md, prompts-v3-improvements.md, vibe-coding-cheatsheet.md, vibe-plan-7-days.md
---

# /goal — Cosmogram

> Wklej całą zawartość poniżej do `/goal` w Claude Code. To jest stały kompas decyzyjny dla wszystkich sesji vibe codingu. Każdą propozycję kodu, prompta lub UI Claude Code ma weryfikować przeciwko temu dokumentowi. Jeśli decyzja koliduje z tym celem — wstrzymaj się, zapytaj, nie improwizuj.

---

## 0. Jednozdaniowy cel projektu

Zbudować PWA łączącą astrologię z AI dla polskiego rynku, w której **horoskopy są maksymalnie trafne (osobiście rezonujące), maksymalnie angażujące (codzienny powrót) i maksymalnie sharowalne (one-liner-y do screenshotów)** — z modelem freemium prowadzącym do subskrypcji 29 zł/mc utrzymywanej powyżej 40% retencji 30-dniowej.

Pozycjonowanie produktu: **symboliczne lustro, nie wyrocznia.** Trzy filary: trafność × zaangażowanie × shareability — przy spiętym modelu monetyzacji freemium → subskrypcja. Pełna specyfikacja w `docs/spec.md`, prompty w `docs/prompts.md`, plan operacyjny w `docs/plan.md`.

---

## 1. Trzy nadrzędne KPI (kolejność ma znaczenie)

Każde inżynieryjne tradeoff rozstrzygaj na korzyść metryki wyżej w hierarchii:

1. **Paid subscriber 30-day retention ≥ 40%** (North Star — milestone listopad 2026, 100 subs)
2. **Share-rate per natal reading ≥ 15%** (proxy dla wow-effect: ile osób kliknie "udostępnij" lub eksportuje obrazek)
3. **Trial → paid conversion ≥ 25%** (sygnał trafności + value perception)

Counter-metric (nie pozwolić zdegradować): **AI cost / paid user ≤ 1 USD / mc**. Powyżej tego pułapu — wracamy do cache i model swapu (Haiku zamiast Sonnet dla 80% wiadomości chatu).

---

## 2. Filar #1 — TRAFNOŚĆ horoskopów (priority gate)

> Trafność = "to brzmi jak gdyby ktoś mnie znał". Bez tego nie ma share, nie ma retencji, nie ma monetyzacji. Wszystko inne jest wtórne.

### 2.1 Twarde reguły każdego prompta

Każde wygenerowanie horoskopu (natal, daily, synastry, chat, child) MUSI spełnić:

- **Forma gramatyczna spójna w 100%.** Pole `birth_data.grammatical_form` (`masculine` / `feminine` / `impersonal` / `they`) przekazywane do prompta. Krok 3.5 onboardingu zbiera tę informację. Zero mieszania form w obrębie jednego outputu — to zabija immersję natychmiast.
- **Zero meta-komentarzy o ograniczeniach.** Nigdy: "bez godziny urodzenia opieram się na…", "pomijam domy…", "z braku X używam Y". User wie co podał. Sekcja zaczyna się od konkretnego placementu.
- **Każdy placement omawiamy GŁĘBOKO tylko w swojej domowej sekcji.** Sun/Moon/Asc → sekcja 1. Moon dodatkowo → sekcja 2 (Wewnętrzne dziecko). Mars → sekcja 4 LUB 5 (wybierz). Wenus → sekcja 4. Saturn → sekcja 6. Jowisz → sekcja 3. W innych sekcjach maksymalnie jednozdaniowe nawiązanie, nigdy ponowny opis.
- **Każda rada wynika z konkretnego aspektu omawianego w tej sekcji.** Test: jeśli możesz tę poradę przykleić do innej pary / innego usera — wymyśl inną. Generic ("stwórzcie wspólny cel finansowy", "wprowadźcie cotygodniową rozmowę") = banowane.
- **Zero stereotypów płciowych w synastrii.** Atrybut wynika z aspektu, nie z płci. Opisuj dynamikę aspektu i mów po imieniu lub "osoba z Wenus w Byku", nigdy "kobieca intuicja" / "męski pragmatyzm".
- **Banlista fraz** (egzekwowana mechanicznie + przez review): "wodne podłoże emocjonalne", "ognista energia", "ziemska stabilność", "twórcza ekspresja" (bez konkretu), "fundament duchowy", "naturalna mądrość", "wewnętrzny kompas", "zaufaj sobie" (bez konkretu w czym), "Twoje przeczucie było słuszne", "energia X znaku", "twoje energie", "zaufaj procesowi", "kosmiczna podróż", "drogi czytelniku".
- **Twarde guardrails:** zero diagnoz medycznych / psychiatrycznych (delikatne odesłanie do specjalisty przy depresji/lęku), zero porad prawnych i finansowych, zero przepowiedni konkretnych zdarzeń ("rozstaniesz się w lipcu"), zero "musisz / na pewno / nigdy / zawsze".

### 2.2 Walidacja techniczna astro

- Pozycje planet z `astro-compute` muszą zgadzać się z Astro.com **do 0.1°** na 10 znanych dat (golden chart set). Test odpalany przed każdym deployem.
- System domów: domyślnie **Whole Sign** dla MVP (bezpieczne dla skrajnych szerokości); jeśli koleżanka w W0 ustali Placidus — dodajemy switch w settings (ale default zostaje WSign by default safe).
- Wersja efemerydy zapisywana w `charts.ephemeris_version` — re-compute trigger przy bumpie.
- Wszystkie outputy podpisane `readings.ai_prompt_version`, żeby móc cofnąć / regenerować retroaktywnie.

### 2.3 Bramki jakości promptów (release gate)

Zanim którykolwiek prompt trafia na produkcję:

- **Golden set ≥ 10 par** input/output dla każdego prompta (natal, daily, synastry, chat, child).
- **Koleżanka rates blind ≥ 4.0/5** na autentyczność, accuracy, voice (sekcja 10 specu).
- **Zero hallucinations technicznych** w 20 outputach z rzędu (manual audit: AI nigdy nie pisze "Pluton w Wadze" jeśli w danych jest Skorpion).
- **Voice compliance:** koleżanka czyta 10 outputów blind, identyfikuje że "to ta sama autorka" w 9/10.
- **Length compliance:** ±20% od targetu długości (natal 700-1100 słów, daily ≤150 słów, synastry 350-500, chat 100-300).

Niezdane którąkolwiek bramkę — prompt wraca do iteracji, kod nie wdraża go na prod.

---

## 3. Filar #2 — ZAANGAŻOWANIE (daily habit loop)

> Daily reading to główny retention hook. Trzy elementy: konkret, krótko, predictably świeży każdego ranka.

### 3.1 Daily reading — sztywny kontrakt formatu

Każdy daily ma **≤150 słów** w strukturze:

1. **Nagłówek dnia** (8-15 słów, konkretny obraz, nie klisza — "Dzień konkretnych decyzji - z mglistych planów wybierz jeden" TAK; "Twoja intuicja pracuje szybciej niż umysł" NIE).
2. **Co dziś wspiera** (≤50 słów, **JEDEN** konkretny tranzyt z nazwą — najściślejszy applying, manifestacja behawioralna).
3. **Co dziś uwiera** (≤40 słów, **JEDEN** trudny tranzyt, bez katastrofizowania).
4. **Zrób** (1 zdanie, behawioralne, konkretne — "Zadzwoń do mamy" TAK; "skontaktuj się z bliskimi" NIE).
5. **Unikaj** (1 zdanie, konkretne).

Zero "zaufaj swojej intuicji", zero "wszechświat dziś…", zero coachingowych ogólników.

### 3.2 Cache + cron — daily musi być gotowy zanim user wstanie

- **Pre-generation cron** o 6:00 timezone usera generuje daily na ten dzień (płatnym subskrybentom).
- TTL 24h, jedno wymuszone "odśwież" dziennie dostępne userowi.
- Push notification (PWA Web Push, iOS 16.4+ wymaga zainstalowanej PWA) dostarcza headline + CTA do otwarcia.
- Streak counter ("12 dni pod rząd") jako gamifikowany element — pokazujemy na dashboardzie, w push notice, w share image.

### 3.3 Cosmogram Chat — differentiator

- Każda odpowiedź zaczyna się od **konkretnego astrologicznego elementu** (tranzyt + natal placement), potem tłumaczy co to znaczy dla TEGO usera, nie ogólnie.
- AI pyta zwrotnie ("Czy to się zgadza?", "Co konkretnie się dzieje?") — rozmowa, nie monolog.
- 100-300 słów / odpowiedź. Nigdy >400.
- Kontekst per wiadomość: natal summary + top 5 tranzytów dnia + ostatnie 5-10 wiadomości.
- Pamięta historię konwersacji (referencja do wcześniejszych wiadomości jest mile widziana).
- **Optymalizacja kosztu:** klasyfikator na początku decyduje Haiku vs Sonnet — proste pytania (kim jestem, co znaczy mój znak) → Haiku; złożone (analiza sytuacji, synteza wielu placementów) → Sonnet 4.6.

### 3.4 Retencyjne anti-patterns (zakazane)

- ❌ Generowanie tego samego daily reading dwa razy w 24h (cache first).
- ❌ AI calls z frontendu — wszystko przez edge function, klucze nigdy w przeglądarce.
- ❌ AI na każdy page load — cache aggressively.
- ❌ Generic daily ("dzień pełen możliwości") — to natychmiastowa utrata wow.

---

## 4. Filar #3 — SHAREABILITY (wbudowane w produkt, nie dolepione)

> User ma w trakcie czytania natalu pomyśleć "BOŻE muszę to pokazać znajomym". Bez tego CAC będzie zabójczy.

### 4.1 One-liner-y w każdym natalu — twardy wymóg promptu

W każdej z 7 sekcji natalnej interpretacji **minimum 1 zdanie napisane jak cytat, nie jak ekspozycja**:

- Max 15 słów.
- Forma paradoksu, kontrastu lub odwrócenia oczekiwań.
- DOBRZE: "Twoje 'za dużo' jest dokładnie odpowiednią ilością — dla właściwych ludzi." / "Czytasz ludzi szybciej niż oni sami siebie." / "Twoja czujność z dzieciństwa stała się Twoim radarem dla bullshitu."
- ŹLE: "Masz wrażliwość połączoną z siłą." / "Twoja unikalna kombinacja…" (banał, brak ostrości).

Cel: **≥5 cytatowych zdań na pełną interpretację natalną.** Jeśli <3 — prompt wraca do iteracji.

### 4.2 Generowane obrazki do share (Canvas API)

- Po każdym natal reading: przycisk "Udostępnij" generuje obrazek 1080×1920 (IG Story) i 1080×1080 (IG Feed) z:
  - Wizualizacja kosmogramu (mini wersja)
  - **Jedno wybrane przez AI cytatowe zdanie** z interpretacji (highlighted)
  - Subtelny watermark `cosmogram.pl` (low-key, nie reklamowy)
- Po każdym Astro-Match: obrazek z wynikiem ("Anna × Marek: 78/100") + jeden insight + watermark.
- Po każdym daily streak milestone (7, 30, 100 dni): obrazek "12 dni z Cosmogramem".

### 4.3 Astro-Match jako viral driver

- Wynik 0-100 jako duży gamifikowany element (progress bar, kolor: zielony >70, żółty 50-70, czerwony <50).
- Score MUSI być uzasadniony aspektami (sekcja 2.3 prompts-v3): baza 50, +5 za harmonijny aspekt <3°, -3 za napięcie <3°. Konjunkcje wycenione per para planet (Wenus-Mars +8, Saturn-Mars -5).
- Pierwszy match w trialu darmowy → naturalny moment share ("zobaczcie nasz wynik").
- Frame share: "Sprawdź nasz Astro-Match — wyszło nam X" (nie "polecam appkę").

### 4.4 Pre-launch content jako test shareability

W W2-W3 (przed publicznym launchem) testujemy voice przez IG/TikTok content. Sygnał kill-switch: jeśli content NIE generuje >1000 view łącznie i kosmetycznego share → voice nie rezonuje i wracamy do kalibracji z koleżanką, nie do kodu.

---

## 5. Monetyzacja — freemium z miękką ścianą, jeden tier

> Model: **freemium gateway + 7-day trial bez friction + 1 płatny tier**. Nie hybrid, nie one-time micropayments do P2.

### 5.1 Free tier (cel: poczuć value, pokazać one-liner-y)

- Natal chart (pełna wizualizacja kołowa).
- **Natal teaser** (~250-400 słów): Sun + Moon + Rising. Zero pełnej interpretacji, ale z wbudowanymi **2 one-liner-ami** żeby user zobaczył jakość.
- 1 daily reading (sample, żeby zobaczyć format).
- 1 Astro-Match (pierwszy partner) — celowo aby user PO match-u był maksymalnie blisko share + trial CTA.
- 3 wiadomości w Cosmogram Chat (paywall po 3.).

### 5.2 Trial (7 dni, low-friction A/B test)

- **A/B test:** wariant z kartą wymaganą (lower CAC, niższy conversion) vs bez karty (wyższy signup, niższy paid). Default: bez karty pierwsze 60 dni, potem decyzja na bazie danych.
- Pełen dostęp do wszystkich features w trialu.
- Trigger pointy w UI prompujące upgrade: po pierwszym darmowym Astro-Match, po 3. daily reading, na dzień przed końcem trialu.
- Email cadence (Resend): welcome → dzień 3 "co już wypróbowałeś" → dzień 5 "co tracisz" → dzień 6 "trial kończy się jutro" → dzień 7 "zostań / pa".

### 5.3 Paid tier — Cosmogram Plus

- **29 zł / mc** lub **290 zł / rok** (~24 zł/mc, -17%). A/B test 29 vs 39 zł po pierwszych 60 dniach.
- Co zawiera:
  - Pełna interpretacja natalna (vs. teaser).
  - Daily reading codziennie, unlimited.
  - Astro-Match do 5/mc (potem +5 zł / match).
  - Cosmogram Chat unlimited.
  - Year-ahead overview raz w roku przy subskrypcji.
- Anti-pattern (DO NOT): nie wprowadzamy 2 tierów w MVP. To rozprasza decyzję paid/nie-paid. Dodatkowe tiery do rozważenia dopiero >500 subs.

### 5.4 Paywall — taktyka

Funkcja `hasActiveSubscription(user_id)` jako single gate. Sprawdza `subscriptions.status IN ('active', 'trialing')`. Gate'uje:

- Daily reading (po 1. darmowym).
- Astro-Match (po 1. darmowym).
- Chat (po 3 wiadomościach).
- Pełna interpretacja natalna (zawsze gated dla free).

Modal "Odblokuj Cosmogram Plus" pokazuje wprost co user dostaje + 7-day trial CTA. Zero dark patterns. Zero "okupowania" UI z paywall.

### 5.5 Phase 2 monetization addons (NIE w MVP)

- Deep dive PDFs (Złoty Kompas — career, Bagaż Karmiczny — north node) jako **one-time 39-79 zł, TYLKO dla subskrybentów lub z 30% rabatem dla nich**. Boost ARPU, nie alternatywa.
- Year-ahead extended (30-stronicowy raport) jako one-time 79 zł.
- Native mobile, community/forum, live readings — KILLED dla MVP, decyzja >1000 subs.

### 5.6 Stripe + technical

- Stripe Subscriptions + Checkout + Stripe Tax (PL VAT 23%).
- Webhook do edge function `stripe-webhook` aktualizuje `subscriptions` table (status, current_period_end, canceled_at).
- Wszystkie ceny w PLN; karty międzynarodowe akceptowane (PLN charged).
- Coupon 100% off dostępny dla testowej grupy znajomych w soft launch.

---

## 6. Hierarchia decyzji — jak rozstrzygać tradeoff

Gdy decyzja techniczna może iść w dwie strony, rozstrzygaj w tej kolejności:

1. **Czy poprawia trafność horoskopu?** → preferuj.
2. **Czy poprawia daily retention loop?** → preferuj.
3. **Czy zwiększa share-rate?** → preferuj.
4. **Czy chroni unit economics (AI cost ≤ 1 USD/paid user/mc)?** → preferuj.
5. **Czy upraszcza implementację (mniej kodu, mniej bugów)?** → preferuj.
6. **Czy "fajniej wygląda"** → ostatnie kryterium, prawie nigdy decydujące.

Przykład zastosowania:

- "Czy dodać tarot deck?" → konflikt pozycjonowania ("lustro, nie wyrocznia") + brand confusion + już istnieje konkurencja → **KILL** (decyzja zapadła, nie litygujemy).
- "Czy generować daily dla wszystkich naraz przez cache 'transit-base'?" → poprawia unit economics + neutralne dla trafności → **TAK w P1, nie MVP**.
- "Czy zrobić animowaną wizualizację kosmogramu?" → "fajniej wygląda" + zero wpływu na trafność → **NIE w MVP**.

---

## 7. Anti-cele (czego NIE robimy w tej sesji)

- ❌ Native mobile app (PWA wystarczy do 12 mies / 1000 subs).
- ❌ Community/forum (Reddit /r/astrology już to robi za darmo).
- ❌ Live readings (operacyjne piekło, nie nasz model).
- ❌ Tarot integration (konflikt pozycjonowania).
- ❌ Drugi tier subskrypcji (decision paralysis).
- ❌ B2B / dla wróżek-profesjonalistów (inny segment, później).
- ❌ Internationalization w UI (architektura przygotowana, ale PL na start).
- ❌ SSR / server components (PWA client-rendered).
- ❌ RAG dla chatbota (structured prompting wystarczy i jest tańsze).
- ❌ Hardkodowanie promptów w kodzie (zawsze przez `packages/prompts/` z version tagiem).
- ❌ API calls z frontendu (wszystko przez edge function).
- ❌ Generowanie daily bez cache.

---

## 8. Bramki decyzyjne (kill switches)

Cel istnieje w kontekście kill switchy z briefa — Claude Code ma je honorować przy każdej propozycji scope expansion:

- **W4 (16-22 czerwca 2026):** waitlist >100, pre-launch content >1000 view, sygnał rezonansu pozycjonowania. Jeśli nie — wracamy do Sigil Wear, ten projekt zamykany.
- **Miesiąc 3 (sierpień 2026):** 100+ subs + retencja 30d >40% → skala (płatne kampanie). 50-100 subs / retencja <40% → pivot promptów lub ceny. <50 subs → kill.
- **Miesiąc 6 (listopad 2026):** 100 płatnych subs i break-even na infra to milestone success.
- **Counter-metric trigger:** jeśli AI cost / paid user > 1 USD/mc → wstrzymanie scope, re-architektura cache + model swap.

Każda decyzja "dodajmy feature X" musi przejść test: czy pomaga osiągnąć najbliższą bramkę? Jeśli nie — odłóż na backlog.

---

## 9. Ground rules dla Claude Code (operacyjne)

- **CLAUDE.md** w korzeniu repo to single source of truth procedur. Każda sesja zaczyna od `docs/spec.md` + `docs/prompts.md` + tego pliku (`docs/goal-instruction.md`).
- **`docs/PROGRESS.md`** — dziennik po każdym dniu pracy. Bez tego po 3 dniach Claude Code zaczyna powtarzać błędy.
- **Po każdym dniu z `vibe-plan-7-days.md`:** commit + push + `/clear` + zapis w PROGRESS.md. Nie idź dalej jeśli deliverable danego dnia nie działa.
- **Każdy nowy prompt** otrzymuje version tag (`natal-v1.2`), trafia do `packages/prompts/` i ma towarzyszący golden set test.
- **Wersjonowanie outputów:** każdy `readings` row ma `ai_prompt_version` i `ephemeris_version` — retroaktywne regeneracje są możliwe.
- **Test commands** istnieją: `pnpm test`, `pnpm test:e2e`, `pnpm eval:prompts`. Każdy PR przechodzi `eval:prompts` minimum.
- **Cost monitoring** — daily dashboard z tokenami i $/user. Alert powyżej progu z sekcji 1.

---

## 10. Definition of Done dla MVP (7 dni vibe codingu)

MVP uważamy za skończony, gdy:

1. User może przejść onboarding (z godziną lub bez), dostać natal interpretation, daily reading, Astro-Match, użyć Cosmogram Chat.
2. Subskrypcja przez Stripe działa end-to-end (7-day trial → paid → access do wszystkich features).
3. Push notifications dostarczają daily reading rano.
4. Prompty mają zaliczone bramki jakości z sekcji 2.3 (golden set + koleżanka 4.0/5).
5. 5-10 znajomych ma dostęp i daje feedback przez Tally/Typeform.
6. PostHog mierzy funnel: signup → onboarding_complete → first_natal_view → trial_started → payment_completed.
7. Lighthouse PWA score >90.
8. E2E testy w Playwright dla 4 krytycznych ścieżek (rejestracja, partner+match, chat, trial→payment).
9. `astro-compute` przechodzi golden test (5+ dat zgodnych z Astro.com do 0.1°).
10. Co najmniej 3/5 testerów mówi "płaciłbym za to".

Jeśli 10/10 spełnione → trzeci tydzień to publiczny launch. 7-9/10 → tydzień iteracji. <7/10 → wracamy do diagnozy z koleżanką, nie do kodu.

---

## 11. Co Claude Code MA robić proaktywnie w każdej sesji

- Przypominać o tym goal-u jeśli scope czata zaczyna dryfować (np. user prosi o feature który koliduje z sekcją 7).
- Sugerować backlog zamiast implementacji dla rzeczy "fajnie by było".
- Pytać o `grammatical_form` zanim zacznie pisać kod związany z promptem.
- Weryfikować nowy prompt przeciwko regułom z sekcji 2.1 PRZED implementacją (lista kontrolna: forma gramatyczna, banlista, anti-meta, hierarchia domowych sekcji, one-liner-y, brak stereotypów).
- Logować w PROGRESS.md każdą decyzję techniczną która nie była explicitly w specu.
- Przy każdej zmianie prompta — proponować dodanie/aktualizację case'u w golden set.
- Przy każdej zmianie pricing / paywall logiki — explicit potwierdzić że nie tworzy drugiego tieru i nie wprowadza one-time payments.

---

## 12. Najczęstsze pułapki — preempt

| Pułapka | Sygnał | Reakcja |
|---|---|---|
| Generic daily ("zaufaj swojej intuicji") | Prompt wraca bez konkretnego tranzytu | Force JEDEN tranzyt z nazwą + applying orb |
| Mieszane formy gramatyczne | "byłeś" + "Twoje za dużo" w jednym tekście | Sprawdź `grammatical_form` propagację end-to-end |
| Meta-komentarze | "Bez godziny opieram się na…" | Anti-meta rule w prompcie, regex check post-gen |
| Powtórzenia placementów | Mars-Koziorożec w 3 sekcjach | Hierarchia domowych sekcji w prompcie |
| Generic synastry advice | "Stwórzcie wspólny cel finansowy" | Test "nie pasuje do innej pary" — każda rada do konkretu aspektu |
| Stereotypy płciowe | "Ona intuicyjnie wyczuwa jego potrzeby" | Anti-gender rule w synastry prompcie |
| AI cost explosion | $/user >1 USD/mc | Model swap Haiku/Sonnet klasyfikator, cache transit-base |
| Brak one-linerów | <3 cytatowych zdań w natalu | Force min 1/sekcja, golden set test |
| Drugi tier "tylko na chwilę" | Stripe ma >1 product | Sekcja 5.3 zabrania, kill propozycję |
| Featuritis | "dodajmy mood tracker" | Sekcja 7 anti-cele, propose backlog |

---

## 13. Linki

- `docs/brief.md` — kontekst portfolio + strategia
- `docs/spec.md` — pełna specyfikacja produktu (2026-05-18-spec-v1.md)
- `docs/prompts.md` — prompty AI v1 + v3 improvements
- `docs/dev-guide.md` — tech stack, folder structure, conventions (vibe-coding-cheatsheet.md)
- `docs/plan.md` — operacyjny plan 7 dni (vibe-plan-7-days.md)
- `docs/child-horoscope-feature.md` — feature spec horoskopu dziecka (Dzień 8+)
- `docs/PROGRESS.md` — dziennik decyzji (tworzony w trakcie)

---

## Changelog

- **v1.0 (2026-05-20)** — pierwsza wersja goal-instruction wyciągnięta z briefa, specu v1, prompts v1+v3, vibe-plan-7-days. Trzy filary (trafność, zaangażowanie, shareability) + freemium z 1 tierem. Do walidacji po W0 weekend z koleżanką-astrolożką (sekcje 2.1, 2.3, 3.3 mogą wymagać aktualizacji o jej voice/system domów/whitelistę-banlistę).
