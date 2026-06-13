# PROMPT DLA CLAUDE CODE — System symboli zodiaku: wdrożenie medalionów + glify

> W repo, w `docs/assets/zodiac/`, leży 12 zwektoryzowanych medalionów znaków (baran.svg … ryby.svg): autorska symbolika projektu — złoty line-art / sakralna geometria. Pliki są gotowe technicznie: prawdziwe ścieżki, `fill="currentColor"`, `viewBox="0 0 1200 1200"`, 85–176 KB. Zadanie: zbudować z nich trójpoziomowy system symboli i wdrożyć w całej aplikacji.

---

Pracujesz w repo Cosmogram: Next.js 16, TypeScript, Tailwind, Framer Motion. Koło kosmogramu używa dziś fioletowych kafelków-emoji dla znaków (do wymiany — to pkt 6.1 audytu natala). Istnieją: karty Wielkiej Trójki, kalendarz v4 (pasek „Dziś", sezony, pełnia/nów), match (SynastryWheel), quote cards i OG images (lub w trakcie wdrażania — sprawdź stan).

## WAŻNE ograniczenie techniczne medalionów

Medaliony to ścieżki typu FILL (wynik wektoryzacji), nie stroke. Konsekwencje:
- Kolor zmieniasz przez `color` (CSS) — działa.
- Animacja „rysowania się linii" (stroke-dashoffset) NIE zadziała na nich. Efekt rysowania osiągaj przez reveal maską (radialny wipe / segmentowy fade), nie stroke-animacją.
- Glify poziomu 2 i 3 (które narysujesz od zera) rób STROKE-based — na nich animacja rysowania działa natywnie.

## FAZA 1 — Infrastruktura systemu symboli

1. Przenieś assety do struktury produkcyjnej (np. `src/assets/zodiac/medallions/`), zachowaj slugi (baran…ryby; uwaga: plik nazywa się `koziorozec.svg`).
2. Komponent `<ZodiacSymbol sign={Sign} tier="medallion"|"glyph"|"mini" className/color/size>`:
   - `medallion`: lazy-load SVG (dynamic import / next-image z SVG; NIE inline w bundlu głównym — to 85–176 KB/sztuka), placeholder = glif.
   - `glyph` i `mini`: inline (powstaną w FAZIE 2, są małe).
   - `aria-label` z polską nazwą znaku (mapa deklinacji już istnieje — mianownik).
3. Preload medalionu znaku Słońca zalogowanego usera (najczęściej wyświetlany).

## FAZA 2 — Narysuj 12 uproszczonych glifów (programistycznie)

Poziom 2 systemu — czytelny w 16–24 px, spójny z duchem medalionów:

1. `src/assets/zodiac/glyphs/` — 12 SVG pisanych ręcznie jako ścieżki STROKE: `viewBox="0 0 24 24"`, `stroke="currentColor"`, `stroke-width="1.75"`, `stroke-linecap="round"`, `fill="none"`, bez transformacji, geometria z łuków i linii.
2. Forma: klasyczne glify astrologiczne (♈♉♊…) narysowane na siatce 24px — czytelność > ozdobność. Opcjonalny akcent z medalionów: pojedyncza kropka/promień, TYLKO jeśli nie zaburza czytelności w 16 px.
3. Spójność zestawu: identyczna grubość kreski, optyczne wyrównanie wielkości (glif Bliźniąt i glif Strzelca mają wyglądać na ten sam rozmiar — koryguj skalę per znak), wspólne marginesy.
4. Poziom 3 (`mini`): te same glify renderowane ≤14 px — zweryfikuj czytelność; jeśli któryś się klei, uprość wariant (osobny plik tylko dla problematycznych).
5. **QA wizualne obowiązkowe**: wyrenderuj arkusz (wszystkie glify × rozmiary 14/18/24/32 px na ciemnym tle) jako screenshot Playwright → zapisz do `docs/` i oceń czytelność każdego; popraw, co się klei. Iteruj, aż wszystkie przechodzą.

## FAZA 3 — Wdrożenie w aplikacji (mapa miejsc)

| Miejsce | Poziom | Szczegóły |
|---|---|---|
| Koło kosmogramu — pierścień znaków | glyph | ZAMIANA fioletowych kafelków-emoji; kolor złoty/wygaszony wg stanu (hover/dim) |
| Koło — tooltipy planet, chipy pozycji | mini/glyph | obok nazw („Słońce w Strzelcu" + glif) |
| Karty Wielkiej Trójki | medallion | medalion znaku jako art karty (obecne ikony glifowe → medalion + subtelny glow już istniejący) |
| Teatr generowania kosmogramu | medallion | medalion znaku Słońca odsłaniany maską radialną podczas oczekiwania (akt 1–2); skip działa |
| Kalendarz: pasek „Dziś" (Księżyc w znaku) | mini | przy frazie znaku |
| Kalendarz: karta sezonu | medallion (mały, ~48px) | znak, w którym stoi planeta tranzytująca |
| Kalendarz: karta pełni/nowiu/zaćmienia | medallion (mały) | znak pełni/nowiu |
| Match / SynastryWheel | glyph | pierścienie znaków obu kół |
| Share page + OG image natal | medallion | medalion znaku Słońca w OG (sprawdź wagę — do OG renderuj z SVG do PNG raz, cache) |
| Quote cards | medallion (wodny znak autora, delikatny, jako tło/watermark ~10% opacity) | nie konkuruje z tekstem |
| E-maile (horoskop dzienny) | PNG z glifu | e-mail nie zaciągnie SVG niezawodnie — wygeneruj raz 12 PNG 2x z glifów |

Wdrażaj idąc po tabeli; jeśli któreś miejsce jeszcze nie istnieje w kodzie (np. quote cards w trakcie), pomiń i odnotuj w raporcie.

## FAZA 4 — Wydajność i domknięcie

1. Bundle check: medaliony nie mogą trafić do initial JS bundle (asercja na rozmiar chunka przed/po).
2. Lighthouse na `/app/cosmogram` przed/po — performance nie spada więcej niż o 2 pkt.
3. Screenshot testy: koło z glifami (desktop + 390px), karta Wielkiej Trójki z medalionem, teatr (klatka z odsłoniętym w połowie medalionem), kalendarz „Dziś".
4. Usuń stare kafelki-emoji znaków i nieużywane assety; grep za pozostałościami.
5. Raport `docs/ZODIAC-SYMBOLS-VERIFY.md`: arkusz glifów z QA, screenshoty wdrożeń, miejsca pominięte (nieistniejące), wpływ na bundle/Lighthouse.
6. Zaktualizuj dokument statusu projektu.

## Zasady

- Medaliony = fill (reveal maską), glify = stroke (animacja rysowania OK) — nie mieszaj technik.
- Glify mają być czytelne, nie ozdobne — ozdobność niesie medalion.
- Jeden komponent `ZodiacSymbol` — żadnych rozproszonych importów SVG po komponentach.
- Kolor zawsze przez currentColor/CSS — zero hardkodowanych fill w miejscach użycia.
- Niejasności → zatrzymaj się i zapytaj.
