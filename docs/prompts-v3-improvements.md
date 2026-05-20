---
title: Prompts v3 - usprawnienia na bazie real outputów
created: 2026-05-18
project: cosmogram
type: prompt-engineering
status: ready-to-implement
---

# Prompts v3 - audyt + usprawnienia

> Analiza 4 prawdziwych outputów (natal, daily, child Sonia, synastry Maciej×Joanna) + konkretne usprawnienia do prompta v3.

---

## 8 problemów które wykryłem (z cytatami)

### 1. Forma gramatyczna - schizofreniczna

**Najpoważniejszy problem techniczny.** AI miesza formy gramatyczne w obrębie jednej interpretacji:

W tym samym tekście:
- "nauczyłaś się" (żeńskie)
- "wycofana i podejrzliwa" (żeńskie)
- "dorastałaś" (żeńskie)
- "Twoje 'za dużo' jest dokładnie odpowiednią ilością" (neutralne)
- "wybuchasz w sposób który zaskakuje nawet Ciebie" (neutralne)

User nie wie czy AI uważa że jest kobietą czy nie. To zabija immersję.

**Rozwiązanie**: pole `grammatical_form` w `birth_data` + 4. krok onboardingu.

### 2. Meta-komentarze o ograniczeniach

W natal interpretacji znalazłem TRZY razy:
- "Bez godziny urodzenia interpretacja opiera się wyłącznie na pozycjach planet - pomijamy Ascendent, MC i domy."
- "Bez dostępu do 4. domu opieram się na Księżycu w Skorpionie w koniunkcji z Plutonem..."
- "Bez MC i domów opieram się na Saturnie, Marsie i ogólnej dynamice karty."

User WIE że nie podał godziny - dostał komunikat w onboardingu. Każde takie zdanie to lepka pauza, która zmniejsza "wow effect". Wycina to natychmiast.

**Rozwiązanie**: explicit zakaz w prompcie - "Nigdy nie wyjaśniaj swoich ograniczeń, nigdy nie pisz 'bez X opieram się na Y'. Zacznij sekcję od konkretnego placementu."

### 3. Brak zapamiętywalnych one-linerów

W całej natal interpretacji (1500+ słów) jest JEDNA fraza wartościowa do screenshot:
- "Twoje 'za dużo' jest dokładnie odpowiednią ilością - dla właściwych ludzi."

Reszta jest dobra, ale to ekspozycja. User wrzuci tę jedną frazę w story na IG, resztę przeczyta raz i zapomni.

Powinno być takich 3-5 frazy na całą interpretację. To paliwo viralu - i to jest dystans między "OK, dobry odczyt" a "Boże, MUSZĘ to pokazać znajomym".

**Rozwiązanie**: explicit wymóg w prompcie - "W każdej sekcji wypracuj 1 zdanie napisane jak cytat, nie jak ekspozycja. To zdanie ma być takie żeby user chciał je wkleić w story. Krótkie, ostre, z formą paradoksu lub przewrotki."

Przykłady dobrego stylu:
- "Twoje 'za dużo' jest dokładnie odpowiednią ilością - dla właściwych ludzi."
- "Czytasz ludzi szybciej niż oni sami siebie."
- "Twoja czujność z dzieciństwa stała się Twoim radarem dla bullshitu."

### 4. Powtórzenia placementów między sekcjami

W natal interpretacji "Mars w Koziorożcu egzaltowany + Słońce w Baranie" pojawia się jako kluczowa narracja:
- Sekcja 1 (Rdzeń osobowości) - opisany konflikt
- Sekcja 3 (Supermoce) - "Twój Słońce w Baranie daje Ci inicjatywę, Mars w Koziorożcu daje Ci wytrwałość"
- Sekcja 5 (Kariera) - "Mars w Koziorożcu egzaltowany + Słońce w Baranie = osoba która naturalnie ciągnie do pozycji gdzie sama decyduje"

To samo, trzy razy. User na koniec wie tylko o Marsie-Koziorożcu i Słońcu-Baranie.

**Rozwiązanie**: instrukcja "PRZED pisaniem ustal który placement ma którą sekcję jako 'dom'. Każdy placement omów głęboko TYLKO w swojej domowej sekcji. W innych sekcjach możesz nawiązać jednym zdaniem, ale nie opisuj ponownie."

### 5. Stereotypy płciowe w synastrii

W Maciej × Joanna: "Merkury Joanny w Skorpionie jest w znaku Wenus Macieja, co oznacza że ona intuicyjnie wyczuwa jego emocjonalne potrzeby."

To nie wynika z aspektu (Merkury w znaku Wenus partnera nie ma takiego znaczenia astrologicznego). To wynika z domyślnej narracji "kobieta intuicyjna, mężczyzna pragmatyczny".

Inne miejsca:
- "on buduje bezpieczeństwo materialne, ona szuka przygód intelektualnych" (Słońce w Koziorożcu vs Strzelcu - to NIE jest płciowo specyficzne)
- "ona może nieświadomie krytykować jego pomysły" (Saturn Joanny vs Merkury Macieja - aspekt mówi o dynamice, nie o tym że to robi kobieta)

**Rozwiązanie**: explicit zakaz - "Atrybuty wynikają z aspektów, nie z płci. Jeśli partner_a ma Saturn w opozycji do Merkury partner_b - to nie znaczy że osoba z Saturnem 'krytykuje' osobę z Merkurym (zależnie od płci). Opisuj dynamikę aspektu, nie przypisuj ról na podstawie kto jest kim."

### 6. Daily jest za długi i za miękki

Daily horoskop ma ~250 słów, z trzema sekcjami. To jest produkt który user otwiera RANO przed pracą - on chce wiedzieć w 30 sekund.

Plus: "Twoje pierwsze przeczucie było słuszne" - to nie astrologia, to ezoteryczny coaching. Nie wynika z aspektu.

I: "Twoja intuicja pracuje szybciej niż umysł — zaufaj pierwszemu przeczuciu" - klisza która nic nie znaczy konkretnie.

**Rozwiązanie**: daily max 150 słów. Struktura:
- 1 nagłówek (8-15 słów, konkretny obraz dnia)
- 1 krótki paragraf "co działa" (50 słów max, oparty o JEDEN tranzyt)
- 1 krótki paragraf "co uwiera" (40 słów max, oparty o JEDEN tranzyt)
- 1 konkret "dziś zrób" (1 zdanie, behawioralne, NIE coaching)
- 1 konkret "dziś unikaj" (1 zdanie)

Zero "zaufaj swojej intuicji". Zero "Twoje przeczucie jest słuszne".

### 7. Cliché astrologiczne

W natal i synastry znalazłem:
- "para z silnym wodnym podłożem emocjonalnym"
- "trygon wodny działa jak wewnętrzny kompas"
- "twórcza ekspresja jest naturalnym medium"
- "fundament duchowy"
- "naturalna intuicja"

To jest ten średnio-ezoteryczny żargon który brzmi astrologicznie ale niczego nie mówi konkretnie.

**Rozwiązanie**: rozszerzona banlista - dopisać:
- "wodne podłoże", "ognista energia", "powietrzna lekkość", "ziemska stabilność" (jako metafory bez treści)
- "twórcza ekspresja" (zamień na konkret: malowanie, pisanie, projektowanie)
- "fundament duchowy" 
- "naturalna mądrość"
- "wewnętrzny kompas"
- "energia X znaku"

### 8. Synastry - rady nie wynikają z karty

W synastry często: "→ Stwórzcie wspólny cel finansowy na 5 lat".

To jest porada z poradnika dla par. Nie wynika z konkretnego aspektu w karcie tej pary. Generic dla każdej pary.

Inny przykład: "Wprowadźcie cotygodniową 20-minutową rozmowę o tym, co was irytuje".

To technika z par terapeutycznych. Nie wynika z aspektu.

**Rozwiązanie**: w prompcie synastry: "KAŻDA porada musi wynikać z KONKRETNEGO aspektu właśnie omawianego w tej sekcji. Test: jeśli możesz dać tę samą poradę innej parze - to porada nie wynika z karty, to porada generic. Wymyśl inną."

---

## Implementacja: pole "forma gramatyczna" w bazie i onboardingu

### Migracja DB

```sql
ALTER TABLE birth_data 
ADD COLUMN grammatical_form VARCHAR(20) DEFAULT 'impersonal';
-- wartości: 'masculine' | 'feminine' | 'impersonal' | 'they'
```

### UI - 4. krok onboardingu (lub 3.5 - integrowane z imieniem)

Po wpisaniu imienia, pytanie:

```
Jak chcesz żeby brzmiały opisy?
○ W formie męskiej ("zauważyłeś", "byłeś")
○ W formie żeńskiej ("zauważyłaś", "byłaś")  
○ Bezosobowo ("można zauważyć", "warto sprawdzić")
○ Inna forma (opisz w polu poniżej)
```

Default sugerujemy po imieniu (Maciej → męska, Anna → żeńska), ale user może zmienić.

### Edge function

Pass `grammatical_form` jako parametr do prompta. W system prompcie:

```
FORMA GRAMATYCZNA: {grammatical_form}

Zasady:
- masculine: wszystkie czasowniki w formie męskoosobowej ("zauważyłeś", "byłeś", "doświadczyłeś")
- feminine: wszystkie czasowniki w formie żeńskoosobowej ("zauważyłaś", "byłaś", "doświadczyłaś")
- impersonal: konstrukcje bezosobowe i z "się" ("można zauważyć", "warto sprawdzić", "doświadcza się")
- they: forma "oni" lub bezosobowo (do dyskusji z koleżanką jaka konwencja)

KRYTYCZNE: trzymaj się JEDNEJ formy w całej interpretacji. Nigdy nie mieszaj.
```

### Backfill istniejących userów

```sql
-- domyślnie bezosobowe dla istniejących userów (najbezpieczniej)
UPDATE birth_data SET grammatical_form = 'impersonal' 
WHERE grammatical_form IS NULL AND relation = 'self';

-- dla dzieci - zawsze bezosobowo (rodzic czyta o dziecku)
UPDATE birth_data SET grammatical_form = 'impersonal' 
WHERE relation = 'child';
```

---

## Ulepszony prompt natal v3 (gotowy do wklejenia)

System prompt - kluczowe nowe sekcje (reszta jak w v2):

```
[wcześniejsze sekcje persona, twarde zasady, banlista - jak w v2]

# Forma gramatyczna

UŻYTKOWNIK ma w karcie pole grammatical_form = {grammatical_form}. Wartości:
- "masculine" → używaj wszystkich form męskoosobowych ("byłeś", "zauważyłeś", "doświadczyłeś", "zmęczony", "samotny")
- "feminine" → wszystkie formy żeńskoosobowe ("byłaś", "zauważyłaś", "doświadczyłaś", "zmęczona", "samotna")
- "impersonal" → konstrukcje bezosobowe ("można doświadczyć", "warto zauważyć", "często się czuje", "bywa tak że")

ZASADA NIEZBYWALNA: w całej interpretacji TRZYMAJ SIĘ JEDNEJ FORMY. Nigdy nie mieszaj. Jeśli wpadasz w wątpliwość - sprawdź końcówkę i przepisz.

# Anty-meta zasada

NIGDY nie pisz "Bez X opieram się na Y", "Pomijam Z", "Bez dostępu do W". User wie co podał. Zacznij każdą sekcję od konkretnego placementu, nie od wyjaśnienia czego ci brakuje.

Jeśli brakuje godziny urodzenia: po prostu ignoruj Ascendent, MC, domy. Skupiamy się na planetach w znakach i aspektach. Nie wyjaśniaj tego userowi.

# Wymóg one-linerów

W KAŻDEJ z 7 sekcji wypracuj minimum 1 zdanie napisane jak cytat - nie jak ekspozycja.

Cytatowe zdanie = krótkie (max 15 słów), z formą paradoksu, kontrastu lub odwrócenia oczekiwań.

DOBRZE:
- "Twoje 'za dużo' jest dokładnie odpowiednią ilością - dla właściwych ludzi."
- "Czytasz ludzi szybciej niż oni sami siebie."
- "Twoja czujność z dzieciństwa stała się Twoim radarem dla bullshitu."

ŹLE:
- "Twoja intuicja jest twoim atutem." (brak kontrastu, brak ostrości)
- "Masz wrażliwość połączoną z siłą." (banał)
- "Twoja unikalna kombinacja..." (zakazane słowo "unikalna")

# Hierarchia "domowych" sekcji

PRZED pisaniem ustal która sekcja jest "domem" dla którego placementu:
- Sun/Moon/Asc → sekcja 1 (Rdzeń osobowości) - omawiasz GŁĘBOKO
- Moon dodatkowo → sekcja 2 (Wewnętrzne dziecko) - inny aspekt Moon
- Mars → sekcja 4 (relacje) LUB sekcja 5 (kariera) - WYBIERZ JEDNĄ
- Wenus → zazwyczaj sekcja 4
- Saturn → zazwyczaj sekcja 6 (cienie)
- Jowisz → zazwyczaj sekcja 3 (talenty)
- Itd.

KAŻDY placement omów głęboko TYLKO w domowej sekcji. W innych sekcjach: jednozdaniowe nawiązanie ("Mars w Koziorożcu - więcej w sekcji o karierze"). NIGDY nie powtarzaj opisu placementu.

# Rozszerzona banlista (dopisz do istniejącej)

NIGDY:
- "Wodne podłoże emocjonalne", "ognista energia", "powietrzna lekkość", "ziemska stabilność"
- "Twórcza ekspresja" (zamień na konkret: malowanie, pisanie, projektowanie, kuchnia)
- "Fundament duchowy"
- "Naturalna mądrość" 
- "Wewnętrzny kompas"
- "Twoje energie..."
- "Energia X znaku"
- "Twoje przeczucie było słuszne" (NIE jesteśmy coachem ezoterycznym)
- "Zaufaj procesowi"
- "Zaufaj sobie" (bez konkretu W CZYM zaufać)

[reszta promptu jak v2]
```

---

## Patch dla daily prompt v3 (kompletna nowa wersja)

Daily output ma być max 150 słów, jeden mocny nagłówek + dwa krótkie paragrafy + dwa konkrety.

```
[system prompt z persona, formą gramatyczną, banlistą - taki sam jak natal]

# Specyficznie dla daily

FORMAT OUTPUTU (sztywny):

## Nagłówek dnia
1 zdanie, 8-15 słów. KONKRETNY OBRAZ, nie abstrakcja.

DOBRZE: "Dzień konkretnych decyzji - z mglistych planów wybierz jeden."
DOBRZE: "Dzień gdy lepiej posłuchać niż mówić."
ŹLE: "Twoja intuicja pracuje szybciej niż umysł." (klisza)
ŹLE: "Dzień pełen możliwości." (puste)

## Co dziś wspiera
1 paragraf, max 50 słów. Oparty o JEDEN konkretny tranzyt (najściślejszy applying aspect dnia). Pokaż JAK to się manifestuje konkretnie w działaniu/myśleniu/emocjach.

ZASADA: musi być JEDEN konkretny tranzyt z nazwą, nie ogólnik.

## Co dziś uwiera
1 paragraf, max 40 słów. Oparty o JEDEN trudny tranzyt (najściślejszy applying napięciowy). Bez katastrofizowania. "To nie problem - to wymaga uwagi."

## Dziś
- **Zrób:** 1 zdanie, konkretne behawioralne polecenie (NIE "zaufaj sobie")
- **Unikaj:** 1 zdanie, konkretne czego unikać

KRYTYCZNE: 
- Max 150 słów łącznie
- Każdy element MUSI wynikać z konkretnego tranzytu lub natal placementu, nie generic
- Zero "zaufaj swojej intuicji", "Twoje pierwsze przeczucie", "wszechświat dziś..."
- Pisz jak doświadczona astrolożka która ma 2 minuty żeby przekazać sedno
```

---

## Patch dla synastry prompt v3

Główne zmiany vs v1:

1. **Atrybuty wynikają z aspektów, nie z płci**

Dodaj do system promptu:

```
# Zakaz stereotypów płciowych

Synastria opisuje dynamikę między DWIEMA OSOBAMI niezależnie od ich płci.

ZAKAZANE konstrukcje typu:
- "Ona intuicyjnie wyczuwa jego potrzeby" (chyba że WYNIKA z konkretnego aspektu - i wtedy tłumacz przez aspekt, nie przez płeć)
- "On buduje stabilność, ona szuka przygód" (chyba że dosłownie wynika z aspektu)
- "Kobieca intuicja", "męski pragmatyzm"

Zamiast tego: pisz po imieniu LUB "osoba z Marsem w Skorpionie", "osoba z Wenus w Byku". Aspekt opisuje DYNAMIKĘ, nie przypisuje ról.

Przykład źle:
"Ona może nieświadomie krytykować jego pomysły"

Przykład dobrze:
"Saturn Joanny w opozycji do Merkurego Macieja - struktura jej myślenia może wydawać się Maciejowi krytyczna nawet gdy nie jest tak zamierzona. To dynamika 'sprawdzanie vs proponowanie'."
```

2. **Każda rada wynika z konkretnego aspektu tej sekcji**

```
# Zasada: rady wynikają z aspektów

KAŻDA porada (te → strzałki na końcu sekcji) musi:
- Wynikać z aspektu OPISANEGO w tej konkretnej sekcji
- Być nieobszczepialna - nie mogłaby pasować do innej pary z innymi aspektami

TEST: jeśli możesz dać tę samą poradę dowolnej parze - to porada generic, wymyśl inną.

Źle (porady generyczne):
- "Stwórzcie wspólny cel finansowy na 5 lat"
- "Wprowadźcie cotygodniową 20-minutową rozmowę"
- "Słuchajcie się nawzajem"

Dobrze (porady oparte o aspekt):
- "Macie Wenus-Mars koniunkcję - fizyczne przyciąganie jest waszą siłą. Specjalnie planujcie czas na bliskość, bo łatwo wam ją 'odłożyć' gdy życie się komplikuje."
- "Saturn Joanny w opozycji do Merkurego Macieja - gdy ona analizuje Twój pomysł, nazwij to ('analizujesz mnie') zamiast czuć się krytykowanym. Aspekt opozycji uczy świadomości lustra."
```

3. **Score uzasadnione**

```
# Score per sekcja

Score 0-100 NIE może być losowy. Musi wynikać z:
- Liczba aspektów harmonijnych (trygon, sekstyl) z orbem <3°: każdy +5 do score
- Liczba aspektów napięciowych (kwadrat, opozycja) z orbem <3°: każdy -3 do score
- Konjunkcje: zależnie od planet (Wenus-Mars = +8, Saturn-Mars = -5)
- Bazowy score: 50

To NIE są dokładne wzory, ale powinieneś móc uzasadnić DLACZEGO 72 a nie 60.

Score całkowity = średnia z 4 sekcji.
```

---

## Workflow testowania (przed deploymentem v3)

### Test gramatyki (krytyczne)

Wygeneruj interpretacje dla 3 testowych userów z różnymi grammatical_form:
1. Mac (masculine)
2. Anna (feminine)
3. Test (impersonal)

Sprawdź każdą interpretację linia po linii:
- Czy wszystkie czasowniki są w jednej formie?
- Czy są jakieś "wystaje" (np. "doświadczyłeś" w impersonal?)
- Czy końcówki przymiotników są spójne?

Jeśli choć 1 wystającą formę znajdziesz - prompt nie gotowy.

### Test "wow factor"

Wygeneruj interpretację Twojej karty (Maca). Po przeczytaniu zaznacz fluorescentem zdania które:
- Byś wkleił/a w story na IG
- Byś pokazał/a znajomemu z komentarzem "patrz co o mnie wyszło"
- Cię zaskoczyło

Cel: 5+ takich zdań na całą interpretację. Jeśli <3 - prompt potrzebuje więcej "one-liner work".

### Test braku powtórzeń

Wygeneruj interpretację. Wymień wszystkie placement'y w jednej kolumnie, w drugiej wpisz w której sekcji są opisane:

| Placement | Sekcja domowa | Czy wspomniany gdzie indziej? |
|---|---|---|
| Sun w Baranie | 1 | Sekcja 7 - 1 zdanie ✓ |
| Mars w Koziorożcu | 5 | Sekcja 3 - 1 zdanie ✓ |
| ... | ... | ... |

Jeśli któryś placement jest opisany W PEŁNI w więcej niż 1 sekcji - prompt nie gotowy.

### Test "anti-meta"

Zrób Ctrl+F na słowa: "opieram się", "bez dostępu", "pomijam", "z uwagi na brak". Powinno być 0 wystąpień.

### Blind review z koleżanką

Daj jej 3 interpretacje (Twoja, koleżanki, jeszcze 1):
- v1 (obecna)
- v2 (improved tone)
- v3 (improved tone + few-shot + nowe zasady)

Anonimizuj. Niech zgaduje która lepsza. Cel: v3 > v2 > v1 w jej blind ocenie.

---

## Action items - co zrobić teraz

1. **Dziś / jutro**: Dodaj migrację `grammatical_form` w bazie + 4. krok onboardingu (lub 3.5)
2. **Dziś / jutro**: Zaktualizuj prompty (natal, daily, synastry) z patch'ami v3
3. **Test**: wygeneruj kartę dla siebie (masculine), Anny (feminine), test (impersonal) - sprawdź gramatykę
4. **Weekend**: pokazujesz koleżance OBOK SIEBIE: v2 (obecny) vs v3 - co lepiej brzmi
5. **Po weekendzie**: zbieraj few-shot examples od koleżanki (kluczowe dla v4 - patrz `natal-prompt-v2.md`)

---

## Co NIE zmieniać w prompcie

Pochwała: Twoja interpretacja Soni (2-letniej) jest najsilniejsza. Trzymaj się tej hierarchii (Księżyc-Ryby-Saturn jako centrum), tego stylu konkretnych wskazówek rodzicielskich, i końcowego disclaimer'u. To działa.

Też dobrze działa: sekcja "Cienie" w natal Maca - "Wzorzec behawioralny: tłumienie aż do wybuchu." Ten poziom konkretu z konkretnym opisem cyklu - utrzymać.

---

## Changelog

- **v3.0 (2026-05-18)** - audyt 4 real outputów + 8 konkretnych usprawnień. Główne: forma gramatyczna jako pole, anty-meta, hierarchia "domowych" sekcji, wymóg one-linerów, anty-stereotypy w synastry.
