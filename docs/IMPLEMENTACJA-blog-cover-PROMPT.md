---
title: IMPLEMENTACJA — Szablon okładki bloga (kod, P1)
type: implementation-prompt
owner: Mac
last_updated: 2026-06-26
target: Claude Code
---

# Prompt dla Claude Code — Szablon okładki bloga w kodzie (next/og)

Wklej całość do Claude Code. Zastępujemy okładki AI **generowanym szablonem brandowym**: każdy post dostaje okładkę z tokenów design-systemu, bez plików do wgrywania i bez loterii AI. To także usuwa ręczny krok zapisu obrazka.

**Bazujemy na tym, co już macie w repo.** `next/og` `ImageResponse` działa u Was w `src/app/share/reading/[id]/opengraph-image.tsx` i `src/app/share/match/[id]/opengraph-image.tsx`. **Skopiuj ten wzorzec** (ładowanie fontów, `size`, `contentType`, zwrot `ImageResponse`) zamiast pisać od zera.

## Zasady (z CLAUDE.md)

- Next.js 16 App Router, TS. Trzymaj się istniejącego wzorca opengraph-image.
- Po skończeniu: `npm run typecheck` + `npm run lint` + `npm run test` zielone; `npm run build` przechodzi.
- Commity krótkie, po polsku. Implementacja w ramach stacku — Twoje decyzje.

## Tokeny (źródło: `src/styles/landing-tokens.css`)

```
--bg-base #0B0912 · --bg-elevated #14101F · --line #2B2540
--text-primary #F4F1EA · --voice #E9DCC0 · --text-secondary #B6AFC6
--accent #FFAE3D · --accent-deep #E0B566
grad-ember: linear-gradient(135deg,#FFC56B,#FFAE3D,#F08F2E)
grad-text:  linear-gradient(110deg,#FFF8EC,#FFD9A0,#E8BE78)
```
Tytuł: **Fraunces** (serif, jak `--font-fraunces`). Eyebrow/wordmark: General Sans / system sans.

---

## T1 — `src/app/blog/[slug]/opengraph-image.tsx`

Generuje okładkę **1200×630** per post. Dane z `getPostBySlug(params.slug)` (`src/lib/blog.ts`). Eksportuj `size`, `contentType`, `alt` i domyślną funkcję zwracającą `ImageResponse` — dokładnie jak w istniejącym `share/reading/[id]/opengraph-image.tsx`.

**Layout (lewy blok tekstu, prawy motyw):**
- **Tło:** gradient `#0B0912 → #14101F` (radialny lub 135°), subtelny ember-glow (`rgba(255,174,61,.12)`) za motywem. Opcjonalnie delikatne ziarno (data-URI z `landing-tokens.css`) na niskiej kryciu.
- **Motyw (prawa strona, częściowo poza kadrem):** koncentryczne cienkie złote pierścienie w stylu `NatalWheelDemo` (stroke `rgba(224,181,102,.25–.5)`, 3–5 okręgów), kilka rozsianych gwiazd (kremowo-złote kropki), opcjonalnie 2–3 wyblakłe glify z `src/components/astro/zodiacGlyphs.tsx`. **Dekoracyjnie, nie jako realny wykres.**
- **Tekst (lewa, wyśrodkowany w pionie):**
  - eyebrow = `frontmatter.category`, UPPERCASE, letter-spacing ~0.22em, kolor `#E0B566`, ~22px;
  - `frontmatter.title` w **Fraunces**, ~60–66px, kolor `#F4F1EA` (lub clip z `grad-text`), line-height ~1.1, maks. ~3 linie;
  - na dole mały wordmark „Cosmogram" (kolor `--voice` `#E9DCC0`) + cienka linia `--line`.
- **`alt`:** `frontmatter.coverAlt` (fallback: `${title} — Cosmogram`).
- **Fallback:** brak posta → prosta okładka z samym wordmarkiem (nie crashuj).

Fonty ładuj jak w istniejącym opengraph-image (Fraunces jako ArrayBuffer — z Google Fonts albo zbundlowany plik).

---

## T2 — `cover` opcjonalny w kontrakcie frontmatter

W `src/lib/blog.ts` zmień `cover: string` → `cover?: string`. `coverAlt` zostaje (alt/aria).

**Reguła źródła okładki (jedna, używana wszędzie):**
```
coverUrl = frontmatter.cover ?? `/blog/${slug}/opengraph-image`
```
Czyli: jest własny `cover` → używamy go; brak → automatyczny szablon. Znika wymóg pliku `public/blog/<slug>/cover.png` i ręczny zapis dla domyślnych postów.

---

## T3 — Wepnij `coverUrl` wszędzie

- **Hero na stronie posta** (`src/app/blog/[slug]/page.tsx`): obrazek z `coverUrl` (zachowaj `next/image` lub zwykły `<img>` dla route'a OG).
- **Karta na indeksie** (`src/app/blog/page.tsx`): thumbnail z `coverUrl`.
- **`BlogPosting.image`** i **OG `images`** w `generateMetadata`: `coverUrl` (absolutny URL). Uwaga: plik `opengraph-image.tsx` i tak **automatycznie** ustawia `og:image` dla route'a posta (konwencja Next), więc social ma okładkę nawet bez ręcznej roboty.

---

## T4 — Sprzątanie pilota

- W `content/blog/czym-jest-kosmogram.mdx` usuń linię `cover: "/blog/czym-jest-kosmogram/cover.png"` (albo zostaw puste) → użyje szablonu.
- Usuń pusty katalog `public/blog/czym-jest-kosmogram/` jeśli niepotrzebny.

---

## Weryfikacja (definicja „done")

1. `npm run typecheck` + `npm run lint` + `npm run test` — zielone.
2. `npm run build` — przechodzi.
3. `/blog/czym-jest-kosmogram/opengraph-image` zwraca PNG 1200×630, on-brand (ciepłe ember/złoto na aubergine, tytuł Fraunces, czytelny).
4. Strona posta i `/blog` pokazują wygenerowaną okładkę; brak złamanych obrazków.
5. [Rich Results Test](https://search.google.com/test/rich-results) na poście: `BlogPosting` ma `image`.
6. Test społecznościowy (np. podgląd OG): okładka się zaciąga.

## Sugerowane commity

- `Blog: generowana okładka opengraph-image (next/og) z tokenów DS`
- `Blog: cover opcjonalny — fallback do szablonu, koniec ręcznych plików`

## Po wdrożeniu (do Cowork)

Potwierdź, że domyślny szablon wygląda OK na 2–3 różnych długościach tytułu. Warstwa Cowork od teraz **nie musi** dostarczać okładki — chyba że dany post ma mieć grafikę specjalną (wtedy ustawiamy `cover` we frontmatterze, np. obraz z Higgsfield).
