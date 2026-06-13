# PROMPT DLA CLAUDE CODE — Kalendarz v3: specyfikacja ostateczna z twardymi kryteriami odbioru

> Trzecia iteracja kalendarza. Poprzednie dwie zawiodły z tego samego powodu: brak twardych limitów → inflacja ważności (na screenie z produkcji CAŁY wrzesień jest podświetlony, dni 26–30 mają gwiazdki seriami, legenda nadal pokazuje usunięte pojęcie „Wyjątkowy"). Ta specyfikacja ma limity wpisane w kod i raport weryfikacyjny jako warunek zakończenia. Wykonaj ją DOKŁADNIE — bez własnych interpretacji. Wzorzec wizualny docelowej siatki: docs/calendar-target-design.png (opis w §2).

---

Pracujesz w repo Cosmogram. Wdrożone: silnik tranzytów, okna (start/peak/koniec — sekcja „Twoje nadchodzące okna" liczy je poprawnie), `daily_personal_horoscopes`, `day_interpretations`, panel dnia z sekcjami sprzyja/uważać i przyciskiem „Odczytaj ten dzień".

## FAZA 0 — Audyt: dlaczego v2 nie weszło w pełni

Na produkcji legenda nadal pokazuje „Dzień Mocy / Wyjątkowy / Pełnia·Nów", frazy mają stary format („Mars trygon Twoim Księżycem w Byku"), a klasy dni nadal działają. Zanim cokolwiek napiszesz:
1. Znajdź WSZYSTKIE komponenty renderujące siatkę kalendarza i legendę — sprawdź, czy nie ma dwóch path'ów (stary komponent + nowy, desktop vs mobile, free vs premium). Wynik audytu zapisz w raporcie (§5).
2. `grep -r "Wyjątkowy"` po repo — każde wystąpienie w kodzie produkcyjnym usuwasz w tej fazie.
3. Zinwentaryzuj, które elementy v2 weszły, które nie — raport, bez domysłów.

## FAZA 1 — Kalibracja absolutna (rzetelność zamiast wymuszonego rozkładu)

Zasada nadrzędna (decyzja właściciela): **dane astrologiczne pokazujemy uczciwie** — jeśli ktoś ma naprawdę gęsty miesiąc, kalendarz ma to pokazać. Inflację z poprzednich wersji leczymy KALIBRACJĄ progów na rozkładzie długookresowym, nie przycinaniem prawdy do kwot.

1. **Skrypt kalibracyjny** (`scripts/calibrate-calendar.ts`, uruchamiany ręcznie przy zmianie wag): policz siłę dnia i siłę okien dla ~50 zróżnicowanych kosmogramów × 10 lat efemeryd. Z tego DŁUGOOKRESOWEGO rozkładu wyznacz absolutne progi (np. percentyl 70 → próg lekkiego tintu, 90 → wyraźnego, próg „okna wartego pokazania", próg Dnia Mocy) i zapisz jako stałe w `src/lib/astro/calendarLimits.ts` z komentarzem, skąd pochodzą.
2. **Efekt**: ten sam dzień ma ten sam tint niezależnie od miesiąca. Przeciętny miesiąc wyjdzie ~70/20/10 naturalnie, ale konkretny miesiąc może uczciwie odbiec w obie strony — i TO JEST INFORMACJA, którą komunikujemy (patrz pkt 5).
3. **Dni Mocy (★)**: peak każdego okna powyżej absolutnego progu siły. Typowo 3–6/mies. (zweryfikuj kalibracją); sąsiadujące ★ są dozwolone, jeśli to peaki RÓŻNYCH okien (jedno okno = zawsze jeden peak — to naprawia serie gwiazdek z produkcji, które były jednym rozmazanym tranzytem). Sanity cap renderowania: przy >8 ★ pokaż top 8 i odnotuj w karcie miesiąca, że miesiąc jest wyjątkowo intensywny.
4. **Pasma**: wszystkie realne okna powyżej progu; przy nakładaniu renderuj max 2 najsilniejsze pasma per dzień + wskaźnik „+1" w tooltipie. Gęsty miesiąc = więcej pasm, uczciwie.
5. **Charakter miesiąca w karcie „Twój [miesiąc]"**: porównanie miesiąca do długookresowej bazy daje jedną linię: „spokojny miesiąc — dobry na regenerację" / „zwykły rytm" / „gęsty miesiąc — dużo się otwiera". Zmienność między miesiącami to feature produktu (i argument za powracalnością), nie błąd.
6. Test CI: na bazie kalibracyjnej (50 kosmogramów × 10 lat) ŚREDNIE pokrycie tintu ~70/20/10 (tolerancja ±10 pp), średnio 3–6 ★/mies. — asercja na średnich, NIE na pojedynczym miesiącu. Plus test: jedno okno nigdy nie produkuje dwóch ★.

## FAZA 2 — Render siatki (wzorzec wizualny — odtwórz 1:1)

Docelowy wygląd miesiąca (zaakceptowany przez właściciela):
1. Dni zwykłe (70%): płaskie, ciemne, bez obramowań akcentowych — CISZA jest domyślna.
2. Tint: 20% dni minimalnie jaśniejsze tło, 10% wyraźniej — różnica subtelna (krok jasności ~4–6% L), bez złotych teł całych komórek.
3. **Okno = pasmo**: cienka linia 3px u DOŁU komórek przez wszystkie dni okna (zaokrąglona na końcach zakresu), kolor: wspierające #E3B85C / wymagające #C97A4A (dopasuj do palety dark crystal). Pasmo NIE zmienia tła komórki.
4. **★ tylko na peaku**: mała gwiazdka przy numerze dnia, numer w kolorze złota. Żadnych pierścieni na innych dniach okna.
5. Dziś: obwódka fioletowego akcentu — jedyna obwódka w siatce (poza hover).
6. Pełnia/nów: drobny glif ● / ○ w rogu komórki.
7. Legenda DOKŁADNIE: „━ okno tranzytu · ★ Dzień Mocy (peak okna) · ● pełnia / nów".
8. Karta „Twój [miesiąc]" nad siatką (z v2 — jeśli nie weszła, wchodzi teraz): wiersz per okno z pasmem-próbką koloru, frazą tranzytu, zakresem dat, jednym zdaniem znaczenia i „★ peak [data]". Klik wiersza → podświetlenie zakresu w siatce.

## FAZA 3 — Język: formattery jako jedyne źródło

1. `formatTransit(window)` → „Mars w Byku · trygon do Twojego Księżyca" — JEDYNA funkcja produkująca frazy tranzytów; używana w karcie miesiąca, oknach nadchodzących, panelu dnia, e-mailach, tooltipach. CI grep-test na zakazane wzorce: `trygon Twoim|opozycja Twoją|kwadrat Twoim|aktywuje Twojego [A-Z][a-z]+ ` (mianownik po zaimku).
2. `formatNatalPoint(point, case)` — deklinacja punktów natalnych (dopełniacz/biernik: Saturna, Księżyca, Słońca, Marsa, Merkurego, Wenus [ndm], Ascendentu, MC). Obecny błąd na produkcji: „Saturn aktywuje Twojego Saturn".
3. **Deduplikacja opisów**: mapa tekstów okien kluczowana (planeta tranzytująca × aspekt × punkt natalny), po 2–3 warianty na klucz (rotacja per user+miesiąc). Na produkcji trzy okna Marsa mają IDENTYCZNE zdanie „napięcia i konflikty blisko powierzchni — świadoma komunikacja" — niedopuszczalne; opozycja do Merkurego (komunikacja) musi mieć inny tekst niż kwadrat do Marsa (działanie/impulsywność) i inny niż napięcie do Księżyca (emocje).
4. Nagłówek panelu dnia: fraza z `formatTransit`, nie zlepek („Saturn aktywuje Twojego Saturna" tylko jeśli tak wygeneruje formatter — konwencja: „[fraza tranzytu]" jako tytuł sekcji, bez słowa „aktywuje").

## FAZA 4 — Higiena panelu dnia (drobne, ale wykonaj)

1. Sekcje sprzyja/uważać: max po 1 pozycji z najsilniejszych okien dnia; jeśli dzień bez okien — pojedyncze zdanie spokojnego dnia, BEZ sekcji.
2. Pytanie refleksyjne: tylko dni z oknem (scarcity).
3. Data w panelu: polska odmiana „Niedziela, 6 września 2026" (miesiąc małą literą, dopełniacz — obecnie „6 Września").
4. Wszystkie poprawki z v2 FAZY 0, które nie weszły (struktura JSON horoskopu, walidacja skryptu łacińskiego, koniec zdania, stan przycisku) — zweryfikuj i domknij.

## FAZA 5 — Raport weryfikacyjny (warunek zakończenia — bez tego nie kończysz)

Wygeneruj `docs/CALENDAR-V3-VERIFY.md`:
1. Wynik audytu FAZY 0 (ile path'ów renderowania, co nie weszło w v2 i dlaczego).
2. Dla 3 kosmogramów referencyjnych × 3 miesiące — tabela: liczba ★ (każda z przypisanym OSOBNYM oknem — jedno okno nigdy nie daje dwóch ★), % dni z pasmem, rozkład tintu per miesiąc + średnia z bazy kalibracyjnej (~70/20/10 ±10 pp na średniej), liczba unikalnych tekstów okien, linia charakteru miesiąca.
3. Screenshoty (Playwright): siatka miesiąca aktywnego, miesiąc spokojny, karta „Twój miesiąc", panel dnia z oknem i bez, mobile 390px.
4. Wynik grep-testów językowych (0 trafień zakazanych wzorców, 0 wystąpień „Wyjątkowy").
5. Potwierdzenie modelu generującego treści kalendarza (nazwa modelu z configu + przykładowy wpis `ai_call_logs`).

## Zasady

- Progi z `calendarLimits.ts` pochodzą z kalibracji długookresowej — są absolutne i stałe; zmiana progów wyłącznie przez ponowną kalibrację, nigdy ad hoc per miesiąc.
- Rzetelność > estetyka: gęsty miesiąc pokazujemy jako gęsty (i nazywamy to w karcie miesiąca). Cisza przeciętnego dnia bierze się z uczciwej kalibracji, nie z przycinania danych.
- Każda fraza przez formattery — żadnych sklejanych stringów z nazwami planet/znaków poza nimi.
- Niejasności → zatrzymaj się i zapytaj. Odstępstwa od spec — tylko po pytaniu.
