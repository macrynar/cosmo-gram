---
title: Prompts v4 — Audyt prawdziwych outputów + patche
created: 2026-05-21
project: cosmogram
type: prompt-engineering
status: ready-to-implement
audit_set: [daily-mac-21maj, natal-mac-1993, synastry-mac-joanna, child-eryk-2021]
related: prompts-v1.md, prompts-v3-improvements.md, goal-instruction.md
---

# Prompts v4 — audyt z 4 real outputów

## TL;DR

Cztery outputy w produkcji (daily Maca z 21 maja, natal Maca z 1993, synastry Mac×Joanna, child Eryk) ujawniły **dziewięć kategorii problemów**. Dzielą się na trzy rodzaje:

1. **Architektura** (3 problemy) — wymaga zmian w kodzie, nie w prompcie. Najważniejszy: niedeterministyczny synastry score (user dostaje inny wynik za każdym razem dla tych samych ludzi).
2. **Wyciekający żargon astrologiczny** (4 problemy) — banlista v3 nie jest egzekwowana, AI wypuszcza terminy ("dyspozytor", "orb X°Y'", "retrograde", "applying") prosto w output.
3. **Format i forma gramatyczna** (2 problemy) — slash-formy ("oddałeś/aś", "powinieneś/powinnaś") pokazywane userowi natychmiast zabijają immersję. Hierarchia placementów z v3 nie jest trzymana — Mars-Moon opozycja Maca opisana w 3 sekcjach z rzędu.

Patche w sekcjach A–G poniżej, w kolejności priorytetu implementacji.

---

## 1. Per-output audit

### 1.1 Daily — Mac, czwartek 21 maja 2026

Headline: "Chcesz działać, ale coś w środku hamuje — i dobrze robi"

**Co działa:**

- Headline konkretny, obrazowy, w targecie 8-15 słów (10 słów). ✓
- Struktura "ZRÓB / UNIKAJ" zachowana. ✓
- One-liner zamykający "Moje tempo, moje zdanie." ✓

**Co nie działa (kolejność = severity):**

1. **CRITICAL — slash-formy pokazywane userowi.** Output zawiera dosłownie: "oddałeś/aś", "powinieneś/powinnaś", "chciałeś/aś". To narusza nadrzędną zasadę z `prompts-v3-improvements.md` o jednej formie gramatycznej. Diagnoza: albo pole `birth_data.grammatical_form` nie zostało jeszcze zaimplementowane, albo jest, ale AI nie używa go bo prompt nie zakazuje wprost slash-fallbacka.
2. **CRITICAL — zero nazwanego tranzytu.** Cały output mówi ogólnie o "napięciu między potrzebą ruchu a bezpieczeństwa". To narusza twardy kontrakt z `goal-instruction.md` sekcja 3.1: "Każde 'co dziś wspiera' / 'co dziś uwiera' MUSI nazwać JEDEN konkretny tranzyt z nazwą planety." Mac ma w natalu opozycję Mars-Moon 0°01' — w jakimkolwiek dniu jeden z planet powinien być tranzytujący i wymieniony.
3. **Generic content** — całość pasuje do dowolnego usera tego dnia. Brak śladu konkretnego kosmogramu Maca. Daily ma być personalizowane przez tranzyt nad natalem, tu nie ma natalu w wejściu albo AI go ignoruje.
4. **Filler nie-astrologiczny** — "To nie jest lenistwo ani egoizm. To sygnał że oddałeś/aś ostatnio więcej niż dostałeś/aś z powrotem" — to coachingowa wstawka bez podstawy w aspekcie. Daily ma być oparty wyłącznie o tranzyt + natal.
5. **Długość OK** — ~95 słów, mieści się w targecie ≤150.

### 1.2 Natal — Mac, 1500+ słów

**Co działa:**

- "Mówi się tak, żeby dotknęło — nie żeby było poprawne" — najlepszy one-liner całej kolekcji. ✓
- "Zostań w 'chcę' przez 60 sekund dłużej" — actionable, oparte o konkretny aspekt. ✓
- "Małe dziecko które analizowało zamiast czuć — bo analiza dawała złudzenie kontroli" — rdzeń narracji, dobrze ujęty. ✓
- "To radar na bullshit zakodowany w 1. domu" — celowo niski rejestr, działa.
- Końcówka sekcji 7: "Największa siła ujawnia się dokładnie w momentach, w których pojawia się pokusa żeby się wycofać." — solid one-liner.

**Co nie działa (severity):**

1. **CRITICAL — żargon w outputie końcowym.** Wypisuję dokładne cytaty z naruszeniem:
   - "Dyspozytor Ascendentu to Jowisz retrograde w Wadze w 10. domu" — 3 terminy techniczne bez tłumaczenia w jednym zdaniu.
   - "orb 58 minut — to dominanta domu 1" — "orb" + "minuty" + "dominanta".
   - "Mars 19°55' Rak w opozycji do Księżyca 19°56' Panna — to jest rdzeń wzorca relacyjnego. Orb 0°01': dosłownie jedno ciało niebieskie uderza w drugie" — minuty łuku w outputie, "orb" wyjaśniany metaforą która niczego nie wyjaśnia.
   - "Pluton retrograde w Skorpionie w 11. domu: wzorzec grupowy" — "retrograde" jako termin technicznym, "11. dom" bez kontekstu.
   - "Węzeł Północny w tej karcie wskazuje kierunek ewolucji przez przeciwieństwo Węzła Południowego" — tłumaczone z podręcznika, user nie wie co to Węzeł.
   - "MC w Skorpionie, dyspozytor: Pluton retrograde w Skorpionie w 11. domu" — 4 terminy techniczne, zero tłumaczeń.
2. **CRITICAL — hierarchia placementów złamana.** Mars 19°55' Rak opozycja Księżyc 19°56' Panna opisana SZCZEGÓŁOWO w trzech różnych sekcjach:
   - Sekcja 2 (Dziecko) — "Księżyc w Pannie w 9. domu tworzy z Marsem w Raku opozycję z orbem poniżej jednej minuty łuku — to najostrzejszy aspekt..."
   - Sekcja 4 (Relacje) — "Mars 19°55' Rak w opozycji do Księżyca 19°56' Panna — to jest rdzeń wzorca relacyjnego."
   - Sekcja 6 (Cienie) — "Mars 19°55' Rak opozycja Księżyc 19°56' Panna — orb 0°01' — to jest najważniejszy cień w tej karcie..."
   Ta sama struktura wymieniona 3×. Po trzech sekcjach user zapamiętuje TYLKO Marsa-Księżyc, reszta karty zanika. Reguła v3 "domowa sekcja dla każdego placementu" nie jest egzekwowana.
3. **Forma gramatyczna: schyłek do bezosobowego nie-konsekwentnie.** Mac ma grammatical_form = masculine. Output prawie całkowicie używa "się"/"można" (impersonal). To "bezpieczne" — slash-forma się nie pojawia — ale traci osobisty efekt. Dla Maca powinno być: "byłeś", "zauważyłeś", "doświadczyłeś", "Twoja czujność z dzieciństwa stała się Twoim radarem". Występują też pojedyncze nawiązania osobowe ("Pierwszy konkretny krok: Kiedy pojawi się wewnętrzne 'ale' zaraz po 'chcę'") — niespójność.
4. **Długość 1500+ słów vs target 700-1100** — przekroczenie o ~35-50%. Akceptowalne ±20%.
5. **Anty-meta wycieka** — "to jest najważniejszy cień w tej karcie i należy go nazwać wprost" — "należy nazwać wprost" to meta o tym co AI zaraz zrobi. Lepsze: po prostu nazwać.
6. **Brak one-linerów w niektórych sekcjach.** Sekcji 7, one-linery są w 3 (sekcja 3 mocno, sekcja 6 i 7 średnio). Reszta to ekspozycja. Reguła v3 "min 1 cytatowe zdanie / sekcja, cel 5+ na całość" — niespełniona.

### 1.3 Synastry — Mac × Joanna, score 62/100

**Co działa:**

- "konflikt jest w tym, że miłość dla jednej osoby wygląda jak zagrożenie dla drugiej" — silny one-liner. ✓
- Struktura "→ Konkretny krok" w każdej sekcji jest dobra (alignment z v3 wymogiem actionable).
- Krok z sekcji Namiętność: "ustalcie z góry co oznacza 'potrzebuję przestrzeni' — czy to 2 godziny czy 2 dni" — wynika wprost z aspektu Wenus Joanny ↔ Pluton Maca. Spełnia regułę v3 "każda rada z konkretnego aspektu". ✓

**Co nie działa:**

1. **CRITICAL — score niedeterministyczny.** User zgłasza: za każdym uruchomieniem dla tych samych dwóch osób dostaje inny wynik (62, 58, 71 itd.). To nie jest problem promptu — to architektura. AI generuje liczbę zamiast otrzymywać ją deterministycznie z computed metrics. **Fix wyłącznie w kodzie** — sekcja 3 poniżej.
2. **CRITICAL — żargon brutalny.** Każda sekcja zaczyna się od:
   - "Merkury Macieja w Strzelcu (27°12') vs Merkury Joanny w Skorpionie (22°11') — brak dokładnego aspektu między nimi (5° różnicy, zbyt szeroki orb na koniunkcję)"
   - User nie wie co to "orb", "koniunkcja", nie obchodzi go że Merkury jest w 27°12'. To wygląda jak raport.
3. **"Brak aspektu, ale piszę interpretację" pattern** — kilka razy AI pisze "brak dokładnego aspektu (5° różnicy)" i kontynuuje interpretację 3 paragrafy. Albo aspekt jest i go używamy, albo go nie ma i pomijamy temat — bez meta-komunikacji.
4. **Detal techniczny przed insightem** — kolejność: stopnie → orby → typ aspektu → interpretacja. Powinno być: insight psychologiczny → minimalna podstawa astrologiczna (bez stopni i orbów).
5. **Generic pre-amble** — "Maciej i Joanna urodzili się 24 dni od siebie w tym samym roku — ich zewnętrzne planety (Uran, Neptun, Pluton) są niemal identyczne, co tworzy lustrzane podobieństwo generacyjne, ale nie synastię." — to wstęp dla astrologa, nie dla usera. User nie wie czemu mu się to mówi i co ma z tym zrobić.

### 1.4 Child — Eryk, 5 lat (2200+ słów)

**Co działa:**

- "Wyobraź sobie taką scenę: Eryk siedzi przy stole i rysuje..." — najlepsze otwarcie z całej kolekcji. Konkretne, sceniczne, pamiętalne. ✓ **Wprowadzić to jako standard hook też do natal i synastry.**
- "Eryk nie jest trudny — jest precyzyjny" — one-liner, screenshot-godny. ✓
- "Reaguje na niespójność między Twoimi słowami a tonem głosu zanim Ty sam zauważysz, że ta niespójność istnieje" — wynika z konkretnych placementów (Księżyc Skorpion + Asc Lew). ✓
- Struktura "Pułapka rodzicielska / Co zamiast" — wprowadź do natal sekcji 6 (Cienie).
- Konkretne scenariusze ("jesteście w sklepie, Eryk chce zostać...") — ten poziom konkretu utrzymać.
- Disclaimer na końcu o "obiektywie, nie wyroku" — dobry. ✓

**Co nie działa:**

1. **Żargon residual** — "Księżyc w 29° Skorpiona w czwartym domu", "Retrograde Merkury w Wodniku", "Pięć planet w szóstym domu", "29° to stopień graniczny". Mniej niż w natal Maca, ale wciąż wycieka.
2. **Długość 2200+ słów** — target dla child to ~1200-1500. Przekroczenie o ~50%. Sekcje 6 i 7 można skrócić.
3. **Sekcja 7 "Pięć rzeczy które zmienią Waszą relację"** — 5 punktów po 60-80 słów każdy = 350 słów. To dużo. Można zostawić 5 punktów ale po 30-40 słów = 200 słów.

**Diagnoza globalna**: child jest najlepszym outputem z czterech. Bo? — Bo prompt child został napisany później (po lekcjach z natal i synastry), z silniejszymi konkretnymi zasadami (otwarcie scenowe, struktura "pułapka/zamiast"). To dowód że v4 patche **dadzą zauważalny skok jakości** także na pozostałych typach.

---

## 2. Patche promptów v4

### A. Forma gramatyczna — twardy ban slash-form

Dodaj na początku każdego prompta (przed jakąkolwiek inną zasadą):

```text
FORMA GRAMATYCZNA TEGO USERA: {grammatical_form}

# ZAKAZ BEZWZGLĘDNY
Nigdy nie używaj slash-form. Zakazane konstrukcje:
- "byłeś/aś", "chciałeś/aś", "powinieneś/powinnaś", "oddałeś/aś"
- "zauważyłeś/aś", "doświadczyłeś/aś", "zmęczony/a"
- Każde użycie "/" w czasowniku lub przymiotniku = output odrzucony

# JAK PISAĆ ZAMIAST
- masculine → "byłeś", "chciałeś", "powinieneś", "doświadczyłeś", "zmęczony"
- feminine → "byłaś", "chciałaś", "powinnaś", "doświadczyłaś", "zmęczona"
- impersonal → "można doświadczyć", "warto zauważyć", "bywa tak, że pojawia się zmęczenie"
- they → bezosobowo lub w trybie bezokolicznika ("doświadczać", "zauważać")

# WALIDACJA PRZED WYSŁANIEM
Przed wysłaniem outputu przeszukaj go regex'em /\w+\/\w+/ — jeśli znajdziesz "/" w słowie, popraw natychmiast.
```

Dodatkowo na poziomie kodu — `validate-reading` edge function odrzuca slash w `\w+/\w+` pattern (sekcja 5 niżej).

### B. Banlista v4 — jargon translation table

Wszystkie poniższe ZAKAZANE w outputach końcowych. Mogą być w reasoning (chain-of-thought), nie mogą trafić do textu czytanego przez usera.

| Zakazane | Czemu | Czym zastąpić |
|---|---|---|
| "dyspozytor X" | niewytłumaczalne dla niefachowca | "planeta, która kieruje X" — lub po prostu pomiń |
| "orb X°" / "orb X' łuku" | techniczne | całkowicie pomiń, mów "blisko" / "ścisły" |
| "X°Y'" (stopnie z minutami) | nikt nie potrzebuje stopni w outputie | tylko znak (np. "Mars w Raku" bez "19°55'") |
| "applying / separating" | techniczne | "narastający / opuszczający" lub pomiń |
| "retrograde" / "retrograd" | techniczne | "cofa się" jeśli już musisz, ale lepiej pomiń lub: "ten obszar życia dojrzewa od wewnątrz, nie z zewnątrz" |
| "MC" | skrót | "punkt zawodowy" / "wierzchołek kariery" — przy pierwszym użyciu |
| "IC" | skrót | "korzenie" / "punkt rodzinny" |
| "ASC" / "DSC" | skrót | "znak wschodzący — jak świat Cię widzi" / "linia relacji — kogo przyciągasz" — przy pierwszym użyciu |
| "dom 1" / "dom 7" bez kontekstu | techniczne | "obszar X" (np. "obszar grupowy" dla 11) |
| "koniunkcja" | techniczne | "spotkanie" / "stop" — przy pierwszym użyciu, potem już ok |
| "kwadratura" | techniczne | "napięcie" / "tarcie" — przy pierwszym, potem ok |
| "opozycja" | techniczne | "biegunowość" / "lustro" / "stoją naprzeciw" |
| "trygon" | techniczne | "harmonia" / "łatwy przepływ" |
| "sekstyl" | techniczne | "dobre wsparcie" / "ułatwienie" |
| "Węzeł Północny" | techniczne | "Twój kierunek wzrostu" / "to, czego masz się jeszcze nauczyć" — bez nazwy |
| "Węzeł Południowy" | techniczne | "to, co już znasz na pamięć, co Cię już nie rozwija" |
| "dyspozytor Ascendentu" | mega techniczne | po prostu pomiń lub: "planeta która rządzi Twoim sposobem bycia" |
| "dominanta domu X" | techniczne | "najsilniejszy element tego obszaru" |
| "stopień graniczny" | techniczne | "na granicy dwóch znaków, więc dwa wpływy się ścierają" |

ZASADA META: jeśli używasz terminu astrologicznego, MUSISZ w tym samym zdaniu wytłumaczyć co to znaczy psychologicznie — albo skreślić termin. **Bez wytłumaczenia = output odrzucony.**

Rozszerzona banlista cliché (poszerzenie z v3):

- "wodne podłoże emocjonalne"
- "ognista energia"
- "ziemska stabilność"
- "powietrzna lekkość"
- "twórcza ekspresja" (jako fraza bez konkretu)
- "fundament duchowy"
- "naturalna mądrość"
- "wewnętrzny kompas"
- "zaufaj sobie" (bez konkretu w czym)
- "zaufaj procesowi"
- "Twoje pierwsze przeczucie / przeczucie było słuszne"
- "kosmiczna podróż" / "energie wszechświata"
- "Twoje 'X' jest darem"
- **NOWE z v4 audit:**
   - "intuicja strukturalna" (jargon-coaching mix)
   - "wzorcowe myślenie"
   - "radar na bullshit" (tylko 1× w całym natalu, nie więcej — straci ostrość)
   - "dosłownie jedno ciało niebieskie uderza w drugie" (taka metafora to overcompensation za techniczny termin)

### C. Hierarchia placementów — explicit pre-write listing

Aktualna reguła v3 ("każdy placement ma swoją domową sekcję") jest nieegzekwowana w natal-prompt v3. Patch:

Dodaj do prompta natal **explicit pre-write step**:

```text
# KROK 0 (zanim zaczniesz pisać interpretację)

Sporządź wewnętrznie tabelę:

| Placement | Sekcja domowa | Czemu |
|---|---|---|
| Słońce w X | 1 | rdzeń tożsamości |
| Księżyc w X | 1 + 2 | emocje + dzieciństwo, różne aspekty |
| Ascendent | 1 | maska |
| Mars w X | 4 LUB 5 | wybierz na podstawie najsilniejszego aspektu |
| Wenus w X | 4 | relacje |
| Saturn w X | 6 | cień strukturalny |
| Jowisz w X | 3 lub 5 | wybierz |
| Pluton w X | 6 (jeśli silny) lub 7 (jeśli kierunek) | wybierz |
| Główna opozycja/kwadratura orb <2° | 6 jako rdzeń | tu jest cień |
| Węzły | 7 | kierunek |

# KROK 1 (przy pisaniu każdej sekcji)

Sprawdź: czy placement który chcę głęboko omówić w tej sekcji jest jej "domowy"?
- TAK → opisz głęboko (3-5 zdań, mechanizm, manifestacja codzienna)
- NIE → maksymalnie 1 zdanie nawiązania ("więcej w sekcji X")

# KROK 2 (przed wysłaniem)

Dla każdego placementu policz, w ilu sekcjach pojawia się DOKŁADNY OPIS (>1 zdanie).
Jeśli któryś >1 → przepisz sekcję pozostającą jako jednozdaniowe nawiązanie.

# KRYTYCZNE
Mars-Moon opozycja u Maca pojawiła się w 3 sekcjach. To bug. Po implementacji v4 — każdy placement opisany głęboko TYLKO RAZ.
```

### D. Daily — twardy format + transit injection

Aktualnie daily ignoruje natal i transity. Twardy patch:

```text
# Input MUSI zawierać (przekazywane przez edge function):
- user_first_name: string
- grammatical_form: 'masculine'|'feminine'|'impersonal'|'they'
- natal_chart_summary: { sun: {sign, house}, moon: {sign, house}, rising: string }
- top_transit_supporting: { transit_planet, transit_sign, aspect_type, natal_planet, orb_degrees, applying }
- top_transit_challenging: { jak wyżej }
- moon_phase: string
- date: string

# Output MUSI:

## Nagłówek (8-15 słów)
Konkretny obraz dnia, nie klisza. NIE "Twoja intuicja pracuje szybciej". TAK "Dzień konkretnych decyzji - z mglistych planów wybierz jeden".

## Co dziś wspiera (≤50 słów)
Pierwsza fraza MUSI zawierać nazwę top_transit_supporting.transit_planet.
Wzór: "{Planeta} przechodzi przez {znak} i {robi co} z Twoim {natalna_planeta}: {co to znaczy konkretnie}."
Przykład: "Wenus w Bliźniakach robi delikatny most do Twojego Marsa w Raku — łatwiej Ci dziś łapać kontakt niż zwykle."

## Co dziś uwiera (≤40 słów)
Pierwsza fraza MUSI zawierać nazwę top_transit_challenging.transit_planet.
Wzór jak wyżej. Bez katastrofizowania, bez "uważaj".

## Dziś
- **Zrób:** 1 zdanie, behawioralne, konkretne. Musi wynikać z top_transit_supporting.
- **Unikaj:** 1 zdanie, behawioralne, konkretne. Musi wynikać z top_transit_challenging.

## Jednozdaniowy "manifest dnia"
1 zdanie kursywą — krótka mantra do zapamiętania, max 8 słów. Wynika z całości dnia.

# TWARDE LIMITY
- ≤150 słów total
- ≥1 nazwa konkretnej planety tranzytującej w "co wspiera"
- ≥1 nazwa konkretnej planety tranzytującej w "co uwiera"
- Zero "zaufaj swojej intuicji", "Twoje przeczucie", "wszechświat dziś"
- Zero filler-coachingu ("To nie lenistwo, to sygnał...")

# CO ROBIĆ JEŚLI BRAK TRANZYTÓW
Jeśli top_transit (orb >5°) nie ma — wygeneruj output o:
(a) fazie księżyca + jej naturze emocjonalnej dla tego usera
(b) tranzytującym księżycu (zawsze coś robi)
NIGDY nie generuj generic content bez konkretnego astro-anchora.
```

### E. Synastry — DETERMINISTIC SCORE (architektura)

To **nie jest fix promptu**. To zmiana w `synastry-compute` edge function.

#### Aktualny stan (buggy)
Edge function zwraca aspekty + house overlays. AI dostaje to i sam wymyśla score. Każde wywołanie LLM = inna liczba.

#### Docelowy stan
Edge function dodatkowo zwraca **deterministycznie policzony score** per kategoria + total. AI dostaje score jako input — tylko opakowuje go w copy.

#### Algorytm scoringu

```typescript
type Aspect = {
  planet_a: 'Sun'|'Moon'|'Mercury'|'Venus'|'Mars'|'Jupiter'|'Saturn'|'Uranus'|'Neptune'|'Pluto';
  planet_b: typeof Aspect['planet_a'];
  type: 'conjunction'|'sextile'|'square'|'trine'|'opposition';
  orb_degrees: number;
};

const PLANET_WEIGHT = {
  Sun: 1.5, Moon: 1.5, Venus: 1.2, Mars: 1.2, Mercury: 0.9,
  Jupiter: 1.0, Saturn: 1.1, Uranus: 0.6, Neptune: 0.5, Pluto: 0.8
};

const CONJUNCTION_PAIR_SCORE: Record<string, number> = {
  'Venus-Mars': 8,
  'Sun-Moon': 6,
  'Sun-Venus': 4,
  'Moon-Venus': 5,
  'Mars-Mars': 2,
  'Saturn-Mars': -5,
  'Saturn-Venus': -3,
  'Saturn-Sun': -2,
  'Saturn-Moon': -3,
  'Pluto-Venus': 3,
  'Pluto-Mars': 1,
  'Pluto-Sun': 0,
  'Pluto-Moon': 0,
  'Neptune-Venus': 2,
  'Neptune-Moon': 1
  // default 2 dla innych par
};

function computeAspectScore(a: Aspect): number {
  if (a.orb_degrees > 6) return 0;
  
  const orbWeight = a.orb_degrees < 2 ? 1.0 : a.orb_degrees < 4 ? 0.7 : 0.4;
  const planetWeight = (PLANET_WEIGHT[a.planet_a] + PLANET_WEIGHT[a.planet_b]) / 2;
  
  let baseScore: number;
  switch (a.type) {
    case 'trine':
    case 'sextile':
      baseScore = 5;
      break;
    case 'square':
    case 'opposition':
      baseScore = -4;
      break;
    case 'conjunction':
      const key = [a.planet_a, a.planet_b].sort().join('-');
      baseScore = CONJUNCTION_PAIR_SCORE[key] ?? 2;
      break;
  }
  
  return baseScore * orbWeight * planetWeight;
}

function computeSynastryScore(aspects: Aspect[], houseOverlays: HouseOverlay[]): SynastryScores {
  let overall = 50;
  let communication = 50;
  let passion = 50;
  let values = 50;
  let challenge = 50;
  
  for (const a of aspects) {
    const s = computeAspectScore(a);
    overall += s;
    
    // route to category
    if (['Mercury'].includes(a.planet_a) || ['Mercury'].includes(a.planet_b)) {
      communication += s * 1.5;
    }
    if (['Venus', 'Mars'].includes(a.planet_a) || ['Venus', 'Mars'].includes(a.planet_b)) {
      passion += s * 1.5;
    }
    if (['Jupiter', 'Saturn', 'Sun'].includes(a.planet_a) || ['Jupiter', 'Saturn', 'Sun'].includes(a.planet_b)) {
      values += s * 1.2;
    }
    if (['square', 'opposition'].includes(a.type) && a.orb_degrees < 3) {
      challenge -= Math.abs(s); // challenge metric: low = many challenges
    }
  }
  
  // house overlays bonus
  for (const overlay of houseOverlays) {
    if (overlay.house_in_b === 7 && overlay.planet === 'Sun') overall += 3;
    if (overlay.house_in_b === 7 && overlay.planet === 'Venus') overall += 4;
    if (overlay.house_in_b === 8 && overlay.planet === 'Pluto') overall += 0; // intense, ambiguous
    // ... pełna tabela w docs/synastry-scoring.md
  }
  
  return {
    overall: clamp(Math.round(overall), 30, 92),
    communication: clamp(Math.round(communication), 30, 92),
    passion: clamp(Math.round(passion), 30, 92),
    values: clamp(Math.round(values), 30, 92),
    challenge: clamp(Math.round(challenge), 30, 92)
  };
}
```

#### Prompt zmiana

```text
# Input zawiera teraz scores deterministycznie obliczone:
- overall_score: {number 30-92}
- communication_score, passion_score, values_score, challenge_score

# ZASADA TWARDA
NIE generujesz score'a. Score jest dany. Twoja praca: napisać copy, która brzmi spójnie z tymi liczbami.

- Jeśli passion_score = 78 — pisz o sile fizycznego przyciągania i braku nudy.
- Jeśli passion_score = 42 — pisz o tym, że chemia wymaga świadomej pracy.
- Jeśli challenge_score = 35 (dużo wyzwań) — sekcja "Wyzwania" mówi wprost, że to napięta dynamika.
- Jeśli overall_score >75 — overall ton komplementarny.
- Jeśli overall_score 50-60 — ton "to się daje zrobić, ale wymaga uwagi".
- Jeśli overall_score <45 — ton ostrzegający bez katastrofizowania.

# ZAKAZ
Nie odwołuj się do nieistniejących aspektów. Jeśli w input.aspects nie ma Venus-Mars conjunction — nie pisz o niej.
```

#### Test deterministyczności

Po deploy: 10× pod rząd ten sam (Mac, Joanna) — overall_score MUSI być identyczny. Tolerancja: 0 punktów różnicy.

### F. Length enforcement — post-processing

Twardy limit przez prompt często ignorowany. Dwuetapowo:

**Etap 1: prompt instruction**
```text
TARGET słów: {target_min}-{target_max}
HARD MAX: {target_max + 20%}
Policz słowa przed wysłaniem. Jeśli >hard_max, skróć.
```

**Etap 2: post-generation check w edge function**
```typescript
function checkLength(text: string, type: ReadingType): {ok: boolean, regenerate?: string} {
  const wordCount = text.trim().split(/\s+/).length;
  const targets = {
    natal: { min: 700, max: 1100, hard: 1320 },
    daily: { min: 80, max: 150, hard: 180 },
    synastry: { min: 350, max: 550, hard: 660 },
    child: { min: 1100, max: 1500, hard: 1800 }
  };
  
  const t = targets[type];
  if (wordCount <= t.hard) return { ok: true };
  
  return {
    ok: false,
    regenerate: `Poprzednia wersja miała ${wordCount} słów. Twardy limit to ${t.hard}. Wygeneruj jeszcze raz, skracając.`
  };
}
```

Max 2 retry — potem return ostatnią wersję z warningiem do logów.

### G. Anti-meta + jargon: post-generation guardrails

Edge function `validate-reading` przed zwróceniem outputu userowi:

```typescript
function validateReading(text: string, type: ReadingType): {valid: boolean, issues: string[]} {
  const issues: string[] = [];
  
  // slash-formy
  if (/\b\w+\/\w+\b/.test(text)) issues.push('SLASH_FORM');
  
  // stopnie minut w outputie
  if (/\d+°\d+['′]/.test(text) || /\bX°\d+/.test(text)) issues.push('DEGREE_MINUTES');
  
  // żargon nieprzetłumaczony
  const jargonOnce = ['dyspozytor', 'retrograde', 'retrograd', 'applying', 'separating', 'MC w', 'orb '];
  for (const term of jargonOnce) {
    if (text.toLowerCase().includes(term.toLowerCase())) issues.push(`JARGON_${term.trim()}`);
  }
  
  // meta-leak
  const metaPatterns = [
    /należy go nazwać wprost/i,
    /\bopieram się\b/i,
    /\bbez (dostępu|godziny) (do|urodzenia)/i,
    /\bpomijam\b/i,
    /\bw tej karcie pokazuje\b/i,
    /\bnależy zaznaczyć\b/i
  ];
  for (const p of metaPatterns) {
    if (p.test(text)) issues.push(`META_${p.source.slice(0, 20)}`);
  }
  
  // banned phrases (z v3 banlisty + v4)
  const banned = [
    'wodne podłoże', 'ognista energia', 'ziemska stabilność', 'powietrzna lekkość',
    'fundament duchowy', 'naturalna mądrość', 'wewnętrzny kompas',
    'zaufaj sobie', 'zaufaj procesowi', 'twoje przeczucie',
    'kosmiczna podróż', 'energie wszechświata',
    'intuicja strukturalna', 'wzorcowe myślenie'
  ];
  for (const phrase of banned) {
    if (text.toLowerCase().includes(phrase)) issues.push(`BANNED_${phrase}`);
  }
  
  return { valid: issues.length === 0, issues };
}
```

Jeśli `!valid` — regenerate z explicit instrukcją "Poprzednia wersja zawierała problemy: {issues.join(', ')}. Popraw i wygeneruj ponownie."

Max 2 retry. Po 3 nieudanych próbach — alert do admina + return ostatnią wersję z flagą `quality_warning: true` w response.

---

## 3. Co zachować bez zmian (działa)

Audit pokazuje też **co utrzymać** — te wzorce powtarzać:

1. **Otwarcie scenowe** (sekcja 1 child) — "Wyobraź sobie taką scenę: Eryk siedzi przy stole..." → wprowadź jako standard hook do natal sekcji 1 i synastry intro.
2. **Konkretne actionable kroki** — "Zostań w 'chcę' przez 60 sekund dłużej", "wstrzymaj odpowiedź o minimum 5 sekund", "powiedz wieczorem 'widzę że potrzebujesz być blisko'". Każda rada zachowuje wzorzec: konkretne polecenie behawioralne, oparte o konkretny placement / aspekt, możliwe do wykonania dziś.
3. **Struktura "Pułapka rodzicielska / Co zamiast"** (child sekcja 6) — wprowadź do natal sekcji 6 (Cienie) jako "Wzorzec / Co robić zamiast" oraz do synastry sekcji Wyzwania.
4. **Konkretne scenariusze** ("jesteście w sklepie, Eryk chce zostać przy zabawkach...") — pokazują manifestację placementu w codzienności. Przenieś do natal jako "Codzienna manifestacja:" w sekcji 4 i 6.
5. **One-linery z paradoksem** które trzeba archiwizować jako pattern (wszystkie z auditu):
   - "Mówi się tak, żeby dotknęło — nie żeby było poprawne."
   - "Eryk nie jest trudny — jest precyzyjny."
   - "konflikt jest w tym, że miłość dla jednej osoby wygląda jak zagrożenie dla drugiej."
   - "Największa siła ujawnia się dokładnie w momentach, w których pojawia się pokusa żeby się wycofać."
6. **Disclaimer końcowy** child ("To co czytasz to jeden z wielu obiektywów na Twoje dziecko. Karta urodzeniowa pokazuje tendencje, nie wyrok.") — wprowadź skróconą wersję do natal.

---

## 4. Priorytet implementacji

### P0 — krytyczne (blokują jakość i poprawność)

- **Slash-form ban** (sekcja A) — wklej do system prompt każdego typu. Bez tego userzy dalej dostają "oddałeś/aś".
- **Audyt propagacji `grammatical_form`** — sprawdź czy pole faktycznie idzie z DB do prompta w `ai-natal`, `ai-daily`, `ai-synastry`, `ai-child`. Mac to masculine, natal go zignorował → bug po stronie kodu albo prompta, do zlokalizowania.
- **Deterministic synastry score** (sekcja E) — architektura. Score liczony w kodzie z aspektów, AI dostaje liczbę jako input. Najgorszy bug funkcjonalny — user widzi inny wynik za każdym razem.

### P1 — wysokie (systemowe wycieki)

- **Banlista v4 + jargon translation table** (sekcja B) — do system promptu wszystkie 4 typy. Tabela "JAK MÓWIĆ ZAMIAST" jako few-shot.
- **Hierarchia placementów pre-write** (sekcja C) — do prompta natal i child. Konkretny test: Mars-Moon u Maca opisany 1× a nie 3×.
- **Daily transit injection** (sekcja D) — `ai-daily` edge function musi przekazywać `top_transit_supporting` i `top_transit_challenging`. Prompt egzekwuje że pierwsza fraza paragrafu nazywa planetę.

### P2 — guardrails (red-team output zanim trafi do usera)

- **`validate-reading` edge function** (sekcja G) — post-generation regex check (slash, stopnie minut, żargon, meta, banned phrases). Reject + regenerate, max 2 retry.
- **Length enforcement** (sekcja F) — word count check po generacji, regenerate jeśli >hard_max.

### P3 — eval po implementacji v4

- **Re-run 4 outputów z auditu** — Mac natal, Mac daily 21 maj, Mac×Joanna, Eryk. Compare przed/po.
- **Test deterministyczności**: 10× synastry Mac×Joanna — score identyczny, tolerancja 0 punktów.
- **Test grammar form**: 3 generacje per forma (masc/fem/imp) z tym samym chartem — sprawdź konsekwencję.

---

## 5. Bramki akceptacji v4 (release gate)

Przed mergem v4 do produkcji każdy z 4 typów outputu MUSI przechodzić:

- [ ] **Zero slash-form** w 20 testowych outputach (regex `\w+/\w+`).
- [ ] **Zero stopni i minut** w outputie (regex `\d+°\d+['′]`).
- [ ] **Zero `dyspozytor`, `retrograde`, `applying`, `separating`, `orb `** w outputach (case-insensitive).
- [ ] **Zero meta-fraz** ("opieram się", "bez dostępu", "pomijam", "należy nazwać").
- [ ] **Każdy placement opisany głęboko 1×** (manual audit dla natal — sprawdź Mars-Moon u Maca — w 1 sekcji, nie 3).
- [ ] **Daily zawiera nazwę konkretnej planety tranzytującej** w "co wspiera" i "co uwiera".
- [ ] **Synastry score deterministyczny** — 10× pod rząd ten sam input = ten sam output overall_score.
- [ ] **Length compliance**: natal 700-1100, daily ≤150, synastry 350-550, child 1100-1500. Tolerancja ±20%.
- [ ] **Forma gramatyczna spójna**: dla 3 testowych userów (masc/fem/imp) — zero mieszania w obrębie outputu (manual audit linia po linii).
- [ ] **Koleżanka rates blind v4 vs v3** — średnia ocena ≥0.5 punktu wyżej (na skali 1-5).

---

## 6. Co zostaje do następnej iteracji (v5+)

- **Few-shot examples per voice koleżanki** — jak tylko będą 10-15 ręcznie napisanych przez nią natal-interpretations, włącz do prompta jako few-shot.
- **Klasyfikator Haiku vs Sonnet 4.6** dla chat (sekcja 3.3 goal-instruction) — proste pytania → Haiku, złożone → Sonnet. Optymalizacja kosztu.
- **Cache transit-base per znak** — generuj raz dziennie "Mars w Raku robi opozycję do Słońca w Koziorożcu" jako tranzyt-base, potem dla każdego usera składaj które jego dotyczą. Big savings na cost.
- **Custom one-liners library per placement** — z czasem zbieraj najlepsze one-linery z generacji do osobnej bazy, potem inject do prompta jako "examples of voice".
- **A/B test długości natal** — czy 800 słów konwertuje lepiej niż 1100 (na trial → paid).

---

## Changelog

- **v4.0 (2026-05-21)** — audyt 4 outputów produkcyjnych. 9 kategorii problemów. 7 patchów. 2 zmiany architektury (deterministic score, validate-reading). Bramki akceptacji.
