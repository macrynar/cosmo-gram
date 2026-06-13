---
title: Redesign kosmogramu — przekazanie do Claude Code (release na produkcję)
type: release-handoff
owner: Mac
created: 2026-06-13
companion: docs/design-system.md · docs/natal-page-redesign-prompt.md · podgląd: docs/landing-v2/kosmogram-redesign-podglad.html
---

# Cel

Wypuścić **sam redesign strony kosmogramu** (`/app/cosmogram`: koło natalne + Wielka Trójka + DS-pass całej strony) na `main` jako **osobny release**, odseparowany od niedokończonej pracy nad prognozą.

Redesign jest **gotowy i przetestowany lokalnie** (TSC 0 błędów, wygląda zgodnie z landingiem). Problem jest wyłącznie organizacyjny: kod siedzi na złym branchu i wymaga dopięcia fundamentu w `layout.tsx`.

# Stan repo (2026-06-13)

- **Redesign żyje w commicie `377e8ac` na branchu `prognoza-v6`** — NIE na `main`.
- `prognoza-v6` ma też niedokończoną prognozę/kalendarz (silnik „kiedy najlepiej", week/year-interpretation, deepseek.ts, text-validation.ts) — **tego NIE wypuszczać** z tym releasem.
- **`main` (produkcja) ma już**: nowy landing + fundament DS (`src/styles/landing-tokens.css`, `src/components/landing/`) z mergu PR #12 (`p1-2-match-design-fix`, commit `793d670`). Produkcja zdrowa, landing działa.
- **ALE**: `src/app/layout.tsx` na `main` **nie ładuje globalnie** tokenów ani fontów — tokeny są scope'owane do landingu. Trasa `/app/cosmogram` ich nie dostaje. To trzeba dopiąć (sekcja „Fundament").

# Co obejmuje redesign (pliki w commicie 377e8ac)

- **NOWY** `src/components/astro/zodiacGlyphs.tsx` — autorski zestaw glifów znaków (24×24, stroke, currentColor) + glify żywiołów (trójkąty alchemiczne) + mapy `SIGN_TO_KEY`, `SIGN_ELEMENT`, `portraitSrc`, `signIndexFromLon`. Render inline (bez `<symbol>`/`<use>` — zero kolizji id).
- `src/components/generate/NatalChartSVG.tsx` — koło natalne, port języka wizualnego z landingu (`NatalWheelDemo`) na realne dane. Zachowany silnik aspektów, `fanOut`, domy. Glify znaków zamiast emoji; planety = złoty punkt + halo + glif (text + U+FE0E); osie ASC/MC/DSC/IC cienkie `--accent-deep`; aspekty tylko `--accent-deep` / `#E2654A`. Hover→aspekty + tooltip, klik→panel, reveal rotacją.
- `src/components/generate/NatalChartAltarView.tsx` — Wielka Trójka: karty z **portretami** `sign-<znak>.png` dobieranymi dynamicznie, układ Słońce-góra / ASC-lewo / Księżyc-prawo (mobile: karty nad kołem), hover-tooltip (opis + słowa kluczowe), klik→scroll do `#interpretacja`, chipy z glifami, opcjonalne tło `wheel-backdrop.png` (graceful onError).
- `src/components/generate/PlanetTable.tsx` — tokeny + glify ze sprite (bez `PLANET_COLORS`/unicode/strzałek).
- `src/components/generate/KartaZawodnika.tsx`, `ModuleCard.tsx`, `ModuleNav.tsx`, `LockedModulePlaceholder.tsx`, `FailedModulePlaceholder.tsx` — DS-pass (paleta → tokeny, Fraunces, metry monochrom-złote).
- `src/components/HistorySelector.tsx` — DS-pass paleta.
- `src/app/app/cosmogram/page.tsx` — H1 na `--grad-text` + Fraunces, tło `--bg-base`, kotwica `id="interpretacja"`, tab bar bez emoji (✨→`<Star>`), usunięty martwy `getDominantElement` (miał emoji 🔥🌿💨💧).
- `public/assets/zodiac/sign-*.png` — 12 portretów Higgsfield (self-host, bo CDN może wygasnąć).
- `scripts/fetch-zodiac-portraits.sh` — skrypt pobrania portretów (już niepotrzebny, portrety są w 377e8ac, ale zostaje).

# KRYTYCZNE — fundament w `src/app/layout.tsx`

Bez tego `/app/cosmogram` renderuje się **bez stylów** (puste `var(--accent)` itd. + systemowy font). Dodać do root layoutu:

1. `import "@/styles/landing-tokens.css";` (plik jest już na `main` z PR #12).
2. Font Fraunces (next/font/google):
   ```ts
   import { /* …, */ Fraunces } from "next/font/google";
   const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], display: "swap", style: ["normal", "italic"] });
   ```
3. General Sans przez Fontshare — `<link>` w `<body>`:
   ```tsx
   <link href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap" rel="stylesheet" />
   ```
4. Dodać `${fraunces.variable}` do `className` na `<body>`.

(Tokeny używane przez redesign: `--bg-base`, `--bg-elevated`, `--text-primary/secondary/muted`, `--accent`, `--accent-deep`, `--on-accent`, `--voice`, `--line`, `--line-soft`, `--grad-text`, `--grad-ember`, `--ease-out` — wszystkie są w `landing-tokens.css`.)

# Sekwencja release'u

```bash
rm -f .git/index.lock
git stash push -u -m "WIP prognoza"            # schowaj bieżącą pracę
git fetch origin
git checkout -b release-kosmogram origin/main  # czysto z produkcji

# wciągnij SAM redesign + portrety z 377e8ac (czysto, bez merge/konfliktów)
git checkout 377e8ac -- \
  src/components/astro \
  src/components/generate \
  src/components/HistorySelector.tsx \
  src/app/app/cosmogram/page.tsx \
  scripts/fetch-zodiac-portraits.sh \
  public/assets/zodiac

# >>> dopiąć fundament w src/app/layout.tsx (sekcja „KRYTYCZNE" wyżej) <<<

npm run build            # musi przejść
git add -A && git commit -m "Redesign kosmogramu i Wielkiej Trojki — spojnosc z DS"
git push -u origin release-kosmogram
# PR release-kosmogram → main → merge → Vercel deploy

git checkout prognoza-v6 && git stash pop       # powrót do pracy nad prognozą
```

# Pułapki (wnioski z sesji koncepcyjnej)

- **Service worker PWA (`sw.js`) agresywnie cache'uje** — przy każdym teście (lokalnie i na prod) odznacz/unregister SW (DevTools → Application → Service Workers) + hard refresh, albo testuj w incognito. To był główny powód „nic się nie zmienia".
- **`wheel-backdrop.png` jest opcjonalne** (graceful `onError` → znika bez błędu) i **nie jest śledzone w gicie** — nie blokuje. Jeśli chcesz tło: pochodzi z commita `431b406`.
- **Zero emoji znaków zodiaku w UI** (DS §7) — tylko glify (inline SVG). Symbole planet jako `text` + `U+FE0E` (nie emoji).
- **Tylko paleta DS** — `grep -rnE "212,175,55|#D4AF37|#F3E5AB|#050508"` po komponentach powinno być puste; jedyny dozwolony „spoza tokenów" kolor napięcia to `#E2654A`.

# Definition of done

TSC 0 · `npm run build` OK · `/app/cosmogram` nieodróżnialny językowo od landingu · mobile 390 px bez przycięcia · `prefers-reduced-motion` OK · portrety renderują właściwy znak dla danych usera · brak emoji/kolorów spoza tokenów (grep).
