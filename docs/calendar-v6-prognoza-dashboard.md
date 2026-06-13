# Koncepcja v6: Prognoza — dashboard astrologa

Status: **zastępuje v5 (`calendar-v5-briefing.md`) i v4.** Silnik danych (tranzyty, okna, sezony, rytm Księżyca, wydarzenia nieba) ZOSTAJE bez zmian — wymieniamy architekturę ekranu, język i dokładamy dwie brakujące warstwy retencji: **odczyty per okres** i **powiadomienia**.

Geneza (13 cze 2026, feedback Maca po 5 nieudanych iteracjach): każda wersja produkowała przeładowany ekran, który pokazywał *dane astronomiczne* zamiast *odpowiedzi*. Klient nie pyta „jakie mam tranzyty" — pyta „kiedy zacząć biznes, kiedy uważać, kiedy szukać miłości". Astrolog prowadzi od wniosku i od daty; mechanika to przypis.

Decyzja kierunkowa zaakceptowana przez Maca na podstawie klikalnej makiety: **dashboard z przełącznikiem horyzontu + silnik odpowiedzi „Kiedy najlepiej…?" + koło roku**.

---

## 0. Co się zmienia względem v5 (skrót dla kogoś, kto czytał v5)

| v5 (Briefing) | v6 (Prognoza dashboard) |
|---|---|
| Jeden długi scroll A→D (Dziś, Co przed Tobą, Sezony, Pokaż miesiąc) | **Przełącznik horyzontu Dziś / Tydzień / Miesiąc / Rok** — jeden ekran = jedna skala czasu |
| „Kiedy najlepiej…?" jako P2 (timeline) | **„Kiedy najlepiej…?" awansuje do P0 — to serce produktu** (pytanie życiowe → data) |
| Siatka miesiąca jako pod-widok „Pokaż miesiąc" | Siatka to widok **Miesiąc**; rok to **koło** (sygnaturowy wizual, oryginalny pomysł Maca) |
| Brak odczytów per okres | **Odczyt dnia / tygodnia / miesiąca / roku** z modelem bramkowania |
| Push tylko w P1 (3 typy) | **Pełny system powiadomień**: mail + push, wyzwalacze automatyczne + własne, oszczędne defaulty, granica free/premium |

Zasada nadrzędna (sekcja 1) i twarde limity (sekcja 8) z v5 zostają — wzmocnione.

---

## 1. Zasada nadrzędna: wniosek → domena → mechanika

Każdy element na ekranie ma trzy poziomy, **zawsze w tej kolejności**:

1. **Wniosek** — jedno zdanie po ludzku: rada lub obserwacja („Dobry tydzień na rozmowy o pieniądzach — szczególnie 19–23 cze").
2. **Domena** — etykieta życiowa: *Kariera · Relacje · Finanse · Energia · Decyzje*. Zawsze widoczna, daje skanowalność jednym rzutem oka.
3. **Mechanika** — fraza astrologiczna („Wenus w trygonie do Twojego Jowisza w 2. domu") — **dopiero po rozwinięciu**, dla ciekawych. Nigdy jako nagłówek, nigdy na początku zdania.

Jeśli czegoś nie da się streścić do wniosku w jednym zdaniu — nie pokazujemy tego.

---

## 2. Model główny: dashboard z przełącznikiem horyzontu

Route `/app/calendar` (etykieta w nawigacji zmienia się na **„Prognoza"**). Cztery horyzonty, ten sam język i ta sama zasada 1, różna skala czasu i różny rytm powrotu:

| Horyzont | Co pokazuje | Rytm powrotu | Główny przycisk |
|---|---|---|---|
| **Dziś** (default) | Wniosek dnia + Księżyc + sprzyja/uważaj + „Kiedy najlepiej…?" + 1–2 najbliższe okna | codzienny | „Odczyt dnia" (auto, gotowy rano) |
| **Tydzień** | 7-dniowy pasek, okna tego tygodnia, peak. Pusty tydzień = „spokojny tydzień" | tygodniowy | „Odczyt tygodnia" |
| **Miesiąc** | Cicha siatka (pasma okien, ★ peaki, ◆ dni dokładności) + charakter miesiąca | miesięczny | „Odczyt miesiąca" |
| **Rok** | **Koło roku** z sezonami (łuki) i Dniami Mocy (punkty) + karty wielkich tematów | kwartalny | „Odczyt roku" |

Domyślnie otwiera się **Dziś**. Przełącznik to segmentowany kontroler na górze (pod headerem). Mobile-first, jedna kolumna, identycznie na desktopie.

### 2.A Widok Dziś (hero, 10-sekundowy poranny rytuał)
- Data + Księżyc w znaku (+ Twój dom — premium).
- **Wniosek dnia**: jedno zdanie („Dziś sprzyja domykaniu spraw, które wiszą — nie zaczynaj nowego").
- Dwie pigułki: **✓ Sprzyja** (zielona) / **⚠ Uważaj** (bursztynowa) — krótkie hasła.
- Jeśli pełnia/nów/zaćmienie/stacja retro: **glif + pytanie refleksyjne** (z silnika `getSkyEvents` / `moonRhythmSentence`).
- Blok **„Kiedy najlepiej…?"** (sekcja 3).
- **„Co przed Tobą"**: 1–2 najbliższe okna (wniosek + domena + daty + ★ peak).
- To jest codzienny powód powrotu. Odczyt dnia generuje się cronem w nocy → rano jest od ręki.

### 2.B Widok Tydzień
- Nagłówek + **linia charakteru** („Spokojny tydzień — nic, co wymaga ruchu" / „Intensywny tydzień — dwa okna").
- 7-dniowy pasek (Pn–Nd), dziś podświetlone, dni okna tintowane, ★ na peaku.
- Karty okien tego tygodnia (wniosek → domena → mechanika po rozwinięciu).
- Pusty tydzień pokazuje wprost: „Spokojny tydzień. Następny istotny moment: 19 cze." (rzadkość = wiarygodność).
- Przycisk „Odczyt tygodnia".

### 2.C Widok Miesiąc
- Nagłówek + **linia charakteru miesiąca** („Gęsty miesiąc — dużo otwiera się w relacjach i karierze" / „Spokojny miesiąc — dobry na regenerację"). Charakter liczony z gęstości okien (deterministycznie).
- **Cicha siatka**: większość dni bez żadnego oznaczenia (płaskie, faint). Tylko: pasma okien (cienkie, wcięte), ★ na peakach (limit z `calendarLimits`), ◆ dni dokładności sezonu, glify pełni/nowiu/zaćmień, ℞ stacje retro. NIC więcej.
- Klik w dzień → panel dnia (max 2 karty astrologiczne, sekcja 8).
- Lista okien miesiąca jako karty-odpowiedzi.
- Przycisk „Odczyt miesiąca".

### 2.D Widok Rok (koło roku — sygnaturowy wizual)
- **Koło**: 12 miesięcy po obwodzie. Łuki (różne promienie) = sezony (wolne tranzyty, miesiące–lata). Złote punkty na obwodzie = Dni Mocy. Znacznik „teraz". Renderuje się **w całości deterministycznie, bez AI** — nigdy pusty ekran.
- Pod kołem: **karty wielkich tematów** (sezony): nazwa domenowa, zakres, faza (początek/środek/domykanie) jako pasek, jedno zdanie rady (premium: akapit).
- Sezony wychodzą CAŁKOWICIE z siatki dnia/miesiąca (poza ◆ na dniach dokładności) — to rozdziały życia, nie „okna w czerwcu". To rozwiązuje u źródła „okno 1–30 czerwca", które psuło v1–v5.
- Przycisk „Odczyt roku".

---

## 3. „Kiedy najlepiej…?" — silnik odpowiedzi (serce produktu, P0)

Odwracamy kierunek: nie „masz tranzyt Marsa", tylko **pytanie życiowe → data z jednym zdaniem**. To jest dokładnie to, co robi astrolog („od września dobry czas na odważne ruchy w karierze").

- Blok w widoku Dziś (i dostępny z każdego horyzontu): wiersz chipów-pytań.
- Pytania v1 (mapowanie → domena/silnik w sekcji 7): **Nowy biznes · Miłość · Pieniądze · Ważna rozmowa · Odpoczynek** + (premium) **Kiedy uważać**.
- Klik → karta-odpowiedź: domena (kolor + ikona), **zakres dat**, ★ najlepszy dzień, jedno zdanie wniosku. Mechanika po rozwinięciu.
- Logika: z `getFastWindows` (i sezonów dla dłuższych horyzontów) wybieramy najbliższe **wspierające** okno pasujące do domeny pytania; „Kiedy uważać" → najbliższe okno **wymagające**; „Odpoczynek" → najbliższy okres bez okien wysokiego score (cisza jako odpowiedź).
- Jeśli w rozsądnym horyzoncie (np. 90 dni) nie ma nic dla danej domeny: uczciwa odpowiedź „Najbliższe wyraźne okno na X dopiero po [data]" lub „W tym kwartale nic mocnego — to też informacja".
- Free: widzi domenę + że COŚ jest + przybliżony zakres (zajawka). Premium: pełna data + ★ + wniosek + mechanika.

To jest naturalne rozwinięcie premium i główny powód „chcę to mieć". P2 (po stabilizacji): pełny **eksplorator timeline** per domena.

---

## 4. Odczyty per okres + model bramkowania (retencja bez muru)

Każdy horyzont ma jeden główny przycisk: **„Odczyt dnia / tygodnia / miesiąca / roku"** — generuje interpretację AI w kontekście tego okresu.

### Zasada bramkowania (uzgodniona z Macem)
- **Dzień — tylko „dziś".** Odczyt dnia istnieje wyłącznie dla bieżącego dnia, generowany cronem w nocy → rano gotowy. Przyszłych „dni" nie generujemy — to naturalne (nikt nie oczekuje gotowego, osobistego odczytu konkretnego przyszłego dnia), więc nie czyta się jak sztuczna blokada. To najsilniejsza dźwignia codziennego powrotu. Każdy dzienny odczyt zapisuje się do dziennika → naturalny streak (spina się z istniejącym `dziennik`/streak).
- **Tydzień / Miesiąc / Rok — BEZ blokady przyszłości.** Premium może wygenerować odczyt przyszłego tygodnia/miesiąca/roku. Blokowanie przyszłości tutaj walczyłoby z obietnicą produktu („chcę wiedzieć, co mnie czeka") i frustrowałoby płacących. Astrolog *mówi* o wrześniu, nie każe czekać do września.
- **Zamiast muru — gradient rozdzielczości.** Daleka przyszłość = struktura (kiedy, domena, jedno zdanie). Bliżej = pełny odczyt okresu. Dziś = pełny osobisty odczyt dnia. Powracalność bierze się z tego, że **przyszłość gęstnieje w miarę zbliżania** + powiadomienia ściągają w ważnym momencie — a nie z zamykania okresów.

### Mechanika cache (koszt pod kontrolą — anty-wzorzec z CLAUDE.md)
- Dzień: tabela `day_interpretations` / `daily_personal_horoscopes` (istnieją). Generacja cron, nigdy 2× w 24h.
- Miesiąc: `monthly_summaries` (istnieje, ma `reading_id`). On-demand, cache, regeneracja przy zmianie danych miesiąca.
- Rok / Sezony: `seasons` (istnieje, cache per faza). Odczyt roku = kompozycja z sezonów + charakteru kwartałów; cache per `reading_id`+rok, invalidacja przy zmianie fazy sezonu.
- **Tydzień: nowa tabela `week_interpretations`** (nie istnieje — do dodania). On-demand, cache per `reading_id`+ISO-tydzień.
- Każdy zapis: `prompt_version` (= `ai_prompt_version`) + `model` + `transits_used`. Log tokenów do `ai_call_logs` (istnieje).

---

## 5. Koło roku (widok Rok) — szczegóły wizualne

- Komponent SVG `YearWheel`, deterministyczny, mobile-first, `viewBox` kwadratowy, `currentColor`/zmienne motywu (nie hardcode).
- 12 segmentów miesięcy, etykiety na obwodzie.
- Sezony jako **łuki** na różnych promieniach (max 3 wyświetlane wg ścisłości orbu i rangi planety — reguła z silnika). Kolor = domena sezonu.
- **Dni Mocy** jako złote punkty na obwodzie (limit z `calendarLimits`).
- Znacznik „teraz" (bieżący miesiąc).
- Centrum: rok + „teraz: [miesiąc]".
- Klik w łuk → karta sezonu; klik w punkt → dzień.
- Legenda: łuki = sezony, punkty = Dni Mocy.
- Renderuje się zanim/bez AI; treść AI (nazwy, akapity) dochodzi z `seasons`.

---

## 6. Powiadomienia — silnik powracalności

Dwa kanały:
- **E-mail** (Resend — `src/lib/email.ts`, szablony `src/emails/`). Już działa dla dziennego horoskopu.
- **Push przeglądarkowy** (PWA / Web Push, VAPID). **Do zbudowania od zera** — `web-push` nie jest jeszcze w zależnościach. Na iOS działa tylko po instalacji PWA jako apki (znane ograniczenie systemowe — nie obchodzić).

Dwa rodzaje wyzwalaczy:
- **Automatyczne (astro):** nowy sezon / zmiana fazy sezonu · „jutro peak okna" · „dziś Dzień Mocy" · start retrogradacji Merkurego · pełnia/nów · zaćmienie. (Dane z silnika — `getSeasons`, `getFastWindows`, `getSkyEvents`.)
- **Własne (user):** „przypomnij mi 3 dni przed oknem na karierę", „odezwij się, gdy zacznie się dobry czas na miłość". Tabela `custom_reminders` (nowa).

Twarda zasada UX: **domyślnie oszczędnie** — na start włączone tylko *Dni Mocy* i *nowe sezony*. Za dużo powiadomień = odinstalowanie (odwrotność celu). Kto chce więcej, dokręca w ustawieniach (granularne przełączniki per typ + per kanał).

Granica free/premium:
- Free: powiadomienie „dziś masz Dzień Mocy" (wabik z powrotem do apki, bez treści).
- Premium: treść (headline z odczytu), odczyty okresów, własne przypomnienia, wydarzenia w „Twoich domach".

Ustawienia: rozszerzenie `/app/settings/notifications` + tabela `user_preferences` (dodać kolumny per-typ/per-kanał) + nowa `custom_reminders` + `push_subscriptions`.

---

## 7. Mapowanie domen (heurystyka v1 — do weryfikacji astrolożki)

Silnik ma już `WindowCategory` = `miłość · kariera · energia · komunikacja · transformacja · intuicja` oraz flagę `character` (`wspierające`/`wymagające`). Mapujemy na etykiety życiowe i pytania „Kiedy najlepiej":

| Domena (UI) | Kategoria silnika / sygnał | Pytanie „Kiedy najlepiej" |
|---|---|---|
| **Relacje** | `miłość` (Wenus; 5./7. dom; aspekty do natalnej Wenus/Księżyca) | Miłość |
| **Kariera** | `kariera` (MC/10. dom), `energia` (Słońce, Mars), Saturn | Nowy biznes / odważny ruch |
| **Finanse** | Jowisz/Wenus; 2./8. dom *(brak osobnej kategorii — sygnał złożony, FLAGA dla astrolożki)* | Pieniądze |
| **Decyzje / komunikacja** | `komunikacja` (Merkury; 3./9. dom; retro Merkurego = ostrzeżenie) | Ważna rozmowa |
| **Energia / ciało** | `energia` (Mars, Słońce; 1./6. dom), rytm Księżyca | Odpoczynek (cisza) / Energia |
| (przekrojowe) | `character: wymagające` | Kiedy uważać |

Konflikt (kilka domen naraz): wybieramy jedną dominującą, reszta w mechanice. **Etykieta domeny tylko tam, gdzie heurystyka pewna**; tam, gdzie sygnał złożony (np. Finanse) — do czasu weryfikacji astrolożki bez twardej etykiety albo z ostrożnym sformułowaniem.

Pytania do astrolożki: czy heurystyka się broni · jak ważyć planetę vs dom · które kombinacje aspektów są „zielone" (wspierające) a które „ostrzegawcze" per domena · jak traktować Finanse bez osobnej kategorii.

---

## 8. Twarde limity — jako kod i testy, nie prose

v1–v5 poległy, bo limity były w dokumencie, a nie w kodzie. Każdy limit = stała w `src/lib/astro/calendarLimits.ts` + test w CI:

| Limit | Wartość | Test |
|---|---|---|
| Sezony wyświetlane (widok Rok + Dziś) | ≤ 3 | unit na selektorze |
| Pozycje „Co przed Tobą" (Dziś) | ≤ 3 | unit na selektorze |
| Wniosek/nagłówek dnia | 1 zdanie, ≤ 120 znaków | walidacja AI + retry przy przekroczeniu |
| Dni Mocy (★) w miesiącu | `POWER_WINDOWS_PER_MONTH` (5), sanity cap 8 | unit + snapshot siatki |
| Dwie sąsiadujące ★ z tego samego okna | zakazane (jedno okno = jeden peak) | unit |
| Zapis „★N" (gwiazdka z liczbą) w siatce | zakazany | snapshot siatki |
| Pokrycie dni pasmami okien w miesiącu | ≤ ~40% dni | unit na selektorze |
| Karty astrologiczne w panelu dnia | ≤ 2 | unit |
| Okna w siatce | tylko ≥ `WINDOW_MIN_SCORE` | istniejący próg |
| Frazy tranzytów/punktów | wyłącznie przez `formatTransit`/`inSign` (deklinacja) | grep-test CI na zakazane wzorce („w Baran", „w Wodniaku" itd.) |
| Obce alfabety w treści PL (家, cyrylica) | zakazane | `containsForeignScript` + retry/fallback |

---

## 9. Język AI (prompt, nie kod)

- **Wniosek najpierw, zawsze.** Zakaz zaczynania zdania od nazwy planety.
- **Forma neutralna przez 2. osobę czasu teraźniejszego** („widzisz", „budujesz", „twoja siła") — bez pola rodzaju w bazie. Zakaz form `-łbyś/-łabyś` i rodzajowych przymiotników; zakaz chłodnych bezosobowych konstrukcji („można funkcjonować") — przeformułować w stronę „ty". (Spójne z natalem — golden testy.)
- **Ton astrologa-doradcy:** konkretna rada lub obserwacja, nie poetycka mgła. Wzorzec: „od września sprzyja Ci czas na X — warto Y".
- **Zakaz żargonu w warstwie wniosku** (orb, kwadratura, tranzyt — tylko w mechanice).
- **Reguła konkretu:** każdy odczyt cytuje realne pozycje usera z silnika (golden test egzekwuje).
- Nagłówek/wniosek dnia: deterministyczny szkielet (Księżyc + aktywne okno) → AI tylko redaguje zdanie. Cache 24h. `ai_prompt_version` przy zapisie.
- Drugi przebieg korekty językowej (Haiku — `correctModuleWithHaiku`) na WSZYSTKICH treściach kalendarza (dzień, tydzień, miesiąc, sezon, okno), nie tylko natalu.

---

## 10. Free vs premium

| Element | Free | Premium |
|---|---|---|
| Wniosek dnia (zdanie) | ✅ | ✅ |
| Mechanika dnia + Księżyc w Twoich domach | — | ✅ |
| Odczyt dnia (pełny) | — | ✅ |
| „Kiedy najlepiej…?": że COŚ jest + domena + przybliżony zakres | ✅ (zajawka) | ✅ |
| „Kiedy najlepiej…?": dokładna data + ★ + wniosek + mechanika | lock | ✅ |
| „Co przed Tobą": domena + daty | ✅ | ✅ |
| „Co przed Tobą": wniosek + znaczenie | lock | ✅ |
| Odczyt tygodnia / miesiąca / roku | lock (zajawka 1 zdanie) | ✅ |
| Wielkie tematy (sezony): nazwa + zakres + faza | ✅ | ✅ |
| Wielkie tematy: rada + akapit + odczyt ◆ | lock | ✅ |
| Siatka miesiąca + koło roku (struktura) | ✅ | ✅ |
| Powiadomienie „dziś Dzień Mocy" (sam sygnał) | ✅ | ✅ |
| Powiadomienia z treścią + własne przypomnienia + „w Twoich domach" | — | ✅ |

Granica: free widzi **STRUKTURĘ** (kiedy coś jest), płaci za **ZNACZENIE** (co z tym zrobić). Wniosek dnia darmowy — to silnik nawyku, nie produkt.

---

## 11. Do usunięcia z obecnego ekranu

- „Porównaj z innym kosmogramem" / tryb `compareMode` — to feature Cosmo Match, nie Prognozy.
- Podwójne renderowanie `SeasonsCard` (page.tsx ~107 i ~175) — jedno źródło.
- Karta „Twoje sezony 18" → limit ≤ 3.
- Pasmo/gwiazdka na większości dni siatki → progi i pokrycie ≤40%.
- Ściana tekstu w panelu wybranego dnia → max 2 karty.
- Rząd chipów profili (jeśli jest) — przełącznik profilu w headerze obok avatara, nie w treści.
- Martwe „dzwoneczki" / wiszące „Generuję opis…" → deterministyczny stan + fallback.

---

## 12. UI/UX — szczegóły wykonania (żeby „wow", nie „potworek")

- **Mobile-first, jedna kolumna.** Po otwarciu „Prognoza" użytkownik widzi widok Dziś bez scrolla (zasada: „otwierasz Prognozę i widzisz, co dziś" — asercja w testach screenshotowych).
- **Cisza jako stan domyślny.** Większość dni siatki płaska. Intensywność dnia jako subtelne ciepło tła (tint), nie ramka. Ramkę dostają tylko: dziś, wybrany, peak (★), dzień dokładności (◆).
- **Hierarchia typograficzna:** wniosek > domena > daty > mechanika. Mechanika najmniejsza, stłumiona.
- **Stany każdego elementu:** loading (skeleton, nie „Generuję…"), empty (uczciwy komunikat: „spokojny okres"), error (deterministyczny fallback z silnika — wizual zawsze przeżywa błąd AI), locked (free — karta z zajawką + CTA premium).
- **Mikrointerakcje:** płynne rozwijanie karty (wniosek→mechanika), płynna zmiana horyzontu, odpowiedź „Kiedy najlepiej" pojawia się miękko.
- **Kolory domen** spójne wszędzie (Dziś, Tydzień, Miesiąc, Rok, „Kiedy najlepiej"): Kariera, Relacje, Finanse, Energia, Decyzje — każda swój kolor, ten sam w całej apce.
- **Symbolika zodiaku** (z `zodiac-symbols-implementation-prompt.md`): medaliony na kartach sezonów/nagłówkach, glify na kole i w siatce.
- **Onboarding:** 3 coachmarki przy pierwszej wizycie (czym jest sezon / okno / peak), raz.
- **Przełącznik profilu** w headerze (gdy user ma kilka kosmogramów), nie w treści.
- **Strefa czasowa** granic dnia jako jawny parametr (test na zmianę znaku tuż po północy — klasyczne źródło błędu ±1 dzień).

---

## 13. Priorytety

**P0 — bez tego nie ma produktu:**
1. Architektura: przełącznik horyzontu + 4 widoki (Dziś/Tydzień/Miesiąc/Rok) z twardymi limitami (sekcja 8) i testami.
2. Warstwa języka: wniosek → domena → mechanika (sekcja 9), deklinacja przez `formatTransit`, korekta językowa na wszystkich treściach kalendarza.
3. „Kiedy najlepiej…?" (sekcja 3).
4. Odczyty per okres + bramkowanie (sekcja 4): dzień (cron), tydzień (nowa tabela), miesiąc, rok.
5. Koło roku (sekcja 5).

**P1:**
6. Powiadomienia (sekcja 6): mail + push, automatyczne + własne, ustawienia, oszczędne defaulty.
7. Mapowanie domen po weryfikacji astrolożki (sekcja 7).
8. Onboarding 3 coachmarki.

**P2:**
9. Eksplorator „Kiedy najlepiej…?" — pełny timeline per domena.
10. Tygodniowy digest mailowy (Resend) = treść odczytu tygodnia.

---

## 14. Otwarte pytania

1. **Astrolożka:** mapowanie domen (sekcja 7), zielone vs ostrzegawcze kombinacje aspektów, Finanse bez osobnej kategorii.
2. **Mac / kod:** w repo istnieje `/app/today` — czy Prognoza go zastępuje, czy współistnieją? (Faza 0 promptu: zinwentaryzować i zdecydować, nie zgadywać.)
3. **Mac:** etykieta nawigacji „Kalendarz" → „Prognoza" (rekomendacja: tak; route `/app/calendar` zostaje dla linków).
