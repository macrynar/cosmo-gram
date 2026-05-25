---
title: Cosmo Map V2 — redesign po feedback'u z V1
created: 2026-05-24
project: cosmogram
type: claude-code-prompt
status: ready-to-paste
supersedes_in_parts: cosmo-map-prompt.md
---

# Cosmo Map V2 — patch po feedback z V1

> Wklej do Claude Code. To NIE jest budowa od zera — to refactor istniejącego Cosmo Map. Cel: zamiana abstrakcyjnej "mapy mocy" w narzędzie pod konkretne decyzje podróżne.

---

Przeczytaj `docs/cosmo-map-prompt.md` (V1, aktualnie wdrożone) i kod w `apps/web/src/pages/Map.tsx` + `apps/web/src/components/Map/*`. To co masz teraz działa technicznie, ale produktowo nie odpala wartości — lista miast jest generyczna, użytkownik z Polski dostaje Los Angeles, intencje są abstrakcyjne.

V2 zmienia: scenariusze zamiast intencji, hand-written templates zamiast generycznych opisów, hometown anchor, default Europa, detail view z actionable layer.

## Co zmieniamy (skrót)

1. **3 intencje → 7 scenariuszy podróżnych** (Wakacje regeneracyjne, Romantyczny wyjazd, Retreat, Sabbatical, Coś szalonego, Inspiracja kreatywna, Networking).
2. **Default kontynent: Europa** (zostaje selektor kontynentów jaki jest — tylko zmiana defaultu z Globalnie na Europa).
3. **40 hand-written templates** dla każdej kombinacji (planeta × typ linii) → koniec "idealne miejsce na dom i rodzinę..." powtarzanego 8x.
4. **Hometown Anchor** — sekcja nad listą miast: "Twoje obecne miasto: Warszawa. Tu masz aktywne: Saturn MC, Neptun DSC, Księżyc IC".
5. **Mapping planet→scenariusz poprawiony** — wyrzucam Saturn ze "Spokoju" (był błąd w V1, Saturn = dyscyplina nie spokój).
6. **Detail view rozszerzony**: optymalny czas pobytu, co tu robić, kiedy NIE jechać (bad windows), realistyczna logistyka.
7. **Algorytm dla "Globalnie"**: top 5 per kontynent zamiast czystego sortowania po dystansie (żeby user widział wariację, nie 8 miast z USA).

## Co NIE zmieniamy

- Selektor kontynentów jaki jest (Globalnie / Europa / Azja / Bliski Wschód / Afryka / Ameryka Płn / Ameryka Płd / Oceania) — tylko default na Europa.
- Cała backend matematyka linii i parans (V1 jest poprawna).
- Brand "Cosmo Map", route `/app/map`, file Map.tsx.
- Share cards z V1 (3 typy) — działają.
- Compare mode (z Cosmo Match).
- Paywall logic.

## Pliki do utworzenia

```
apps/web/src/lib/lineDescriptions.ts          # 40 hand-written templates (planeta × linia)
apps/web/src/lib/travelScenarios.ts           # 7 scenariuszy z mapping planet
apps/web/src/components/Map/HometownAnchor.tsx
apps/web/src/components/Map/ScenarioPicker.tsx  # zastępuje IntentionPicker
```

## Pliki do modyfikacji

- `apps/web/src/pages/Map.tsx` — default continent='europe', wymiana IntentionPicker na ScenarioPicker, dodanie HometownAnchor nad city list
- `apps/web/src/components/Map/MobileCityList.tsx` — używa `lineDescriptions` zamiast generycznych opisów
- `apps/web/src/components/Map/CityDetails.tsx` — dodaj sekcje: optimal_duration, what_to_do, bad_windows, logistics
- `apps/web/src/components/Map/IntentionPicker.tsx` — DELETE (zastępuje ScenarioPicker)
- `apps/web/src/lib/astrocartography.ts` — funkcja `rankCitiesForContinent` z logiką "top 5 per continent" dla Globalnie
- `apps/web/src/lib/cityDatabase.ts` — dodaj pola `flight_hours_from_waw: number`, `price_tier: 'low' | 'mid' | 'high'`, `continent: string`
- `supabase/functions/cosmo-map-city/index.ts` — extend prompt: zwracaj structured JSON z 5 sekcjami zamiast plain markdown

## lineDescriptions.ts — krytyczne, 40 templates

Wszystkie po polsku, 15-25 słów, evocative, specific do kombinacji planety i linii. Każdy template ma 2 wersje: short (do listy miast, ~10 słów) i full (do badge w detail view, ~25 słów).

```typescript
// apps/web/src/lib/lineDescriptions.ts

type Planet = 'Sun' | 'Moon' | 'Mercury' | 'Venus' | 'Mars' | 'Jupiter' | 'Saturn' | 'Uranus' | 'Neptune' | 'Pluto';
type LineType = 'MC' | 'IC' | 'ASC' | 'DSC';

type LineDescription = {
  short: string;  // dla listy miast
  full: string;   // dla detail view i hometown anchor
};

export const LINE_DESCRIPTIONS: Record<Planet, Record<LineType, LineDescription>> = {
  Sun: {
    MC: { short: 'Tu cię widzą i błyszczysz', full: 'Słońce na szczycie nieba. Tu cię widzą, tu twoje imię nabiera ciężaru, twarz pojawia się w odpowiednich miejscach.' },
    IC: { short: 'Powrót do siebie bez maski', full: 'Słońce u korzeni. Miejsce uziemienia tożsamości — wracasz do tego kim jesteś bez warstw, jakie nakłada świat.' },
    ASC: { short: 'Pewność siebie, witalność rośnie', full: 'Słońce wschodzi z tobą. Emanujesz autorytetem, ludzie cię zauważają, ciało odzyskuje energię.' },
    DSC: { short: 'Partnerstwa, które zmieniają kurs', full: 'Słońce zachodzi w drugich. Spotykasz osoby które cię definiują — relacje tu nawiązane mają wagę życiowych zwrotów.' },
  },
  Moon: {
    MC: { short: 'Emocje stają się walutą', full: 'Księżyc w blasku publicznym. Dobre miejsce dla opieki, twórczości, kontaktu z ludźmi — empatia tu pracuje na ciebie.' },
    IC: { short: 'Pierwotny dom emocjonalny', full: 'Księżyc u dna nieba. Czas zwalnia, sen głębszy, sentyment wraca. Miasto które potrafi przytulić.' },
    ASC: { short: 'Wrażliwość i intuicja prowadzą', full: 'Księżyc wschodzi z tobą. Jesteś przezroczysty emocjonalnie — intuicja staje się ostra, ciało reaguje na nastroje miejsca.' },
    DSC: { short: 'Przyciągasz opiekuńcze figury', full: 'Księżyc zachodzi w innych. Trafiają się matkujące osoby, romantyczne projekcje, intensywne więzi emocjonalne.' },
  },
  Mercury: {
    MC: { short: 'Twoje słowa są słyszane', full: 'Merkury na szczycie. Miejsce na publikacje, wystąpienia, intelektualną widoczność — to co napiszesz, ma szansę zaiskrzyć.' },
    IC: { short: 'Cichy dom dla myśli', full: 'Merkury u korzeni. Dobre miejsce na pisanie, naukę, wewnętrzny dialog — umysł znajduje tu rytm pracy.' },
    ASC: { short: 'Bystrość, szybkie kontakty', full: 'Merkury wschodzi. Jesteś werbalny, ciekawy, ludzie chcą z tobą rozmawiać — lokalne sieci same się tworzą.' },
    DSC: { short: 'Spotykasz mentorów i rozmówców', full: 'Merkury w partnerstwach. Trafiasz na osoby które zmieniają twój sposób myślenia — biznesowi partnerzy, intelektualne romansy.' },
  },
  Venus: {
    MC: { short: 'Tu jesteś piękny dla świata', full: 'Wenus na szczycie. Miejsce dla sztuki, mody, publicznej miłości — twoja estetyka znajduje publiczność.' },
    IC: { short: 'Dom pełen harmonii i komfortu', full: 'Wenus u korzeni. Codzienne życie staje się piękne — dobra kuchnia, ładne przestrzenie, ciepło wśród bliskich.' },
    ASC: { short: 'Promieniujesz urokiem', full: 'Wenus wschodzi. Ludzie cię lubią od pierwszego spojrzenia, ciało odzyskuje dobrostan, atrakcyjność rośnie.' },
    DSC: { short: 'Miłość przychodzi do ciebie', full: 'Wenus w partnerstwach. Romanse same trafiają, ktoś otwiera dla ciebie serce — niska bariera wejścia w relacje.' },
  },
  Mars: {
    MC: { short: 'Walczysz publicznie i wygrywasz', full: 'Mars na szczycie. Miejsce dla przedsiębiorczości, sportu, konkurencji — agresja konwertuje się w wyniki.' },
    IC: { short: 'Niepokój w domu, ostre życie seksualne', full: 'Mars u korzeni. Może być silna pasja w sypialni, ale też konflikty rodzinne — trudniej tu po prostu odpocząć.' },
    ASC: { short: 'Energia, siła, adrenalina', full: 'Mars wschodzi. Miejsce dla treningu, sportu, fizycznych wyzwań — ciało chce działać, nie regenerować.' },
    DSC: { short: 'Spotykasz wojowników i konfrontacje', full: 'Mars w partnerstwach. Spotkasz pasjonatów ale też osoby z ostrymi krawędziami — relacje intensywne, czasem walka.' },
  },
  Jupiter: {
    MC: { short: 'Sukces większy niż się spodziewasz', full: 'Jowisz na szczycie. Ekspansja kariery, dobra prasa, ważne kontakty mentoringowe — okno na duży zawodowy ruch.' },
    IC: { short: 'Hojny dom, optymizm w przestrzeni', full: 'Jowisz u korzeni. Miejsce gdzie chce się gości, gdzie jest oddech, gdzie wszystko wydaje się możliwe.' },
    ASC: { short: 'Drzwi same się otwierają', full: 'Jowisz wschodzi. Optymizm cię otwiera, szczęście podąża, ludzie odpowiadają ci dobrocią — chwilowo łatwiej niż w domu.' },
    DSC: { short: 'Spotykasz nauczycieli i zagraniczne kontakty', full: 'Jowisz w partnerstwach. Ludzie którzy poszerzają twój świat — cudzoziemcy, akademicy, mentorzy, duchowi przewodnicy.' },
  },
  Saturn: {
    MC: { short: 'Mistrzostwo zawodowe przez ciężką pracę', full: 'Saturn na szczycie. To nie awans, to budowanie — miejsce dla długoterminowej kariery, autorytetu, lasting achievement.' },
    IC: { short: 'Ciężki dom, samotnie ale głęboko', full: 'Saturn u korzeni. Możesz być samotny, ale fundament który tu zbudujesz wytrzyma dekady — miejsce dla introspekcji i pracy nad sobą.' },
    ASC: { short: 'Poważnie odbierany, autorytet', full: 'Saturn wschodzi. Wyglądasz dojrzalej niż jesteś, ludzie traktują cię z respektem, ale ciężko o spontaniczność.' },
    DSC: { short: 'Starsi, poważni partnerzy', full: 'Saturn w partnerstwach. Trafiasz na trwałe ale wymagające relacje — przewaga wieku, doświadczenia, czasem chłodu.' },
  },
  Uranus: {
    MC: { short: 'Niespodziewane breakthrough zawodowe', full: 'Uran na szczycie. Innowacja, technologia, bycie pierwszym — kariera tu może wystrzelić nieoczekiwaną ścieżką.' },
    IC: { short: 'Niespokojny dom, częste zmiany', full: 'Uran u korzeni. Częste przeprowadzki, nietypowi współlokatorzy, brak stabilności — nie dla osoby szukającej zakorzenienia.' },
    ASC: { short: 'Oryginalność jako magnes', full: 'Uran wschodzi. Przyciągasz uwagę przez bycie innym — outsiderzy znajdują się nawzajem.' },
    DSC: { short: 'Nieprzewidywalni partnerzy, wolność', full: 'Uran w partnerstwach. Niezwykłe układy, ludzie spoza twojej bańki, relacje na własnych zasadach.' },
  },
  Neptune: {
    MC: { short: 'Marzenia stają się karierą', full: 'Neptun na szczycie. Sztuka, film, muzyka, duchowość jako zawód — miejsce dla osób żyjących z wyobraźni.' },
    IC: { short: 'Mglisty marzycielski dom', full: 'Neptun u korzeni. Dobre miejsce na sen, modlitwę, twórczość — ale uważaj na zatrzymanie czasu, eskapizm, addykcje.' },
    ASC: { short: 'Stajesz się nieuchwytny', full: 'Neptun wschodzi. Ludzie cię projektują, romantyzują, czasem mistyfikują — twoja tożsamość rozmywa się w obrazach które o tobie tworzą.' },
    DSC: { short: 'Dusze pokrewne ale też iluzje', full: 'Neptun w partnerstwach. Spotykasz osoby które wydają się magiczne — uważaj kogo idealizujesz, sprawdzaj fakty.' },
  },
  Pluto: {
    MC: { short: 'Władza ale przez transformację', full: 'Pluton na szczycie. Wpływ i siła zawodowa — ale za cenę intensywnych zmian wizerunku, czasem skandali.' },
    IC: { short: 'Głęboka transformacja domu', full: 'Pluton u korzeni. Może być terapeutyczne, może być wyrywające z fundamentów — nie jedziesz tu na lekko.' },
    ASC: { short: 'Intensywność, ludzie czują twoją siłę', full: 'Pluton wschodzi. Jesteś magnetyczny — niektórzy się boją, inni są zauroczeni, nikt nie zostaje obojętny.' },
    DSC: { short: 'Spotykasz osoby które cię odmienią', full: 'Pluton w partnerstwach. Relacje głębokie, czasem niszczące, zawsze przekształcające — nic z tym co tu spotkasz nie zostanie powierzchowne.' },
  },
};

export function getLineDescription(planet: Planet, lineType: LineType): LineDescription {
  return LINE_DESCRIPTIONS[planet][lineType];
}
```

## travelScenarios.ts — 7 scenariuszy

```typescript
// apps/web/src/lib/travelScenarios.ts

type Scenario = {
  id: string;
  emoji: string;
  label: string;          // PL
  subtitle: string;       // PL, 1-liner
  primary_lines: Array<{ planet: Planet; type: LineType; weight: number }>;
  default_duration_days: { min: number; max: number };
  tone: 'spokojny' | 'zmysłowy' | 'transformacyjny' | 'ambitny' | 'energetyczny' | 'poetycki' | 'profesjonalny';
};

export const SCENARIOS: Scenario[] = [
  {
    id: 'regen',
    emoji: '🏖️',
    label: 'Wakacje regeneracyjne',
    subtitle: 'Odpocząć, naładować, zwolnić',
    primary_lines: [
      { planet: 'Moon', type: 'IC', weight: 1.0 },
      { planet: 'Venus', type: 'IC', weight: 0.9 },
      { planet: 'Neptune', type: 'IC', weight: 0.8 },
      { planet: 'Jupiter', type: 'IC', weight: 0.7 },
    ],
    default_duration_days: { min: 7, max: 14 },
    tone: 'spokojny',
  },
  {
    id: 'romance',
    emoji: '💑',
    label: 'Romantyczny wyjazd',
    subtitle: 'Z partnerem albo żeby kogoś poznać',
    primary_lines: [
      { planet: 'Venus', type: 'DSC', weight: 1.0 },
      { planet: 'Venus', type: 'ASC', weight: 0.9 },
      { planet: 'Moon', type: 'DSC', weight: 0.8 },
      { planet: 'Mars', type: 'DSC', weight: 0.7 },
    ],
    default_duration_days: { min: 3, max: 5 },
    tone: 'zmysłowy',
  },
  {
    id: 'retreat',
    emoji: '🧘',
    label: 'Retreat / praca nad sobą',
    subtitle: 'Wyjść z trybu codzienności, pójść głębiej',
    primary_lines: [
      { planet: 'Neptune', type: 'ASC', weight: 1.0 },
      { planet: 'Pluto', type: 'IC', weight: 0.9 },
      { planet: 'Saturn', type: 'IC', weight: 0.8 },
      { planet: 'Moon', type: 'ASC', weight: 0.7 },
    ],
    default_duration_days: { min: 7, max: 14 },
    tone: 'transformacyjny',
  },
  {
    id: 'sabbatical',
    emoji: '🚀',
    label: 'Sabbatical / praca zdalna 1-3 mc',
    subtitle: 'Dłuższy wyjazd z laptopem',
    primary_lines: [
      { planet: 'Sun', type: 'MC', weight: 1.0 },
      { planet: 'Jupiter', type: 'MC', weight: 0.9 },
      { planet: 'Mercury', type: 'MC', weight: 0.8 },
      { planet: 'Jupiter', type: 'ASC', weight: 0.7 },
    ],
    default_duration_days: { min: 30, max: 90 },
    tone: 'ambitny',
  },
  {
    id: 'breakout',
    emoji: '⚡',
    label: 'Coś szalonego',
    subtitle: 'Przełamać rutynę, dostać kopa',
    primary_lines: [
      { planet: 'Uranus', type: 'ASC', weight: 1.0 },
      { planet: 'Mars', type: 'ASC', weight: 0.9 },
      { planet: 'Jupiter', type: 'ASC', weight: 0.8 },
      { planet: 'Sun', type: 'ASC', weight: 0.7 },
    ],
    default_duration_days: { min: 5, max: 10 },
    tone: 'energetyczny',
  },
  {
    id: 'creative',
    emoji: '🎨',
    label: 'Inspiracja kreatywna',
    subtitle: 'Odblokować twórczość, znaleźć nowy język',
    primary_lines: [
      { planet: 'Neptune', type: 'MC', weight: 1.0 },
      { planet: 'Venus', type: 'MC', weight: 0.9 },
      { planet: 'Moon', type: 'ASC', weight: 0.8 },
      { planet: 'Mercury', type: 'ASC', weight: 0.7 },
    ],
    default_duration_days: { min: 7, max: 14 },
    tone: 'poetycki',
  },
  {
    id: 'networking',
    emoji: '🏛️',
    label: 'Networking / konferencja',
    subtitle: 'Krótki wyjazd zawodowy z efektem',
    primary_lines: [
      { planet: 'Jupiter', type: 'MC', weight: 1.0 },
      { planet: 'Sun', type: 'MC', weight: 0.9 },
      { planet: 'Mercury', type: 'MC', weight: 0.8 },
      { planet: 'Mercury', type: 'DSC', weight: 0.7 },
    ],
    default_duration_days: { min: 2, max: 7 },
    tone: 'profesjonalny',
  },
];
```

## ScenarioPicker.tsx — zastępuje IntentionPicker

UI: zamiast 3 dużych kafli (Miłość/Kariera/Spokój), siatka 7 mniejszych kart 2×4 (desktop) / 1×7 scroll (mobile). Każda karta:

```
[emoji 36px]
Wakacje regeneracyjne
Odpocząć, naładować, zwolnić
```

Aktywna karta podświetlona accent gold (#c89968), tak jak obecnie zaznaczona "Spokój" w screenshocie. Ustawienie scenariusza → triggeruje filter linii (tylko `primary_lines` aktywnego scenariusza są rysowane na mapie) + filter listy miast.

## HometownAnchor.tsx — nowa sekcja nad listą miast

```tsx
type Props = {
  userName: string;
  hometownName: string;
  hometownCoords: { lat: number; lon: number };
  activeLines: ActiveLine[];  // linie aktywne w hometown (uses activeLinesForCity z V1)
};

export function HometownAnchor({ userName, hometownName, hometownCoords, activeLines }: Props) {
  const top3 = activeLines.slice(0, 3); // sorted by distance ascending
  
  return (
    <div className="border border-zinc-700 rounded-lg p-5 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon name="map-pin" />
        <span className="text-sm text-zinc-400">
          Twoje miasto: <span className="text-white font-medium">{hometownName}</span>
        </span>
      </div>
      
      {top3.length === 0 ? (
        <div className="text-sm text-zinc-500">
          W promieniu 700km nie ma silnych linii — to neutralny grunt, idealny do bycia po prostu sobą.
        </div>
      ) : (
        <>
          <div className="text-sm text-zinc-300 mb-3">Tu w tobie pracuje:</div>
          <div className="space-y-2">
            {top3.map(line => (
              <div key={`${line.planet}-${line.type}`} className="flex items-start gap-3">
                <span className="text-lg mt-0.5">{getPlanetGlyph(line.planet)}</span>
                <div className="flex-1">
                  <div className="text-sm text-white">
                    <span className="font-medium">{getPlanetPL(line.planet)} {line.type}</span>
                    <span className="text-zinc-500 ml-2">{line.distance_km}km</span>
                  </div>
                  <div className="text-sm text-zinc-400">
                    {getLineDescription(line.planet, line.type).short}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-xs text-zinc-500 mt-4 italic">
            Sprawdź gdzie inaczej działają twoje planety →
          </div>
        </>
      )}
    </div>
  );
}
```

Renderuj jako pierwszy element side panelu (desktop) / pierwszego ekranu listy (mobile), PRZED listą "Najlepsze miasta · {scenariusz}".

Hometown name: pobierz z `user.birth_city` lub `user.current_city` jeśli różne. Jeśli user ma "current_city" w settings — użyj tego (gdzie aktualnie mieszka, nie urodził się). Jeśli nie ma — fallback do birth_city.

## CityDetails.tsx — rozszerzony detail view

Aktualny detail (LA w screenshocie) ma świetną prozę interpretacyjną. Zostaw ją. **Dodaj pod nią 4 nowe sekcje:**

```
┌─────────────────────────────────────────────────────────┐
│ [emoji] Los Angeles, USA                            [×] │
│ Księżyc IC (75km) · Wenus IC (331km)                    │
│                                                          │
│ IC — dno nieba — dom i korzenie                          │
│                                                          │
│ Los Angeles wciąga cię w swój rytm stopniowo —          │
│ najpierw światło, które tu pada inaczej...              │
│ [...aktualna proza interpretacyjna z V1...]              │
│                                                          │
├─────────────────────────────────────────────────────────┤
│ ⏱  Optymalny czas pobytu                                 │
│ 7-14 dni. Linia Księżyca działa najsilniej po 5 dniu     │
│ — krócej i nie zdążysz przełączyć rytmu.                 │
├─────────────────────────────────────────────────────────┤
│ 🎯 Co tu robić                                           │
│ Pacyfik o świcie, joga w Topanga, cisza nad Mulholland.  │
│ Księżyc IC nie chce klubów — chce wody, gór, długich     │
│ rozmów wieczorami przy lampce wina.                      │
├─────────────────────────────────────────────────────────┤
│ ⚠  Kiedy NIE jechać                                      │
│ Unikaj kiedy Mars przechodzi przez tę linię — wtedy      │
│ regeneracja zamienia się w konfrontację z samym sobą.    │
│ Najbliższe takie okno: 14-28 czerwca 2026.               │
├─────────────────────────────────────────────────────────┤
│ ✈  Logistyka z Warszawy                                  │
│ Lot 14h (z przesiadką w Frankfurcie/Londynie)            │
│ Bilet ~4500-6500 zł sezon letni                          │
│ Jetlag 9h — pierwsze 2-3 dni na adaptację                │
└─────────────────────────────────────────────────────────┘
```

## cosmo-map-city — extended structured output

Edge function `supabase/functions/cosmo-map-city/index.ts` — zmień prompt żeby zwracał JSON z 5 polami zamiast plain markdown:

```typescript
const systemPrompt = `Jesteś ekspertem astrokartografii. Piszesz interpretacje energii planetarnej dla konkretnego miasta w kontekście SCENARIUSZA podróży.

OUTPUT WYMAGANY: ścisły JSON z polami:
{
  "main_prose": "<2-3 zdania głównej interpretacji, evocative, konkretnej>",
  "optimal_duration": "<1 zdanie o tym jak długo zostać i dlaczego>",
  "what_to_do": "<1-2 zdania konkretnych aktywności pasujących do aktywnych linii i scenariusza>",
  "bad_window": "<1 zdanie KIEDY nie jechać — wskaż konkretny miesiąc/okres jeśli wiesz coś o aktualnych tranzytach, inaczej generyczna ostrzeżenie>",
  "logistics": "<1-2 zdania o lotach z user_home, sezonie, jet-lagu, kosztach>"
}

ZAKAZY: bez slash-form (oddałeś/aś), bez żargonu astrologicznego (orb, dyspozytor, retrograde, MC, IC w sensie technicznym), bez wstępu typu "W tym mieście...", bez disclaimer'ów.

Pisz w drugiej osobie, forma gramatyczna: {{grammatical_form}}.`;

const userPrompt = `Scenariusz podróży: ${scenario.label} (${scenario.subtitle})
Domyślny czas trwania scenariusza: ${scenario.default_duration_days.min}-${scenario.default_duration_days.max} dni
Ton: ${scenario.tone}

Miasto: ${city.name_pl}, ${city.country_pl}
Kontynent: ${city.continent}
Lot z domu usera (${user.home_city}): ${city.flight_hours_from_waw}h
Tier cenowy: ${city.price_tier}

Aktywne linie planetarne w 700km:
${activeLines.map(l => `- ${planetPL[l.planet]} na ${linePL[l.type]} (${l.distance_km}km)`).join('\n')}

Napisz interpretację jako JSON. Sekcja "what_to_do" musi konkretnie pasować do scenariusza "${scenario.label}" — np. dla regeneracji nie polecaj klubowania.`;
```

Cache w `map_city_interpretations` jako kompletny JSON object. Renderuj sekcje w `CityDetails.tsx` jako 4 osobne bloki pod główną prozą.

## Algorytm rankingu — zmiana dla "Globalnie"

W `apps/web/src/lib/astrocartography.ts`:

```typescript
export function rankCitiesForScenarioAndContinent(
  cities: City[],
  lines: Astrocartography,
  scenario: Scenario,
  continent: 'all' | 'europe' | 'asia' | 'middle_east' | 'africa' | 'north_america' | 'south_america' | 'oceania',
  userHomeCoords?: { lat: number; lon: number }
): RankedCity[] {
  // 1. Filter cities by continent (jeśli nie 'all')
  const filtered = continent === 'all' ? cities : cities.filter(c => c.continent === continent);
  
  // 2. Dla każdego miasta policz aktywne linie i score
  const scored = filtered.map(city => {
    const active = activeLinesForCity(city, lines);
    
    // Tylko linie ze scenariusza są scoring-relevant
    const scenarioLines = scenario.primary_lines.map(s => `${s.planet}-${s.type}`);
    const scenarioActive = active.filter(l => scenarioLines.includes(`${l.planet}-${l.type}`));
    
    if (scenarioActive.length === 0) return null;
    
    // Score: weight z scenariusza × (1 / distance), znajdź najsilniejszą linię
    const bestLine = scenarioActive.reduce((best, line) => {
      const planetWeight = scenario.primary_lines.find(p => p.planet === line.planet && p.type === line.type)?.weight ?? 0;
      const score = planetWeight * (700 - line.distance_km) / 700;
      return score > best.score ? { line, score } : best;
    }, { line: scenarioActive[0], score: 0 });
    
    return { city, bestLine: bestLine.line, score: bestLine.score, allActive: active };
  }).filter(Boolean);
  
  // 3. Sort
  scored.sort((a, b) => b!.score - a!.score);
  
  // 4. Jeśli continent === 'all' → użyj "top 5 per continent" zamiast czystego sortowania
  //    żeby user widział wariację, nie 8 miast z USA
  if (continent === 'all') {
    const byContinent = new Map<string, RankedCity[]>();
    for (const item of scored) {
      const list = byContinent.get(item!.city.continent) ?? [];
      if (list.length < 5) {
        list.push(item!);
        byContinent.set(item!.city.continent, list);
      }
    }
    // Flatten interleaved (round-robin po kontynentach żeby top 1 z każdego było na górze)
    const result: RankedCity[] = [];
    for (let i = 0; i < 5; i++) {
      for (const list of byContinent.values()) {
        if (list[i]) result.push(list[i]);
      }
    }
    return result;
  }
  
  return scored.slice(0, 20) as RankedCity[];
}
```

## cityDatabase.ts — dodaj nowe pola

Każdy city record:

```typescript
type City = {
  slug: string;
  name_pl: string;
  name_en: string;
  country_pl: string;
  country_en: string;
  lat: number;
  lon: number;
  population: number;
  continent: 'europe' | 'asia' | 'middle_east' | 'africa' | 'north_america' | 'south_america' | 'oceania';  // NOWE
  flight_hours_from_waw: number;  // NOWE — approximate, 1 decimal place
  price_tier: 'low' | 'mid' | 'high';  // NOWE — łączny tier kosztów (lot + życie)
};
```

Wartości szacunkowe — nie dokładne, ale konsystentne. Reguły:
- `flight_hours_from_waw`: 0-2h Europa Centralna, 2-4h reszta Europa + N Afryka + Stambuł, 4-7h Bliski Wschód + India + Afryka subsaharyjska, 7-12h Azja Wsch + Ameryki, 12+ Oceania
- `price_tier`: low (Albania, Maroko, Turcja, Wschodnia Europa, większość Azji Pd-W), mid (Hiszpania, Włochy, Niemcy, Tajlandia, Meksyk), high (Szwajcaria, Skandynawia, Japonia, USA, ZEA)

Jeśli scriptem łatwiej — wygeneruj te pola jednorazowo na podstawie continent + region. Jest OK żeby Praga i Budapeszt miały to samo: `2.0h, low`.

## Map.tsx — zmiana defaultu i ułożenia

```tsx
const [continent, setContinent] = useState<Continent>('europe');  // ZMIANA z 'all'
const [scenario, setScenario] = useState<Scenario>(SCENARIOS[0]); // domyślnie 'Wakacje regeneracyjne'

// Layout:
// [Header: Cosmo Map + profile selector]
// [ScenarioPicker — 7 kart]
// [Continent tabs: Globalnie / Europa* / Azja / Bliski Wschód / ...]  (* = aktywne)
// [Map + side panel]
//   [Side panel content:]
//     [HometownAnchor]
//     [Lista miast]
```

## Test akceptacyjny

1. Pierwsze wejście na `/app/map` → default scenariusz = "Wakacje regeneracyjne", default continent = "Europa". Side panel pokazuje europejskie miasta (NIE Los Angeles).
2. Zmień scenariusz na "Romantyczny wyjazd" → mapa rysuje linie Venus DSC, Venus ASC, Moon DSC, Mars DSC (4 linie, nie 40). Lista miast się zmienia.
3. Zmień continent na "Globalnie" → top miast pokazuje wariację z 5-7 kontynentów (NIE 8 miast z USA).
4. HometownAnchor pokazuje 3 linie aktywne w mieście usera z PL templates (nie generyczne).
5. Lista miast: każde miasto ma opis z `LINE_DESCRIPTIONS[planet][lineType].short` (różne dla różnych planet-line combos). Grep w DOM — żadnego "idealne miejsce na dom i rodzinę..." powtórzonego 3+ razy.
6. Klik miasto → detail view pokazuje 5 sekcji: główna proza, optymalny czas, co tu robić, bad window, logistyka. Wszystkie wypełnione, żadna nie pusta.
7. Hometown bez aktywnych linii w 700km → HometownAnchor pokazuje fallback "...neutralny grunt..." NIE pusty box.
8. Compare mode (z V1) dalej działa — toggle Cosmo Match → druga osoba renderuje w gold.
9. Free user (paywall) → grayscale + CTA dalej działa.
10. Mobile: ScenarioPicker przewija się horyzontalnie 7 kart. Continent tabs poniżej. HometownAnchor + city list w bottom sheet.
11. PostHog: nowy event `cosmo_map_scenario_selected {scenario_id}` dochodzi przy zmianie scenariusza.
12. Wywołaj cosmo-map-city z scenariuszem "Retreat" dla Lizbony → response zawiera JSON z 5 polami, sekcja `what_to_do` pasuje do retreatu (NIE pisze o klubowaniu).

Jeśli któreś z 12 nie przechodzi → nie commituj, wróć z błędem.

## Co odłożone na P1+ (NIE w tym refactorze)

- Bad window calculation z realnych tranzytów — na razie generyczne ostrzeżenie z LLM
- Integracja Skyscanner/Kiwi API dla realnych cen
- User-curated bucket list (zapisywanie ulubionych miast)
- Push notification o sprzyjających oknach
- Personalizacja `current_city` w settings (jeśli user nie mieszka tam gdzie się urodził)
- Trip planner — łączenie 2-3 miast w trasę
- Eksport listy miast do PDF/share

## Po skończeniu

Dopisz do `docs/PROGRESS.md`:
- Lista 40 templates działa (grep w DOM potwierdza wariację)
- Default continent Europa
- 7 scenariuszy zastąpiło 3 intencje
- HometownAnchor pokazuje insighty o aktualnym mieście usera
- Pytania do mnie (np. "city dataset nie ma kontynentu, dorzuciłem manualnie — chcesz że puszczę skrypt dla 500 miast czy zostawiamy top 100?")

Plus wklej 3 przykłady wygenerowanych structured outputs (Lizbona dla "Romantyczny wyjazd", Bali dla "Retreat", Berlin dla "Networking") — żeby zobaczyć czy AI łapie ton scenariusza.
