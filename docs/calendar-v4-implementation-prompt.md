# PROMPT DLA CLAUDE CODE — Kalendarz v4: wdrożenie modelu trzech warstw

> Specyfikacja koncepcyjna: docs/calendar-concept-v4.md — PRZECZYTAJ JĄ NAJPIERW W CAŁOŚCI. To przeprojektowanie, nie iteracja: model „okien w miesiącu" dla wszystkich tranzytów zostaje zastąpiony trzema warstwami (sezony / okna / rytm). Wykonuj koncepcję dokładnie; każde odstępstwo wymaga pytania do właściciela.

---

Pracujesz w repo Cosmogram. Istnieją: silnik tranzytów z rankingiem i oknami, `daily_personal_horoscopes`, `day_interpretations`, formatTransit/formatNatalPoint + mapa deklinacji (jeśli nie weszły w pełni — wchodzą teraz, są warunkiem), karta miesiąca, panel dnia, golden testy, AI_MOCK. Modele: sonnet (natal), haiku (cała reszta). Gemini nie jest używany.

## FAZA 0 — Naprawa bugów krytycznych z produkcji

1. **Niespójność danych natalnych**: panel dnia twierdzi „Ascendent w Strzelcu", karta miesiąca „w Skorpionie" dla tego samego usera. Znajdź przyczynę (dwa fetche? stary cache? zły chart id przy wielu zapisanych kosmogramach?). Wprowadź JEDEN context/provider danych natalnych dla całego widoku kalendarza. Test integracyjny: frazy we wszystkich komponentach widoku odwołują się do tych samych pozycji natalnych.
2. Styl bezrodzajowy w syntezie miesiąca i wszystkich treściach kalendarza (na produkcji: „będziesz musiał") — podpiąć współdzielony fragment promptu + rozszerzyć golden test rodzajowy na treści kalendarza.
3. Usuń zapis „★N" wszędzie (na produkcji „★21" czyta się jak liczba gwiazdek) — peak w tekście to zawsze „peak 21 cze".

## FAZA 1 — Rozdzielenie silnika na warstwy

`src/lib/astro/layers.ts`:
1. `getSeasons(natalChart, date)`: aktywne aspekty WOLNYCH planet (Jowisz–Pluton) do punktów natalnych — zakres całkowity = od PIERWSZEGO wejścia w orb do OSTATNIEGO wyjścia (retrogradacja wyprowadza i wprowadza ponownie — to JEDEN sezon z 2–3 przejściami, nie trzy sezony), fazy wyznaczane przejściami (przed 1. dokładnością / między przejściami / po ostatniej), **dni dokładności** (orb < 0,3°, wszystkie przejścia). Selekcja do wyświetlenia: max 3 wg ścisłości orbu i rangi planety, reszta pod „pokaż wszystkie".
2. `getFastWindows(natalChart, month)`: okna TYLKO szybkich planet (Mars, Wenus, Merkury, Słońce) — start/peak/koniec/kategoria/charakter. Naturalna liczność 2–5/mies. po progu istotności (kalibracja na rozkładzie długookresowym, absolutna).
3. `getMoonRhythm(date, natalChart?)`: znak Księżyca, godzina zmiany znaku, faza, pełnia/nów; z natalChart (premium): dom natalny, przez który przechodzi.
4. `getSkyEvents(range, natalChart?)`: **retrogradacje Merkurego/Wenus/Marsa** (daty stacji retro i directe; astronomy-engine liczy prędkość geocentryczną) oraz **zaćmienia** Słońca i Księżyca (astronomy-engine ma funkcje zaćmień; zaćmienie = flaga na odpowiednim nowiu/pełni). Z natalChart (premium): dom natalny, w którym dzieje się retro/zaćmienie. Wszystko deterministyczne + mapy tekstów (retro×planeta, zaćmienie×typ, ×dom dla premium) — zero AI.
5. Obsługa `no_birth_time`: bez godziny urodzenia nie istnieją — Księżyc w domach, sezony/okna do ASC i MC, domowa personalizacja retro/zaćmień; funkcje degradują się do znaków i aspektów planetarnych + UI pokazuje CTA „Uzupełnij godzinę urodzenia" (spójnie z natal).
6. **Strefa czasowa**: granice dni, godziny zmian znaku Księżyca i momenty dokładności w strefie usera — jawny parametr tz we wszystkich funkcjach warstw; test na dzień, w którym zmiana znaku wypada tuż po północy (klasyczny błąd ±1 dzień).
7. Wolne planety NIE występują w `getFastWindows`, szybkie w `getSeasons` — testy jednostkowe. Testy referencyjne każdej funkcji (znane efemerydy: sezon z retrogradacją i 3 dniami dokładności, okres Merkurego retro, zaćmienie).

## FAZA 2 — UI: struktura widoku (kolejność sztywna; SIATKA WIDOCZNA BEZ SCROLLA)

Kolejność desktop: „Dziś" (1 linia) → sezony (DOMYŚLNIE zwinięte do 1 linii) → siatka → „Twój [miesiąc]"; panel dnia w kolumnie bocznej. Mobile: „Dziś" → siatka → „Twój [miesiąc]" → sezony; panel dnia jako bottom sheet. Zasada nadrzędna: user otwiera „Kalendarz" i widzi kalendarz.

1. **Pasek „Dziś"**: data · Księżyc w znaku [· w Twoim N. domu — premium] · 1 zdanie rytmu (mapa tekstów Księżyc×znak + Księżyc×dom) · wzmianka o aktywnym oknie LUB trwającym retro z linkiem.
2. **„Twoje sezony"**: karta wg koncepcji §2 (nazwa AI, fraza, zakres, pasek fazy, akapit premium/lock free). Rozwinięta tylko: przy pierwszej wizycie, nowym sezonie, zmianie fazy; poza tym zwinięta do linii „Sezon przemiany w relacjach · do lis 2026 [rozwiń]" (stan w user_preferences). Generacja nazwy+akapitu: haiku, raz na sezon, cache w tabeli `seasons` (user_id, transit_key, content, phase, generated_at); cron dzienny sprawdza zmiany faz → inwalidacja + regeneracja.
3. **„Twój [miesiąc]"**: okna szybkie chronologicznie (format wiersza z koncepcji §2: pasmo-próbka · zakres · fraza · zdanie · „peak [data]") + sekcja **„Niebo dla wszystkich"**: zakres Merkurego/Wenus/Marsa retro i daty zaćmień z 1 zdaniem z mapy tekstów [+ dom usera premium]; synteza miesiąca + linia charakteru na końcu. Zdania okien i synteza: haiku, raz/mies., cache.
4. **Siatka**: pasma TYLKO dla okien szybkich + ★ peak; ◆ dni dokładności sezonów; glify pełni/nowiu (zaćmienie = wyróżniony glif); ℞ na dniach stacji Merkurego; ikonka zmiany znaku Księżyca (subtelna, w rogu); obwódka „dziś". ŻADNYCH: pasm sezonów, tintu, „+1". Wzorzec: docs/calendar-target-design.png.
5. **Panel dnia**: struktura z koncepcji §5; karta zaćmienia/pełni z pytaniem (zaćmienie = mocniejszy wariant treści); max 2 karty astrologiczne; „okno się domyka" zamiast „peak już za nami"; bez „dzień N z M".
6. **Onboarding pojęć** (pierwsza wizyta, raz): 3 coachmarki wg koncepcji §5b, zamykalne, stan w user_preferences.
7. Filtry kategorii NIE wchodzą w v4 (decyzja właściciela) — jeśli istnieją w kodzie, ukryj/usuń.

## FAZA 3 — Free/premium wg tabeli z koncepcji §4

Egzekwowanie server-side jak zawsze (struktura widoczna dla free, znaczenia za lockiem; treść lockowana nie opuszcza serwera). E2E na różnicę free/premium per sekcja.

## FAZA 4 — Sprzątanie po v1–v3

1. Usuń martwy kod: klasy dni, tint intensywności, stare pasma wolnych tranzytów, wskaźnik „+1", wszystkie nieużywane warianty komponentów kalendarza (audyt z v3 FAZY 0 — jeśli nie był zrobiony, zrób teraz; podejrzenie dwóch path'ów renderowania NADAL aktualne).
2. „Twoje nadchodzące okna" (sekcja pod siatką): scal z kartą „Twój [miesiąc]" — jedna lista okien, nie dwie; pozycje spoza bieżącego miesiąca jako „na horyzoncie" na końcu karty.
3. Grep-testy: „Wyjątkowy" (0 wystąpień), „★\d" w JSX/treściach (0), zakazane frazy mianownikowe (0).

## FAZA 5 — Weryfikacja (warunek zakończenia)

`docs/CALENDAR-V4-VERIFY.md`:
1. Tabela dla 3 kosmogramów × 3 miesiące: liczba sezonów, okien szybkich, ★, ◆, wydarzeń nieba (retro/zaćmienia), dni z jakimkolwiek oznaczeniem (oczekiwane: zdecydowana mniejszość dni miesiąca).
2. Screenshoty: pełny widok desktop i mobile 390px (siatka widoczna bez scrolla — asercja!), panel dnia (zwykły / w oknie / ◆ / zaćmienie), free z lockami, coachmarki, kosmogram bez godziny urodzenia.
3. Wynik testu spójności danych natalnych (FAZA 0.1).
4. Potwierdzenie braku wywołań AI dla dni bez wydarzeń (asercja na ai_call_logs podczas testu nawigacji po 30 dniach).
5. PostHog: `today_bar_viewed`, `season_expanded`, `season_exact_day_viewed`, `window_clicked`, `moon_phase_question_answered` + istniejące.

## Zasady

- Trzy warstwy są rozłączne: wolne planety → sezony, szybkie → okna, Księżyc → rytm. Nigdy w poprzek.
- AI generuje: nazwę+akapit sezonu (raz/sezon), zdania okien (raz/mies.), syntezę miesiąca (raz/mies.), odczyty dni (on-demand). Wszystko inne — mapy tekstów i formattery.
- Cisza domyślna: dzień bez wydarzeń pokazuje tylko rytm Księżyca.
- Niejasności → zatrzymaj się i zapytaj.
