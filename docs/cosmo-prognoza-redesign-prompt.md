---
title: Cosmo Prognoza (kalendarz) — redesign UX + wizual (przekazanie do Claude Code)
type: implementation-prompt
owner: Mac
created: 2026-06-13
companion: docs/design-system.md
visual-source-of-truth: docs/landing-v2/cosmo-prognoza-mockup.html
asset-script: scripts/fetch-prognoza-graphics.sh
---

# Cel

Redesign strony **Cosmo Prognoza** (`/app/today` / kalendarz) — funkcjonalnie najważniejszy moduł dla retencji, dziś w najgorszym stanie UX. Cztery zakładki (Dziś / Tydzień / Miesiąc / Rok) wyglądały i działały inaczej, część miała przyciski „Wygeneruj" z pustymi stanami, dużo żargonu. **Logika danych (silnik tranzytów/sezonów) zostaje — wymieniamy UX i prezentację.**

# Idea przewodnia (to nie 4 funkcje, to 1 timeline w 4 zoomach)

Wszystkie cztery zakładki mają **tę samą anatomię**, zmienia się tylko zoom i gęstość. Użytkownik uczy się raz:

1. **Pogoda okresu** — dominujący temat (Fraunces) + jednozdaniowy opis po ludzku + wskaźnik intensywności + orb-grafika nastroju.
2. **Oś czasu** — wizualizacja wg zoomu (Dziś = oś dnia z tranzytami; Tydzień = 7 kafli z ikoną pogody; Miesiąc = siatka z ikonami pogody; Rok = koło-medalion + łuki sezonów).
3. **Narracja** — interpretacja po ludzku + „na podstawie" (chipy z astro-detalem) + „Na dziś" (refleksja).
4. **Kiedy najlepiej…?** — chipy (Nowy biznes / Miłość / Pieniądze / Ważna rozmowa / Odpoczynek), klik → najlepsze okno. **Na każdym zoomie** (killer-feature retencyjny).
5. **Okna i wydarzenia** — jedna lista, filtrowana zoomem (zastępuje „Nadchodzące" / „Twój miesiąc" / „Twoje sezony").

# Twarde zasady (to było źródłem problemów)

- **Zero przycisków „Wygeneruj".** Auto-generacja przy pierwszym wejściu + **cache 24h+** (koszt AI pod kontrolą). Pusty stan z przyciskiem = zabójca retencji.
- **Tekst po ludzku, żargon TYLKO w metadanych.** Główna interpretacja bez nazw planet/aspektów — życie, nie wykres. Astro-detal w dyskretnych chipach „na podstawie" (np. „Uran napina Ascendent"). Zakaz: „okno tranzytu", „peak", „Uran w Bliźniętach staje naprzeciw Twojemu ASC…". (DS §6.)
- **Dwie osobne osie sygnału:**
  - **Intensywność** (ile) = gauge 5 kresek, **zawsze jeden kolor** (`--accent`) na każdym zoomie.
  - **Charakter** (jaki) = słowo (np. „napięty / spokojny / przełomowy", kolor: terakota=napięty, złoto=łagodny) **+ orb-grafika**. Nigdy nie koduj charakteru kolorem pasków intensywności.
- **Ikony „pogody dnia" rysuje kod** (skalowalne, kolor z tokenów): ☀ słońce = dzień sprzyjający (`--accent`), ⚡ piorun = napięty (`--tense`), ☾ księżyc = spokojny (`--text-muted`). Każdy dzień ma pogodę (też spokojne). **Grafiki Higgsfield = tylko duże tła** (orb nastroju, koło roku).

# Oś czasu — szczegóły per zoom (patrz mockup)

- **Dziś:** pozioma oś dnia; każdy moment to **konkretny tranzyt** (krążek z glifem planety + godzina + słowo „wsparcie/zwrot/napięcie", złoto/terakota) + tooltip z opisem; znacznik „teraz".
- **Tydzień:** 7 kafli (Pn–Nd) z ikoną pogody + podpisem; klik w dzień → „Dziś" tego dnia.
- **Miesiąc:** siatka; każdy dzień z ikoną pogody (słońce/piorun/księżyc); dziś podświetlony; legenda po ludzku; klik → „Dziś".
- **Rok:** **medalion-grafika (koło roku) w środku, obraca się** + kod rysuje wokół: pierścień miesięcy (bieżący podświetlony + wskaźnik), **3 łuki sezonów** (różne promienie, kolor wg charakteru) z **tooltipem po najechaniu** (nazwa + okres + co znaczy), „2026" wyśrodkowane. **Uwaga implementacyjna:** centruj medalion przez `margin` (nie `transform: translate`), bo `transform` kasuje animację `rotate`.

# Nawigacja między zoomami

Klik w dzień (tydzień/miesiąc) → „Dziś" tego dnia. Klik w sezon (rok) → skok do szczytu w miesiącu. Zoomy się przenikają, nie są wyspami.

# Grafiki (self-host)

```
bash scripts/fetch-prognoza-graphics.sh    # → public/assets/prognoza/
git add public/assets/prognoza
```
- `year-wheel.png` — medalion „Rok" (Higgsfield job b3de8b49).
- `mood-calm / mood-intense / mood-electric / mood-misty .png` — orb nastroju, **dobierany wg charakteru okresu** (spokojny→calm, napięty→intense, nieoczekiwany/Uran→electric, mglisty/Neptun→misty). Mapowanie zatwierdzone. Orb: maska kołowa, opacity ~.6, rotacja ~70s.

# Animacje + reduced-motion

Orb nastroju i medalion roku obracają się (~70–90s), pierścienie/oś żyją. **`prefers-reduced-motion` → statyczny kadr** (bez rotacji). Animuj tylko `transform`/`opacity`.

# Retencja (poza ekranem — rekomendacja)

- **Dzienny push:** „dzisiejsza pogoda + 1 rzecz najważniejsza" → deep-link do „Dziś".
- **Niedzielny digest tygodnia** (push/e-mail): „Twój tydzień w 30 sekund".
- **Odliczanie do okien:** „za 2 dni: dobry czas na rozmowę".
To największe dźwignie powrotów — warto zaplanować równolegle.

# DS / fonty

Tokeny globalne, General Sans + Fraunces w `layout.tsx`. Wyłącznie paleta DS (jedyny „spoza": `#E2654A` jako napięcie), zero emoji (ikony pogody = SVG kodem).

# Definition of done

Cztery zoomy = jedna anatomia · zero przycisków „Wygeneruj" (auto+cache) · intensywność jeden kolor wszędzie + charakter osobno (słowo+orb) · ikony pogody (☀/⚡/☾) na każdym dniu · interpretacje po ludzku, żargon w „na podstawie" · koło roku obraca się + łuki sezonów z tooltipem, wyśrodkowane · nawigacja między zoomami · grafiki self-host w `public/assets/prognoza/` · animacje + reduced-motion · istniejący silnik tranzytów/sezonów bez regresji · mobile 390px · TSC 0 · `npm run build` OK.
