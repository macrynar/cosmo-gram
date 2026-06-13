# PROMPT DLA CLAUDE CODE — Koło natalne: naprawa fan-out i aspektów + szlif UI wyników

> Po wdrożeniu natal-quality-fixes koło ma dwa regresy krytyczne (fan-out planet, aspekty) i kilka błędów szlifu. Dane astrologiczne są POPRAWNE (zweryfikowane: kierunek znaków, MC, domy) — naprawiamy wyłącznie prezentację.

---

Pracujesz w repo Cosmogram. Stan: koło SVG z fan-out stelliów, aspekty z legendą harmonijne/napięte, moduły w jednej kolumnie ze sticky nawigacją „8 rozdziałów o Tobie", chipy źródłowe, metryki z rejestru.

## FAZA 1 — Fan-out planet: z „łuku wszystkiego" na minimalną korektę

**Bug:** wszystkie planety renderują się w jednym ciasnym łuku niezależnie od realnych pozycji; kropki rzeczywistych pozycji bywają oddalone o dziesiątki stopni od glifu. Koło nie pokazuje nieba.

Wymagana logika:
1. Planeta BEZ kolizji (żadna inna w promieniu < średnicy glifu po kątowym rzucie): glif DOKŁADNIE na swojej pozycji, zero przesunięcia, zero kropki i linii prowadzącej.
2. Grupa kolidujących planet (klaster): rozsunięcie symetrycznie wokół środka ciężkości klastra, krok = minimalny odstęp gwarantujący brak nakładania (≈ średnica glifu + 2px), z zachowaniem kolejności kątowej. **Maksymalne przesunięcie glifu od realnej pozycji ≤ 12°** — jeśli klaster jest zbyt liczny, dodatkowo różnicuj PROMIEŃ (dwa pierścienie: wewnętrzny/zewnętrzny naprzemiennie) zamiast rozciągać łuk.
3. Kropka pozycji + linia prowadząca: TYLKO dla glifów przesuniętych o > 3°, linia krótka (glif→kropka), subtelna.
4. Testy wizualne (Playwright screenshot) na 3 przypadkach: kosmogram bez stellium (zero przesunięć — asercja na atrybutach transform), stellium 4 planet, stellium 6+ planet (przypadek „Ja": Saturn-Uran-Merkury-Neptun-Słońce-… w Koziorożcu/Strzelcu). Asercja w teście jednostkowym: |pozycja_glifu − pozycja_realna| ≤ 12° dla każdej planety.

## FAZA 2 — Aspekty: z centralnego dysku na całe wnętrze koła

**Bug:** linie aspektów rysują się w małym centralnym dysku — nieczytelne.

1. Linie aspektów łączą REALNE pozycje planet (nie pozycje glifów po fan-out!) po cięciwach wewnętrznego okręgu koła (promień ≈ tuż pod orbitami glifów). Centralny dysk zmniejszyć/usunąć — wnętrze koła należy do aspektów.
2. Domyślnie top 8 wg rankingu; tap/klik planety → podświetlenie jej aspektów + przygaszenie reszty (zgodnie z wcześniejszą specyfikacją — zweryfikuj, czy interakcja działa po naprawie).
3. Style: harmonijne ciągłe / napięte kreskowane (jest w legendzie ✓), grubość 1–1.5px, kolory czytelne na tle (sprawdź kontrast obecnej zieleni).
4. Screenshot test: koło z aspektami przez całe wnętrze, czytelne na 390px.

## FAZA 3 — Szlif UI wyników

1. **Sticky nawigacja rozdziałów**: wyśrodkuj zakładki względem kontenera treści (obecnie nagłówek „8 rozdziałów o Tobie" centrowany, zakładki do lewej — asymetria); na mobile: poziomy scroll z aktywną zakładką dosuwaną do widoku.
2. **Etykieta „w toku" przy metrykach**: usuń. Jeśli to stan ładowania/odświeżania — nie może wyciekać do UI; jeśli celowa kopia — jest niezrozumiała. Wartość + opis wystarczą (etykiety progowe wg rejestru metryk, jeśli wdrożone).
3. **Znacznik przeczytania (✓)**: pojawia się TYLKO po faktycznym doczytaniu rozdziału (scroll przez ≥80% sekcji), nie wg innego kryterium; aktywny rozdział ≠ przeczytany.
4. **Chipy źródłowe**: ujednolić notację — „ASC" zawsze wielkimi (nie „Asc"), konwencja: „Słońce w Koziorożcu · II dom", „Księżyc w Skorpionie · XII dom", „ASC w Strzelcu" (znak zawsze odmieniony, dom rzymski po kropce środkowej).
5. **Tytuł „Altar Nieba"**: jeśli ma zostać jako nazwa własna — dodaj do słownika brandowego i nie odmieniaj; zaproponuj właścicielowi 2–3 alternatywy w raporcie (np. „Mapa nieba", „Portret nieba") — decyzja należy do niego, nie zmieniaj samodzielnie.

## FAZA 4 — Język (golden testy przepuściły błędy — zatkaj dziury)

1. **„jakbyś stał"** w treści modułu Rdzeń — forma rodzajowa przeszła przez walidację. Rozszerz detektor: tryb przypuszczający z „jakbyś/gdybyś + imiesłów" (jakbyś stał/stała, gdybyś chciał/chciała) + czas przeszły 2 os. we WSZYSTKICH wariantach. Przepuszczenie = fail golden testu; dodaj ten przypadek do zestawu.
2. **Przecinki przed „który"**: podpisy metryk („terapeuta który…", „praktyk który…", „architekt który…") — interpunkcja do przebiegu korekty językowej; dodaj regexpress-check na „ [a-ząęó]+ który" bez przecinka w outputach.
3. Przebieg korekty językowej najwyraźniej nie objął podpisów metryk i treści — zweryfikuj, czy korekta przetwarza WSZYSTKIE pola outputu (podpisy, tagi, cytaty, treść), nie tylko treść główną.

## FAZA 5 — Weryfikacja

`docs/NATAL-WHEEL-VERIFY.md`: screenshoty koła przed/po (3 przypadki stellium), asercje fan-out (max odchylenie), aspekty na 390px, nawigacja desktop/mobile, wynik rozszerzonych testów językowych na 5 świeżych generacjach, lista propozycji nazwy sekcji dla właściciela.

## Zasady

- Glif planety = jej pozycja na niebie; przesunięcie to ostateczność ograniczona do 12°. Wierność astronomiczna > estetyka układu.
- Aspekty zawsze od pozycji realnych.
- Nie zmieniaj treści promptów interpretacyjnych — tylko walidacja/korekta.
- Niejasności → zatrzymaj się i zapytaj.
