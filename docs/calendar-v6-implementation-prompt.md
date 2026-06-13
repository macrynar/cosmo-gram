# Prompt wdrożeniowy: Kalendarz → Prognoza (v6 dashboard)

> Wklej całość do Claude Code w repo Cosmogram. Prompt zakłada bezpośredni dostęp do kodu.

---

## 0. Kontekst i zasady pracy (przeczytaj zanim dotkniesz kodu)

Przebudowujesz feature kalendarza astrologicznego z przeładowanej „przeglądarki danych" w **dashboard astrologa** odpowiadający na pytania życiowe datami. To **szósta iteracja** — pięć poprzednich zawiodło, bo: (a) limity były w dokumencie, nie w kodzie, (b) duże prompty były wdrażane częściowo i mergowane bez odpalenia kryteriów odbioru, (c) treść AI nie przechodziła przez deklinację i korektę, (d) istniały dwa źródła danych/komponentów i poprawiano nie ten. **Tym razem eliminujemy te przyczyny strukturalnie.**

Najpierw przeczytaj:
1. `docs/calendar-v6-prognoza-dashboard.md` — pełna koncepcja (źródło prawdy dla CO i DLACZEGO).
2. `CLAUDE.md` — konwencje, anty-patterny, styl commitów (krótkie, po polsku).
3. Ten plik — JAK, krok po kroku.

### Twarde zasady wykonania (łamanie = stop)
- **Jeden branch na cały pakiet:** `prognoza-v6`. Odgałęź od aktualnego `main`. Nie dotykaj niezacommitowanych zmian usera (np. WIP match).
- **Jedna faza = jeden commit = jeden dowód.** Po każdej fazie: zielony `npx tsc --noEmit`, `npm run build`, `npm test`. Commit dopiero gdy wszystko zielone. **Masz ZAKAZ przejścia do następnej fazy bez wklejenia dowodu poprzedniej** (output testów / liczby / ścieżka screenshotów).
- **Zakaz improwizacji.** Jeśli coś w koncepcji jest niejasne albo sprzeczne z kodem — ZATRZYMAJ się i zapytaj Maca z 2–3 opcjami. Nie zgaduj.
- **Limity to kod, nie komentarz.** Każdy limit z koncepcji §8 = stała w `src/lib/astro/calendarLimits.ts` + test w CI.
- **Treść AI nigdy nie idzie do usera bez:** deklinacji przez `formatTransit`/`inSign` (`src/lib/i18n/astro.ts`), walidacji obcych alfabetów (`containsForeignScript` z `src/lib/text-validation.ts`), korekty językowej (`correctModuleWithHaiku` z `src/lib/deepseek.ts`).
- **Testy używają `AI_MOCK=true`** (fixtures w `tests/fixtures/ai`) — żadnych prawdziwych wywołań modeli w CI.
- **Podatność krytyczna / błąd danych** (np. dwa różne kosmogramy w jednym widoku) przerywa fazy i jest naprawiany natychmiast.

### Mapa istniejącego kodu (NIE szukaj, NIE dubluj — to już jest)
- **Strona:** `src/app/app/calendar/page.tsx` (~537 linii; renderuje `TodayBar`, `SeasonsCard` **dwukrotnie**, `CalendarGrid`, `MonthSummary`, `DayPanel`, tryb `compareMode`, `HistorySelector`).
- **Komponenty:** `src/components/calendar/{TodayBar,SeasonsCard,CalendarGrid,MonthSummary,DayPanel}.tsx`.
- **Silnik:** `src/lib/astro/layers.ts` → `getFastWindows`, `buildWindowDateMap`, `getSeasons`, `getExactDaysForMonth`, `getMoonSignChangeDatesForMonth`, `getMoonRhythm`, `getSkyEvents`, `moonRhythmSentence`, `skyEventText`. Dalej: `transits.ts` (`getTransitsForDate`), `windows.ts`, `powerDays.ts`, `dayClasses.ts`, `windowDescriptions.ts`, `calendarLimits.ts`.
- **Typy:** `TransitWindow` (ma `category: WindowCategory`, `character: 'wspierające'|'wymagające'`, `favorable`, `peak`, `score`), `Season` (ma `phase`).
- **Język/deklinacja:** `src/lib/i18n/astro.ts` → `formatTransit`, `inSign`, `ASPECT_LABEL_PL`, `PLANET_GENITIVE`, `natalGenitive`, `natalInstrumental`, `SIGN_LOCATIVE`.
- **Walidacja tekstu:** `src/lib/text-validation.ts` → `containsForeignScript`, `endsWithSentence`.
- **AI:** `src/lib/deepseek.ts` (mimo nazwy — backend Anthropic) → `aiComplete({system,messages,model,task})` (default Haiku `claude-haiku-4-5-20251001`), `correctModuleWithHaiku`, `generateModuleWithRetry` (Sonnet, natal), `AiDisabledError`. Honoruje `AI_MOCK`/`AI_DISABLED`. Loguje do `ai_call_logs`.
- **Endpointy AI kalendarza (istnieją):** `/api/day-interpretation` (premium, cache `day_interpretations`), `/api/daily-personal-horoscope` + `/api/cron/daily-personal-horoscope` (`daily_personal_horoscopes`), `/api/season-content` (`seasons`), `/api/monthly-summary` (`monthly_summaries`), `/api/power-day-explanation` (`power_day_explanations`), `/api/user-preferences`.
- **DB (Supabase, RLS wł.):** `readings`, `daily_personal_horoscopes`, `personal_power_days`, `power_day_explanations`, `day_interpretations`, `seasons`, `monthly_summaries` (+`reading_id`), `user_preferences` (`email_horoscope`,`welcome_sent`), `calendar_notes`, `ai_call_logs`. Migracje w `supabase/migrations/`.
- **Subskrypcja:** `hasActiveSubscription(userId)` z `@/lib/subscription`. Auth: `Authorization: Bearer` → `supabaseAdmin.auth.getUser`.
- **Testy:** `npm test` (vitest), `npm run test:e2e` (playwright, `playwright.config.ts`). Fixtures `tests/fixtures/ai`.

---

## FAZA 0 — Audyt + bugi z produkcji (BEZ kodu funkcji)

Cel: zinwentaryzować stan i wyłapać błędy danych, zanim zaczniesz budować. Wynik: `docs/CALENDAR-V6-AUDIT.md`.

Zadania:
1. **Jedno źródło kosmogramu.** Zweryfikuj, że widok dnia, karta miesiąca i koło używają DOKŁADNIE tego samego `chart_data` (na produkcji panel dnia i karta miesiąca pokazywały różne Ascendenty — to błąd danych z dwóch źródeł chartu). Wskaż w raporcie, którędy płynie chart i czy jest jedno źródło.
2. **Podwójny `SeasonsCard`** w `page.tsx` (~107 i ~175) — udokumentuj, zaznacz do usunięcia w Fazie 1.
3. **Ścieżka generacji treści.** Potwierdź, że kalendarz generuje przez `src/lib/deepseek.ts` (`aiComplete`), a nie przez jakiś stary path. Sprawdź, czy `ai_call_logs.task` dla kalendarza ma sensowne nazwy.
4. **Wycieki deklinacji.** Grepem znajdź miejsca, gdzie frazy tranzytów/znaków składane są ręcznie (string templates z nazwą znaku) zamiast przez `formatTransit`/`inSign`. Wylistuj pliki i linie.
5. **Zatruty cache.** Sprawdź, czy w `day_interpretations`/`monthly_summaries`/`seasons` są rekordy sprzed podpięcia korekty (np. „w Wodniaku", obce alfabety). Zaproponuj strategię invalidacji (bump `prompt_version` + regeneracja przy następnym wejściu, BEZ masowego crona).
6. **`/app/today` vs `/app/calendar`.** W repo istnieje `src/app/app/today/` i `src/app/app/dziennik/`. Ustal, co renderują i czy Prognoza ma je zastąpić, połączyć, czy współistnieć. **Nie decyduj sam — opisz opcje i zapytaj Maca.**
7. **Martwe elementy:** wiszące „Generuję opis…", tryb `compareMode`, chipy profili — wylistuj do usunięcia.

Dowód fazy: plik `docs/CALENDAR-V6-AUDIT.md` z odpowiedziami na 1–7 + lista pytań do Maca. **Commit:** `Audyt kalendarza v6 — inwentaryzacja i bugi`. **Czekaj na decyzję Maca w pkt 6 przed Fazą 1.**

---

## FAZA 1 — Architektura: przełącznik horyzontu + 4 widoki

Cel: rozbić jeden przeładowany ekran na dashboard z przełącznikiem **Dziś / Tydzień / Miesiąc / Rok** (default: Dziś). Mobile-first, jedna kolumna.

Zadania:
1. **`HorizonSwitcher`** — segmentowany kontroler (Dziś/Tydzień/Miesiąc/Rok) w `src/components/calendar/`. Stan horyzontu w `page.tsx` (URL param `?h=dzis|tydzien|miesiac|rok` dla deep-linków i powrotów).
2. **Cztery panele-widoki** (każdy osobny komponent w `src/components/calendar/views/`):
   - `TodayView` — reuse `TodayBar` + sekcje: wniosek dnia, sprzyja/uważaj, „Kiedy najlepiej" (placeholder pod Fazę 3), „Co przed Tobą" (≤3).
   - `WeekView` — pasek 7 dni + okna tygodnia + pusty-tydzień fallback.
   - `MonthView` — reuse `CalendarGrid` + `MonthSummary` + charakter miesiąca + panel dnia (`DayPanel`, ≤2 karty).
   - `YearView` — placeholder pod Fazę 5 (koło) + karty sezonów (≤3).
3. **Usuń:** drugi `SeasonsCard`, `compareMode` i całą logikę porównania, martwe elementy z audytu.
4. **Limity w `calendarLimits.ts`** (dodaj brakujące stałe) + testy unit:
   - `MAX_SEASONS_SHOWN = 3`, `MAX_UPCOMING_ITEMS = 3`, `DAY_HEADLINE_MAX_CHARS = 120`, `MAX_BAND_COVERAGE = 0.40`, `MAX_DAY_PANEL_CARDS = 2`.
   - Selektory: `selectShownSeasons()`, `selectUpcoming()`, `selectGridBands()` — z testami egzekwującymi limity i regułę „jedno okno = jeden peak, zakaz sąsiadujących ★ z tego samego okna".
5. **Strefa czasowa** granic dnia jako jawny parametr (test: zmiana znaku Księżyca tuż po północy nie przesuwa o ±1 dzień).

Dowód: `npm test` (nowe unity zielone) + screenshot 4 widoków (Playwright, zapisz do `docs/assets/v6/`) + potwierdzenie, że default to Dziś bez scrolla na mobile (asercja screenshotowa). **Commit:** `Prognoza: przełącznik horyzontu + 4 widoki, twarde limity`.

---

## FAZA 2 — Warstwa języka: wniosek → domena → mechanika

Cel: każdy element mówi po ludzku, z deklinacją, formą neutralną, bez żargonu w warstwie wniosku.

Zadania:
1. **Moduł domen** `src/lib/astro/domains.ts`: mapowanie `WindowCategory` + sygnałów → domena UI (`Kariera·Relacje·Finanse·Energia·Decyzje`) + kolor + ikona. Heurystyka z koncepcji §7. Tam, gdzie sygnał niepewny (Finanse) — `domain: null` (bez twardej etykiety). Unit testy mapowania.
2. **Frazy wyłącznie przez formattery.** Żadnego ręcznego składania nazw znaków. Wszędzie `formatTransit`/`inSign`/`natalGenitive`. **Grep-test w CI**: fail, jeśli w `src/**` poza `i18n/astro.ts` pojawi się wzorzec mianownika znaku po „w " (np. „w Baran", „w Wodniaku", „w Skorpion", „w Bliźniąkach").
3. **Forma neutralna** (2. osoba czasu teraźniejszego). Wspólny `STYLE_BLOCK` (jest w `moduleSpecs`) dołączany do każdego promptu kalendarza. Golden test: wykrycie form `-łbyś/-łabyś`/rodzajowych = fail; heurystyka „chłodu" (udział bezosobowych konstrukcji > próg) = warning.
4. **Korekta językowa na WSZYSTKICH treściach kalendarza** — `correctModuleWithHaiku` w pipeline dnia/tygodnia/miesiąca/sezonu/okna, z guardem `containsForeignScript` (家/cyrylica → retry → fallback z silnika, nigdy do usera). Loguj rate glitchy.
5. **Reguła konkretu:** każdy odczyt cytuje realne pozycje usera (golden test egzekwuje, że output zawiera ≥1 nazwę planety/znaku z kontekstu).

Dowód: golden + grep testy zielone, log rate'u glitchy = 0 na fixtures. **Commit:** `Prognoza: warstwa języka — domeny, deklinacja, korekta`.

---

## FAZA 3 — „Kiedy najlepiej…?" (silnik odpowiedzi)

Cel: pytanie życiowe → data. Serce produktu.

Zadania:
1. **Selektor** `src/lib/astro/whenBest.ts`: `bestWindowForDomain(chart, domain, horizonDays=90)` — najbliższe **wspierające** okno (`character==='wspierające'`, `favorable`) pasujące do domeny; `Kiedy uważać` → najbliższe **wymagające**; `Odpoczynek` → najbliższy okres bez okien ≥ `WINDOW_MIN_SCORE` (cisza jako odpowiedź). Zwraca zakres, peak, wniosek, mechanikę — albo uczciwe „nic w horyzoncie X". Unit testy na 3 kosmogramach.
2. **UI `WhenBest`** w `TodayView`: wiersz chipów (Nowy biznes·Miłość·Pieniądze·Ważna rozmowa·Odpoczynek; +premium „Kiedy uważać"). Klik → karta-odpowiedź (domena, data, ★ peak, wniosek). Mechanika po rozwinięciu.
3. **Free vs premium:** free widzi domenę + że COŚ jest + przybliżony zakres (zajawka, blur na dacie); premium pełną odpowiedź. Treść premium NIE opuszcza serwera dla free (API zwraca free tylko zajawkę).
4. Treść wniosku: deterministyczny szkielet z okna + redakcja AI (cache).

Dowód: unit selektora zielony + screenshot odpowiedzi dla 2 domen (free i premium). **Commit:** `Prognoza: silnik odpowiedzi „Kiedy najlepiej"`.

---

## FAZA 4 — Odczyty per okres + model bramkowania

Cel: przycisk „Odczyt dnia/tygodnia/miesiąca/roku" z poprawnym cache i bramkowaniem (koncepcja §4).

Zadania:
1. **Dzień:** reuse `/api/day-interpretation` + cron `daily-personal-horoscope`. **Bramka: tylko bieżący dzień.** Przyszłe dni nie mają przycisku generowania — pokazują strukturę (okno/Księżyc), nie odczyt. Zapis do dziennika (streak) — spiąć z istniejącym `dziennik`.
2. **Tydzień:** NOWY endpoint `/api/week-interpretation` + NOWA tabela `week_interpretations` (migracja: `user_id, reading_id, iso_week text, content, transits_used jsonb, prompt_version, model, unique(reading_id, iso_week)`, RLS jak w `day_interpretations`). On-demand, cache. **Bez blokady przyszłości** (premium może wygenerować przyszły tydzień).
3. **Miesiąc:** reuse `/api/monthly-summary` (`monthly_summaries`, ma `reading_id`). On-demand, cache, regeneracja przy zmianie danych miesiąca. Bez blokady przyszłości.
4. **Rok:** NOWY endpoint `/api/year-interpretation` — kompozycja z `seasons` + charakter kwartałów. Cache per `reading_id`+rok, invalidacja przy zmianie fazy sezonu. Bez blokady przyszłości.
5. **Gradient rozdzielczości:** w UI daleka przyszłość = struktura + 1 zdanie; bliżej = pełny odczyt. Nie blokuj — degraduj szczegół.
6. Każdy zapis: `prompt_version` (`ai_prompt_version`), `model`, `transits_used`, log do `ai_call_logs`. Nigdy 2× generacja w oknie cache (test: dwa wejścia = jedna generacja).

Dowód: migracja `week_interpretations` zastosowana; testy: cache (dwa wywołania → jedna generacja), bramka dnia (przyszły dzień nie ma przycisku), brak blokady tydzień/miesiąc/rok. **Commit:** `Prognoza: odczyty per okres + bramkowanie + cache`.

---

## FAZA 5 — Koło roku (widok Rok)

Cel: sygnaturowy wizual; deterministyczny, renderuje się bez AI.

Zadania:
1. **`YearWheel`** `src/components/calendar/YearWheel.tsx`: SVG, `viewBox` kwadratowy, kolory ze zmiennych motywu (nie hardcode). 12 segmentów miesięcy + etykiety. Sezony jako łuki na różnych promieniach (≤3 wg ścisłości orbu — `selectShownSeasons`). Dni Mocy jako punkty (limit z `calendarLimits`). Znacznik „teraz". Centrum: rok + bieżący miesiąc.
2. Interakcje: klik w łuk → karta sezonu; klik w punkt → dzień. Glify zodiaku z systemu symboli (`docs/zodiac-symbols-implementation-prompt.md`) jeśli wdrożone; inaczej proste znaczniki.
3. Renderuje się natychmiast; treść AI (nazwy/akapity sezonów) dochodzi z `seasons` po fakcie — wizual przeżywa błąd AI.
4. Karty wielkich tematów pod kołem: nazwa domenowa, zakres, faza (pasek), 1 zdanie (premium: akapit).

Dowód: screenshot koła dla 3 różnych kosmogramów (różna gęstość sezonów) + test, że ≤3 łuki i ≤ limit punktów. **Commit:** `Prognoza: koło roku`.

---

## FAZA 6 — Powiadomienia (mail + push, auto + własne)

Cel: silnik powracalności. Domyślnie oszczędnie.

Zadania:
1. **DB:** rozszerz `user_preferences` o granularne flagi (per typ: `notify_power_day`, `notify_new_season`, `notify_window_peak`, `notify_retro`, `notify_full_moon`, `notify_eclipse`; per kanał: `channel_email`, `channel_push`). Domyślnie włączone TYLKO `notify_power_day` i `notify_new_season`. Nowe tabele: `push_subscriptions` (endpoint, keys, user_id, RLS) i `custom_reminders` (user_id, domain/typ, lead_days, treść, RLS).
2. **Web Push (od zera):** dodaj `web-push`, wygeneruj VAPID (env: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`). Service worker: subskrypcja push + obsługa `push`/`notificationclick`. Endpoint `/api/push/subscribe`. iOS: push tylko po instalacji PWA — wykryj i komunikuj, nie obchodź.
3. **E-mail (Resend):** wyzwalacze przez istniejący `src/lib/email.ts` + nowy szablon `src/emails/EventNotificationEmail.tsx`. Premium daily email bierze `headline` z `daily_personal_horoscopes` (NIE stary szablon znaku Słońca).
4. **Ewaluacja wyzwalaczy w cronie** (`/api/cron/daily-personal-horoscope` lub nowy `/api/cron/notifications`): z silnika (`getSeasons`,`getFastWindows`,`getSkyEvents`) wykryj zdarzenia na dziś/jutro, dopasuj do preferencji usera, wyślij (mail/push) z dedupem (tabela `sent_notifications` lub kolumna, żeby nie dublować).
5. **Własne przypomnienia:** UI „przypomnij mnie X dni przed oknem na [domena]" → zapis `custom_reminders` → ewaluacja w cronie.
6. **Ustawienia:** rozbuduj `/app/settings/notifications` — granularne przełączniki per typ + per kanał, z wyraźnym defaultem oszczędnym.
7. **Free vs premium:** free dostaje sam sygnał „dziś Dzień Mocy"; premium treść + własne przypomnienia + „w Twoich domach".

Dowód: testy: defaulty (tylko 2 typy on), dedup (jedno zdarzenie = jedno powiadomienie), bramka free (bez treści). Ręczna checklista (Mac klika): VAPID env, testowy push, testowy mail. **Commit:** `Prognoza: powiadomienia mail + push, auto + własne`.

---

## FAZA 7 — UI/UX polish

Cel: „wow", nie „potworek". Cisza, hierarchia, stany.

Zadania:
1. **Cisza domyślna:** większość dni siatki płaska, bez ramki. Intensywność jako subtelny tint tła, nie obramowanie. Ramka tylko: dziś, wybrany, ★ peak, ◆ dokładność. Pasma cienkie, wcięte.
2. **Hierarchia typografii:** wniosek > domena > daty > mechanika (najmniejsza, stłumiona). Kolory domen spójne we wszystkich widokach.
3. **Stany każdego elementu:** loading = skeleton (NIE „Generuję opis…"), empty = uczciwy komunikat („spokojny okres"), error = deterministyczny fallback z silnika, locked = karta-zajawka + CTA premium. Stan przycisku odczytu deterministyczny (brak wyścigu „Generuj" ↔ auto).
4. **Mikrointerakcje:** płynne rozwijanie wniosek→mechanika, zmiana horyzontu, pojawianie się odpowiedzi „Kiedy najlepiej".
5. **Onboarding:** 3 coachmarki przy pierwszej wizycie (sezon / okno / peak), raz, zapamiętane.
6. **Przełącznik profilu** w headerze (gdy kilka kosmogramów), nie w treści.
7. **Etykieta nawigacji** „Kalendarz" → „Prognoza" (route `/app/calendar` zostaje).

Dowód: screenshoty wszystkich stanów (loading/empty/error/locked) + finalny zestaw 4 widoków. **Commit:** `Prognoza: polish UI/UX, stany, onboarding`.

---

## FAZA 8 — Testy + raport weryfikacyjny (warunek odbioru)

Cel: Mac sprawdza zgodność w 2 minuty, nie klikając po apce.

Zadania:
1. **Unit:** wszystkie selektory i limity (§8 koncepcji).
2. **E2E (Playwright):** przełączanie horyzontu, „Kiedy najlepiej" (free vs premium), cache odczytu (dwa wejścia = jedna generacja), bramka dnia, locki free, brak powtórzonych zdań w panelu dnia.
3. **Snapshot siatki:** zakaz „★N", ≤ limit ★, brak sąsiadujących ★ z tego samego okna, pokrycie pasm ≤40%.
4. **Grep CI:** zakazane wzorce deklinacji.
5. **Raport `docs/CALENDAR-V6-VERIFY.md`** — tabela LICZB dla **3 kosmogramów × {czerwiec, wrzesień, grudzień}**: liczba wyświetlonych sezonów, liczba ★/mies., pokrycie pasm %, rozkład tintu, liczba okien „Co przed Tobą", długość nagłówka dnia. + ścieżki screenshotów. Wartości muszą mieścić się w limitach — jeśli nie, kalibracja, nie akceptacja.

Dowód: cały `npm test` + `npm run test:e2e` zielone, `docs/CALENDAR-V6-VERIFY.md` wypełniony liczbami. **Commit:** `Prognoza: testy + raport weryfikacyjny`.

---

## Globalne kryteria odbioru (Definition of Done)
- [ ] `npx tsc --noEmit`, `npm run build`, `npm test`, `npm run test:e2e` — wszystko zielone.
- [ ] Default widok = Dziś, widoczny bez scrolla na mobile.
- [ ] „Kiedy najlepiej" zwraca datę dla każdej domeny (albo uczciwe „nic w horyzoncie").
- [ ] Odczyty per okres: dzień bramkowany do dziś, tydzień/miesiąc/rok bez blokady przyszłości, cache działa (jedna generacja).
- [ ] Koło roku renderuje się bez AI, ≤3 sezony, ≤ limit Dni Mocy.
- [ ] Powiadomienia: defaulty oszczędne, dedup, free bez treści, push + mail działają (checklista Maca).
- [ ] Zero wycieków deklinacji / obcych alfabetów (grep + golden).
- [ ] `docs/CALENDAR-V6-VERIFY.md` z liczbami w limitach.
- [ ] Branch `prognoza-v6` gotowy do PR; po review Maca i merge — branch skasowany.

## Po wdrożeniu — należy do Maca (nie do Claude Code)
- Przeczytać kilkanaście wygenerowanych odczytów: czy brzmią jak mądre lustro, czy jak wróżka z jarmarku (golden łapie formę, nie rezonans).
- Zaktualizować politykę prywatności o przechowywanie odczytów/powiadomień, jeśli dochodzi nowy zakres danych.
- Weryfikacja astrolożki: mapowanie domen (§7 koncepcji).
- VAPID, testowy push/mail, ewentualny restore — checklista z Fazy 6.
