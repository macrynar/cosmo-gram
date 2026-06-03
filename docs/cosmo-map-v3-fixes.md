---
title: Cosmo Map V3 — targeted fixes (4 problemy)
created: 2026-05-25
project: cosmogram
type: claude-code-prompt
status: ready-to-paste
context: patch po review screenshotów V3 wdrożenia
---

# Cosmo Map V3 — 4 targeted fixes

> Wklej do Claude Code. To NIE rewrite — to 4 konkretne patche do istniejącego V3. Każdy fix ma jednoznaczny scope, kod do podmiany, weryfikację.

---

V3 jest strukturalnie OK ale ma 4 konkretne błędy widoczne po wdrożeniu. Napraw je w kolejności. Nie ruszaj reszty kodu.

## FIX 1 — Mapa nie renderuje tilów ani linii

**Symptom:** w trybie "Mapa" widoczny tylko mały szary fragment z konturami wysp polarnych, bez tilów map i bez planetarnych linii.

**Diagnoza** (sprawdź wszystkie 4):

1. **Brak `leaflet/dist/leaflet.css` import.** W `apps/web/src/main.tsx` (lub `app.tsx` — entry point) dodaj na górze:
   ```typescript
   import 'leaflet/dist/leaflet.css';
   ```
   Bez tego CSS Leaflet nie wie jak rozmieścić tiles.

2. **Container ma złe wymiary.** W `MapExplorer.tsx` MapContainer musi mieć explicit wysokość. Owiń:
   ```tsx
   <div style={{ width: '100%', height: '70vh', minHeight: '600px', position: 'relative' }}>
     <MapContainer 
       center={[birthLocation.lat, birthLocation.lon]} 
       zoom={2} 
       style={{ width: '100%', height: '100%' }}
       worldCopyJump={true}
       minZoom={2}
       maxZoom={10}
     >
       {/* ... */}
     </MapContainer>
   </div>
   ```

3. **Tile URL.** Użyj CartoDB Dark Matter (free, pasuje do brand):
   ```tsx
   <TileLayer
     attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
     url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
     subdomains="abcd"
     maxZoom={20}
   />
   ```

4. **Planet lines nie renderują się.** Add console.log na początku MapExplorer:
   ```tsx
   console.log('userLines:', userLines);
   console.log('planet lines count:', Object.keys(userLines?.planets ?? {}).length);
   ```
   Jeśli to undefined/0 — fetch z `astrocartography_lines` nie zadziałał lub format nie pasuje. Jeśli OK ale linie nie widać:
   - Sprawdź że `Polyline` jest importowane z `react-leaflet`
   - Sprawdź że pathOptions ma `color` z PLANET_COLORS (nie domyślny blue)
   - Sprawdź że `positions` to array `[[lat, lon], [lat, lon], ...]` (NIE `[{lat, lon}, ...]` — Leaflet potrzebuje touple)
   - Dla MC/IC pionowych linii: positions = `[[85, mc_lon], [-85, mc_lon]]`
   - Dla ASC/DSC krzywych: positions = `asc_curve.map(p => [p.lat, p.lon])`

**Po fixie**: w trybie Mapa user widzi pełną mapę świata z CartoDB dark tiles, 40 kolorowych linii planetarnych (10 planet × 4 typy), gold pin w birth location.

## FIX 2 — Random Unsplash photos (Madera = London, Sardynia = kamerzysta)

**Symptom:** Unsplash search po nazwie miasta zwraca przypadkowe zdjęcia popularne na Unsplash dla danego słowa — nie zdjęcia danego miasta.

**Fix: Wikipedia API zamiast Unsplash.** Wikipedia REST API zwraca infobox photo dla każdego miasta — to jest curated, iconic, recognizable zdjęcie miasta. Zero rate-limit dla read-only public API.

W `scripts/seed-curated-cities.ts`, replace photo fetch:

```typescript
async function fetchCityPhoto(city: { name_en: string; country_code: string }): Promise<string | null> {
  // 1. Spróbuj angielską wikipedię (zwykle najbogatsze infoboxy)
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city.name_en)}`,
      { headers: { 'User-Agent': 'Cosmogram/1.0 (https://cosmogram.pl)' } }
    );
    if (res.ok) {
      const data = await res.json();
      // originalimage daje większą wersję, thumbnail mniejszą — wybierz original jeśli ≤2000px
      const photo = data.originalimage?.source ?? data.thumbnail?.source;
      if (photo && !photo.includes('Flag_of_')) {  // skip flagi
        return photo;
      }
    }
  } catch (e) {
    console.warn(`Wikipedia fetch failed for ${city.name_en}:`, e);
  }
  
  // 2. Fallback: polska wikipedia (dla polskich miast lepsze)
  try {
    const res = await fetch(
      `https://pl.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city.name_pl)}`
    );
    if (res.ok) {
      const data = await res.json();
      const photo = data.originalimage?.source ?? data.thumbnail?.source;
      if (photo && !photo.includes('Flag_of_')) return photo;
    }
  } catch (e) { /* ignore */ }
  
  return null; // placeholder w UI zamiast random Unsplash
}
```

Re-run `scripts/seed-curated-cities.ts` dla wszystkich miast. Wyniki zapisz do `apps/web/src/data/cities.json`.

**Manual override dla seed 80 anchor cities.** Dla tych 80 ręcznie zwerifikuj photo URL po seed run. Jeśli któreś jest złe → manualnie ustaw URL z Wikipedia Commons (search "Santorini Oia" na commons.wikimedia.org → copy URL pliku). Te 80 to face-of-product, muszą być doskonałe.

**Placeholder kiedy photo_url = null.** W `PlaceCard.tsx`:
```tsx
{city.photo_url ? (
  <img src={city.photo_url} alt={city.name_pl} className="w-full h-40 object-cover" />
) : (
  <div className="w-full h-40 bg-gradient-to-br from-indigo-900 to-indigo-700 flex items-center justify-center">
    <span className="text-6xl opacity-30">{getCityInitial(city)}</span>
  </div>
)}
```

Brand-spójny placeholder zamiast random photo.

## FIX 3 — Orb za szeroki, Sopot 988km od Jowisza IC pokazuje się jako rekomendacja

**Symptom:** Sopot jako rekomendacja dla "Spokój" z badge "Jowisz IC 988 km". 988km to praktycznie "linia gdzieś w okolicy", nie aktywacja.

**Fix: hard threshold 700km + secondary 1200km z disclaimer.**

W `apps/web/src/lib/astrocartography.ts` lub gdzie jest `rankCitiesForIntention`:

```typescript
const STRONG_ORB_KM = 700;
const WEAK_ORB_KM = 1200;
const MIN_RESULTS = 6;

export function rankCitiesForIntention(
  cities: CuratedCity[],
  userLines: Astrocartography,
  intention: Intention,
  continent: string,
  userResidence: { lat: number; lon: number } | null
): { strong: RankedPlace[]; weak: RankedPlace[] } {
  let filtered = cities.filter(c => c.intention_matches.includes(intention.id));
  if (continent !== 'all') filtered = filtered.filter(c => c.continent === continent);
  
  const scored = filtered.map(city => {
    const activeLines = activeLinesForCity(city, userLines, WEAK_ORB_KM);
    const intentionPlanetTypes = intention.primary_lines.map(l => `${l.planet}-${l.type}`);
    const matching = activeLines.filter(l => intentionPlanetTypes.includes(`${l.planet}-${l.type}`));
    
    if (matching.length === 0) return null;
    
    const strongest = matching.sort((a, b) => a.distance_km - b.distance_km)[0];
    
    const planetWeight = intention.primary_lines.find(
      p => p.planet === strongest.planet && p.type === strongest.type
    )?.weight ?? 0;
    
    const lineScore = planetWeight * Math.max(0, (WEAK_ORB_KM - strongest.distance_km) / WEAK_ORB_KM);
    const culturalScore = city.travel_relevance / 5;
    
    return {
      city,
      score: lineScore * 0.7 + culturalScore * 0.3,
      strongest_line: strongest,
    };
  }).filter(Boolean) as RankedPlace[];
  
  scored.sort((a, b) => b.score - a.score);
  
  const strong = scored.filter(p => p.strongest_line.distance_km <= STRONG_ORB_KM);
  
  // Jeśli za mało strong → dodaj weak ale z disclaimer
  if (strong.length >= MIN_RESULTS) {
    return { strong: strong.slice(0, 24), weak: [] };
  }
  
  const weak = scored
    .filter(p => p.strongest_line.distance_km > STRONG_ORB_KM && p.strongest_line.distance_km <= WEAK_ORB_KM)
    .slice(0, MIN_RESULTS - strong.length);
  
  return { strong, weak };
}
```

W `PlacesView.tsx`:
```tsx
const { strong, weak } = rankCitiesForIntention(...);

return (
  <>
    <Grid cities={strong} />
    
    {weak.length > 0 && (
      <>
        <div className="mt-12 px-2 text-sm text-zinc-500 italic">
          Delikatniejszy rezonans — linie planetarne dla tej intencji są w twoim chartzie rozproszone. 
          Te miejsca działają subtelniej, ale wciąż na tej energii.
        </div>
        <Grid cities={weak} className="opacity-75" />
      </>
    )}
    
    {strong.length === 0 && weak.length === 0 && (
      <EmptyState 
        message={`Dla intencji "${intention.label}" twoja energia jest rozproszona globalnie. Spróbuj innej intencji żeby zobaczyć silniejsze rezonanse.`} 
      />
    )}
  </>
);
```

Sopot z Jowiszem IC 988km nie wpadnie do `strong` (przekracza 700km). Wpadnie do `weak` jeśli żadne lepsze nie znajdą się — i wtedy ma disclaimer.

## FIX 4 — AI używa "IC", "Imum Coeli" mimo zakazu

**Symptom:** Sekcja "DLACZEGO DLA CIEBIE" zawiera "linii Jowisza IC (Imum Coeli)". Skrót + łacina, dokładnie to czego nie chcemy.

**Fix: rozszerzona ban list + post-generation regex check + few-shot przykład.**

W `supabase/functions/cosmo-map-narrative/index.ts`, zmodyfikuj system prompt:

```typescript
const systemPrompt = `Jesteś ekspertem astrokartografii o głębokiej wiedzy kulturowej. Twoim zadaniem jest napisać głęboką, evocative interpretację konkretnego miejsca dla konkretnej osoby w kontekście wybranej intencji życiowej.

KRYTYCZNE ZASADY:

1. ŻARGON ASTROLOGICZNY — ABSOLUTNY ZAKAZ używania:
   - Skrótów: IC, MC, AC, DC, ASC, DSC
   - Łacińskich nazw: Imum Coeli, Medium Coeli, Ascendens, Descendens
   - Technicznych terminów: orb, dyspozytor, retrograde, retrogradacja, aspekt, kwadratura, trygon, sekstyl, koniunkcja, opozycja
   - Numerów domów w sensie technicznym: "Twój 4. dom" → źle. Można "twój wewnętrzny dom emocjonalny" → ok.

   Zamiast tych skrótów używaj:
   - IC → "fundament domu wewnętrznego" / "punkt zakorzenienia" / "głębia, korzenie"
   - MC → "szczyt twojej widoczności" / "punkt zawodowy" / "miejsce gdzie cię widzą"
   - AC → "wschód twojej energii" / "to jak emanujesz" / "twoja pierwsza warstwa"
   - DC → "zachód twojej energii" / "to co przyciągasz" / "twoi partnerzy"

2. NIE WYMYŚLAJ konkretnych wydarzeń, festiwali, lokalnych nazw dzielnic ani szczegółów których nie jesteś PEWIEN. Trzymaj się szeroko-znanych faktów o mieście (te które są w cultural_blurb).

3. ZAWSZE odnoś się do KONKRETNEJ planety + linii + natywnego umiejscowienia tej planety w karcie usera (znak + dom). To core wartość. Ale używaj zwykłego języka, nie skrótów.

4. ZAKAZ slash-form: "oddałeś/aś", "twój/twoja". Używaj formy: ${grammatical_form}.

5. Język: polski. Ton: ${intention.tone}.

PRZYKŁAD POPRAWNEGO TEKSTU (dla Santorini, intencja Spokój, user z Księżycem w Raku):
"Twoja linia Księżyca przechodzi blisko Santorini i tu działa w funkcji domu wewnętrznego — punktu, w którym wracasz do siebie pod warstwami codzienności. Twój natywny Księżyc w Raku już z natury szuka miejsc z wodą i ciszą, a Santorini te elementy daje spotęgowane: morze cię otula, biały kamień absorbuje hałas, codzienny sunset rytuał przypomina, że dzień ma swój koniec."

PRZYKŁAD ZŁEGO TEKSTU (czego unikać):
"W tym mieście doświadczysz działania twojej linii Księżyca IC (Imum Coeli) na 4. domu w aspekcie trygonu do natywnego Księżyca." — TO JEST ZAKAZANE.

OUTPUT JSON:
{
  "card_teaser": "<≤8 słów>",
  "why_place": "<2-3 zdania>",
  "why_for_you": "<4-6 zdań bez skrótów astrologicznych>",
  "what_youll_feel": "<3-4 zdania>",
  "similar_slugs": ["slug1", "slug2", "slug3"]
}`;
```

**Post-generation guardrail** w `cosmo-map-narrative/index.ts`:

```typescript
const BANNED_TERMS = [
  /\bIC\b/, /\bMC\b/, /\bAC\b/, /\bDC\b/, /\bASC\b/, /\bDSC\b/,
  /Imum Coeli/i, /Medium Coeli/i, /Ascendens/i, /Descendens/i,
  /\borb\b/i, /dyspozytor/i, /retrogradacj/i, /\baspekt\b/i, /kwadratura/i,
  /\btrygon\b/i, /\bsekstyl\b/i, /koniunkcja/i, /\bopozycja\b/i,
];

function validateNarrative(narrative: any): { valid: boolean; violations: string[] } {
  const allText = [
    narrative.why_place,
    narrative.why_for_you,
    narrative.what_youll_feel,
    narrative.card_teaser,
  ].join(' ');
  
  const violations = BANNED_TERMS
    .filter(rx => rx.test(allText))
    .map(rx => rx.source);
  
  return { valid: violations.length === 0, violations };
}

// W handle:
let attempts = 0;
let narrative;
while (attempts < 2) {
  narrative = await callClaude(systemPrompt, userPrompt);
  const validation = validateNarrative(narrative);
  if (validation.valid) break;
  
  // Retry z explicit feedback
  userPrompt += `\n\nPOPRZEDNIA PRÓBA ZAWIERAŁA ZAKAZANE TERMY: ${validation.violations.join(', ')}. Wygeneruj BEZ tych terminów, używając opisowego języka.`;
  attempts++;
}

if (!validateNarrative(narrative).valid) {
  // Last resort: strip banned terms server-side
  narrative.why_for_you = narrative.why_for_you
    .replace(/\b(IC|MC|AC|DC|ASC|DSC)\b/g, '')
    .replace(/\((Imum|Medium) (Coeli|Heaven)\)/gi, '')
    .replace(/\s+/g, ' ');
}
```

To gwarantuje że nawet jeśli AI się zbuntuje, banned term nie dojdzie do usera.

**Invalidate cache** dla istniejących `map_place_narratives` które mogą zawierać żargon:

```sql
-- One-shot cleanup:
DELETE FROM map_place_narratives 
WHERE narrative::text ~ '\m(IC|MC|AC|DC|ASC|DSC|Imum Coeli|Medium Coeli|Ascendens|Descendens)\M';
```

Te zostaną przegenerowane przy następnej wizycie usera w danym mieście.

## Test akceptacyjny (12 punktów)

1. **Mapa się ładuje:** klik "Mapa" → widać pełną mapę świata w dark theme (CartoDB), zajmuje min 70vh wysokości.
2. **40 linii widoczne:** 10 planet × 4 typy linii. Kolorowane wg PLANET_COLORS. MC/IC solid, ASC/DSC dashed.
3. **Birth marker:** gold pin w birth_city użytkownika.
4. **Klik linii działa:** klik dowolnej linii → sidebar pokazuje generic interpretation tej linii.
5. **Photos:** każdy kafel ma zdjęcie miasta (nie flagę i nie random). Sopot pokazuje sopockie molo lub plażę, Madera pokazuje wybrzeże Madery, Sardynia pokazuje sardyńskie wybrzeże.
6. **Placeholder kiedy brak photo:** brand gradient z inicjałem miasta, nie biały box.
7. **Orb threshold:** w trybie Lista dla "Spokój" Sopot z Jowisz IC 988km NIE pojawia się w głównej siatce. Jeśli pojawia się — to w sekcji "Delikatniejszy rezonans" z disclaimer i opacity 75%.
8. **Empty state:** jeśli żaden city nie ma silnej aktywacji (mało prawdopodobne ale możliwe) → komunikat "Twoja energia dla X jest rozproszona globalnie..."
9. **AI bez żargonu:** klik Sopot → detail view → sekcja "DLACZEGO DLA CIEBIE" NIE zawiera "IC", "MC", "Imum Coeli", "dyspozytor", "retrograde", "kwadratura", "trygon". Grep w response JSON sprawdzi.
10. **Post-generation guardrail aktywny:** if AI zwróci tekst z banned term, regenerate up to 2x, potem server-side strip. Zaloguj do PostHog event `narrative_banned_term_caught` z violations array.
11. **Cache invalidation:** po deploycie uruchom one-shot DELETE FROM map_place_narratives WHERE ... — nowo wygenerowane będą poprawne.
12. **Hometown anchor:** sprawdź że tekst "Tu w tobie pracuje:" w ramach HometownAnchor też przeszedł through same banned terms check (używa tych samych templates).

Jeśli 12 nie przechodzi → wróć z błędem.

## Po skończeniu

Wklej do `docs/PROGRESS.md`:
- Screenshot Mapa view (powinno być widoczne wszystko, nie tylko Grenlandia)
- Screenshot Lista view z dobrymi photos
- Screenshot detail view dla Sopota — sprawdź czy tekst NIE zawiera "IC"
- Liczba narracji invalidowanych przez SQL cleanup
- Liczba post-gen retry'ów w pierwszej godzinie po deploy (z PostHog)
