---
title: Cosmo Map — MVP prompt dla Claude Code
created: 2026-05-24
project: cosmogram
type: claude-code-prompt
status: ready-to-paste
---

# Cosmo Map MVP — prompt do wklejenia

> Wklej całość poniżej (od linii `Przeczytaj...` do końca) do Claude Code. Anti-overengineering: scope jest świadomy, nie rozszerzaj go.

---

Przeczytaj `docs/site-structure-and-routing.md` (sekcje o `/app/*` i brand naming) i `docs/share-feature-prompt.md` (architektura share cards). Cosmo Map jest nową feature pod premium subscription, nazwą zgodną z konwencją Cosmo ___ (po Cosmo Match, Cosmo Chat).

## Co budujemy

Cosmo Map = astrokartografia w mobile-first UI. User dostaje mapę świata z naniesionymi liniami planetarnymi obliczonymi z jego danych urodzenia. Może filtrować po intencji (Miłość/Kariera/Spokój), wyszukiwać miasta, porównywać z drugą osobą z Biblioteki i sharować 3 typy kart.

Brand: **Cosmo Map** w UI. Plik: `Map.tsx`. Route: `/app/map`.

## Co NIE robimy w MVP

- Bez relocation chart (pełne przeliczenie kosmogramu jakby user się urodził w innym mieście) — to P2.
- Bez pay-per-city Stripe flow — gating to premium-only, point.
- Bez auto-generowanych SEO landing pages per miasto — to P2 marketing play.
- Bez Mapbox/Google Maps integracji — vanilla SVG z Natural Earth GeoJSON.
- Bez Web Mercator z dragą i pinch-zoom przez bibliotekę — `react-simple-maps` daje wszystko czego trzeba w 30KB.
- Bez geolocation API "twoja obecna lokalizacja" — P1 wewnątrz feature.

Jeśli kusi rozszerzenie scope'u → odpowiedz "to backlog P1/P2" i wracaj do MVP.

## Pliki do utworzenia

```
apps/web/src/lib/astrocartography.ts          # Math: line computation + parans
apps/web/src/lib/cityDatabase.ts              # 500 największych miast świata
apps/web/src/lib/mapShareCard.ts              # 3 share card types
apps/web/src/pages/Map.tsx                    # Główna strona /app/map
apps/web/src/components/Map/MapCanvas.tsx     # SVG world map + lines layer
apps/web/src/components/Map/IntentionPicker.tsx
apps/web/src/components/Map/CitySearch.tsx
apps/web/src/components/Map/CityDetails.tsx   # Side panel (desktop) / bottom sheet (mobile)
apps/web/src/components/Map/CompareMode.tsx
apps/web/src/components/Map/MobileCityList.tsx
apps/web/src/components/Map/PaywallTeaser.tsx # Free user view

supabase/functions/cosmo-map-compute/index.ts # Liczy linie + parans
supabase/functions/cosmo-map-city/index.ts    # AI interpretacja per miasto
```

## Pliki do modyfikacji

- `apps/web/src/lib/routes.ts` — dodaj `app.map: { path: '/app/map', label: 'Cosmo Map' }`
- `apps/web/src/components/layout/AppHeader.tsx` — dodaj pozycję "Cosmo Map" w nav
- `apps/web/src/components/layout/MobileBottomNav.tsx` — zastąp jedną z aktualnych pozycji "Cosmo Map" (sugestia: zastąp "Biblioteka" bo Biblioteka żyje wewnątrz Cosmo Match flow). Jeśli to za bardzo łamie current UX — zostaw 5 zakładek bez Map, a wejście do Map idzie z `/app/today` jako duży kafel.

## DB migracje

```sql
-- Linie astrokartograficzne (cache obliczeń)
CREATE TABLE astrocartography_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  profile_id UUID REFERENCES library_profiles, -- null dla user'a samego, populated dla profili z biblioteki
  lines JSONB NOT NULL,
  parans JSONB NOT NULL,
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, profile_id)
);

-- Cache interpretacji per miasto (oszczędza Claude calls)
CREATE TABLE map_city_interpretations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  profile_id UUID REFERENCES library_profiles,
  city_slug TEXT NOT NULL,
  active_lines JSONB NOT NULL, -- które planety/linie aktywne w 700km orb
  interpretation_markdown TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, profile_id, city_slug)
);

CREATE INDEX idx_city_interp_lookup ON map_city_interpretations(user_id, profile_id, city_slug);
```

## astrocartography.ts — math (krytyczne)

**Input:** dane urodzenia (date_utc, time_utc, lat_birth, lon_birth) + już obliczone pozycje 10 planet (Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto) w RA (right ascension) i declination z swisseph.

**Compute pipeline:**

```typescript
type Planet = 'Sun' | 'Moon' | 'Mercury' | 'Venus' | 'Mars' | 'Jupiter' | 'Saturn' | 'Uranus' | 'Neptune' | 'Pluto';
type LineType = 'MC' | 'IC' | 'ASC' | 'DSC';

type PlanetLines = {
  mc_longitude: number;        // -180..180, straight meridian
  ic_longitude: number;        // -180..180, straight meridian
  asc_curve: Point[];           // polyline of {lat, lon}
  dsc_curve: Point[];           // polyline of {lat, lon}
};

type Astrocartography = {
  planets: Record<Planet, PlanetLines>;
  parans: Paran[];
  birth: { lat: number; lon: number; gst: number }; // Greenwich Sidereal Time at birth
};

type Paran = {
  planet_a: Planet;
  planet_b: Planet;
  type: `${LineType}-${LineType}`; // np. 'MC-ASC' = planet_a na MC, planet_b na ASC
  latitude: number; // szerokość geo gdzie zachodzi
};
```

**Wzory:**

```typescript
// Helper: konwersje
const deg2rad = (d: number) => d * Math.PI / 180;
const rad2deg = (r: number) => r * 180 / Math.PI;
const normalizeLon = (lon: number) => ((lon + 180) % 360 + 360) % 360 - 180;

// 1. MC line: longitude gdzie planet RA = local sidereal time
//    LST = GST + longitude → longitude = planet.RA - GST
function computeMCLongitude(planetRA_deg: number, gst_deg: number): number {
  return normalizeLon(planetRA_deg - gst_deg);
}

// 2. IC = MC + 180
function computeICLongitude(mcLon: number): number {
  return normalizeLon(mcLon + 180);
}

// 3. ASC curve: dla każdego latitude φ ∈ [-66, 66] (krok 1°)
//    znajdź longitude gdzie planeta jest na wschodnim horyzoncie
//    Hour angle H: cos(H) = -tan(φ) * tan(δ)
//    Jeśli |cos(H)| > 1 → brak rozwiązania na tej szerokości (planeta zawsze widoczna lub zawsze pod horyzontem)
//    Inaczej: H = acos(-tan(φ) * tan(δ))
//    Dla wschodniego horyzontu: H < 0 (planeta poniżej meridianu)
//    longitude = planet.RA - GST - H (gdzie H w stopniach)
function computeASCCurve(planetRA_deg: number, planetDec_deg: number, gst_deg: number): Point[] {
  const points: Point[] = [];
  const dec_rad = deg2rad(planetDec_deg);
  for (let lat = -66; lat <= 66; lat += 1) {
    const lat_rad = deg2rad(lat);
    const cosH = -Math.tan(lat_rad) * Math.tan(dec_rad);
    if (Math.abs(cosH) > 1) continue; // skip — planeta nie wschodzi/zachodzi na tej szer.
    const H_deg = rad2deg(Math.acos(cosH));
    const lon = normalizeLon(planetRA_deg - gst_deg - H_deg);
    points.push({ lat, lon });
  }
  return points;
}

// 4. DSC curve: jak ASC ale +H zamiast -H
function computeDSCCurve(planetRA_deg: number, planetDec_deg: number, gst_deg: number): Point[] {
  const points: Point[] = [];
  const dec_rad = deg2rad(planetDec_deg);
  for (let lat = -66; lat <= 66; lat += 1) {
    const lat_rad = deg2rad(lat);
    const cosH = -Math.tan(lat_rad) * Math.tan(dec_rad);
    if (Math.abs(cosH) > 1) continue;
    const H_deg = rad2deg(Math.acos(cosH));
    const lon = normalizeLon(planetRA_deg - gst_deg + H_deg);
    points.push({ lat, lon });
  }
  return points;
}

// 5. Parans: dla każdej pary planet (A, B) i każdej szerokości szukamy
//    miejsca gdzie A jest angular i B jest angular jednocześnie.
//    Implementacja MVP: dla każdej szerokości φ liczysz long(A on MC) = mc_lon_A (constant)
//    i long(B on ASC at φ) z ASC curve B. Jeśli różnica < 1° → paran.
function computeParans(planets: Record<Planet, PlanetLines>): Paran[] {
  const parans: Paran[] = [];
  const planetList = Object.keys(planets) as Planet[];
  for (const A of planetList) {
    for (const B of planetList) {
      if (A === B) continue;
      // MC(A) × ASC(B)
      for (const p of planets[B].asc_curve) {
        if (Math.abs(normalizeLon(planets[A].mc_longitude - p.lon)) < 1) {
          parans.push({ planet_a: A, planet_b: B, type: 'MC-ASC', latitude: p.lat });
        }
      }
      // MC(A) × DSC(B)
      for (const p of planets[B].dsc_curve) {
        if (Math.abs(normalizeLon(planets[A].mc_longitude - p.lon)) < 1) {
          parans.push({ planet_a: A, planet_b: B, type: 'MC-DSC', latitude: p.lat });
        }
      }
      // IC(A) × ASC(B)
      for (const p of planets[B].asc_curve) {
        if (Math.abs(normalizeLon(planets[A].ic_longitude - p.lon)) < 1) {
          parans.push({ planet_a: A, planet_b: B, type: 'IC-ASC', latitude: p.lat });
        }
      }
    }
  }
  return parans; // może być dużo, frontend filtruje pod intencję
}

// 6. Dla danego miasta: które linie są aktywne w orb 700km?
function activeLinesForCity(
  city: { lat: number; lon: number },
  lines: Astrocartography
): ActiveLine[] {
  const result: ActiveLine[] = [];
  const KM_PER_DEG_LAT = 111;
  
  for (const [planet, pLines] of Object.entries(lines.planets)) {
    // MC: straight meridian — distance = |city.lon - mc_lon| × cos(city.lat) × 111
    const mcDist = Math.abs(normalizeLon(city.lon - pLines.mc_longitude)) * Math.cos(deg2rad(city.lat)) * KM_PER_DEG_LAT;
    if (mcDist < 700) result.push({ planet: planet as Planet, type: 'MC', distance_km: Math.round(mcDist) });
    
    const icDist = Math.abs(normalizeLon(city.lon - pLines.ic_longitude)) * Math.cos(deg2rad(city.lat)) * KM_PER_DEG_LAT;
    if (icDist < 700) result.push({ planet: planet as Planet, type: 'IC', distance_km: Math.round(icDist) });
    
    // ASC/DSC: znajdź najbliższy punkt na krzywej (interpolacja po lat)
    const ascDist = distanceToCurve(city, pLines.asc_curve);
    if (ascDist < 700) result.push({ planet: planet as Planet, type: 'ASC', distance_km: Math.round(ascDist) });
    
    const dscDist = distanceToCurve(city, pLines.dsc_curve);
    if (dscDist < 700) result.push({ planet: planet as Planet, type: 'DSC', distance_km: Math.round(dscDist) });
  }
  
  return result;
}
```

`distanceToCurve` używa haversine na najbliższym wierzchołku polyline.

## cosmo-map-compute edge function

```typescript
// supabase/functions/cosmo-map-compute/index.ts
// POST { user_id, profile_id?: uuid } → 200 { lines, parans, cached }

// 1. Sprawdź czy w astrocartography_lines jest już rekord dla (user_id, profile_id)
//    → jeśli tak, zwróć z DB, set cached: true
// 2. Inaczej:
//    a) Pobierz birth_data z odpowiedniej tabeli (auth.users albo library_profiles)
//    b) Wywołaj swisseph (już dostępny w projekcie) — pobierz RA + dec wszystkich 10 planet
//    c) Wylicz lines i parans (kod z astrocartography.ts ale w Deno)
//    d) INSERT do astrocartography_lines
//    e) Zwróć
```

## cosmo-map-city edge function

```typescript
// POST { user_id, profile_id?, city_slug, active_lines: ActiveLine[] }
// → 200 { interpretation_markdown, cached }

// 1. Sprawdź cache: SELECT z map_city_interpretations WHERE (user_id, profile_id, city_slug)
//    → jeśli tak, zwróć z DB
// 2. Inaczej:
//    a) Pobierz user.grammatical_form
//    b) Build prompt do Claude Sonnet:

const systemPrompt = `Jesteś ekspertem astrokartografii. Piszesz krótkie, konkretne interpretacje energii planetarnej dla konkretnego miasta. ZAKAZY: bez slash-formy (oddałeś/aś), bez żargonu astrologicznego (orb, dyspozytor, retrograde, MC, IC), bez generalnych truizmów ("każde miejsce ma coś do zaoferowania"), bez disclaimer'ów ("to tylko sugestia"). Pisz w drugiej osobie z formą gramatyczną: ${user.grammatical_form}.`;

const userPrompt = `Miasto: ${city.name_pl}, ${city.country_pl}.

Aktywne linie planetarne w promieniu 700km:
${activeLines.map(l => `- ${planetPL[l.planet]} na ${linePL[l.type]} (${l.distance_km}km)`).join('\n')}

Napisz 2-3 zdania konkretnej interpretacji dla tej osoby. Zacznij od tego co najsilniej wpływa (najmniejsza odległość). Powiedz CO osoba poczuje/doświadczy w tym miejscu, nie ogólników. Bez wstępu "W tym mieście...". Wejdź od razu w meritum.`;

//    c) Zapisz do map_city_interpretations
//    d) Zwróć
```

Mapa polish names:
```typescript
const planetPL = {
  Sun: 'Słońce', Moon: 'Księżyc', Mercury: 'Merkury', Venus: 'Wenus',
  Mars: 'Mars', Jupiter: 'Jowisz', Saturn: 'Saturn', Uranus: 'Uran',
  Neptune: 'Neptun', Pluto: 'Pluton'
};
const linePL = {
  MC: 'szczycie kariery', IC: 'fundamencie domu', ASC: 'wschodzie (energia którą emanujesz)', DSC: 'zachodzie (co przyciągasz)'
};
```

## cityDatabase.ts

500 największych miast świata (population > 500k) + top 50 polskich (population > 50k). Format:

```typescript
type City = {
  slug: string;        // 'lizbona', 'warszawa', 'tokio'
  name_pl: string;     // 'Lizbona', 'Warszawa', 'Tokio'
  name_en: string;     // 'Lisbon', 'Warsaw', 'Tokyo'
  country_pl: string;
  country_en: string;
  lat: number;
  lon: number;
  population: number;
};

export const CITIES: City[] = [/* ... 550 records ... */];
```

Generuj z public dataset: `simplemaps.com/data/world-cities` (free tier, ~40k cities, weź top 500 + dorzuć polskie). Zapisz statyczny JSON w `public/cities.json` jeśli > 100KB, lazy-load.

## Map.tsx — flow strony

```
1. Component mount: useEffect → call /functions/cosmo-map-compute z user_id.
   Loading state: szkielet mapy świata z animowanym shimmer.

2. Po load:
   - Mapa centrowana na user.birth_city, miejsce urodzenia pulsuje (kropka brand color).
   - 3 duże kafle intencji nad mapą: "Miłość" / "Kariera" / "Spokój"
   - Search bar zawsze widoczny: input "Sprawdź miasto..." + autocomplete z CITIES
   - Toggle "Pokaż wszystkie linie" (off domyślnie — bo overwhelming)

3. User klika intencję:
   - Filtr planet:
     • Miłość → Venus (wszystkie 4 typy) + Moon (ASC, DSC)
     • Kariera → Sun (MC, IC) + Jupiter (MC, ASC) + Mars (MC)
     • Spokój → Moon (IC) + Saturn (IC) + Neptune (ASC) [tak — Saturn IC = grounding]
   - Linie animują się in od miejsca urodzenia outward, 1.5s ease-out
   - Side panel (desktop) / bottom sheet (mobile) pokazuje top 3 miasta dla tej intencji
     → dla każdego miasta jedna linia tekstu: "{Miasto} — {Planeta} {type} • {distance}km"

4. User klika miasto z listy LUB wyszukuje:
   - Mapa zooma na miasto (smooth, 1s)
   - Wokół miasta rysuje się okrąg 700km orb (faded)
   - Wywołanie /functions/cosmo-map-city z miasto + active_lines
   - W panel pojawia się interpretacja (2-3 zdania) + lista aktywnych linii pod spodem
   - 2 przyciski: [Zapisz do ulubionych] [Udostępnij]

5. Toggle "Tryb porównania" → otwiera CompareMode component:
   - Picker profilu z biblioteki
   - Po wyborze drugiej osoby:
     • Jego linie też się obliczają (drugi call do cosmo-map-compute z profile_id)
     • Renderują się w innym kolorze (#c89968 accent gold)
     • Side panel pokazuje "Miasta dla was obojga" — intersection top intencji obu osób
     • Nowy share card type "Wasza wspólna mapa"

6. Toggle "Parans" (advanced, ukryte pod "Więcej"):
   - Rysuje horyzontalne pasy na szerokościach geograficznych z paranami
   - Hover/tap pasa → tooltip "{Planeta A} na {type} × {Planeta B} na {type}"
```

## MobileCityList.tsx — fallback na mobile

Drugie tab obok "Mapa" / "Lista":
- Precomputed top 20 miast posortowane po silności wpływu (min distance × planet weight)
- Każde miasto = card z planet emoji + theme line
- Tap → ten sam flow co klik na mapie (CityDetails)

## PaywallTeaser.tsx — dla free users

User bez premium wchodzi na `/app/map`:
- Mapa w grayscale, tylko jedna linia (Słońce MC) widoczna
- Overlay z blur na resztę
- Call-to-action card centered: "Odblokuj Cosmo Map — twoja osobista mapa mocy w 53 krajach. Premium 19,90 zł/mc" + przycisk "Wypróbuj 7 dni za darmo" → `/app/settings/subscription`

## Share cards (3 typy)

Rozszerz `shareCard.ts` (lub stwórz `mapShareCard.ts`):

### Typ 1: Pełna mapa (1080×1920)

```
y=80, top-left: Logo Cosmo Map (Cosmogram crescent + "Cosmo Map" 32px)
y=160 do y=200: tytuł "Moja Mapa Mocy" centered serif 48px
y=240 do y=1640: mapa świata SVG z aktywnymi liniami (skala 16:9 wycentrowana w tym pasie, czyli ~1080×608)
y=1680 do y=1800: 3 największe miasta z tekstem "{Miasto} • {planet emoji}"
y=1860, centered: "cosmogram.pl" 26px sans, biały 50% opacity
```

### Typ 2: Top 5 miast mocy (1080×1920)

```
y=80, logo
y=200, centered serif: "Moje 5 miast mocy"
y=320 do y=1700, lista 5 cards po 220px wysokości każdy:
  card layout:
    left 80px: planet emoji 80px
    center: linia 1 nazwa miasta serif 44px biały
            linia 2 "{Planeta} {type description PL}" sans 22px biały 70%
    right: distance "{N}km" sans 28px gold
y=1820, "cosmogram.pl"
```

### Typ 3: Anty-mapa (1080×1920)

```
y=80, logo
y=200, centered serif: "Miejsca które mogą cię wyzywać"
y=300, subtitle sans 22px gray "Linie Saturna i Plutona — intensywna transformacja"
y=400 do y=1700, lista 3 cards po 380px wysokości:
  każdy card:
    nazwa miasta serif 44px
    "{Planeta} {type}" sans 22px
    krótki opis 2 zdania sans 20px italic
y=1820, "cosmogram.pl"
```

Dla każdego typu — pozwól userowi wybrać w modalu który share asset.

## Tracking PostHog

```typescript
posthog.capture('cosmo_map_opened', { user_id, is_premium: boolean });
posthog.capture('cosmo_map_intention_selected', { intention: 'love' | 'career' | 'peace' });
posthog.capture('cosmo_map_city_searched', { city_slug, has_active_lines: boolean, lines_count: number });
posthog.capture('cosmo_map_city_viewed', { city_slug, active_planets: string[] });
posthog.capture('cosmo_map_compare_started', { compared_with_profile_id });
posthog.capture('cosmo_map_shared', { card_type: 'full_map' | 'top_5' | 'anti_map', city_slug?: string });
posthog.capture('cosmo_map_paywall_shown', {});
posthog.capture('cosmo_map_paywall_cta_clicked', {});
```

## Test akceptacyjny

1. Wygeneruj cosmo map dla znanej daty urodzenia (np. 1990-01-01 12:00 UTC, Warszawa) → manual check: MC longitude Słońca = (RA Słońca 1 stycznia ≈ 283°) - (GST 12:00 1 stycznia ≈ 282°) ≈ 1° E. Akceptuj jeśli ±2°.
2. Wyszukaj miasto "Lizbona" → mapa zooma → wyświetla się okrąg 700km → AI interpretacja pojawia się w panel w <3s pierwszy raz, <500ms drugi raz (cache).
3. Wybierz intencję "Miłość" → tylko linie Venus + Moon się renderują (sprawdź DOM ile path elementów: powinno być max 6 — Venus MC, Venus IC, Venus ASC, Venus DSC, Moon ASC, Moon DSC).
4. Toggle "Tryb porównania" → wybierz profil z Biblioteki → druga osoba ma linie w kolorze gold → side panel zmienia się na "Miasta dla was obojga".
5. Klik "Udostępnij" na widoku miasta → modal z 3 typami kart → wybierz "Top 5 miast" → preview wygląda zgodnie z spec → "Pobierz" → PNG zapisuje się na dysk → sprawdź wizualnie czy emoji renderują, tekst nie obcięty.
6. Mobile test (PWA installed, viewport 375×812):
   - Map.tsx pokazuje 2 taby na górze "Mapa" / "Lista"
   - Tab "Lista" pokazuje 20 cards z miastami
   - Tap na miasto → bottom sheet animuje up z interpretacją + active lines
   - Share → otwiera system share sheet z PNG
7. Free user wchodzi na `/app/map` → grayscale mapa + paywall overlay → klik CTA → leci na `/app/settings/subscription`.
8. PostHog → 8 eventów lecą z poprawnymi properties.
9. DB → po pierwszym wejściu na map dla danego user_id w `astrocartography_lines` jest rekord; po wyszukaniu Lizbony w `map_city_interpretations` jest rekord z (user_id, null profile_id, 'lizbona').
10. Refresh strony Map → nie ma drugiego call do cosmo-map-compute (load z DB cache).
11. Toggle "Parans" → renderują się horizontal bands na pasach z paranami → hover wyświetla tooltip z nazwami planet i typami.
12. Grep w kodzie: żaden komponent Map/* nie powinien zawierać literałów "/app/map" ani "Cosmo Map" poza `routes.ts` (per [[site-structure-and-routing]] zasada).

Jeśli któreś z 12 nie przechodzi → nie commituj, wróć z błędem.

## Po skończeniu

Dopisz do `docs/PROGRESS.md` co zaimplementowane + jaki feedback masz do specu. Specyficznie zgłoś:
- Czy edge function compute mieści się w Supabase free tier (CPU time) per request.
- Czy `react-simple-maps` plus 500-city dataset nie blow-upuje bundle size > 200KB.
- Czy interpretacje AI dają sensowne wyniki dla 5 losowych kombinacji (jedna planet + jeden line type) — wklej przykłady do PROGRESS.

## Następne iteracje (P1, NIE w tym promcie)

Wymieniam tylko żebyś nie zgubił:
- Geolocation API → "twoja obecna lokalizacja" overlay
- Auto-generowane SEO landing pages `/cosmogram-w-warszawie`, `/cosmogram-w-krakowie` etc.
- Pay-per-city report Stripe flow dla non-subscribers (14,90 zł one-off)
- Relocation chart — pełne przeliczenie kosmogramu jakby user urodził się w wybranym mieście
- Compare mode dla 3+ osób (mapa "twojej rodziny" lub "twojej drużyny")
