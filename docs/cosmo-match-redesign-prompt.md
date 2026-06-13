---
title: Cosmo Match (synastria) — redesign (przekazanie do Claude Code)
type: implementation-prompt
owner: Mac
created: 2026-06-13
companion: docs/design-system.md
visual-source-of-truth: docs/landing-v2/cosmo-match-mockup.html
asset-script: scripts/fetch-match-graphics.sh
---

# Cel

Redesign strony **Cosmo Match** (`/app/match`) — dziś generyczna (pierścień z liczbą). Nowa koncepcja: **relacja jako splecione nieba**. Hero pokazuje więź dwojga ludzi jako kosmos (dwa ciała + nici aspektów), a **wygląd zmienia się wg siły relacji** (5 tierów, każdy z własną grafiką). Zero twarzy/postaci — relacja jako stars/orbits/light.

**Wymieniasz warstwę prezentacji.** Silnik synastrii, wyliczanie score, podział na wymiary, paywall (Plus), share i wybór osób — **zostają**; tylko reskin + podpięcie grafik wg wyniku.

# Źródło prawdy wizualnej

`docs/landing-v2/cosmo-match-mockup.html` — kompletny mockup obu ekranów (**Wybór osób** + **Wynik**), z przełącznikiem „Siła relacji" pokazującym wszystkie 5 tierów. Portuj 1:1 do React/Tailwind, tokeny DS. Mac zaakceptował.

# Ekrany

**1. Wybór osób (setup):** dwa panele „Osoba 1 / Osoba 2", każdy z segmentem **Moje / Nowe**. „Moje" = lista zapisanych kosmogramów (avatar-inicjał + imię + data · godzina · miasto, wybór). „Nowe" = formularz (Imię opcjonalne, data, Godzina + „Nie znam", Miasto urodzenia). CTA **„Porównaj kosmogramy →"** (ember) gdy obie osoby wybrane. Wszystko na tokenach DS.

**2. Wynik:** hero z więzią + karty wymiarów + paywall + share.

# Hero „więź" — zmienność wg siły relacji

Złożenie warstw (środek):
- **Grafika tła** = jedna z 5 (wg tieru) — okrągła, rotacja ~160s + delikatny oddech.
- **Pierścienie** kodowe (kontr-rotujące) + **2 orbitujące akcenty** (kolor `--bond`).
- **Scrim** (radial dark) + w centrum **wynik** (liczba /100) i pod nim **etykieta tieru** (Fraunces italic).
- Nad kołem: „KOMPATYBILNOŚĆ" + imiona „A × B"; pod kołem: akapit-podsumowanie.

**Mapowanie wynik → tier (etykieta · grafika · kolor nici `--bond`):**

| Wynik | Etykieta | Grafika (`public/assets/match/`) | `--bond` |
|------|----------|-----------------------------------|----------|
| 90–100 | Splecione gwiazdy | `bond-90-splecione.png` | `--accent-deep` |
| 75–89 | Silne przyciąganie | `bond-75-przyciaganie.png` | `--accent-deep` |
| 60–74 | Rosnąca więź | `bond-60-rosnaca.png` | `--accent-deep` |
| 45–59 | Nauka przez tarcie | `bond-45-tarcie.png` | `--tense` (#E2654A) |
| 0–44 | Dwa różne nieba | `bond-0-rozne-nieba.png` | `--tense` (#E2654A) |

Teksty podsumowań per tier — w mockupie (tablica `TIERS`); doprecyzowanie copy zostaw astrolożce/Macowi (placeholder OK).

# Karty wymiarów

Siatka 2-kolumnowa: **8 modułów** (patrz sekcja „Rozbudowa interpretacji"). Pierwszy (**Komunikacja i zrozumienie**) odblokowany — nagłówek + pasek score + opis + „insight" z `--accent-deep`; pozostałe 7 zablokowane = treść `blur` + nakładka z kłódką (SVG, nie emoji) + „Dostępne w planie Plus" + „Odblokuj →". Pasek score: gradient `rgba(224,181,102,.6)→var(--accent)`. Pod kartami paywall + „Udostępnij wynik".

# Asset — 5 grafik relacji (self-host)

```
bash scripts/fetch-match-graphics.sh     # → public/assets/match/bond-*.png
git add public/assets/match              # commit razem z kodem
```
Higgsfield jobs (anchor `3cd1d4f4…`, model `nano_banana_2`): 1f1fb056 · 832f2f7c · 4406add3 · 3891e468 · bba903c6. (Ew. konwersja do `.webp`.)

# Animacje + reduced-motion

Z mockupu: rotacja grafiki + oddech, kontr-rotujące pierścienie, orbitujące akcenty, count-up liczby score przy wejściu (dodaj). **`prefers-reduced-motion` → statyczny kadr** (bez rotacji/oddechu). Animuj tylko `transform`/`opacity`.

# Integracja z istniejącą logiką (NIE przepisywać)

- Wynik/score, wymiary, ich teksty — z istniejącego silnika synastrii / API.
- Wybór osób → istniejące zapisane kosmogramy + formularz (reużyj komponentów `BirthForm`/selektora jeśli są).
- Paywall (locked dla nie-Plus), share — istniejące mechanizmy.
- Mapowanie score→tier (grafika/etykieta/kolor) to jedyna nowa logika prezentacji.

# DS / fonty

Tokeny globalne (`landing-tokens.css`), General Sans + Fraunces w `layout.tsx`. Wyłącznie paleta DS (jedyny dozwolony „spoza": `#E2654A` jako napięcie), zero emoji (kłódka/ikony = SVG/lucide).

# Rozbudowa interpretacji — moduły synastrii (≥6)

Obecnie analiza ma ~4 moduły i są krótkie. **Rozszerz do 8 modułów** (1 darmowy + 7 Plus — symetria z kartą natalną) i **wydłuż treść** (z 2–3 zdań do ~160–240 słów na moduł, z konkretami zamiast ogólników). Dobór modułów wg tego, co najbardziej zajmuje ludzi pytających o relacje:

1. **Komunikacja i zrozumienie** — jak rozmawiacie, słuchacie, rytm myśli i nieporozumienia. (Merkury–Merkury, Księżyc–Merkury, Mars–Merkury, III dom). **[DARMOWY — pierwszy odsłonięty]**
2. **Przyciąganie i chemia** — magnetyzm, pożądanie, iskra, co podtrzymuje napięcie. (Mars–Wenus, Pluton–Wenus, Słońce/Mars w V/VIII domu). **[Plus]**
3. **Więź emocjonalna i bezpieczeństwo** — bliskość, czułość, poczucie bycia „u siebie", przywiązanie. (Księżyc–Księżyc, Księżyc–Wenus, Rak/IV dom). **[Plus]**
4. **Wartości i wspólny kierunek** — cele, światopogląd, wiara, co budujecie razem. (Słońce, Jowisz, Saturn, IX dom). **[Plus]**
5. **Niezależność i bliskość** — równowaga wolności i „my", przestrzeń, autonomia. (Uran–Wenus, Wodnik, VII/XI dom). **[Plus]**
6. **Wyzwania i napięcia** — punkty zapalne, wzorce konfliktu i jak stają się rozwojem. (kwadratury/opozycje, Mars–Saturn, twardy Saturn). **[Plus]**
7. **Trwałość i przyszłość** — potencjał na długo, zobowiązanie, co spaja. (Saturn, VII dom, kompozyt Słońce/Księżyc, Vertex). **[Plus]**

8. **Przeznaczenie i lekcja** — po co się spotkaliście, wątek karmiczny, czego uczycie się przez siebie nawzajem. (Węzły Księżycowe, Pluton, Saturn). **[Plus]** — stały moduł (domyka symetrię „od przyciągania do sensu").

**Struktura każdego modułu** (spójna z natalną `KartaZawodnika`/`ModuleCard`, by reużyć UI):
- cytat-lead we **Fraunces** (1 zdanie, „głos Astrei"),
- **1–2 akapity** interpretacji z **konkretnymi aspektami synastrii** (nazwa aspektu + ciała OBOJGA osób, np. „Księżyc Macieja w trygonie do Wenus Joanny"),
- praktyczny **insight „→"** (co z tym zrobić w relacji),
- 2–3 **metry** (visualMeters, 0–100) + **tagi** + `confidenceScore`.

**Implementacja (domena treści — copy do akceptacji przez astrolożkę/Maca):** zaktualizuj spec modułów synastrii i **prompt generujący** (źródło: `docs/prompts.md` / edge function synastrii / `moduleSpecs`) — NIE hardcoduj treści w komponencie. UI `ModuleCard` renderuje moduły generycznie, więc obsłuży więcej i dłuższe moduły bez zmian strukturalnych; zadbaj tylko o `PREMIUM_MODULE_IDS` (1 darmowy + 6 Plus) i kolejność.

# Definition of done

Oba ekrany spójne z mockupem · 5 grafik self-host w `public/assets/match/` (w repo) · score→tier mapuje grafikę/etykietę/kolor/opis · **8 modułów (1 darmowy + 7 Plus), interpretacje wydłużone ~160–240 słów** · karty (odblokowana + 7 locked) na DS · animacje + reduced-motion · istniejąca synastria/score/paywall/share działają bez regresji · mobile 390px · TSC 0 · `npm run build` OK.
