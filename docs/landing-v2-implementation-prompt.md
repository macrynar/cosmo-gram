---
title: Landing v2 — prompt wdrożeniowy (produkcja)
type: implementation-prompt
owner: Mac
created: 2026-06-12
source-of-truth: docs/landing-v2/hero-prototyp.html (działający prototyp referencyjny)
companion: docs/design-system.md (v2 — dołączyć do prompta w całości)
---

# Zadanie

Przenieś landing page z prototypu `docs/landing-v2/hero-prototyp.html` do aplikacji produkcyjnej (Next.js App Router + Tailwind, deploy Vercel) jako stronę główną (`src/app/page.tsx`). Prototyp jest ŹRÓDŁEM PRAWDY dla wyglądu, copy, animacji i interakcji — nie projektuj od nowa, portuj wiernie. `design-system.md` jest konstytucją: wartości spoza tokenów = bug.

# Przed startem — assety (BLOCKER)

1. Uruchom `bash docs/landing-v2/assets-download.sh public/assets/landing` — pobiera 10 plików z CDN Higgsfield (linki wygasną!).
2. Wykonaj kroki optymalizacji wypisane przez skrypt (WebP dla PNG, ffmpeg dla MP4 do ~3–4 MB + wariant webm).
3. Skopiuj `docs/landing-v2/zodiac-glyphs.svg` do źródeł — to autorski sprite glifów zodiaku (NIE podmieniać na Unicode/emoji — patrz DS §7).
4. Self-host fonty: General Sans (400/500/600/700, woff2 z Fontshare) i Fraunces italic (Google) — `font-display: swap`, preload dla General Sans 700.

# Struktura komponentów

```
src/app/page.tsx               # strona główna (Server Component — składa sekcje)
src/components/landing/        # komponenty interaktywne z dyrektywą "use client"
  HeroSky.tsx        # <video> loop (poster bg-hero.png, muted playsinline, pauza poza viewportem,
                     #   brak autoplay przy prefers-reduced-motion) + canvas gwiazd + planety DOM
                     #   (paralaksa lerp .05, strefy ochronne nav/treść — logika 1:1 z prototypu)
  NatalWheelDemo.tsx # koło-instrument: tiki 5°, wypełnienia segmentów, piasta z logo, glify <use>,
                     #   aspekty + hitboxy, tooltipy (planeta/znak/aspekt), tilt za kursorem,
                     #   wejście rotacją po IntersectionObserver
  SectionHow.tsx     # S3 (Astrea, 3 kroki z ilustracjami)
  SectionModules.tsx # S4 (karta flagowa + 3 karty, spotlight, zoom ilustracji)
  SectionProof.tsx   # S5 (bigquote + testimoniale)
  SectionPricing.tsx # S6 (Free + Plus z grad-border)
  SectionFaq.tsx     # S7 (details/summary)
  SectionFinal.tsx   # S8 (klamra nieba)
  Footer.tsx
src/hooks/useReveal.ts        # IntersectionObserver dla [data-reveal] ("use client")
src/styles/tokens.css         # WSZYSTKIE tokeny z DS §1 jako CSS variables (Tailwind czyta przez var())
```

Uwagi Next.js: interaktywne komponenty (HeroSky, NatalWheelDemo, useReveal, CTA z magnetic) = "use client"; sekcje statyczne mogą zostać serwerowe. Ilustracje przez `next/image` (sizes, lazy domyślnie). Fonty przez `next/font/local` (General Sans woff2) + `next/font/google` (Fraunces) — zero zewnętrznych CSS-ów fontowych. Logo już jest w `public/logo-b-refined.svg` (na ciemnym tle renderować w bieli jak w prototypie). Tailwind: rozszerz theme o tokeny (colors, borderRadius 16/pill, transitionTimingFunction ease-out-quint). Zero wartości inline poza tokenami.

# Copy

Przenieś 1:1 z prototypu (jest po audycie językowym). Forma neutralna 2 os.; silnik nazywa się **Astrea** (nigdy „model"/„algorytm"). Niełamliwe spacje po jednoliterowych spójnikach zachować (w prototypie są jako `&nbsp;`).

# SEO / meta (dodać — w prototypie nie ma)

- Przez Metadata API Next.js w `src/app/layout.tsx`: `<html lang="pl">`, title `Cosmogram — horoskop, który naprawdę jest o Tobie`, description z sub hero, openGraph (url cosmo-gram.com — uwaga na literówkę domeny z audytu!) + og:image — tymczasowo kadr bg-hero.png 1200×630; docelowo dedykowany OG (osobne zadanie).
- Preload posteru (`<link rel="preload" as="image">`); wideo `preload="none"`, start po LCP.
- JSON-LD (Organization + WebSite) jako `<script type="application/ld+json">` w layout.

# Wydajność (budżety)

LCP < 2,5 s (LCP = H1, nie wideo — poster ładuje się pierwszy), CLS ≈ 0 (sekcje mają zarezerwowane wysokości ilustracji), animacje tylko transform/opacity, IntersectionObserver wszędzie zamiast scroll listenerów, wideo: `preload="none"` + start po `requestIdleCallback`, obrazy `loading="lazy"` poza hero, `prefers-reduced-motion` honorowany w 100% (prototyp ma wzorzec).

# Dostępność

Focus states na wszystkim (DS §5), kontrasty tokenowe (policzone, nie ruszać), `aria-hidden` na dekoracjach (niebo, ilustracje), tooltips koła jako `role="status"`, FAQ na natywnych `<details>`, skip-link do treści.

# Do potwierdzenia przez Maca PRZED deployem (nie zgaduj!)

- [x] Ceny Plus POTWIERDZONE przez Maca (2026-06-12): 19,99 zł/mies, 149 zł/rok (−37%). Prototyp zaktualizowany.
- [ ] Testimoniale w S5 = PLACEHOLDERY — podmienić na prawdziwe opinie testerów (struktura zostaje).
- [ ] Cytaty „z prawdziwych odczytów" (S2 „Korzenie duszy", S5 „Cienie do integracji") — potwierdzić, że pochodzą z realnych odczytów lub mają akcept jako redakcyjne.
- [ ] Claim „nad interpretacjami pracowali prawdziwi astrologowie" — wymaga domkniętej współpracy.
- [ ] Dane podmiotu w stopce (nazwa, NIP, adres) + linki Regulamin/Polityka muszą prowadzić do żywych dokumentów (P0.2 roadmapy!).
- [ ] CTA „Odkryj swój kosmogram" → routing do `/signup` (lub flow onboardingu), „Zobacz przykładowy kosmogram" → publiczna strona share przykładowego odczytu.

# Definition of done

Lighthouse: Performance ≥ 90, A11y ≥ 95, SEO ≥ 95 (mobile) · porównanie side-by-side z prototypem na 1440/768/390 px — brak różnic wizualnych · wszystkie interakcje z prototypu działają (hover planet/znaków/aspektów, spotlight, sheen, magnetic, reveals, FAQ) · hard refresh bez FOUC · checklist DS §8 zaliczony.
