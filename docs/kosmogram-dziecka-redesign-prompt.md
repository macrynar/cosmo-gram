---
title: Kosmogram Dziecka — redesign (spójność z dorosłym) + rail zamiast chipsów + selektor DS
type: implementation-prompt
owner: Mac
created: 2026-06-13
companion: docs/design-system.md
visual-source-of-truth: docs/landing-v2/kosmogram-dziecka-mockup.html
assets: public/assets/zodiac/sign-*.png   # 12 portretów JUŻ w repo — ZERO nowych grafik
---

# Cel

Zakładka **Kosmogram dziecka** (`/app/cosmogram`, `activeTab === "child"`) jest dziś niespójna z resztą appki: zielona kolorystyka (off-brand), **w ogóle nie pokazuje koła kosmogramu** (renderuje tylko siatkę małych `ChildCard`), ma przyciski „Dodaj dziecko"/„Regeneruj" w starym stylu. Robimy ją **1:1 jak kosmogram dorosłego** — to samo koło natalne, ta sama Wielka Trójka, ten sam układ modułów — różni się **tylko treścią interpretacji** (dziecięce moduły) i danymi.

Przy okazji dwie zmiany przekrojowe, które dotykają też dorosłego:
1. **Chipsy historii → pasek z miniaturami** (portret znaku Słońca) — wszędzie, gdzie dziś jest `HistorySelector`.
2. **Selektor `Twój kosmogram / Kosmogram dziecka`** — przebudowa na DS (koniec zieleni).

**Logika obliczeń (chart-engine, Swiss Ephemeris) zostaje bez zmian.** Wymieniamy prezentację i — dla dziecka — strukturę interpretacji (patrz §4).

Wizualny source of truth: **`docs/landing-v2/kosmogram-dziecka-mockup.html`** (koło + Wielka Trójka u góry, dziecięce moduły pod spodem, pasek-przełącznik dzieci, nawigacja modułów ze złotą kreską, locked-karty).

---

# 1. Pasek z miniaturami zamiast chipsów (dorosły + dziecko)

Dziś `src/components/HistorySelector.tsx` to tekstowe chipsy (nazwa + ołówek/kosz). Zastępujemy je **paskiem `.pp` z mockupu**: miniatura portretu **znaku Słońca** (40×40, `rounded-[10px]`) + nazwa + podtytuł (data/miejsce). Ten sam komponent obsługuje **oba** konteksty — listę kosmogramów dorosłego i listę dzieci.

Zasady:
- Miniatura = portret znaku Słońca pozycji, przez `portraitSrc(sign)` z `src/components/astro/zodiacGlyphs.tsx` → `/assets/zodiac/sign-<key>.png`. **Nie używaj URLi z CDN Higgsfield** (te są tylko w mockupie); w repo portrety są self-hostowane.
- `HistoryItem` dostaje pole `sunSign` (klucz znaku, np. `"aquarius"`). Wyliczasz je z `chart_data` — placement Słońca → znak → `SIGN_TO_KEY`. Dla braku danych: neutralny fallback (sygnet/inicjał), bez crasha.
- Stany wg mockupu i istniejących tokenów: zaznaczony = `border rgba(224,181,102,.45)` + delikatna poświata; hover = rozjaśnienie ramki. Edycja nazwy / usuwanie zostają, ale **chowane** (ikony ołówek/kosz pojawiają się na hover/zaznaczeniu, jak teraz — nie psują paska).
- Ostatni element: **`+ Dodaj kosmogram` / `+ Dodaj dziecko`** (dashed pill, `newLabel` przez prop — już jest).
- Pozioma przewijalność (`overflow-x-auto`), `scrollbar-none`, `shrink-0` na elementach.

Komponent zostaje generyczny (props bez zmian + `sunSign` w itemie). Używany 1:1 na zakładce dorosłego (lista `readings`) i dziecka (lista `children`).

---

# 2. Selektor `Twój kosmogram / Kosmogram dziecka` — DS

Dziś (page.tsx, „Tab bar") zakładka dziecka jest **zielona** (`rgba(16,185,129,…)`, `#6ee7b7`, ikona `Baby`). To łamie DS (jeden akcent — bursztyn). Przebuduj na dwusegmentowy toggle w stylu z mockupu (`.mode`):

- Kontener: `bg var(--bg-elevated)`, `border var(--line)`, `rounded-13px`, padding 5px.
- Aktywny segment: `bg rgba(224,181,102,.12)`, `color var(--voice)`, subtelny `inset` border. Nieaktywny: `color var(--text-muted)`.
- **Usuń zieleń z całego flow dziecka:** nudge-banner (dziś `rgba(16,185,129,…)`), pusty stan, ikony — wszystko na paletę DS (akcent bursztyn / `--text-muted`). Ikony `Baby`/zielone gradienty → spójne z DS (lucide w `--accent-deep`, bez gradientu zielonego).
- Etykiety bez zmian: `Twój kosmogram` / `Kosmogram dziecka`. Mechanika `childNudge` (auto-podpowiedź przy dacie < 13 lat) zostaje — tylko de-zielona.

---

# 3. Zakładka dziecka = ten sam kosmogram co dorosły

Przebuduj blok `activeTab === "child"`. Zamiast siatki `ChildCard` + zielonych przycisków renderuj **dokładnie tę samą anatomię co natal**, dla wybranego dziecka:

1. **Pasek dzieci** (komponent z §1, items = `children`, portret = znak Słońca dziecka, `+ Dodaj dziecko`).
2. **`<NatalChartAltarView chart={selectedChild.chart_data} />`** — pełne koło natalne + Wielka Trójka (Słońce góra / ASC lewo / Księżyc prawo) z tooltipami. **Reuse 1:1, bez forka** — koło i Trójka „za darmo".
3. **`<PlanetTable chart={selectedChild.chart_data} />`** — „Pozycje planet" (collapsible), reuse.
4. **Dziecięca Karta** (warianty `KartaZawodnika`, patrz §4) — nawigacja modułów + moduły interpretacji.

Stan wyboru dziecka: `selectedChildId` analogicznie do `selectedId` natala (pierwsze dziecko zaznaczone po wczytaniu). Klik w pasku przełącza dziecko → przerysowuje koło + Trójkę + moduły.

**Usuń:** osobny zielony przycisk „Dodaj dziecko" w nagłówku, przycisk „Regeneruj"/„Odśwież interpretację" (generacja auto przy dodaniu + cache jak w prognozie — żadnych ręcznych „wygeneruj" w UI), siatkę `ChildCard` jako główny widok. „Dodaj dziecko" żyje teraz tylko jako element paska (gated `isPro` → `PaywallModal`). `AddChildModal` zostaje. Pusty stan (brak dzieci): jedno wezwanie „Dodaj pierwsze dziecko" w stylu DS, bez zieleni.

---

# 4. Dziecięce moduły interpretacji (różnica vs dorosły)

Dorosły ma 8 modułów (`src/lib/schemas/astroModule.ts` → `ALL_MODULE_IDS`), renderowanych przez `KartaZawodnika` → `ModuleNav` + `ModuleCard` + `LockedModulePlaceholder`. Dziecko dostaje **własny zestaw 6 modułów**, ten sam wzór wizualny (ikona w nagłówku karty, cytat Fraunces, mierniki, tagi, „na podstawie", locked z Plusem), inna treść i ikony.

Zestaw (kolejność = numeracja w nav, ikony lucide):

| # | id | Nazwa (nagłówek) | Nazwa krótka (nav) | Ikona | Dostęp |
|---|----|------------------|--------------------|-------|--------|
| 1 | `temperament` | Temperament | Temperament | `Sun` | **free** |
| 2 | `emotions` | Świat emocji | Emocje | `Moon` | Plus |
| 3 | `learning` | Jak poznaje świat | Poznawanie | `Sprout` | Plus |
| 4 | `talents` | Talenty i mocne strony | Talenty | `Star` | Plus |
| 5 | `parenting` | Wskazówki dla rodzica | Rodzic | `Heart` | Plus |
| 6 | `peers` | Relacje z rówieśnikami | Rówieśnicy | `Users` | Plus |

Ton treści (DS §6, „człowiek w tekście, żargon w metadanych"):
- **Opis dziecka w 3 os.** („[Imię] łączy niezależny umysł… z intensywnym światem emocji…"). Bez nazw planet/aspektów w głównym tekście.
- **Wskazówki dla rodzica w 2 os.** („Dawaj mu przestrzeń na własne »dlaczego«… nie przegap chwil, gdy milknie").
- Astro-detal tylko w dyskretnych chipach **„na podstawie"** (np. „Słońce w Wodniku", „Księżyc w Skorpionie") — jak u dorosłego.
- Zero diagnoz/etykiet medycznych. Język ciepły, wspierający, nigdy oceniający dziecko.

### Implementacja

**Schema.** Dodaj `src/lib/schemas/childModule.ts` — kopia `astroModule.ts`: **identyczne pola i walidacje** (`title`; `quote` 40–90 znaków, bez kropki na końcu, bez „?"; `content` 200–550 słów, bez żargonu astro; `tactics` ×3 [20–140 zn.]; `tags` ×4 [PL lowercase]; `visualMeters` ×3; `confidenceScore`/`isPremium`/`cacheKey`/`promptVersion` wstrzykiwane backendem). Zmienia się **tylko** enum `id`:
```ts
id: z.enum(["temperament","emotions","learning","talents","parenting","peers"])
```
Eksport `ALL_CHILD_MODULE_IDS` (kolejność jak w tabeli) + `ChildModuleAIOutputSchema = ChildModuleSchema.omit({confidenceScore,isPremium,cacheKey,promptVersion})`, analogicznie do dorosłego.

**Parametryzacja UI.** `ModuleNav` dziś importuje na sztywno `ALL_MODULE_IDS` + `SHORT_NAMES` — przyjmij zestaw configiem (`ids` + `shortNames` + `iconMap`) propsem, żeby ten sam komponent obsłużył oba warianty (numeracja, ✓ przeczytane, ruchoma złota kreska — bez zmian wizualnych). `KartaZawodnika` dostaje `variant: "adult" | "child"` (albo cienki `KartaDziecka` reużywający `ModuleNav`/`ModuleCard`/`LockedModulePlaceholder`); wariant wybiera config modułów, mapę ikon i nagłówek („Co mówi niebo o {imię}", eyebrow „Karta dziecka").

**AI pipeline.** `/api/ai-child` zwraca **tablicę 6 modułów** walidowaną `ChildModuleAIOutputSchema` (nie płaski string). Wejście jak w pipeline dorosłego: `promptContext`, `placements`, `aspects`, `nodes` + `name`, `age`. Wszystkie 6 modułów generowane przy dodaniu dziecka, cache per dziecko + `promptVersion`. Prompt dziecka jako nowa sekcja w `docs/prompts.md` (source of truth).

**Kontrakt promptu dziecka:**
- Rola/ton: ciepły, wspierający przewodnik dla rodzica. **Opis dziecka w 3 os.** („{Imię} jest… / {Imię} łączy…"). **`tactics` w 2 os. do rodzica** („Dawaj mu przestrzeń…", „Nazywaj przy nim emocje…"). Nigdy nie ocenia ani nie etykietuje dziecka; zero diagnoz i terminów klinicznych.
- **Bez żargonu** w `quote`/`content` (walidacja to wymusza). Astro-detal renderuje karta w chipach „na podstawie" z `placements`/aspektów — nie z prozy AI.
- `quote` = jedno zdanie-esencja, np. „Mały odkrywca z gorącym sercem — myśli po swojemu, a czuje głębiej, niż pokazuje".
- `visualMeters` dobrane do tematu modułu (Temperament → Ciekawość/Wrażliwość/Niezależność; kategorie `mind`/`emotion`/`action`).
- Słownictwo i przykłady **dopasowane do `age`** (niemowlę / przedszkolak / wczesnoszkolny).

Przykład kształtu jednego modułu (output AI):
```json
{
  "id": "temperament",
  "title": "Temperament",
  "quote": "Mały odkrywca z gorącym sercem — myśli po swojemu, a czuje głębiej, niż pokazuje",
  "content": "Eryk łączy niezależny, ciekawski umysł z intensywnym światem emocji… (200–550 słów, bez żargonu)",
  "tactics": [
    "Dawaj mu przestrzeń na własne »dlaczego« — pytania to jego sposób na bliskość ze światem.",
    "Gdy nagle milknie, nie naciskaj; usiądź obok i nazwij to, co widzisz: »wygląda, jakby ci było smutno«.",
    "Chwal proces, nie tylko efekt — »widzę, ile w to włożyłeś« znaczy dla niego więcej niż »brawo«."
  ],
  "tags": ["ciekawski","niezależny","wrażliwy","uważny"],
  "visualMeters": [
    {"label":"Ciekawość","value":82,"archetype":"Odkrywca","category":"mind"},
    {"label":"Wrażliwość","value":74,"archetype":"Empata","category":"emotion"},
    {"label":"Niezależność","value":68,"archetype":"Samodzielny","category":"action"}
  ]
}
```

**Dostęp:** `temperament` = free; `emotions`/`learning`/`talents`/`parenting`/`peers` → `isPremium: true`. U nie-Plus: moduł 1 widoczny, 2–6 jako locked-teasery (`LockedModulePlaceholder`).

**Etapowanie (opcjonalne, jeśli rozbijasz PR):** etap 1 — UI (koło + Trójka + wariant Karty) z istniejącym płaskim tekstem `ai-child` w module 1 i locked-teaserami 2–6; etap 2 — strukturyzacja AI wg powyższego. Oznacz etap w PROGRESS.md. Cel końcowy to jednak pełna struktura 6 modułów.

---

# DS / zasady

- Tokeny globalne (`landing-tokens.css`), General Sans + Fraunces w `layout.tsx` (już są).
- Wyłącznie paleta DS; jedyny dozwolony „spoza": `#E2654A` (napięcie, aspekty). **Zero zieleni** w całym flow dziecka.
- Zero emoji; glify znaków = autorskie SVG (`zodiacGlyphs`), nie Unicode; ikony modułów = lucide.
- Portrety znaków = self-host `/assets/zodiac/sign-*.png` (reuse). **Nowych grafik Higgsfield NIE generujemy.**
- AI tylko przez edge function, z cache; bez przycisków „wygeneruj"/„odśwież" w UI; `ai_prompt_version` przy zapisie.

# Definition of done

- Zakładka dziecka pokazuje **pełne koło natalne + Wielką Trójkę** (reuse `NatalChartAltarView`) + `PlanetTable` + dziecięce moduły — układ 1:1 z dorosłym, treść dziecięca.
- `HistorySelector` = pasek z miniaturami (portret znaku Słońca) na **obu** zakładkach; chipsy tekstowe usunięte.
- Selektor `Twój/​Dziecka` w DS; **zero zieleni** w całym flow dziecka (selektor, nudge, pusty stan, ikony).
- Nawigacja modułów dziecka = numerowane pozycje + ruchoma złota kreska (jak `ModuleNav` dorosłego); locked-karty = `LockedModulePlaceholder` (kłódka wyśrodkowana, paski-szkielet, „Odblokuj →").
- 6 dziecięcych modułów wg tabeli; moduł 1 free, 2–6 locked; treść w tonie „dziecko 3 os. / rodzic 2 os.", żargon w „na podstawie".
- Brak przycisków „Regeneruj"/„Odśwież interpretację"; „Dodaj dziecko" tylko w pasku, gated `isPro`.
- Mechanika `childNudge`, `AddChildModal`, paywall, share — bez regresji. chart-engine bez zmian.
- Mobile 390px OK · `npx tsc --noEmit` 0 błędów · `npm run build` OK.
