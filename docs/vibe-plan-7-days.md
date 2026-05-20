---
title: Cosmogram - Plan 7 dni vibe codingu
created: 2026-05-18
project: cosmogram
type: operational-plan
status: ready
---

# Plan 7 dni - od zera do działającej apki

> To jest dokument operacyjny. Trzymaj go otwarty obok Claude Code w Visual Studio. Każdy dzień ma deliverable który musisz zobaczyć działający na koniec dnia. Jeśli nie działa - nie idź do następnego dnia.

> Pełna specyfikacja: `2026-05-18-spec-v1.md`. Prompty: `prompts-v1.md`. Tech stack i konwencje: `vibe-coding-cheatsheet.md`.

---

## Zasada nadrzędna

**Jeden dzień = jeden focus. Po skończeniu dnia: commit + push + `/clear` w Claude Code + zapis w PROGRESS.md.**

Nie próbuj robić dwóch rzeczy w jednym dniu. Lepiej skończyć Dzień 1 idealnie niż zacząć cztery dni na pół.

---

## Dzień 0 - Przed weekendem (1-2 godziny)

**Cel:** infrastruktura stoi pusta, gotowa do kodu.

Zadania:
1. Stwórz nowe repo `cosmogram` na GitHubie (private)
2. W lokalnym folderze: `mkdir cosmogram && cd cosmogram && git init`
3. Skopiuj do folderu `docs/`:
   - `2026-05-18-spec-v1.md` → `docs/spec.md`
   - `prompts-v1.md` → `docs/prompts.md`
   - `vibe-coding-cheatsheet.md` → `docs/dev-guide.md`
   - `vibe-plan-7-days.md` (ten plik) → `docs/plan.md`
   - `brief.md` (z projektu) → `docs/brief.md`
4. Stwórz w korzeniu repo plik `CLAUDE.md` (skopiuj zawartość z osobnego pliku `CLAUDE-md-skeleton.md`)
5. Załóż konto Supabase, stwórz projekt `cosmogram-prod` (zapisz URL i klucze)
6. Załóż konto Vercel, podepnij repo
7. Załóż konto Stripe (test mode na razie)
8. Otwórz Visual Studio Code w folderze. Sprawdź że Claude Code działa.
9. Pierwszy prompt do Claude Code: **"Przeczytaj CLAUDE.md i wszystkie pliki w docs/. Streść mi jednym akapitem co budujemy i jakie są zasady. Nie zaczynaj jeszcze kodować."**

**Deliverable końca dnia:** Claude Code potwierdza że rozumie projekt, repo na GitHubie istnieje, Supabase i Vercel czekają.

---

## Weekend - Rozmowa z koleżanką

**Sobota lub niedziela.** Nie kodujesz. Plan rozmowy: `2026-05-W0-questions-for-astrologer.md`.

**Niedziela wieczór:** zapisujesz wynik do `analyses/2026-05-W0-partnership-outcome.md`. Najważniejsze do utrwalenia:
- Voice/tone - jak ma brzmieć AI
- Banned phrases (czego NIGDY)
- Whitelisted phrases (jej ulubione frazy)
- System domów (Placidus/Whole Sign/inny)
- 3 priorytety w pierwszej interpretacji
- Czy daje 10 sample interpretations

Jeśli rozmowa pójdzie źle (NIE od koleżanki) - **wstrzymaj kodowanie**, wróć do `decisions/2026-05-18-week-0-partnership-decision.md` sekcja "Możliwe wyniki rozmowy: NIE". Tam jest fork w drogę.

Jeśli rozmowa pójdzie dobrze - **w niedzielę wieczór zaktualizuj prompty v1** o jej wkład. Najlepiej kazać Claude Code: *"Zaktualizuj docs/prompts.md na podstawie ustaleń z analyses/W0-outcome.md - voice section i banned phrases."*

---

## Dzień 1 - Fundament

**Cel:** user może się zarejestrować, wpisać dane urodzenia, dane są w bazie. Nie ma jeszcze kosmogramu.

Co Claude Code robi (możesz wkleić ten brief 1:1):

```
Przeczytaj docs/spec.md sekcje 4-5 i docs/dev-guide.md całość.

Zadania na dziś:
1. Scaffold projekt: Vite + React 18 + TypeScript + Tailwind + shadcn/ui
2. Skonfiguruj React Router z placeholderami: /, /onboarding, /dashboard, /astro-match, /chat, /settings
3. Dodaj klient Supabase w src/lib/supabase.ts
4. Stwórz migracje Supabase dla tabel: users, birth_data, charts, readings, subscriptions (zgodnie z docs/spec.md sekcja 5)
5. Skonfiguruj Supabase Auth: email magic link + Google OAuth
6. Zbuduj komponent OnboardingFlow w 3 krokach:
   - Krok 1: birth date (date picker, 1900-dziś)
   - Krok 2: birth place (Google Places autocomplete, restrict do cities, zapisz lat/lon/timezone)
   - Krok 3: birth time (HH:MM picker) + duży przycisk "Nie znam godziny"
7. Po submit: zapisz birth_data do bazy, redirect do /dashboard z loaderem "Generujemy Twój kosmogram..."

Dashboard zostaw pusty - na razie tylko placeholder "Tu będzie Twój kosmogram".

Wszystkie copy po polsku. Mobile-first. Wszystkie env vars w .env.example.

Po skończeniu - dopisz do docs/PROGRESS.md co zrobiłeś i jakie podjąłeś decyzje techniczne.
```

**Test na koniec dnia:** Zarejestruj się sam, przejdź onboarding, sprawdź w Supabase Dashboard że Twoje dane są w `birth_data`.

---

## Dzień 2 - Wow moment

**Cel:** po onboardingu user widzi swój kosmogram + czyta interpretację AI.

```
Przeczytaj docs/spec.md sekcja 6 i docs/prompts.md sekcje 1, 2, 6.

Zadania:
1. Stwórz Supabase Edge Function "astro-compute":
   - Input: birth_data_id
   - Używa Swiss Ephemeris (swisseph-wasm albo pyswisseph w Pythonie)
   - Output: zapisuje JSON do tabeli charts (pozycje planet, domów, aspektów)
   - System domów: [WSTAW TO CO POWIEDZIAŁA KOLEŻANKA W WEEKEND]
2. Walidacja: dla 5 znanych dat porównaj output z Astro.com (jedna z dat: 1985-03-15, 08:45, Warszawa, Polska). Pozycje planet muszą zgadzać się do 0.1 stopnia. Pokaż mi tabelę porównawczą zanim ruszysz dalej.
3. Stwórz Edge Function "ai-natal":
   - Input: birth_data_id
   - Czyta chart z bazy
   - Jeśli birth_time_unknown=true → użyj promptu #6 (fallback)
   - W przeciwnym razie → użyj promptu #2 (pełny)
   - Wywołuje Claude Sonnet 4.6 przez Anthropic API
   - Zapisuje wynik do tabeli readings z ai_prompt_version="natal-v1.0"
   - Zwraca {reading_id, text}
4. Komponent NatalChartView - wizualizacja kołowego kosmogramu (znajdź gotową bibliotekę React, np. astrochart2, lub narysuj SVG)
5. Komponent NatalReading - renderuje tekst z markdown
6. Połącz: po onboardingu → astro-compute → ai-natal → pokaż chart + reading

Loading state podczas generowania (15-20 sekund AI): pokazuj ciekawostki astrologiczne na rotacji.

Po skończeniu - dopisz do PROGRESS.md.
```

**Test na koniec dnia:** Załóż drugiego usera (np. dane koleżanki), zobacz czy interpretacja jest sensowna. Jeśli AI gada bzdury - to znak że prompt potrzebuje pracy z koleżanką, nie kodu.

---

## Dzień 3 - Habit (codzienne czytanie)

**Cel:** dashboard pokazuje świeży odczyt na dziś. Następnego dnia odczyt jest nowy.

```
Przeczytaj docs/prompts.md sekcja 4.

Zadania:
1. Edge Function "transit-compute":
   - Input: chart_id (natalny kosmogram) + data
   - Oblicza pozycje planet na daną datę
   - Oblicza aspekty między dzisiejszymi tranzytami a natalnymi planetami
   - Zwraca top 5 aktywnych tranzytów (orb <2 stopnie, applying preferred)
2. Edge Function "ai-daily":
   - Input: user_id, date (default: dzisiaj)
   - Sprawdź cache w readings (czy istnieje reading_type='daily' dla user_id+date)
   - Jeśli tak - zwróć z bazy
   - Jeśli nie - wywołaj transit-compute, potem ai-daily prompt (sekcja 4), zapisz w readings, zwróć
3. Cron job w Supabase (lub Edge Function z scheduled trigger) - generuje daily readings dla wszystkich aktywnych userów o 6:00 ich timezone (pre-generation, żeby user nie czekał rano)
4. UI:
   - Dashboard pokazuje na górze kartę z dzisiejszym readingiem
   - Historia ostatnich 7 dni (lista z datą + nagłówkiem każdego readingu)
   - Możliwość manualnego "odśwież" max 1x dziennie

Po skończeniu - dopisz do PROGRESS.md.
```

**Test na koniec dnia:** Wejdź dziś, zobacz reading. Zmień systemową datę w Supabase na jutro (albo poczekaj), sprawdź że jutro generuje nowy reading.

---

## Dzień 4 - Revenue (Astro-Match / synastria)

**Cel:** user dodaje partnera, dostaje raport kompatybilności z gamifikowanym wynikiem.

```
Przeczytaj docs/prompts.md sekcja 5 i docs/spec.md sekcja 4.F4.

Zadania:
1. UI "Dodaj profil":
   - Modal z formularzem (te same pola co onboarding: data, miejsce, godzina opcjonalna)
   - Pole "Imię profilu" (np. "Marek", "Mama", "Crush z Tindera")
   - Pole "Relacja" (dropdown: partner / rodzic / przyjaciel / inne)
   - Zapis: nowy rekord w birth_data z user_id usera + relation = 'partner' (lub inne)
2. Edge Function "synastry-compute":
   - Input: birth_data_id_a, birth_data_id_b
   - Oblicza aspekty między planetami osoby A i B
   - Oblicza house overlays (gdzie planety A wpadają w domy B i odwrotnie)
   - Zwraca strukturę dla AI
3. Edge Function "ai-synastry":
   - Wywołuje prompt #5 (sekcja 5 w prompts.md)
   - Zapisuje w readings z reading_type='synastry', synastry_partner_id
4. UI matchu:
   - Wynik 0-100 jako duże kółko z liczbą (gamified, kolory: zielony >70, żółty 50-70, czerwony <50)
   - 4 sekcje pod spodem: Komunikacja, Namiętność, Wspólne wartości, Wyzwania
   - Każda sekcja zwijana/rozwijana
   - Przycisk "Udostępnij" - generuje obrazek do social media (canvas API) z wynikiem
5. Lista matchów w profilu - historia, możliwość kliknięcia żeby zobaczyć ponownie

Bez paywalla na razie - paywall dodamy Dzień 6.

Po skończeniu - dopisz do PROGRESS.md.
```

**Test na koniec dnia:** Zrób match siebie z koleżanką, zrób match siebie z partnerem/partnerką. Sprawdź czy wynik ma sens (czy zgadza się z Twoim doświadczeniem życiowym - bo to jest test usera, nie test kodu).

---

## Dzień 5 - Cosmogram Chat

**Cel:** user wchodzi na /chat, zadaje pytanie, dostaje odpowiedź w kontekście swojego kosmogramu.

```
Przeczytaj docs/prompts.md sekcja 7 (Cosmogram Chat) całą.

Zadania:
1. Tabela conversations: id, user_id, created_at, updated_at, title
2. Tabela messages: id, conversation_id, role ('user'|'assistant'), content, created_at, tokens_in, tokens_out, model_used
3. Edge Function "ai-chat":
   - Input: conversation_id, user_message
   - Fetchuje user_id z conversation
   - Fetchuje natalny chart usera (summary, nie pełny)
   - Fetchuje dzisiejsze tranzyty top 5
   - Fetchuje ostatnie 10 wiadomości z conversation
   - Buduje prompt zgodnie z sekcją 7
   - Wywołuje Claude Sonnet 4.6 (dla MVP wszystko Sonnet, optymalizacja Haiku w przyszłości)
   - Zapisuje user_message + assistant_message do messages
   - Zwraca assistant_message
4. UI chata:
   - Lista konwersacji w sidebar (jak ChatGPT)
   - Główny obszar: messages z user/assistant bubbles
   - Input na dole z przyciskiem send + Enter
   - Loading state podczas AI response (kropki "Cosmogram myśli...")
   - Pierwsza wiadomość w nowej konwersacji: AI sam się przedstawia (zgodnie z edge case "puste history")
5. Nazwa konwersacji generowana automatycznie z pierwszej wymiany (kolejny mini-prompt: "podsumuj tę rozmowę w 4 słowach")

Po skończeniu - dopisz do PROGRESS.md + zapisz w nim koszty tokenów po 10 testowych wiadomościach.
```

**Test na koniec dnia:** Zadaj 5 pytań testowych z golden set (sekcja 7 prompts.md). Sprawdź czy:
- AI używa kontekstu natalu (nie generic odpowiedzi)
- Nie wyrokuje
- Nie tłumaczy jak Wikipedia
- Pamięta o czym była wcześniej rozmowa
- Krótkie odpowiedzi (100-300 słów)

---

## Dzień 6 - Płatność i landing

**Cel:** user może zapłacić 29 zł / mc, dostaje 7-dniowy trial, paywall działa.

```
Przeczytaj docs/spec.md sekcja 8.

Zadania:
1. Stripe setup:
   - Stwórz produkt "Cosmogram Plus" w Stripe Dashboard (test mode)
   - Cena: 29 zł / mc + 290 zł / rok
   - Skopiuj price IDs do .env
2. Edge Function "create-checkout-session":
   - Input: user_id, price_type ('monthly'|'annual')
   - Tworzy Stripe Customer (lub używa istniejącego)
   - Tworzy Stripe Checkout Session z 7-day trial
   - Zwraca checkout URL
3. Edge Function "stripe-webhook":
   - Obsługuje eventy: customer.subscription.created, .updated, .deleted, invoice.payment_failed
   - Aktualizuje tabelę subscriptions
4. Logika paywalla:
   - Funkcja hasActiveSubscription(user_id) → boolean
   - Sprawdza subscriptions table: status='active' lub 'trialing'
   - Gateuje dostęp do: daily reading (po 1. darmowym), Astro-Match (po 1. darmowym), Chat (po 3 wiadomościach)
   - UI: modal "Odblokuj Cosmogram Plus" z CTA do checkout
5. Landing waitlist (osobna strona, route /, jeśli user nielogin):
   - Hero: "Twoja astrologia. Z prawdziwym głosem."
   - Sekcja "Co dostajesz" (3 ikonki + krótkie opisy)
   - Form: email + submit → zapisz w tabeli waitlist
   - Po submit: thank-you, "Dasz nam znać gdy ruszymy"
6. E-maile transactional przez Resend:
   - Welcome (po rejestracji)
   - Trial ending za 2 dni
   - Payment receipt
   - Subscription canceled

Po skończeniu - dopisz do PROGRESS.md.
```

**Test na koniec dnia:** Sam sobie zapłać (Stripe test card 4242 4242 4242 4242). Sprawdź czy subscription pojawia się w bazie. Wyloguj się, wróć na landing, sprawdź czy działa.

---

## Dzień 7 - Polish + launch

**Cel:** apka jest stabilna, ma testy najważniejszych ścieżek, 5-10 znajomych dostaje dostęp.

```
Przeczytaj docs/spec.md sekcja 10 (plan testów).

Zadania:
1. Testy E2E w Playwright:
   - Test 1: rejestracja → onboarding → pierwsza interpretacja → dashboard
   - Test 2: dodanie partnera → match → wynik
   - Test 3: chat - 3 wymiany, sprawdź czy pamięta kontekst
   - Test 4: trial → payment → odblokowanie features
2. Push notifications:
   - Service worker w public/sw.js
   - Web Push API - subscription + permission
   - Edge function "send-push" do wysyłania powiadomień daily reading
   - Pamiętaj: iOS działa tylko jeśli PWA zainstalowana
3. PostHog analytics:
   - Event tracking: signup, onboarding_complete, first_natal_view, first_daily_view, first_match, first_chat, trial_started, payment_completed, churn
   - Funnel: signup → trial → paid
4. Lighthouse audit - target >90 PWA score:
   - Manifest.json complete
   - Service worker registered
   - Mobile-friendly
   - Performance OK
5. Bug bash:
   - Przejdź wszystkie flow jako nowy user, znajdź top 5 problemów, fix
6. Soft launch:
   - Lista 5-10 znajomych do testowania
   - Wyślij im e-maile z linkiem + krótkim komunikatem "to jest 7-dniowy projekt, pomóż mi zobaczyć co działa"
   - Daj im darmowy access przez Stripe (coupon 100% off)
7. Feedback form:
   - Prosty Tally/Typeform - 5 pytań: co działa, co nie, czy byś zapłacił, ile, co dodać

Po skończeniu - dopisz do PROGRESS.md całe podsumowanie tygodnia: co zrobione, co odłożone, co dalej.
```

**Test na koniec dnia:** Sam jako nowy user przejdź pełny flow. Każdy znajomy dostaje email z dostępem.

---

## Po Dniu 7 - co robisz w drugim tygodniu

Drugi tydzień **NIE jest kodowaniem**. To jest tydzień:
- Zbierania feedbacku (czytaj odpowiedzi, rozmawiaj 1-na-1 z 3-5 testerami)
- Naprawiania top 5 problemów UX (nie więcej, tylko top 5)
- Dopracowywania promptów z koleżanką na bazie real outputów (anonimizujesz dane testerów, ona czyta 10-20 outputów, daje feedback, ty aktualizujesz prompty)
- Pierwsze treści na IG/TikTok testujące voice (5 postów)
- Decyzja: czy launch publiczny w trzecim tygodniu, czy wstrzymanie

**Jeśli feedback jest mocny (3+ testerów mówi "płaciłbym za to") → trzeci tydzień to launch publiczny + content scale.**

**Jeśli feedback jest mieszany → czwarty tydzień to iteracja, nie launch.**

---

## Tracking postępu

Plik `docs/PROGRESS.md` w repo - to Twój dziennik. Po każdym dniu:

```markdown
## Dzień X (data)

### Co zrobione
- Lista konkretów

### Decyzje techniczne (które nie były w specu)
- Decyzja: opis + powód

### Problemy
- Co poszło źle / co trzeba poprawić

### Koszty (jeśli relewantne)
- Tokeny: X
- $: Y
```

To kluczowe. Bez tego po 3 dniach nie pamiętasz dlaczego coś jest jak jest, i Claude Code zacznie powtarzać błędy.

---

## Czerwone flagi - wstrzymaj się

Zatrzymaj się i przemyśl, jeśli:

- **Dzień 1 i nie masz fundamentu pod koniec dnia** → tempo nierealne, rozważ rozłożenie na 2 dni
- **Dzień 2 i interpretacja AI jest słaba** → to nie problem kodu, to problem promptu, wróć do koleżanki
- **Dzień 5 i chat odpowiada generycznie** → kontekst nie jest poprawnie przekazywany, debug prompt
- **Dzień 7 i bugów jest 20+** → push launch o tydzień, naprawiaj
- **Po Dniu 7, znajomi mówią "ok, ale nie zapłaciłbym"** → produkt nie pasuje do rynku, vibe coding nie ratuje pozycjonowania

---

## Linki

- [[brief]] - kontekst projektu
- `2026-05-18-spec-v1.md` - pełna specyfikacja
- `prompts-v1.md` - prompty AI
- `vibe-coding-cheatsheet.md` - tech stack i konwencje
- `2026-05-W0-questions-for-astrologer.md` - pytania na weekend
- `CLAUDE-md-skeleton.md` - skopiuj do korzenia repo jako CLAUDE.md
