---
title: Cosmogram Design System v1 — konstytucja UI
type: design-system
owner: Mac
created: 2026-06-12
status: v2 (2026-06-12 — wzbogacony o wzorce wypracowane na landingu v2; landing = implementacja referencyjna)
usage: dołączaj ten dokument do KAŻDEGO prompta UI i copy. Wartości spoza tokenów = bug.
reference: docs/landing-v2/hero-prototyp.html — żywy wzorzec wszystkich poniższych reguł
---

# 0. Esencja marki (1 akapit, do każdego prompta)

Cosmogram to nocne niebo czytane jak osobisty list. Wizualnie: głęboki kosmos, jedno ciepłe światło (bursztyn), spokój i precyzja — nic nie krzyczy, wszystko się wyłania. Językowo: ludzki, ciepły, inteligentny głos z lekkim dystansem („symboliczne lustro, nie wyrocznia"). Forma neutralna 2 os.

# 1. Kolory (jedyne dozwolone wartości)

```css
:root {
  /* Tła — nokturn, nigdy jednolita czerń */
  --bg-base:      #0B0912;  /* tło strony */
  --bg-elevated:  #14101F;  /* karty, panele */
  --bg-sky:       radial-gradient(120% 90% at 50% 0%, #1A1530 0%, #0B0912 70%);
  --vignette:     radial-gradient(ellipse at center, transparent 55%, rgba(5,4,10,.55) 100%);

  /* Tekst (kontrast na --bg-base policzony, WCAG AA+) */
  --text-primary:   #F4F1EA;  /* 17.5:1 — nagłówki, body */
  --text-secondary: #B6AFC6;  /* 9.4:1 — opisy, sub */
  --text-muted:     #877FA0;  /* 5.3:1 — captions, meta */

  /* Akcent — JEDEN ciepły (koniec z pomarańcz vs złoto) */
  --accent:       #FFAE3D;  /* bursztyn — CTA, linki, glify aktywne */
  --accent-deep:  #E0B566;  /* 10.3:1 — złoto przygaszone: badge, hover-line */
  --on-accent:    #201405;  /* tekst na bursztynie, 9.8:1 */

  /* Głos produktu (cytaty serif) */
  --voice:        #E9DCC0;  /* 14.6:1 — szampański */

  /* Struktura */
  --line:         #2B2540;  /* bordery, orbity w UI */
  --line-soft:    rgba(182,175,198,.14);

  /* Planety (TYLKO wewnątrz wizualu nieba, nigdy w UI) */
  --p-mars: #E2654A; --p-venus: #F2C879; --p-neptune: #5FA8D3; --p-uranus: #57C4B8;

  /* Gradienty — zamknięta lista (innych nie ma) */
  --grad-ember:  linear-gradient(135deg, #FFC56B 0%, #FFAE3D 45%, #F08F2E 100%);
    /* CTA primary i jego hover-stan; jedyny „pełny" gradient w UI */
  --grad-aurora: radial-gradient(80% 60% at 70% 20%, rgba(94,72,162,.25) 0%, transparent 60%),
                 radial-gradient(60% 50% at 20% 80%, rgba(38,99,138,.18) 0%, transparent 60%);
    /* ambient tła sekcji — ZAWSZE pod treścią, opacity łączna < .3, nigdy na tekście */
  --grad-text:   linear-gradient(110deg, #F4F1EA 30%, #E0B566 100%);
    /* tekst-gradient: wyłącznie na 1–2 słowach akcentowych w H1/H2, ciepły, nigdy fiolet */
  --grad-border: conic-gradient(from var(--angle,0deg), #2B2540 0%, #E0B566 12%, #2B2540 30%);
    /* animowana ramka-promień dla JEDNEJ wyróżnionej karty na widok (np. plan Plus) */
}
```

Zasady gradientów: lista powyżej jest zamknięta. Aurora to atmosfera, nie dekoracja — ma być ledwo widoczna (test: zrzut ekranu w 50% jasności — treść dalej czytelna). Tekst-gradient maks. raz na sekcję. `--grad-border` maks. raz na stronę.

Zasady: kolorowe ikony modułów → wszystkie w `--accent` + `--line`. Kolory planet żyją wyłącznie w kole/orbitach. Tekst poniżej `--text-muted` nie istnieje.

# 2. Typografia — WERDYKT (decyzja Maca, 2026-06-12)

- **Jedna rodzina na display i body: General Sans.** Display: 700 (H1/H2) i 600 (H3), letter-spacing -2% w dużych stopniach. Body/UI: 400/500/600. Jeden font = szybsze ładowanie i mocniejsza spójność.
- **Głos produktu (cytaty z odczytów, TYLKO S2/S5 i interpretacje w aplikacji):** Fraunces, w tym italic. Poza cytatami serif nie istnieje.
- **Cyfry:** tabular-nums dla stopni (19°54′), cen i metryk.
- Źródło: Fontshare CDN (`api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700`) + Google (`Fraunces`); na produkcji self-host woff2 (wydajność + RODO).

Skala (desktop / mobile):
```
display-xl  64/40px  lh 1.05  -2%   (H1 hero)
display     44/32px  lh 1.1   -1.5% (H2 sekcji)
title       28/24px  lh 1.2   -1%   (H3, karty)
quote       32/24px  lh 1.35        (serif, --voice)
body-lg     19/17px  lh 1.6         (sub hero, lead)
body        17/16px  lh 1.6
caption     14px     lh 1.4         (--text-muted)
```

Polska typografia obowiązkowo: „cudzysłowy drukarskie", półpauza z odstępami ( — ), niełamliwe spacje po jednoliterowych spójnikach (i, w, z, o, a), poprawna deklinacja znaków zodiaku z mapy odmian (nigdy sklejana).

# 3. Spacing, kształt, światło

- Skala spacingu: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128 / 160. Sekcje landingu: 128–160 px pionowo (desktop), 80 mobile.
- Radius: **16 px** (karty, panele) i **pill** (CTA, badge). Innych nie ma.
- Cień: zamiast box-shadow — **poświata**: `0 0 48px rgba(255,174,61,.18)` tylko na CTA primary i aktywnych elementach nieba. Karty oddziela `--line` + różnica tła, nie cień.
- Tekstura: subtelny grain (SVG noise, opacity .03–.05) na `--bg-base` — ratuje przed płaskim „AI dark mode".
- Max szerokość treści: 1140 px; tekst czytany (interpretacje, FAQ): 680 px.

# 4. Motion language — „niebiańskie"

- Easing: `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quint). Durations: micro 200 ms · enter 400 ms · scena 600 ms.
- Wejścia: elementy **wyłaniają się** — opacity 0→1 + translateY 12px→0, stagger 80 ms. Nigdy nie wskakują, nic nie pulsuje bez powodu.
- Linie (aspekty, orbity, łączniki kroków) **kreślą się**: stroke-dashoffset przy wejściu w viewport (IntersectionObserver, raz).
- Hover: 200 ms, zmiana koloru/poświaty, transform max 2 px.
- Animuj wyłącznie `transform`, `opacity` i zmienne gradientów. `prefers-reduced-motion` → wszystko statyczne, piękny kadr zamiast sceny.

# 4b. Interaktywność — interfejs żyje (wzorce dozwolone)

Każdy element interaktywny ma trzy stany: hover, focus, active — bez wyjątku. Wzorce:

- **Spotlight na kartach** (wzór Linear/Vercel): radial-gradient podążający za kursorem (`--mx`/`--my` przez JS), ciepła poświata `rgba(255,174,61,.06)` + rozjaśnienie borderu w promieniu kursora. Domyślny stan kart na landingu.
- **Sheen na CTA primary:** ukośny pas światła przelatujący przez przycisk na hover (700 ms, raz — nie w pętli) + wzrost poświaty `0 0 64px rgba(255,174,61,.28)`.
- **Magnetic CTA:** przyciąganie do kursora max 4 px (transform), powrót sprężyście. Tylko CTA primary hero i finałowe.
- **Linki:** underline „dorysowuje się" od lewej (transform: scaleX), 200 ms.
- **Niebo reaguje:** orbity/gwiazdy w hero — paralaksa za kursorem (przesunięcie warstw max 12 px, lerp ~0.05, leniwie — to niebo, nie kursor-party); planeta pod kursorem dostaje jaśniejszą poświatę i tooltip z nazwą.
- **Koło natalne:** hover na planecie → podświetlenie jej aspektów, reszta linii przygasza się do .2 (wzór już obecny w aplikacji — kanon).
- **Scroll-driven reveals:** sekcje wyłaniają się (patrz §4); liczby/stopnie nabijają się count-upem (600 ms) przy pierwszym wejściu w viewport.
- **Ikony w kartach:** mikro-ruch na hover karty (np. glif planety obraca się o 12°, strzałka przesuwa 4 px) — transform only.

**Reguły wizualu nieba (wnioski z prototypu hero, 2026-06-12):**

- **Strefa ochronna treści:** tekst, nav i CTA mają niewidzialne strefy — planety i dekoracje przygasają w nich do opacity ~.15 (lerp, płynnie), nigdy nie przecinają tekstu. Pod blokiem treści zawsze scrim: radial `rgba(11,9,18,.62→0)`, żeby poświata słońca nie zjadała kontrastu subheadu.
- **Orbity gasną na zewnątrz** (opacity ×.72 na każdą kolejną): łuk szerokiej orbity nie może przecinać krawędzi viewportu jako pozioma kreska.
- **Gwiazdy: rozkład stratyfikowany** (siatka + jitter), nie czysty random — random robi zbitki w rogach; centrum przerzedzone (tam mieszka treść).

**Budżet efektów (żeby „żyje" nie zmieniło się w jarmark):** na jeden viewport naraz — 1 efekt ambientowy (niebo/aurora) + spotlighty kart + mikro-ruchy hoverowanych elementów. Zakazane: animacje w nieskończonej pętli poza niebem hero, tilt 3D kart, confetti, kursory custom. Wszystko respektuje `prefers-reduced-motion` (spotlight i sheen też → wyłączone, zostaje zwykły hover kolorem).

# 5. Komponenty — reguły twarde

- **CTA primary: jeden styl na całą stronę** — pill, tło `--grad-ember`, tekst `--on-accent` 600, poświata, strzałka →, sheen + magnetic (§4b). Wszystkie inne przyciski: ghost (border `--line`, tekst `--text-primary`, spotlight na hover).
- Linki: `--accent-deep`, underline offset 3 px na hover.
- Karty: `--bg-elevated`, border `--line`, radius 16, padding 32. Zakaz: dwie sąsiadujące sekcje o tym samym układzie kart.
- Focus: 2 px outline `--accent`, offset 2 px — wszędzie, bez wyjątków.
- Ikony: jeden zestaw linearny (stroke 1.5), kolor `--text-secondary` lub `--accent`. Emoji = nigdy.

# 6. Anty-wzorce (wklejać do prompta jako zakazy)

**Wizualne:** emoji jako ikony · równy grid identycznych kart · fioletowe gradienty na tekście · glassmorphism · box-shadow bez intencji · tekst poniżej AA · więcej niż jeden styl CTA primary · screenshoty aplikacji jako wizuale (tylko stylizowane komponenty uniwersalne) · kolory spoza tokenów · drugi ciepły akcent.

**Językowe:** kalki z angielskiego, marketing-speak · poetyzowanie na siłę, metafory piętrowe · bezosobowe „nosiło się / nauczono się" · zdania nieprzechodzące testu czytania na głos · godzina urodzenia jako warunek wejścia · zmyślone liczby · forma rodzajowa (tylko neutralna 2 os.) · **żargon astrologiczny w treści marketingowej** — „Wenus w Skorpionie w XII domu" odstrasza; zasada: żargon w metadanych (chipy, tooltipy), człowiek w tekście; na landingu zamiast wielu fragmentów: jeden mocny cytat + jedna obietnica + CTA.

# 7. Marka AI i ilustracje

**Astrea** (decyzja Maca, 2026-06-12) — nazwa silnika interpretacji. W copy zawsze: „Astrea", rodzaj żeński, opisywana ciepło (tworzona z astrologami, „pisze, jakby Cię znała"), nigdy „model", „algorytm", „system AI". Mit Astrai (gwiezdna bogini, ostatnia opuściła Ziemię) można cytować w contentcie.

**Ilustracje (zasada „AI maluje, kod rysuje"):** Higgsfield generuje warstwę artystyczną; kod rysuje wszystko funkcjonalne (koło natalne z danych, glify UI, wykresy). Styl zestawu ilustracji — szablon prompta:
„Fine engraved linework in warm amber gold (#E0B566) with subtle luminous glow, on deep near-black indigo-violet cosmic background (#0B0912), faint tiny stars, delicate film grain. Antique astronomical etching reinterpreted minimal & premium. No text, no frame."
Reguły: ZAWSZE podawaj obraz-kotwicę jako referencję stylu (kotwica: job `3cd1d4f4-26c4-4fd0-b07a-6594dfd861d6` — koło natalne) · format 1:1, 1k dla kart, 2k dla hero · tła ilustracji = tokeny (zlewają się z kartami) · nowy motyw = jeden symbol, dużo negatywnej przestrzeni · po akceptacji asset self-host (CDN Higgsfield może wygasnąć).

**Glify zodiaku i planet (twarda zasada):** w UI (koło, Wielka Trójka, chipy, kalendarz) WYŁĄCZNIE autorski zestaw SVG `landing-v2/zodiac-glyphs.svg` (24×24, stroke 1.6, currentColor — kolor tokenami; podgląd: `glify-podglad.html`). Surowe znaki Unicode (♈♀☉…) są ZAKAZANE jako ikony — przeglądarki renderują je jako kolorowe emoji; jeśli znak musi wystąpić w tekście, zawsze z wariantem tekstowym U+FE0E. Glify planet: do zaprojektowania jako rozszerzenie tego samego setu (do tego czasu tekst + FE0E).

# 8. Checklist przed merge każdego ekranu

kontrast AA zmierzony, nie na oko · focus states · reduced-motion · squint test (jedna dominanta) · polskie znaki w wybranym foncie renderują się natywnie (nie fallback) · cyfry tabularyczne w metrykach · mobile 390 px bez poziomego scrolla.
