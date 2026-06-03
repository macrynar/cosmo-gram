---
title: Cosmo Map V3 — astro-narrative product (full overhaul)
created: 2026-05-25
project: cosmogram
type: claude-code-prompt
status: ready-to-paste
supersedes: cosmo-map-prompt.md, cosmo-map-v2-redesign.md
---

# Cosmo Map V3 — astro narratywny produkt z eksplorowalną mapą

> Wklej do Claude Code. To NIE jest dalsza polerka — to pełen overhaul koncepcji i implementacji. Zachowujemy tylko: math do liczenia linii (`astrocartography.ts`), edge function compute, brand naming, paywall logic. Reszta idzie do refactoru lub do kosza.

---

Przeczytaj `docs/cosmo-map-v2-redesign.md` (poprzednia iteracja, nie zadziałała produktowo) i `docs/site-structure-and-routing.md` (brand naming + routes). Konceptualnie: V1 i V2 traktowały to jako map-first product. V3 traktuje to jako **astro narratywny produkt** w którym konkretne ikoniczne miejsca są nośnikiem znaczeń, a mapa jest eksplorowalnym narzędziem dla power-userów.

## Co zmieniamy fundamentalnie

1. **Dwie tryby**: domyślnie **Miejsca dla Ciebie** (kafle z rekomendacjami per intencja, photos), opcjonalnie **Mapa eksploracyjna** (Leaflet w stylu astro.com Travel — pionowe linie MC/IC, zakrzywione AC/DC, klikalne).
2. **Dataset miast**: 500-800 ikonicznych miast/destynacji (NIE losowe top 500 by population). Każde z metadanymi: które intencje matchuje + photo URL + cultural blurb + travel relevance.
3. **6 intencji** (życiowe konteksty energii, nie scenariusze podróżne): Spokój, Miłość, Sukces, Twórczość, Duchowość, Transformacja.
4. **Narracja w stylu astro.com** — głębokie paragrafy interpretacji per miejsce per user, NIE generyczne templates.
5. **Real planetary lines na mapie** — kolorowe, labelowane glifami planet, jak astro.com Travel.
6. **Birth city ≠ residence city** — settings rozróżniają, hometown anchor używa residence, mapa center'uje na residence, computation lines używa birth.

## Co NIE robimy w V3

- Bez integracji Skyscanner/Kiwi (logistyka wyjazdu poza zakresem — to nie travel app).
- Bez AstroClick Local Space (radial lines from current location) — P1.
- Bez transit-driven "kiedy nie jechać" — usuwamy tę sekcję, była źródłem halucynacji. P1 jak będzie computed transits.
- Bez user-uploaded photos miast — używamy curated.
- Bez "compare mode" z V1 (porównanie z drugą osobą) — zostaje istniejące jeśli działa, ale nie ulepszamy.

## Pliki do utworzenia

```
apps/web/src/lib/curatedCities.ts                 # 500-800 cities z metadanymi (seed + generated)
apps/web/src/lib/intentions.ts                    # 6 intencji + planet mappings
apps/web/src/lib/mapColors.ts                     # Kolory linii planet w stylu astro.com
apps/web/src/lib/buildLineSegments.ts             # Helper do renderowania linii na Leaflet

apps/web/src/components/Map/PlacesView.tsx        # Grid kafli — domyślny widok
apps/web/src/components/Map/MapExplorer.tsx       # Leaflet view — drugi tryb
apps/web/src/components/Map/PlaceCard.tsx         # Pojedynczy kafel
apps/web/src/components/Map/PlaceFullNarrative.tsx # Modal/drawer z pełną narracją
apps/web/src/components/Map/IntentionPicker.tsx   # 6 intencji jako pills
apps/web/src/components/Map/ViewToggle.tsx        # Lista | Mapa

supabase/functions/cosmo-map-narrative/index.ts   # AI generation pełnej narracji per city
supabase/functions/cosmo-map-line-info/index.ts   # AI generation interpretacji linii na klik mapy

scripts/seed-curated-cities.ts                    # One-shot: wygeneruj/zatwierdź dataset 500+ miast
scripts/generate-city-metadata.ts                 # Helper: LLM batch tagging miast tags + blurb
```

## Pliki do modyfikacji

- `apps/web/src/pages/Map.tsx` — full refactor, dwa tryby + intention picker
- `apps/web/src/components/Map/HometownAnchor.tsx` — używa `residence_city` z user settings, fallback do `birth_city`
- `apps/web/src/lib/astrocartography.ts` — bez zmian w math; dodaj `formatLineSegmentsForLeaflet()` helper
- `apps/web/src/lib/routes.ts` — bez zmian (route `/app/map` zostaje)
- `apps/web/src/pages/Settings/Profile.tsx` (lub gdzie są user settings) — dodaj pole `residence_city` (Polska auto-defaults to Warszawa jeśli puste)
- `supabase/functions/cosmo-map-compute/index.ts` — bez zmian w math, dorzuca tylko `lines_formatted` field do response (per Leaflet)

## Pliki do usunięcia

- `apps/web/src/lib/lineDescriptions.ts` — generyczne templates, zastępujemy AI per-city per-user
- `apps/web/src/lib/travelScenarios.ts` — zastępujemy `intentions.ts`
- `apps/web/src/components/Map/ScenarioPicker.tsx` — zastępujemy IntentionPicker
- `apps/web/src/components/Map/MobileCityList.tsx` — zastępuje PlacesView (responsive)
- `apps/web/src/components/Map/CityDetails.tsx` — zastępujemy PlaceFullNarrative (głębsza struktura)

## DB migracje

```sql
-- 1. Rozszerz user settings o residence_city (różne od birth_city)
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS residence_city JSONB;
-- format: {"name": "Warszawa", "country_pl": "Polska", "lat": 52.23, "lon": 21.01, "country_code": "PL"}

-- 2. Cache narracji per (user × city × intention)
CREATE TABLE IF NOT EXISTS map_place_narratives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  profile_id UUID REFERENCES library_profiles,
  city_slug TEXT NOT NULL,
  intention_id TEXT NOT NULL,
  active_lines JSONB NOT NULL,
  narrative JSONB NOT NULL,  -- structured: why_place, why_for_you, what_youll_feel, similar
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, profile_id, city_slug, intention_id)
);

CREATE INDEX idx_narratives_lookup ON map_place_narratives(user_id, profile_id, intention_id);

-- 3. Cache interpretacji linii (per planet × line type — generic, nie per user)
CREATE TABLE IF NOT EXISTS map_line_interpretations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planet TEXT NOT NULL,
  line_type TEXT NOT NULL,
  interpretation_pl TEXT NOT NULL,
  travel_meaning TEXT,
  home_meaning TEXT,
  community_meaning TEXT,
  UNIQUE(planet, line_type)
);
-- Pre-seed: 40 wpisów (10 planet × 4 typy linii) — patrz scripts/seed-line-interpretations.ts
```

## intentions.ts — 6 intencji życiowych

```typescript
// apps/web/src/lib/intentions.ts

type Planet = 'Sun' | 'Moon' | 'Mercury' | 'Venus' | 'Mars' | 'Jupiter' | 'Saturn' | 'Uranus' | 'Neptune' | 'Pluto';
type LineType = 'MC' | 'IC' | 'ASC' | 'DSC';

export type Intention = {
  id: 'spokoj' | 'milosc' | 'sukces' | 'tworczosc' | 'duchowosc' | 'transformacja';
  emoji: string;
  label: string;
  subtitle: string;
  description: string;        // dla intro card jeśli user wybiera pierwszy raz
  primary_lines: Array<{ planet: Planet; type: LineType; weight: number }>;
  tone: string;               // dla AI promptu
};

export const INTENTIONS: Intention[] = [
  {
    id: 'spokoj',
    emoji: '🕊',
    label: 'Spokój',
    subtitle: 'Regeneracja, odpoczynek, powrót do siebie',
    description: 'Miejsca, w których ciało zwalnia, a umysł znajduje ciszę.',
    primary_lines: [
      { planet: 'Moon', type: 'IC', weight: 1.0 },
      { planet: 'Venus', type: 'IC', weight: 0.9 },
      { planet: 'Neptune', type: 'IC', weight: 0.85 },
      { planet: 'Jupiter', type: 'IC', weight: 0.7 },
      { planet: 'Moon', type: 'ASC', weight: 0.6 },
    ],
    tone: 'spokojny, kojący, ciepły, sensoryczny — woda, światło, oddech',
  },
  {
    id: 'milosc',
    emoji: '💞',
    label: 'Miłość',
    subtitle: 'Otwarcie serca, romans, partnerstwo',
    description: 'Miejsca, gdzie ludzie zakochują się łatwiej, a dystans w sercu topnieje.',
    primary_lines: [
      { planet: 'Venus', type: 'DSC', weight: 1.0 },
      { planet: 'Venus', type: 'ASC', weight: 0.9 },
      { planet: 'Moon', type: 'DSC', weight: 0.8 },
      { planet: 'Venus', type: 'IC', weight: 0.7 },
      { planet: 'Mars', type: 'DSC', weight: 0.6 },
    ],
    tone: 'zmysłowy, ciepły, intymny — światło, zapach, dotyk',
  },
  {
    id: 'sukces',
    emoji: '🌟',
    label: 'Sukces',
    subtitle: 'Widoczność, kariera, autorytet',
    description: 'Miejsca, gdzie twoja praca i twoje imię zyskują wagę.',
    primary_lines: [
      { planet: 'Sun', type: 'MC', weight: 1.0 },
      { planet: 'Jupiter', type: 'MC', weight: 0.95 },
      { planet: 'Saturn', type: 'MC', weight: 0.8 },
      { planet: 'Mars', type: 'MC', weight: 0.7 },
      { planet: 'Mercury', type: 'MC', weight: 0.6 },
    ],
    tone: 'ambitny, jasny, strategiczny — miasto, wieżowce, kontakty',
  },
  {
    id: 'tworczosc',
    emoji: '🎨',
    label: 'Twórczość',
    subtitle: 'Inspiracja, nowa wizja, artystyczna odwaga',
    description: 'Miejsca, w których wyobraźnia mówi pełnym głosem.',
    primary_lines: [
      { planet: 'Neptune', type: 'MC', weight: 1.0 },
      { planet: 'Venus', type: 'MC', weight: 0.9 },
      { planet: 'Moon', type: 'ASC', weight: 0.8 },
      { planet: 'Neptune', type: 'ASC', weight: 0.75 },
      { planet: 'Mercury', type: 'ASC', weight: 0.6 },
    ],
    tone: 'poetycki, sensoryczny, lekko mistyczny — atelier, muzyka, kawiarnie',
  },
  {
    id: 'duchowosc',
    emoji: '🌌',
    label: 'Duchowość',
    subtitle: 'Transcendencja, cisza, łączność z większym',
    description: 'Miejsca, w których codzienność staje się rytuałem.',
    primary_lines: [
      { planet: 'Neptune', type: 'ASC', weight: 1.0 },
      { planet: 'Jupiter', type: 'ASC', weight: 0.85 },
      { planet: 'Saturn', type: 'IC', weight: 0.8 },
      { planet: 'Pluto', type: 'IC', weight: 0.7 },
      { planet: 'Moon', type: 'IC', weight: 0.6 },
    ],
    tone: 'kontemplatywny, prosty, lekko sacrum — światło, kamień, woda',
  },
  {
    id: 'transformacja',
    emoji: '🔥',
    label: 'Transformacja',
    subtitle: 'Przełom, zmiana fundamentów, nowy ja',
    description: 'Miejsca, które wyrywają z rutyny i przebudowują od zera.',
    primary_lines: [
      { planet: 'Pluto', type: 'ASC', weight: 1.0 },
      { planet: 'Pluto', type: 'MC', weight: 0.9 },
      { planet: 'Uranus', type: 'ASC', weight: 0.85 },
      { planet: 'Saturn', type: 'ASC', weight: 0.7 },
      { planet: 'Mars', type: 'ASC', weight: 0.6 },
    ],
    tone: 'intensywny, energetyczny, czasem niepokojący — ogień, ostra geografia, kontrast',
  },
];

export function getIntention(id: string): Intention | undefined {
  return INTENTIONS.find(i => i.id === id);
}
```

## curatedCities.ts — dataset 500-800 miast

**Approach: hybrid seed + generation.**

Krok 1 (manualny seed w prompcie poniżej): podaję ci 80 anchor miast z pełnymi metadanymi jako wzorzec. **Te 80 są ręcznie kuratowane** — to są ikoniczne miejsca które bezwzględnie muszą być w bazie i mają dobrą jakość metadanych jako few-shot dla generowania reszty.

Krok 2 (script `scripts/seed-curated-cities.ts`): bierze listę raw (top 500 miast światowych >500k populacji + UNESCO Heritage cities + top 100 tourist destinations from Tripadvisor/Lonely Planet) → dla każdego niecuratowanego LLM tag z intention_matches + cultural_blurb + travel_relevance score → output do `apps/web/src/data/cities.json`.

Krok 3: `curatedCities.ts` jest cienką warstwą która ładuje `cities.json` (lazy split jeśli >300KB).

**Format każdego city:**

```typescript
type CuratedCity = {
  slug: string;                          // 'santorini', 'paryz', 'sedona', 'kazimierz-dolny'
  name_pl: string;                       // 'Santorini'
  name_en: string;                       // 'Santorini'
  name_native?: string;                  // 'Σαντορίνη'
  country_pl: string;                    // 'Grecja'
  country_code: string;                  // 'GR'
  continent: 'europe' | 'asia' | 'middle_east' | 'africa' | 'north_america' | 'south_america' | 'oceania';
  lat: number;
  lon: number;
  population: number;
  
  // Cultural metadata
  intention_matches: Array<Intention['id']>;  // 1-3 z 6 intencji
  cultural_blurb: string;                     // 1-2 zdania krótkiej tożsamości kulturowej (do AI input)
  travel_relevance: 1 | 2 | 3 | 4 | 5;        // 5 = ikoniczne (Santorini, Paryż), 1 = duże ale mało turystyczne (Houston)
  
  // Media
  photo_url: string;                          // Unsplash URL lub curated CDN
  photo_credit?: string;
  
  // Tags (do filtrowania w UI)
  tags: string[];                             // ['beach', 'island', 'mediterranean', 'sunset', 'romantic']
};
```

**Seed 80 anchor miast** (paste these as-is w `seed-curated-cities.ts` jako twardo zapisana tablica startowa):

```typescript
const SEED_CITIES: CuratedCity[] = [
  // === SPOKÓJ / REGENERACJA ===
  {
    slug: 'santorini',
    name_pl: 'Santorini', name_en: 'Santorini', name_native: 'Σαντορίνη',
    country_pl: 'Grecja', country_code: 'GR', continent: 'europe',
    lat: 36.39, lon: 25.46, population: 15000,
    intention_matches: ['spokoj', 'milosc', 'tworczosc'],
    cultural_blurb: 'Wulkaniczna wyspa na Egejskim — biały kamień, granatowy błękit, caldera która kiedyś była górą. Archetyp greckiej ciszy.',
    travel_relevance: 5,
    photo_url: 'https://images.unsplash.com/photo-1469796466635-455ede028aca?w=800',
    tags: ['beach', 'island', 'mediterranean', 'sunset', 'romantic', 'iconic'],
  },
  {
    slug: 'bali-ubud',
    name_pl: 'Bali (Ubud)', name_en: 'Bali (Ubud)',
    country_pl: 'Indonezja', country_code: 'ID', continent: 'asia',
    lat: -8.51, lon: 115.26, population: 30000,
    intention_matches: ['spokoj', 'duchowosc', 'tworczosc'],
    cultural_blurb: 'Wewnątrz Bali — ricefieldy, świątynie, rzemieślnicy. Miejsce gdzie joga i medytacja są codziennością, nie weekendem.',
    travel_relevance: 5,
    photo_url: 'https://images.unsplash.com/photo-1604999333679-b86d54738315?w=800',
    tags: ['jungle', 'ricefields', 'spiritual', 'temples', 'yoga'],
  },
  // ... 6-8 dalszych dla każdej z 6 intencji
  // (pełny seed 80 miast: patrz `seed-curated-cities.ts` w repozytorium, ja tu daję strukturę)
];
```

**Pełny seed 80 anchor miast** (wpisz całość w skrypt — to są punkty kotwiczne którym ufamy):

Spokój/Regeneracja: Santorini, Bali Ubud, Sardynia (Costa Smeralda), Madera, Algarve, Kreta, Mauritius, Costa Rica (Nosara), Tulum, Maroko (Essaouira), Sopot, Kazimierz Dolny.

Miłość: Paryż, Wenecja, Florencja, Praga, Lizbona, Charleston, Buenos Aires, Sevilla, Wiedeń, Wenecja, Kraków, Toruń.

Sukces: Londyn, Nowy Jork, Singapur, Tokio, Dubaj, Mediolan, Hong Kong, San Francisco, Frankfurt, Zurych, Warszawa, Berlin.

Twórczość: Berlin (Kreuzberg), Brooklyn, Lizbona, Marrakesz, Mexico City (Roma), Reykjavik, Buenos Aires (San Telmo), Kioto (artisan), Paryż (Montmartre), Wrocław, Łódź, Tbilisi.

Duchowość: Varanasi, Sedona, Mount Shasta, Macchu Picchu, Bhutan (Thimphu), Lhasa, Jerozolima, Glastonbury, Kioto (świątynie), Kalwaria Zebrzydowska, Częstochowa, Iona.

Transformacja: Reykjavik, Marrakesz, Mexico City, Cape Town, Berlin, Beirut, Detroit, Belfast, Sarajewo, Kiev (gdy bezpieczne), Wrocław (po II WŚ — odbudowa), Gdańsk.

Każda pozycja tej listy musi mieć pełne metadane jak Santorini wyżej. Generuj photo_url przez Unsplash search per slug. Jeśli photo nie ładuje się — fallback do `/images/placeholder-city.jpg`.

**Generacja reszty (500+) przez script:**

```typescript
// scripts/seed-curated-cities.ts
// 1. Load SEED_CITIES (80)
// 2. Load raw city dataset (np. simplemaps.com/data/world-cities top 500 by population)
// 3. Dla każdego niezeed-owanego miasta:
//    - Wyślij do Claude Haiku:
//      "Miasto: {name}, {country}. 
//       Tagging z listy intencji [spokoj, milosc, sukces, tworczosc, duchowosc, transformacja] — 
//       które 0-3 najbardziej pasują kulturowo? Travel relevance 1-5? 
//       Cultural blurb 1-2 zdania.
//       Tags z listy [beach, mountain, urban, ancient, spiritual, ...] 1-4.
//       Output JSON."
//    - Parse + dodaj
// 4. Photo URL: dla każdego city wyszukaj na Unsplash API z query "{name_en} city" — pierwsze trafienie
// 5. Save do `apps/web/src/data/cities.json`
// 6. Jeśli intention_matches = [] (nic nie pasuje kulturowo) → skip city (filter na końcu)
```

To daje ~500 miast z dobrymi metadanymi. Plus 80 seed = ~580 łącznie. Wystarczy.

## PlacesView.tsx — kafle (domyślny tryb)

Layout:

```
┌──────────────────────────────────────────────────────────────┐
│ Header: Cosmo Map · profile selector · ViewToggle [Lista|Mapa]│
├──────────────────────────────────────────────────────────────┤
│ IntentionPicker: [🕊 Spokój] [💞 Miłość] [🌟 Sukces] ...      │
├──────────────────────────────────────────────────────────────┤
│ HometownAnchor (compact, 1 linia jeśli home ma aktywne linie)│
├──────────────────────────────────────────────────────────────┤
│ ContinentFilter chips: Wszystkie · Europa* · Azja · ...      │
├──────────────────────────────────────────────────────────────┤
│ Grid 4 col desktop / 1 col mobile:                            │
│                                                                │
│ [card] [card] [card] [card]                                   │
│ [card] [card] [card] [card]                                   │
│ [card] [card] [card] [card]                                   │
│                                                                │
│ Pokaż więcej miast →                                          │
└──────────────────────────────────────────────────────────────┘
```

Domyślnie pokazuj **16 kafli** (4×4 grid), z buttonem "Pokaż więcej" → kolejne 16. Total 50-80 dostępnych jeśli user scrolluje.

## PlaceCard.tsx — pojedynczy kafel

```
┌─────────────────────────────┐
│                              │
│     [PHOTO 240×160]          │
│                              │
│                              │
├─────────────────────────────┤
│ 🇬🇷 Santorini                 │
│ Grecja                       │
│                              │
│ 🌙 Księżyc IC · 87 km        │
│ "Powrót do siebie po latach" │
│                              │
└─────────────────────────────┘
```

- Photo full-width top, aspect 3:2
- Country flag emoji + city name (large)
- Country (small, secondary text)
- Active planet line badge (colored per planet) + dystans
- 1-line teaser — generowane RAZEM z pełną narracją w `cosmo-map-narrative` (sekcja `card_teaser`)
- Click całego kafla → otwiera `PlaceFullNarrative` jako side drawer (desktop) lub full-screen modal (mobile)
- Hover (desktop): subtle elevation, photo zoom 1.05

Kafel ma jednolitą wysokość niezależnie od długości tekstu (truncate teaser w 1 linii z ellipsis).

## PlaceFullNarrative.tsx — głęboki widok

To jest core wartość produktu. **Patrz przykład Santorini w docs/cosmo-map-v3-redesign.md** (this file) — taki właśnie ton i głębia.

Sekcje (każda osobny blok z subtelnym divider'em):

```
┌────────────────────────────────────────────────────────┐
│ [×]                                              [Share]│
│                                                          │
│ [PHOTO HERO 100% width × 320px]                          │
│                                                          │
│ 🇬🇷 SANTORINI · Grecja                                   │
│ Powrót do siebie po latach                               │
│                                                          │
│ Aktywne linie:                                            │
│ [🌙 Księżyc IC 87km] [♀ Wenus IC 240km]                  │
│                                                          │
├────────────────────────────────────────────────────────┤
│ DLACZEGO TO MIEJSCE                                      │
│                                                          │
│ Wulkaniczna wyspa na Egejskim — biały kamień, granatowy │
│ błękit, caldera która kiedyś była górą. Geografia       │
│ ciszy. Greckie tempo sprawia, że nic nie spieszy.       │
│ [2-3 zdania z cultural_blurb rozszerzonego przez AI]    │
├────────────────────────────────────────────────────────┤
│ DLACZEGO DLA CIEBIE                                      │
│                                                          │
│ Linia twojego Księżyca na IC przechodzi 87 km od       │
│ Santorini — to jedna z trzech najsilniejszych        │
│ "domowych" rezonansów na twojej osobistej mapie.       │
│ Twój natywny Księżyc w Raku w 4. domu już z natury    │
│ szuka miejsc z wodą, ciszą i intymnym wymiarem domu.  │
│ Santorini daje to spotęgowane: morze cię otula, biały │
│ kamień absorbuje hałas, codzienny sunset rytuał...    │
│ [4-6 zdań głębokiej astro warstwy]                     │
├────────────────────────────────────────────────────────┤
│ JAK TO MOŻE WYGLĄDAĆ                                     │
│                                                          │
│ Pierwszy dzień jest niewygodny, bo ciało nie wie jak  │
│ się zwalnia. Trzeciego oddychasz głębiej bez          │
│ decydowania. Po tygodniu pamiętasz rzeczy, o których  │
│ zapomniałeś, że pamiętasz.                              │
│ [3-4 zdania behavioral/sensory]                         │
├────────────────────────────────────────────────────────┤
│ PODOBNY REZONANS                                         │
│                                                          │
│ [Hydra · te same wody, mniej turystów]                  │
│ [Folegandros · cisza w kameralnej skali]                │
│ [Kreta · zachód z większą bramą]                        │
│ — klikalne karty mniejsze, prowadzą do innych miejsc    │
├────────────────────────────────────────────────────────┤
│ [Zobacz na mapie →]    [Zapisz do ulubionych ♡]         │
└────────────────────────────────────────────────────────┘
```

Sekcja "Podobny rezonans" — pull 3 inne miasta ze sharowanym primary_line albo z tagami (np. inne wyspy mediterranean). Nie generujemy AI — algorytmicznie znajdujemy 3 najbliższe kulturowo z bazy.

## MapExplorer.tsx — Leaflet w stylu astro.com Travel

Bierzemy `react-leaflet` (Leaflet + tile layer + Polyline). Background tiles: CartoDB dark matter (ciemna mapa pasująca do brand). Alternatywa: OSM z CSS filter `invert(0.9) hue-rotate(180deg)`.

Layout:

```
┌──────────────────────────────────────────────────────────────┐
│ ViewToggle [Lista|Mapa]   Layers: [☑ Wszystkie] [☐ Tylko intencja]│
├──────────────────────────────┬───────────────────────────────┤
│                              │ SIDEBAR (30%)                  │
│                              │                                │
│                              │ Klikneij linię lub miasto       │
│   [LEAFLET MAP 70%]          │ żeby zobaczyć interpretację.    │
│   World view Mercator        │                                │
│   • Birth marker (gold pin)  │ [po kliknięciu linii:]         │
│   • Residence marker (blue)  │ → "Linia Wenus DSC"            │
│   • 40 planetary lines       │   Generic interpretacja        │
│   • City markers (clickable) │                                │
│                              │ [po kliknięciu miasta:]        │
│                              │ → "Lizbona"                    │
│                              │   Aktywne linie + button       │
│                              │   "Pełna narracja →"           │
│                              │                                │
└──────────────────────────────┴───────────────────────────────┘
```

**Renderowanie linii:**

- **MC line** (planeta na zenicie): pionowy meridian — Polyline z punktów (-85, mc_lon) do (85, mc_lon). Solid line. Label "♀ MC" na góra (lat 85) i "♀ MC" na dół (lat -85).
- **IC line** (planeta na nadirze): pionowy meridian na ic_lon. Dashed line. Label "♀ IC".
- **AC line** (planeta wschodzi): curve — Polyline z punktów asc_curve (lat, lon). Solid line. Label "♀ AC" na końcach krzywej.
- **DC line** (planeta zachodzi): curve dsc_curve. Dashed line. Label "♀ DC".

**Kolory** (zgodne z konwencją astro.com, daje natychmiastową czytelność):

```typescript
// apps/web/src/lib/mapColors.ts

export const PLANET_COLORS = {
  Sun:     '#FFA500',  // orange
  Moon:    '#B0C4DE',  // silver-blue
  Mercury: '#00C853',  // green
  Venus:   '#E91E63',  // pink
  Mars:    '#F44336',  // red
  Jupiter: '#9C27B0',  // purple
  Saturn:  '#795548',  // brown
  Uranus:  '#03A9F4',  // light blue
  Neptune: '#009688',  // teal
  Pluto:   '#4A148C',  // dark purple
} as const;
```

Linia weight: 2.5px standard, 3.5px hover.

**Markery miast:**

Renderuj wszystkie kuratowane miasta (~580) jako małe markery (8px circle) w kolorze brand muted. Miasta z aktywnymi liniami w bieżącej intencji (jeśli intencja wybrana) — większe (12px) i podświetlone gold.

**Interakcje:**

- Klik na linię → sidebar pokazuje generic interpretation tej linii (planet + line type). Cache w `map_line_interpretations` — 40 wpisów total, pre-seeded.
- Klik na miasto → sidebar pokazuje (a) nazwę miasta + flagę, (b) listę aktywnych linii w 700km orbie, (c) button "Pełna narracja →" otwiera PlaceFullNarrative.
- Klik na pustą wodę/ląd → sidebar pokazuje "Pusto" + lista najbliższych linii w 200km.
- Zoom: domyślnie world view (zoom 2). Buttony +/- jak w Leaflet defaultowo.
- Pan: drag.
- "Zoom to Europe" toggle szybki widok regional.
- Layer toggle "Tylko intencja" — pokazuje tylko linie scenariusza, nie 40.

**Sidebar contextual zachowanie:**

Default (nic nie klikneite): "Kliknij linię lub miasto żeby zobaczyć interpretację. Linie pokazują energie planetarne — przerywane to IC/DSC, ciągłe to MC/ASC."

## cosmo-map-narrative — AI generation

```typescript
// supabase/functions/cosmo-map-narrative/index.ts
// POST { user_id, profile_id?, city_slug, intention_id }
// → 200 { narrative: { card_teaser, why_place, why_for_you, what_youll_feel, similar_slugs }, cached: bool }

// 1. Sprawdź cache w map_place_narratives
// 2. Pobierz: city z curated DB, user_natal z auth + birth_data, active_lines z astrocartography_lines
// 3. Build prompt do Claude Sonnet:

const systemPrompt = `Jesteś ekspertem astrokartografii o głębokiej wiedzy kulturowej. Twoim zadaniem jest napisać głęboką, evocative interpretację konkretnego miejsca dla konkretnej osoby w kontekście wybranej intencji życiowej.

KRYTYCZNE ZASADY:
1. NIE WYMYŚLAJ konkretnych wydarzeń, festiwali, lokalnych nazw dzielnic ani szczegółów których nie jesteś PEWIEN. Trzymaj się szeroko-znanych faktów o mieście (te które są w cultural_blurb).
2. ZAWSZE odnoś się do KONKRETNEJ planety + linii + natywnego umiejscowienia tej planety w karcie usera (znak + dom). To core wartość.
3. ZAKAZ: slash-form (oddałeś/aś), żargon astrologiczny bez tłumaczenia (orb, dyspozytor, retrograde, MC w sensie technicznym), generyczne truizmy.
4. Forma gramatyczna usera: {{grammatical_form}}.
5. Język: polski.

OUTPUT JSON:
{
  "card_teaser": "<≤8 słów, jedna emotional fraza dla kafla, np. 'Powrót do siebie po latach'>",
  "why_place": "<2-3 zdania o kulturowej/geograficznej tożsamości miejsca, rozwinięcie cultural_blurb>",
  "why_for_you": "<4-6 zdań głębokiej astro warstwy: która linia + który dom natywny + który znak natywny tej planety + jak te warstwy się składają w doświadczenie>",
  "what_youll_feel": "<3-4 zdania behavioral/sensory — co user faktycznie poczuje, jak to się rozłoży w czasie>",
  "similar_slugs": ["slug1", "slug2", "slug3"]
}`;

const userPrompt = `INTENCJA: ${intention.label} — ${intention.subtitle}
TON: ${intention.tone}

MIASTO: ${city.name_pl}, ${city.country_pl}
TOŻSAMOŚĆ KULTUROWA: ${city.cultural_blurb}
TAGI: ${city.tags.join(', ')}

AKTYWNE LINIE W 700KM ORB:
${activeLines.map(l => `- ${planetPL[l.planet]} ${l.type} — ${l.distance_km}km`).join('\n')}

KARTA NATALNA USERA (relevant placements):
${activeLines.map(l => {
  const natalPlacement = userNatal.planets[l.planet];
  return `- ${planetPL[l.planet]}: znak ${natalPlacement.sign}, dom ${natalPlacement.house}`;
}).join('\n')}

INNE PODOBNE MIEJSCA W BAZIE (do similar_slugs — wybierz 3 ze sharowanymi tagami):
${similarCandidates.map(c => `- ${c.slug}: ${c.name_pl}, ${c.country_pl}, tagi: ${c.tags.join(',')}`).join('\n')}

Napisz głęboką narrację. Zacznij od which planet + which line ma najsilniejszy wpływ tu (najmniejsza odległość) i z niej rozwijaj.`;
```

**Cache strategy:** per (user_id, profile_id, city_slug, intention_id). To znaczy że ten sam user oglądający Santorini dla "Spokój" vs "Miłość" dostaje DWIE różne narracje (bo różne intencje aktywują różne linie i ton).

## cosmo-map-line-info — interpretacja linii na klik

```typescript
// supabase/functions/cosmo-map-line-info/index.ts
// POST { planet, line_type } → 200 { interpretation_pl, travel_meaning, home_meaning, community_meaning }

// 1. SELECT z map_line_interpretations WHERE planet=$1 AND line_type=$2
// 2. Jeśli istnieje → zwróć
// 3. Jeśli nie → generuj AI (Claude Haiku — krótki tekst, generic, nie user-specific):

const systemPrompt = `Jesteś astrologiem. Wyjaśnij co oznacza linia planetarna {planet} {line_type} w astrokartografii. Krótko, konkretnie, po polsku. Bez żargonu.

Output JSON:
{
  "interpretation_pl": "<2-3 zdania głównego znaczenia>",
  "travel_meaning": "<1 zdanie: co oznacza dla podróży>",
  "home_meaning": "<1 zdanie: co oznacza dla zamieszkania>",
  "community_meaning": "<1 zdanie: co oznacza dla relacji>"
}`;

// 4. INSERT do map_line_interpretations + zwróć
```

Pre-seed wszystkie 40 wpisów przez `scripts/seed-line-interpretations.ts` żeby pierwszy klik nie wywoływał AI.

## Map.tsx — full refactor

```typescript
type ViewMode = 'places' | 'map';

const Map = () => {
  const [view, setView] = useState<ViewMode>('places');
  const [intentionId, setIntentionId] = useState<Intention['id']>('spokoj');
  const [continent, setContinent] = useState<string>('all');  // 'all', 'europe', 'asia', ...
  const [selectedPlace, setSelectedPlace] = useState<CuratedCity | null>(null);
  
  // ... fetch cosmoMap z compute endpoint
  // ... fetch curated cities
  
  return (
    <div>
      <Header />
      <ViewToggle value={view} onChange={setView} />
      <IntentionPicker value={intentionId} onChange={setIntentionId} />
      
      {view === 'places' ? (
        <PlacesView
          intention={getIntention(intentionId)!}
          userLines={cosmoMap}
          cities={curatedCities}
          continent={continent}
          onContinentChange={setContinent}
          onPlaceClick={setSelectedPlace}
        />
      ) : (
        <MapExplorer
          userLines={cosmoMap}
          birthLocation={birthLocation}
          residenceLocation={residenceLocation}
          cities={curatedCities}
          intentionFilter={intentionId}  // optional layer toggle
          onCityClick={setSelectedPlace}
        />
      )}
      
      {selectedPlace && (
        <PlaceFullNarrative
          place={selectedPlace}
          intention={getIntention(intentionId)!}
          userNatal={userNatal}
          activeLines={getActiveLinesForCity(selectedPlace, cosmoMap)}
          onClose={() => setSelectedPlace(null)}
          onShowOnMap={() => { setView('map'); /* center on city */ }}
        />
      )}
    </div>
  );
};
```

## Ranking algorithm dla PlacesView

```typescript
function rankCitiesForIntention(
  cities: CuratedCity[],
  userLines: Astrocartography,
  intention: Intention,
  continent: string,
  userResidence: { lat: number; lon: number } | null
): RankedPlace[] {
  // 1. Filter cities by intention.id IN intention_matches
  let filtered = cities.filter(c => c.intention_matches.includes(intention.id));
  
  // 2. Filter by continent
  if (continent !== 'all') {
    filtered = filtered.filter(c => c.continent === continent);
  }
  
  // 3. Dla każdego: oblicz active lines i score
  const scored = filtered.map(city => {
    const activeLines = activeLinesForCity(city, userLines);
    const scenarioLines = intention.primary_lines.map(l => `${l.planet}-${l.type}`);
    const matchingActive = activeLines.filter(l => scenarioLines.includes(`${l.planet}-${l.type}`));
    
    // Score: weight z intencji × bliskość linii × travel_relevance miasta
    const lineScore = matchingActive.reduce((sum, line) => {
      const weight = intention.primary_lines.find(p => p.planet === line.planet && p.type === line.type)?.weight ?? 0;
      return sum + weight * (1500 - line.distance_km) / 1500;  // szerszy orb 1500km dla weak resonance
    }, 0);
    
    const culturalScore = city.travel_relevance / 5;
    
    return {
      city,
      score: lineScore * 0.7 + culturalScore * 0.3,
      strongest_line: matchingActive[0] ?? null,
      all_active_lines: activeLines,
    };
  });
  
  // 4. Sort i return top N
  return scored
    .filter(p => p.strongest_line !== null)  // tylko z aktywacją
    .sort((a, b) => b.score - a.score)
    .slice(0, 80);
}
```

## HometownAnchor — używa residence_city

```typescript
const homeLocation = user.residence_city ?? user.birth_city;

// Compute active lines AT residence (not just birth)
const homeLines = activeLinesForCity(homeLocation, userCosmoMap);

// Show top 3 strongest
```

Jeśli `residence_city` nie ustawione w settings → tag "Twoje miasto: {birth_city} (z miejsca urodzenia)" + subtle link "Ustaw aktualne miejsce zamieszkania w ustawieniach →".

## Test akceptacyjny

1. Default page load: tryb "Miejsca dla Ciebie" aktywny, intencja "Spokój" zaznaczona, grid 16 kafli się ładuje. Każdy kafel ma photo (nie placeholder). Header kafla pokazuje flag + city name + active planet badge + 1-line teaser z `card_teaser` field.
2. Zmień intencję na "Miłość" → kafle się odświeżają (animacja fade-cross), pokazują różne miasta (Paryż, Wenecja, Lizbona, Charleston, Buenos Aires...), różne line badges.
3. Zmień continent na "Azja" → kafle filtrują (Bali, Kioto, Tokio dla odpowiednich intencji).
4. Klik na kafel Santorini → otwiera PlaceFullNarrative jako side drawer. Zawiera 4 sekcje (Dlaczego to miejsce, Dlaczego dla Ciebie, Jak to może wyglądać, Podobny rezonans). Tekst odnosi się do KONKRETNEGO Księżyca usera (znak, dom). Photo hero widoczne. Active planet badges widoczne.
5. Sekcja "Podobny rezonans" pokazuje 3 inne miasta z tagami sharowanymi (np. inne greckie wyspy dla Santorini).
6. Klik "Zobacz na mapie" w narracji → przełącza na ViewMode='map' i centruje mapa na Santorini z highlighted linią Księżyca.
7. ViewToggle "Mapa" → ładuje Leaflet, world view zoom=2. Widać:
   - Birth marker (gold pin) w Hajnówce
   - Residence marker (blue pin) w Warszawie (lub gdziekolwiek user ustawił)
   - 40 linii planetarnych (10 planet × 4 typy) w kolorach z PLANET_COLORS
   - MC/IC = pionowe meridiany (solid/dashed)
   - ASC/DSC = krzywe od polarnych
   - Każda linia oznaczona glifem planety na końcu
   - ~580 city markers (małe kropki)
   - Markery z aktywną linią w 700km dla bieżącej intencji = większe i gold
8. Klik na linię Wenus DSC (curve) na mapie → sidebar pokazuje "Linia Wenus DSC" + generic interpretation z `map_line_interpretations`. Nie wymaga AI call (cached).
9. Klik na Lizbonę na mapie → sidebar pokazuje "Lizbona, Portugalia", listę aktywnych linii, button "Pełna narracja →".
10. Klik "Pełna narracja →" → otwiera PlaceFullNarrative.
11. Layer toggle "Tylko intencja" → mapa ukrywa nieistotne linie, zostają tylko 5 z `intention.primary_lines`. Też mniej city markers (filter w UI).
12. Hometown anchor: jeśli user nie ma `residence_city` → pokazuje "Twoje miejsce urodzenia: Hajnówka" + link do settings. Jeśli ma residence — używa residence dla compute active lines tutaj.
13. Mobile (375×812):
    - View toggle [Lista|Mapa] sticky top
    - Intention picker scroll horizontalny 6 pills
    - Grid 1 column, każdy kafel full width
    - PlaceFullNarrative jako bottom sheet full-screen
    - MapExplorer: mapa pełnoekranowa, sidebar slide-in z dołu po kliknięciu
14. AI hallucination check: open Rzeszów (jeśli jest w bazie — prawdopodobnie nie, bo low travel_relevance) lub inne miasto dla `intention=spokoj`. Verify że tekst NIE wymyśla "imprez masowych", "lotu z Hajnówki" (jeśli residence to Warszawa, nie pisze "z Hajnówki"), konkretnych nieistniejących dzielnic. Trzyma się cultural_blurb + planet placements.
15. PostHog events działają: `cosmo_map_intention_selected`, `cosmo_map_view_changed {to: 'map'|'places'}`, `cosmo_map_place_opened {slug, intention}`, `cosmo_map_line_clicked {planet, line_type}`.
16. Performance: kliknięcie kafla → narrative ładuje się <2s pierwszy raz, <300ms drugi raz (cache). Map render początkowy <3s.
17. Empty state: jeśli user nie ma żadnej aktywnej linii dla intencji w 1500km → grid pokazuje 6 najsłabszych aktywacji z disclaimer "Delikatniejszy rezonans — twoja energia dla {intencja} jest rozproszona globalnie. Spróbuj innej intencji."
18. Free user (paywall): tryb Lista pokazuje 3 kafle (preview), pozostałe blur + paywall CTA. Tryb Mapa — pełna mapa ale klik na miasto wymaga premium (paywall popup).

Jeśli któreś z 18 nie przechodzi → nie commituj, wróć z błędem.

## Co odłożone na P1+

- **Local Space** view (radial lines od residence) jako trzeci tryb
- **Compare mode** z drugą osobą (V1 had it, jeśli nie działa po refactorze — fix w P1)
- **Search bar** "Sprawdź dowolne miasto" na mapie — dropdown autocomplete + click → narracja jak dla curated city ale bez cultural_blurb (AI musi sobie poradzić)
- **Save to favorites** — gwiazdka na PlaceFullNarrative + tab "Moje ulubione"
- **Custom routes** — user zaznacza 3-4 miasta i app pokazuje "twoja podróż" connecting story
- **Transit alerts** — kiedy planeta przechodzi przez linię → notification
- **Local sub-regions** — np. dla Bali rozbij na Ubud / Canggu / Uluwatu (różny tagging intention)

## Po skończeniu

Dopisz do `docs/PROGRESS.md`:
- Liczba miast w curated dataset (powinno być 500+)
- Liczba zaseed'owanych line interpretations (powinno być 40)
- 5 przykładów wygenerowanych narracji (3 różne intencje, różne miasta, różne usera) — wklej żebym zobaczył jakość
- Średni czas response cosmo-map-narrative endpoint (pierwsza vs cached)
- Bundle size: czy `cities.json` mieści się w main bundle czy lazy-loaded
- Czy Leaflet + dark tiles wygląda spójnie z brand (#1a1d3a) — wklej screenshot

Plus pytania do mnie (np. "Unsplash API rate-limit — chcesz Unsplash Plus subscription czy self-hosted photos?")
