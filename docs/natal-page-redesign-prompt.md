---
title: Strona kosmogramu — redesign do stylu landing v2
type: implementation-prompt
owner: Mac
created: 2026-06-12
companion: docs/design-system.md (v2 — dołączyć w całości) · referencja kodu: docs/landing-v2/hero-prototyp.html (sekcja S2 / NatalWheelDemo)
assets: docs/landing-v2/znaki-zodiaku-download.sh → public/assets/zodiac/
---

# Zadanie

Przeprojektuj stronę kosmogramu natalnego w aplikacji (widok z kołem i Wielką Trójką) tak, aby była w 100% spójna z design systemem i landingiem. Logika danych (pozycje z silnika astro) zostaje bez zmian — wymieniamy warstwę prezentacji.

# Błędy krytyczne do usunięcia (stan obecny łamie DS)

1. **Emoji zodiaku** (fioletowe kafelki ♑♏♐ i znaki na kole) — ZAKAZ (DS §7). Wszędzie autorski sprite `zodiac-glyphs.svg` przez `<use href="#zg-…">`, kolor `currentColor` z tokenów.
2. **Tęczowe kolory planet** (fioletowe/czerwone/niebieskie/cyjanowe kółka) — poza paletą. W kole-instrumencie planety = złoty punkt `--accent` + halo (blur), glif `--voice`. Kolory `--p-*` istnieją wyłącznie dla wizualu nieba w hero landingu.
3. Pomarańcz/żółć osi (MC/ASC grube linie) → `--accent-deep`, cienkie (1.5), etykiety caption `--text-muted`.
4. Wszystkie wartości kolorów/typografii/spacingu → tokeny z DS §1–2. Fonty: General Sans + Fraunces (tytuł własny odczytu może być we Fraunces — to „głos produktu").

# Koło natalne — port z landingu na prawdziwe dane

Bazą jest `NatalWheelDemo` (kod w prototypie, sekcja S2) → przerób na `NatalWheel` przyjmujący realne pozycje:

- Pierścienie 292/250/212 + piasta 56 z poświatą i znakiem księżyca z logo (opacity .22).
- Tiki co 5° (dłuższe co 10°), wypełnienia `--grad`-wedge co drugiego segmentu, granice znaków.
- Glify znaków ze sprite'a: znaki zamieszkane `--accent-deep` (klasa `on`), puste `--text-muted` .65.
- Domy: numeracja 1–12 w `--text-muted` 10.5px tabular (subtelnie, przy pierścieniu 212); osie ASC/MC/DSC/IC jako cienkie linie `--accent-deep` z małymi etykietami.
- Planety: punkt 3.4 + halo (feGaussianBlur) + glif z FE0E; aspekty `#E0B566` (harmonijne) / `#E2654A` (napięte) z niewidzialnymi hitboxami 12px.
- Interakcje 1:1 z prototypu: hover planety → jej aspekty, hover znaku → planety w znaku, hover aspektu → para; tooltipy (`role="status"`); tilt ±1.6°; wejście rotacją -12°→0 po IntersectionObserver; `prefers-reduced-motion` → statycznie.
- Tło: `public/assets/landing/wheel-backdrop.png` za kołem (border-radius 50%, opacity .9).

# Wielka Trójka — portrety znaków jak dzieło sztuki

Układ zostaje: **góra = Słońce, lewo = Ascendent, prawo = Księżyc** (mobile: trzy karty w rzędzie/kolumnie NAD kołem). Karta:

- Portret znaku z `public/assets/zodiac/sign-<znak>.webp` (zestaw 12, dobierany dynamicznie wg pozycji usera), `next/image`, aspect 1:1, radius 16, border `--line-soft`.
- Pod portretem: eyebrow (SŁOŃCE / ASCENDENT / KSIĘŻYC — caption, letter-spacing .14em, `--accent-deep`), nazwa znaku (General Sans 600, 21px), stopień + żywioł (caption `--text-muted`, tabular: „6° · Ziemia").
- Hover: poświata `0 0 48px rgba(255,174,61,.14)` + scale 1.02 portretu (transform only); klik → płynny scroll do interpretacji danego luminarza.
- Karty wyłaniają się (data-reveal) ze staggerem po narysowaniu koła.

# Pozostałe

- Eyebrow „KOSMOGRAM NATALNY" i tytuł odczytu: tytuł we Fraunces (głos produktu), reszta General Sans.
- Pasek chipów na dole (ASC/MC/Słońce/Księżyc): glify ze sprite'a (nie tekst „Str"/„Pan" — pełne nazwy lub glif + stopień, deklinacja z mapy odmian!).
- Microcopy „Najedź na symbol…" zostaje, ale podnieś kontrast do `--text-muted` minimum.
- Grain + `--grad-aurora` jako ambient tła strony (ledwo widoczny, pod treścią).

# Definition of done

Zero emoji i kolorów spoza tokenów (grep po hexach!) · wszystkie interakcje koła działają jak w prototypie landingu · Wielka Trójka renderuje właściwe portrety dla danych usera (przetestuj 3 różne kosmogramy) · mobile 390px: karty nad kołem, koło bez przycięcia · reduced-motion OK · porównanie side-by-side z landingiem — nieodróżnialny język wizualny.
