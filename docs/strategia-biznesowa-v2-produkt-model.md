---
title: Cosmogram — Strategia biznesowa v2 (korekta economics + zmiany produkt/model)
type: business-strategy
owner: Mac
created: 2026-06-21
analyst: Business Strategist (tryb Deep)
supersedes: docs/strategia-biznesowa-v1.md (sekcja unit economics)
note: v1 nadal ważne dla Five Forces, ERRC, pozycjonowania. v2 koryguje liczby (VAT) i dokłada rekomendacje produktowo-modelowe.
---

# Korekta i czego ona uczy

W v1 nie odjąłem VAT. To był błąd, który zawyżył marżę. Po korekcie (VAT 23% + Stripe + AI) obraz jest twardszy, ale ostrzejszy i bardziej użyteczny.

Jedna liczba, która zmienia rozmowę o cenie: **przy 19,99 z VAT break-even infrastruktury to ~68 płatnych. Przy 24,99 spada do ~51.** Twoja intuicja „50 płatnych" jest poprawna, ale tylko przy wyższej cenie. Przy 19,99 VAT zjada Ci 17 dodatkowych płatników, zanim w ogóle wyjdziesz na zero.

---

# 1. Unit economics po korekcie
*Frameworki: Contribution Margin i Break-even, LTV (Skok)*

**Marża kontrybucyjna / miesiąc** (netto po VAT, minus Stripe ~2% +1 zł +tax, minus AI):

| Cena brutto | Netto po VAT | AI 1,5 zł | AI 2,5 zł | AI 4,0 zł |
|---|---|---|---|---|
| 19,99 | 16,25 | 12,75 | **11,75** | 10,25 |
| 24,99 | 20,32 | 16,69 | **15,69** | 14,19 |
| 29,99 | 24,38 | 20,63 | **19,63** | 18,13 |

Marża brutto spadła z ~80% (błędne v1) do ~59% przy 19,99. To jest cienka marża miesięczna.

**Plan roczny 149 zł** (jedna prowizja Stripe na rok zamiast dwunastu): CM ~80-92 zł z góry. Roczny jest strukturalnie dużo lepszy, bo płacisz jeden raz fix Stripe, a nie 12 razy, i kasujesz ryzyko churnu.

**Break-even (płatni miesięczni potrzebni na pokrycie kosztu stałego), CM bazowe @ AI 2,5:**

| Koszt stały | Przy 19,99 (CM 11,75) | Przy 24,99 (CM 15,69) |
|---|---|---|
| Infra ~800 zł | ~68 | ~51 |
| Infra + marketing 1500 | ~196 | ~147 |

**LTV wg churnu (CM 11,75 przy 19,99):**

| Churn / mc | Życie | LTV | Sufit CAC (3x) |
|---|---|---|---|
| 10% | 10 mc | 118 zł | 39 zł |
| 15% | 6,7 mc | 78 zł | 26 zł |
| 20% | 5 mc | 59 zł | 20 zł |
| 25% | 4 mc | 47 zł | 16 zł |

Przy 24,99 i churnie 15% LTV rośnie ze 78 do 105 zł, a sufit CAC z 26 do 35 zł. Cena i churn to dwie dźwignie, które decydują, czy w ogóle masz z czego płacić za usera.

**Koszt AI to teraz 13-34% Twojej marży.** Przy CM 11,75 każda złotówka kosztu modelu na aktywnego płatnika boli. To czyni kontrolę kosztu AI metryką pierwszej wagi, nie ciekawostką.

---

# 2. Prawdziwy problem (i on jest produktowy)
*Framework: JTBD (Christensen) — do jakiej pracy klient wynajmuje produkt*

Niewygodna diagnoza: **kosmogram i Match to wartość jednorazowa.** Generujesz, czytasz „wow", i co dalej? Płacisz 20 zł co miesiąc za coś, co w pełni zobaczyłeś w pierwszym tygodniu. To jest klasyczny przepis na churn w subskrypcji.

To, co realnie ma utrzymać miesięczną opłatę, to warstwa powtarzalna, którą już macie:
1. **Astrea chat** (relacja, która trwa)
2. **Kalendarz i Dni Mocy** (timely, indywidualne, „ten tydzień ma dla Ciebie znaczenie")
3. **Maile tygodniowe i miesięczne z prognozą** (rytm powrotu)

Cała gra retencyjna toczy się o to, czy te trzy rzeczy są na tyle wciągające, by usprawiedliwić powtarzalną opłatę. Dziś kosmogram robi „wow" na wejściu, ale to nie on Cię utrzyma. Utrzyma Cię Astrea i kalendarz. Dlatego strategia produktu to przesunięcie ciężaru z jednorazowego objawienia na powtarzalny nawyk.

---

# 3. Zmiany w PRODUKCIE (na funkcjach, które macie)
*Framework: Four Fits, North Star = retencja płatnych 30 dni*

Żadnych nowych wielkich funkcji. Trzy ruchy na istniejącym:

**A. Astrea jako proaktywna relacja, nie reaktywne okienko.**
Dziś chat czeka, aż user go otworzy. Retencyjny odlot zaczyna się, gdy Astrea sama się odzywa, indywidualnie i w czasie. Mail tygodniowy ma być głosem Astrei („Twój tydzień: Wenus wchodzi w aspekt do Twojego Księżyca, oto co to znaczy u Ciebie"), a nie bezosobową prognozą. To zamienia mail w bicie serca produktu i wciąga z powrotem do czatu. Metryka: mail → klik → sesja, i liczba sesji czatu na aktywnego płatnika.

**B. Kalendarz i Dni Mocy jako cotygodniowy powód otwarcia.**
To Twój najmocniejszy powtarzalny, indywidualny hak. Osobiste Dni Mocy z tranzytów to jedyna rzecz w produkcie, która jest jednocześnie timely, indywidualna i powtarzalna. Mail tygodniowy powinien zaczynać się od „Twój najważniejszy dzień w tym tygodniu" i prowadzić w głąb aplikacji. To jest anty-churn rdzeń, postaw go w centrum.

**C. Spraw, by kosmogram się pogłębiał, a nie wyczerpywał.**
Dziś natal czyta się raz. Niech tranzyty czynią go żywym (to samo zdarzenie w karcie znaczy co innego dziś niż za miesiąc). Niech Astrea odwołuje się do niego w każdym kontakcie. Subskrypcja ma sprawiać wrażenie, że się pogłębia, a nie że wszystko widziałeś w tygodniu pierwszym.

(Push, streak, dziennik z v1 wycofuję jako rekomendację. Nie macie ich i nie są konieczne. Maile plus Astrea plus kalendarz wystarczą jako silnik powrotu, jeśli zrobicie z nich indywidualny rytm. Push to ewentualny późniejszy wzmacniacz haka kalendarza, nie warunek.)

---

# 4. Zmiany w MODELU BIZNESOWYM
*Frameworki: Anchoring (Kahneman, Tversky), JTBD pricing*

**A. Cena → test 24,99 zł/mc.** To już nie kosmetyka. To różnica między break-even przy 51 a 68 płatnych. Po VAT 19,99 jest strukturalnie za cienkie. Twoja płacąca persona płaci 25-40 zł za Calm i Headspace, 25 zł jej nie odstraszy.

**B. Plan roczny jako domyślny wybór, nie alternatywa.** CM 80-92 zł z góry, jedna prowizja zamiast dwunastu, churn skasowany. Ustaw roczny wizualnie jako oczywisty (kotwica „prawie 3 miesiące gratis" przy 24,99/199). Im wyższy miks rocznego, tym mniej Twój biznes zależy od miesięcznego churnu, który Cię zabija.

**C. Governance kosztu AI jako metryka P0.** Przy CM ~12 zł koszt modeli to 13-34% marży. Trzymaj chat i prognozy na Haiku, Sonnet tylko tam, gdzie jakość tego wymaga (natal). Mierz koszt AI na aktywnego płatnika co tydzień. Macie już hamulec na czat (limity, chat pack) i to dobra decyzja, pilnujcie jej.

**D. Dołóż wysokomarżowe raporty jednorazowe.** To pasuje do natury produktu i ratuje cienką marżę miesięczną. Jednorazowy głęboki raport (prognoza roczna, raport kariery, bagaż karmiczny) za 39-79 zł nie generuje powtarzalnego kosztu AI i ma wysoką marżę. Część ludzi nigdy nie kupi subskrypcji, ale zapłaci raz za duże objawienie. Add-ony, które już macie (Match 9,99 też dla free, chat pack), idą w tę samą stronę. To jest druga noga przychodu obok subskrypcji.

**E. Free tier ma konwertować, nie palić AI.** Darmowy natal 3/8 plus 3 wiadomości czatu kosztują Cię AI bez gwarancji konwersji. Upewnij się, że free robi „wow" i stawia twardą ścianę, a nie daje tyle, że nie ma po co płacić. Mierz koszt AI free tier vs konwersja na płatne.

**F. Sprawdź status VAT z księgowym.** Jeśli obrót jest poniżej 200 tys. zł/rok i sprzedajesz głównie polskim konsumentom, możliwe jest zwolnienie podmiotowe z VAT. Wtedy CM przy 19,99 wraca z ~12 do ~16 zł. Uwaga: sprzedaż usług cyfrowych konsumentom w innych krajach UE i tak uruchamia VAT-OSS od pierwszej transakcji. To pytanie do księgowego, ale to realna dźwignia marży, jeśli akurat się łapiesz.

---

# 5. Fosa bez zależności od astrolożki
*Framework: 7 Powers (Helmer)*

Skoro nie wiesz, gdzie jej miejsce, nie buduj na niej strategii. To, co realnie kontrolujesz i co stanowi fosę:

- **Jakość silnika interpretacji (cornered resource, którego sam jesteś właścicielem).** Twoje dostrojone prompty, golden testy, architektura „kod liczy, AI pisze". Kopista z surowym GPT da generyk. Ty dajesz trafny, indywidualny odczyt. To jest realna przewaga, choć erodowalna, więc inwestuj w jakość jako aktyw, nie tylko feature.
- **Brand Astrea.** Nazwany, ciepły, polski głos. Ludzie wracają do osoby.
- **Indywidualna trafność (Swiss Ephemeris, pełny kosmogram).** Precyzja, której darmowe apki nie dają.
- **Switching cost z danych usera.** Zapisane kosmogramy, kosmogramy dzieci, historia matchów, kontekst, który Astrea pamięta. Im więcej user zgromadzi, tym drożej mu odejść. To budujesz retencją.

Astrolożka jest opcją, nie filarem. Gdybyś kiedyś szukał dla niej miejsca, naturalne są dwa: walidacja jakości interpretacji (podnosi Twój najtwardszy aktyw) albo autorytet w treści marketingowej („tworzone z astrologami"). Ale to dodatek, nie zależność, i nic nie musisz formalizować teraz.

---

# 6. Priorytety (zaktualizowane)

**P0 — Przeżycie**
- Przesuń ciężar wartości na warstwę powtarzalną: Astrea proaktywna w mailu tygodniowym + kalendarz jako cotygodniowy hak. Bez nowych funkcji, lepsze wykorzystanie istniejących.
- Test ceny 24,99 + roczny jako domyślny. To Twoja największa dźwignia, jaką masz przed launchem.
- Instrumentacja: churn płatnych, koszt AI na aktywnego, retencja kohort, mail → sesja.
- Pierwszy milestone: ~51 płatnych (break-even przy 24,99).

**P1 — Rentowność i fosa**
- Switching cost: niech zapisane dane i pamięć Astrei rosną z czasem.
- Wysokomarżowe raporty jednorazowe jako druga noga przychodu.
- Cel ~100-150 płatnych, biznes finansuje się sam.

**P2 — Rozwidlenie: skalowanie czy lifestyle**
- Bramka: przy ~150 płatnych churn < 12%/mc i CAC < 30 zł → masz fundament, skaluj. Churn uparcie > 18% → to lifestyle business, dój marżę zamiast inwestować w wzrost.

---

# 7. Ryzyka (zaktualizowane)
*Framework: Inversion (Munger)*

1. **Jednorazowość produktu wygrywa z subskrypcją.** Jeśli warstwa powtarzalna (Astrea, kalendarz) nie wciągnie, ludzie płacą raz i znikają. To ryzyko numer jeden i jest produktowe. Mitygacja: sekcja 3.
2. **Cienka marża plus koszt AI.** Przy CM ~12 zł power user na Sonnecie potrafi zejść poniżej zera. Mitygacja: Haiku domyślnie, limity, monitoring kosztu/usera, cena 24,99.
3. **Churn ponad 15%/mc.** Wtedy żaden kanał akwizycji się nie spina. Mitygacja: roczny plan i warstwa powtarzalna.
4. **Pasmo founder-a.** Jeden operator robi wszystko. Mitygacja: jedna rzecz naraz, automatyzacja treści.
5. **Zależność od platformy w dystrybucji.** Mitygacja: zbieraj email od dnia 1, własny kanał.

---

# 8. Decyzje dla Ciebie

1. **Cena.** Test 24,99 + roczny jako domyślny. To jest ruch, który zamienia break-even z 68 na 51 płatnych. Najwyższa dźwignia, najmniejszy koszt.
2. **Warstwa powtarzalna jako P0.** Zgoda, że robimy Astreę proaktywną w mailu i kalendarz jako cotygodniowy hak, zanim dołożymy cokolwiek nowego?
3. **Druga noga przychodu.** Wchodzimy w jednorazowe raporty wysokomarżowe (39-79 zł), czy zostajemy przy czystej subskrypcji plus drobne add-ony?
4. **VAT.** Sprawdzisz z księgowym status zwolnienia podmiotowego? To może oddać Ci ~4 zł marży na subskrypcji.
