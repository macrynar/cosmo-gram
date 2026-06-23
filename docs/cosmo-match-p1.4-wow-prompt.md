---
title: Cosmo Match (P1.4) — prompt WOW · dopracowanie modułu pod kątem wizualnym
type: prompt
owner: Mac
created: 2026-06-22
supersedes: 2026-06-14-cosmo-match-p1.4-plan.md
context: redesign wizualny gotowy; ten dokument domyka „efekt wow" — koło synastrii jako bohater, dramaturgia reveal, jakość motion. Cosmo Match to jeden z motorów akwizycji, więc poprzeczka = „zajebiście", nie „ok".
mockup: docs/landing-v2/cosmo-match-wow-mockup.html  ← wizualny source of truth (klikalny, z animacjami)
---

# TL;DR dla Claude Code

Masz gotowy, klikalny mock-up: **`docs/landing-v2/cosmo-match-wow-mockup.html`**. To jest wzorzec wyglądu, ruchu i kopii. Twoje zadanie: doprowadzić żywy moduł (`/app/match`) do tego stanu. Otwórz mock-up, obejrzyj reveal (przycisk „↻ Odtwórz reveal"), przełącz pary i Free/Plus — wszystko, co tam widać, ma działać w produkcie.

**Jedno zdanie, o co chodzi:** dziś „wow" w hero to **dekoracja** (obrazek `bond-*.png` per tier → dwie różne pary o score 70 widzą ten sam obraz). Zamieniamy to na **realne koło synastrii** danej pary (już zbudowane w `SynastryWheel.tsx`), opakowane w dramaturgiczny reveal. „Wow = to jest o MNIE, nikt inny by tego nie dostał."

---

# Część I — ART DIRECTION (czytaj zanim dotkniesz kodu)

Cały moduł trzyma się palety i typografii redesignu. Nie wymyślaj nowych kolorów — używaj tokenów. Pełen zestaw jest w mock-upie (`:root`) i w `src/app/globals.css`.

## Paleta (tokeny — używaj dokładnie tych wartości)

```
--bg-base:#0B0912        tło bazowe
--bg-elevated:#14101F    karty / panele
--text-primary:#F4F1EA   nagłówki, imiona
--text-secondary:#B6AFC6 treść
--text-muted:#877FA0     podpisy, „/100", eyebrow
--accent:#FFAE3D         amber — akcent żywy (wypełnienia, CTA, glow)
--accent-deep:#E0B566    złoto — akcent spokojny (ramki, ikony, linie harmonijne)
--voice:#E9DCC0          krem — tier label, lead (Fraunces)
--line:#2B2540           ramki, separatory
--tense:#E2654A          tier napięty (score < 60)
--rose:#f5879a           planety Osoby B w kole
--grad-ember:linear-gradient(135deg,#FFC56B,#FFAE3D 45%,#F08F2E)   CTA
--grad-text: linear-gradient(110deg,#FFF8EC,#FFD9A0 55%,#E8BE78)   nagłówek H1
```

Tło strony: `radial-gradient(130% 90% at 50% -5%,#1A1530 0%,#0B0912 62%)` + delikatny film‑grain (SVG `feTurbulence`, opacity ~.05). Już jest w innych widokach — utrzymaj spójność.

## Typografia

- **Fraunces** (serif) — `font-style: italic` dla: tier label, lead każdej karty (pierwsze zdanie interpretacji), nagłówek hero. To „głos Astrei", emocjonalny akcent.
- **General Sans** (sans) — cała reszta (UI, body interpretacji, liczby). Liczby zawsze `font-variant-numeric: tabular-nums` (żeby count-up nie skakał szerokością).
- Score w centrum koła: 64px, weight 700, `text-shadow: 0 0 28px rgba(255,174,61,.45)`.

## Koło synastrii — styl jak kosmogram natalny (złoty monochrom)

Koło ma wyglądać jak ekran kosmogramu natalnego w apce — **złote, eleganckie, bez „chamskich" fioletowych ikon znaków**.

- **Glify znaków i planet = CIENKI ZŁOTY TEKST, nigdy emoji.** Przeglądarka domyślnie renderuje ♀ ♂ ♈–♓ jako kolorowe emoji (fioletowe kwadraty). Wymuś prezentację tekstową: dopisz `U+FE0E` po każdym symbolu (albo użyj fontu symbolicznego), `font-family: serif`, `fill` złoty. To był główny błąd pierwszej iteracji.
- **Paleta koła = monochrom złota.** Osoba A: amber `#FFC56B`. Osoba B: krem `#EAD9B0`. Zero różu/fioletu. Planety w ciemnych tarczkach (`rgba(11,9,18,.92)`) z cienkim złotym obrysem — rozróżnienie osób przez pierścień zewn./wewn. + dwa odcienie złota, nie przez kontrastowy kolor.
- **Detale jak natal:** pierścień stopni (krótkie kreski co 5°, dłuższe co 30°), znaki w zewnętrznym pasie, ciemne centrum pod score. Najlepiej **przejmij wprost język wizualny istniejącego komponentu kosmogramu natalnego** (ten sam font glifów, te same złote tony, ten sam pierścień) — żeby Match i Kosmogram wyglądały jak jedna rodzina.

## Warstwy hero (kolejność z‑index, od tyłu)

1. **Tło = istniejące grafiki więzi `bond-*.png`** (5 sztuk, per stopień kompatybilności — te same, co dziś w `TIERS` / `CompatibilityResult.tsx`). Wybór po tierze, `bondFor(score)`: 90+ splecione · 75+ przyciąganie · 60+ rosnąca · 45+ tarcie · 0+ różne nieba. `<img>` za kołem jako klimat, **nie** jako dane; opacity ~.6, **bez blura**, wolny `spin` 200s + `breathe`. **NIE generuj nowego nebula‑tła** — Mac woli istniejące grafiki (są ostrzejsze i ładniejsze). `onerror` → chowaj, gradient zostaje. Assety serwuj z `public/assets/match/`.
2. **Glow** — radialny amber `breathe` 7s.
3. **Koło synastrii** (SVG, `SynastryWheel`) — bohater. z‑index nad tłem.
4. **Scrim** — radialny ciemny krążek w centrum (żeby score był czytelny na liniach).
5. **Score overlay** (HTML, wyśrodkowany) — count-up + „/ 100".

> Zasada: tło Higgsfield = atmosfera; koło = treść. Jeśli kiedykolwiek tło zaczyna konkurować z kołem o uwagę — ściszaj opacity, nie odwrotnie.

---

# Część II — DRAMATURGIA REVEAL (to jest „wow", nie ozdoba)

Reveal to jeden ciągły spektakl, nie spinner + skok do wyniku. Dokładny timing jest zaimplementowany w mock-upie (`render()`). Hero **nie jest globalnie wygaszany** — treść pod kołem jest ukryta (`.rv`) i odsłaniana etapami. Wartości docelowe (od momentu, gdy znika intro-kino):

| Faza | Start (ms) | Co się dzieje | Jak |
|---|---|---|---|
| 0. Kino w kole | przed | cinematic wideo (Higgsfield) gra **wewnątrz okręgu koła** — wycentrowane, przycięte do koła; w tle wolny „skan" + pulsujące pierścienie | ~2,8 s. **Bez napisów loadingowych** — przy tej długości i tak nieczytelne (decyzja Maca). Jeśli wideo się nie wczyta → sam skan/pierścienie, nigdy nie wygląda na zepsute |
| 1. Koło się odsłania | 0 | intro-kino znika (crossfade ~.65 s), w okręgu pojawia się koło + score | bez globalnego fade hero; tylko intro chowa się nad kołem |
| 2. Planety | 120 + i·55 | planety A (złote, pierścień zewn.) potem B (różowe, wewn.) wchodzą opacity 0→1, staggered | matchuje `SynastryWheel` (delay `i*0.07`) |
| 3. Linie aspektów | 650 + i·90 | linie **rysują się** od planety A do B (`stroke-dashoffset` len→0) + opacity 0→.5; harmonijne złote ciągłe, napięte `#E0865A` przerywane `4 3` | to najefektowniejszy moment — niech każda linia „dociąga" |
| 4. Count‑up score | ~750 | 0 → wynik, easing cubic‑out 1300 ms; glow w centrum pulsuje | `useCountUp` już istnieje |
| 5. Tier → top aspekt → summary | 1100 / 1300 / 1500 | kolejno fade‑up | `.rv → .show` ze stagger |
| 6. 8 kart | 1700 + i·80 | staggered fade‑up; paski score wypełniają się (width 0→%) | już jest stagger kart |
| 7. Paywall + akcje | ~2500 | fade‑in | — |

**Easing wszędzie:** `cubic-bezier(.22,1,.36,1)` (już jako `--ease`).

**`prefers-reduced-motion: reduce`** → pomiń całą sekwencję: pokaż stan końcowy natychmiast (koło narysowane, score = wynik, karty widoczne). W mock-upie obsłużone przez gałąź `if(!animate||reduce)`.

**`?reveal=instant`** (już obsługiwane przez prop `animate`) → też stan końcowy bez animacji (dla wejść z powrotu/SSR‑hydration).

---

# Część II.5 — UKŁAD INTERPRETACJI + mikroanimacja + asset wideo (review #2)

## Interpretacja = rozdziały, nie siatka kart (jak kosmogram natalny)

> **WYMÓG TWARDY — użyj DOKŁADNIE tych samych komponentów co kosmogram urodzeniowy.** Ta sama nawigacja rozdziałów i ten sam panel rozdziału (np. `ChaptersNav` / `ChapterPanel` — jak nazywają się w natalu). **Nie buduj „podobnego" wariantu.** Interpretacja w Match i w Kosmogramie ma być wizualnie nie do odróżnienia: ten sam wygląd pigułek, checkmarków, eyebrow, typografia nagłówka, paddingi, linie. Mock-up jest tylko poglądowy i **lekko się różni** — źródłem prawdy jest komponent natalny, nie mock. Jakakolwiek różnica względem natala = błąd do poprawy.

8 wymiarów prezentujemy **dokładnie jak „8 rozdziałów o Tobie" w kosmogramie natalnym**: pozioma nawigacja rozdziałów + jeden moduł pokazany pionowo, na pełną szerokość. (Nie siatka 2-kolumnowa.)

- **Nawigacja:** 8 pigułek „1. Komunikacja … 8. Przeznaczenie" (krótkie etykiety). Aktywna = złota pigułka; dostępny rozdział = ✓; zablokowany = kłódka. Pod navem cienka linia (jak na ekranie natal). Na mobile nav przewija się poziomo.
- **Panel aktywnego rozdziału:** eyebrow (ikona + NAZWA WERSALIKAMI, gold), wielki **Fraunces italic** nagłówek (lead/„cytat" Astrei), duży score + pasek, body + insight.
- Domyślnie otwarty = **najmocniejszy** (darmowy) wymiar. Klik w zablokowany rozdział → panel z **widoczną liczbą** (np. „67/100") + rozmyty teaser + CTA „Odblokuj". Bez pełnego blura — liczba sprzedaje.
- **Te same komponenty, nie kopia:** importuj i użyj istniejących komponentów rozdziałów z kosmogramu natalnego (nawigacja + panel). Jeśli trzeba je uogólnić, by przyjęły dane Match — zrób to przez propsy, nie przez duplikację. Mapowanie: 8 wymiarów Match → „rozdziały"; score wymiaru → np. odznaka/checkmark rozdziału; lead → nagłówek‑cytat; body+insight → treść rozdziału.

## Mikroanimacja grafiki głównej

Koło hero ma **żyć**: warstwa złotych particli na `<canvas>` — kilkanaście pływających (twinkle) + ~6 orbitujących wokół środka jak satelity. Subtelnie i premium, nie „disco". `prefers-reduced-motion` → szczątkowe/statyczne.

## Asset: cinematic wideo reveal (Higgsfield)

Wygenerowane 9:16, ~5 s, model kling3_0_turbo (`hf_…_7615490c….mp4`). Zastosowania:

- **In-app:** tło sekwencji „Odczytujemy połączenia…" (loading reveal) — w mock-upie podpięte pod `#loadvid`. Opcjonalnie pętla w tle hero na mobile.
- **Akwizycja:** Reels / Stories / ads. Do feedu zrób wariant 1:1 lub 16:9 narzędziem `reframe`.
- Pobierz do `public/assets/match/`; `muted loop playsinline autoplay`. Nie linkuj CloudFront w prod.

# Część III — ZADANIA (kolejność = priorytet)

> Numeracja = sugerowana kolejność. 1–2 domykają „wow" całego modułu i odblokowują sens 4 (share). 3, 5–8 to szlif jakości i konwersji — równolegle lub zaraz po.

## 1. [WOW] Realne koło synastrii jako hero — *domyka P1.4 / wizualizacja*

Dziś hero w `CompatibilityResult.tsx` (sekcja „Bond visual", ~linie 276–349) to dekoracyjny `tier.img` + orbitujące kropki. Komponent z prawdziwymi danymi (`SynastryWheel.tsx`) już istnieje i jest dobry.

- [ ] Zaimportuj `SynastryWheel` z `@/components/match/SynastryWheel` do `CompatibilityResult.tsx`.
- [ ] Podaj dane, które API już zwraca: `result.planetPositions.a/b` i `result.aspects` (route.ts ~201–205, 293). Propsy się zgadzają: `planetsA`, `planetsB`, `aspects`, `nameA`, `nameB`.
- [ ] Zastąp obrazek kołem. Score (`{score}` z `useCountUp`) nałóż **na środek koła** jako HTML overlay (łatwiejszy count‑up + glow niż SVG `<text>`); zachowaj tier label i summary pod spodem.
- [ ] Kosmiczne tło Higgsfield zostaw jako **delikatną poświatę za kołem** (opacity ~.42, blur), nie jako główny element — patrz Część I, warstwy hero. Dodaj `scrim` w centrum pod score.
- [ ] **Fallback:** stare zapisy bez `aspects`/`planetPositions` (sprzed redesignu) → pokaż starą dekorację. Warunek: `result.aspects?.length ? <SynastryWheel/> : <dekoracja/>`.

**Gotowe, gdy:** dwie różne pary o tym samym score widzą **różne** koła. (W mock-upie: przełącz „Para 92 / 71 / 47" — koło i liczba aspektów zmieniają się, bo liczone są z realnych długości planet.)

## 2. [WOW] Dokończyć dramaturgię reveal — *domyka P1.4 / reveal*

`SynastryWheel` ma już animowane wchodzenie planet i rysowanie linii. Trzeba zsynchronizować całość wg tabeli z Części II.

- [ ] Sekwencja: koło+planety → linie (draw `stroke-dashoffset`) → count‑up score → tier/top‑aspekt/summary → 8 kart → paywall/akcje.
- [ ] **Bez napisów loadingowych w reveal** — przy tej długości migają nieczytelnie (decyzja Maca). Zamiast „teatru tekstu": cinematic wideo w okręgu koła + skan/pulsujące pierścienie, potem odsłona koła. Stary loader „Odczytujemy połączenia…" (`page.tsx` ~284–303) zastąp tym intro.
- [ ] Uszanuj `?reveal=instant` (jest) i `prefers-reduced-motion` — rozszerz na count‑up (dziś reduced‑motion działa na CSS hero, ale liczba i tak się animuje — wyłącz ją też).

## 3. [UX] Mobile — *P1.8 „każdy moduł na mobile"*

- [ ] Interpretacja to teraz **rozdziały (komponent natalny)**, nie siatka kart — na mobile nawigacja rozdziałów przewija się poziomo, panel na pełną szerokość. Zachowanie mobilne **odziedzicz z natala** (kolejny powód, by użyć tych samych komponentów). Stary `mx-grid` z `CompatibilityResult.tsx` znika.
- [ ] Koło na wąskim ekranie: `SynastryWheel` ma `maxWidth:390` + listę mobilną aspektów (`sm:hidden`). Po podpięciu jako hero zweryfikuj, że lista nie dubluje się z kołem i że glify planet są klikalne palcem.
- [ ] Checklist: czy moduł wygląda jak natal, czy gorzej (P1.8). Score 64px na 360px szerokości — sprawdź, czy nie dotyka krawędzi scrim.

## 4. [WZROST] Grafika do pobrania (9:16) + ujednolicenie OG — *domyka P1.4 / share, zasila P3*

- [ ] **Ujednolić OG** (`src/app/share/match/[id]/opengraph-image.tsx`): dziś fiolet `#a78bfa` + `Georgia`. Przejść na paletę redesignu: złoto `#E0B566`/`#FFAE3D`, krem `#E9DCC0`, tło `#0B0912`/`#1A1530`, akcent serif = Fraunces (lub `Georgia` jako serif‑fallback w OG runtime). Wzór layoutu = karta share w mock-upie.
- [ ] **In‑app „Pobierz grafikę"** — karta **9:16** do IG/Stories (mock-up: `#modal` / `.scard`). Zawiera: brand, „Kompatybilność", `imię × imię`, duży score, tier label, **najpiękniejszy aspekt**, stopka `cosmogram.app/match`, tło = wariant 9:16 Higgsfield (`hf_…_9a99833a…`). Render do PNG: `html-to-image`/`satori` w edge function albo `<canvas>` po stronie klienta.
- [ ] Powiąż z programem poleceń (P3): grafika = naturalne zaproszenie drugiej osoby.

## 5. [KONWERSJA] Mocniejszy tease paywalla

Dziś free‑user widzi zawsze moduł #1 (Komunikacja); reszta = pełny blur (`CompatibilityResult.tsx` `locked = !isFirst && !isPremiumUser` ~369; strip server‑side route.ts ~296–304).

- [ ] Zamiast zawsze pierwszego — pokaż za darmo **najmocniejszy** wymiar pary (np. Przyciąganie 90). Mocniejszy hook FOMO. (Mock-up: karta „Darmowy wgląd" = `argmax(scores)`.)
- [ ] Na zablokowanych kartach pokaż **samą liczbę** zamiast pełnego blura: nagłówek + pasek + „Dlaczego **90/100**? — odblokuj". Liczby sprzedają lepiej niż rozmazany tekst.
- [ ] **Backend:** API musi zwracać *score'y wszystkich wymiarów* (bez treści) zamiast wycinać całe kategorie. Zmień strip w route.ts: dla free zostaw `{name, score}` wszystkich, `interpretation/insight` tylko dla najmocniejszego.

## 6. [WOW] „Najsilniejszy aspekt" w hero — *personalizacja*

- [ ] Top aspekt jest już liczony i używany w OG, ale nie w UI wyniku. Dodaj pod tier label pigułkę: „Wasz najsilniejszy aspekt: ☉ Słońce ↔ ♀ Wenus · trygon". Personalizuje hero i zasila grafikę z pkt. 4. (Mock-up: `.topasp`.)

## 7. [RETENCJA] Jeden jasny krok dalej po wyniku — *spójne z P1.7*

Dziś po wyniku jest tylko „Udostępnij" + paywall. Brak mostu do reszty aplikacji.

- [ ] Dodaj sekcję dwóch akcji (mock-up: `.actions`): **„Jak ten tydzień wpływa na Waszą relację"** (most do horoskopu tranzytowego P1.2) + **„Porównaj z kolejną osobą"** (nowy match). Karty z ikoną, tytułem, podtytułem.

## 8. [JAKOŚĆ] Sprzątanie kodu

- [ ] `src/lib/synastry-score.ts` (stary, 5‑wymiarowy) jest **nieużywany** — aktywny `src/lib/astro/synastry.ts` (8‑wymiarowy). Usuń legacy.
- [ ] Skonsoliduj typ `SynastryAspect` — istnieją dwie definicje różnego kształtu.
- [ ] Drobne: chip zapisanego matcha bez daty; brak akcji „regeneruj". Clamp score 30–92/95 to świadoma decyzja (brak brutalnych wyników) — zostaw, ale **udokumentuj** w kodzie komentarzem.

---

# Definicja „P1.4 gotowe"

1. Hero pokazuje **realne koło synastrii** danej pary — różne pary = różne koła.
2. Reveal to **sekwencja** koło → linie (draw) → count‑up → karty, nie sam spinner; działa reduced‑motion i `?reveal=instant`.
3. Pełne 8 wymiarów czytelne na mobile (1 kolumna — zweryfikowane, nie zduplikowane).
4. Działa in‑app **„Pobierz grafikę" (9:16)** w palecie redesignu; OG spójny wizualnie.
5. Free‑tease pokazuje **najmocniejszy** wymiar + **liczby** zablokowanych; API zwraca score'y wszystkich wymiarów; „najsilniejszy aspekt" w hero; most do tranzytów; martwy kod usunięty.

# Minimum, żeby ruszyć dalej z roadmapą

**Pkt 1 + 2** (koło + reveal) — realnie domyka „wow" całego modułu i odblokowuje sens pkt 4 (share). Reszta to szlif jakości i konwersji.

---

# Czego NIE robić (anti‑patterns)

- **Nie buduj osobnego, „podobnego" komponentu interpretacji/nawigacji** — użyj DOKŁADNIE tych samych komponentów rozdziałów co kosmogram urodzeniowy. Różnica wyglądu względem natala = błąd. (Mock-up jest tylko poglądowy i lekko się różni.)
- **Nie dawaj migających napisów loadingowych w reveal** — przy tej długości są nieczytelne; intro to kino w kole + skan, bez tekstu.
- Nie wracaj do `bond-*.png` jako głównego elementu hero — to dekoracja, nie dane (chyba że fallback dla starych zapisów).
- Nie hardkoduj nowych kolorów — tylko tokeny z Części I.
- Nie rób reveal „all‑at‑once" — efekt „wow" jest w sekwencji i w rysowaniu linii.
- Nie linkuj assetów Higgsfield z CloudFront w produkcji — pobierz do `public/assets/match/`.
- Nie ruszaj logiki astro/score bez tabeli porównawczej z Astro.com (zasada z CLAUDE.md) — tu zmieniamy tylko warstwę prezentacji i co API zwraca dla free, nie sam scoring.
- AI/astro tylko przez edge function (zasada z CLAUDE.md) — to dotyczy interpretacji, nie tej warstwy UI.
