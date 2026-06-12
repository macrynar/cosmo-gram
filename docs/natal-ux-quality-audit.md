# Audyt kosmogramu natalnego — jakość, UX, efekt wow

Data: 2026-06-11 · Materiał: widok aplikacji (screeny) + publiczna strona share (Asia)

---

# 1. Co już działa — i czego nie ruszać

Treść interpretacji jest na wysokim poziomie: cytuje konkretne pozycje (Wenus w XII w Skorpionie, Saturn przy Słońcu, Węzeł Płn. w Baranie w V), trzyma ton „symbolicznego lustra", nazywa cienie bez straszenia, a moduł „Cienie do integracji" zawiera wzorowe przekierowanie do terapeuty. Cytaty-nagłówki w serif („Dom, który nosiło się w sobie, zanim nauczono się mówić") to najmocniejszy element językowy produktu. Wielka Trójka jako karty okalające koło, efekt przygaszania koła przy hoverze, „Dominuje Woda" — kierunek estetyczny jest właściwy. Audyt dotyczy więc dopracowania diamentu, nie ratowania produktu.

---

# 2. KRYTYCZNE — rzeczy łamiące zaufanie (napraw przed czymkolwiek innym)

## 2.1 Niespójne metryki między modułami

„Głębokość percepcji" = **88** w Rdzeniu tożsamości i **92** w Supermocach — ta sama etykieta, dwie wartości na jednej stronie. Do tego pięć wariantów tej samej cechy z rozrzuconymi wartościami: „Dostępność emocjonalna 38", „Próg otwarcia emocjonalnego 28", „Gotowość do bliskości 42", „Odwaga w wyrażaniu potrzeb 44", „Dostęp do czułości wobec siebie 38". Uważny czytelnik (a płacący user JEST uważny — czyta o sobie) zobaczy, że liczby są dekoracją, i przestanie wierzyć całości.

**Fix:** rejestr metryk liczony DETERMINISTYCZNIE z kosmogramu (jeden algorytm: pozycje → wartości), nie per moduł przez AI. Każda metryka ma jedną kanoniczną nazwę i jedną wartość w całym dokumencie; moduły wybierają z rejestru, nigdy nie wymyślają. To samo dotyczy tagów.

## 2.2 Błędy językowe i forma rodzajowa

- **Forma męska do kobiety**: „co powiedziałbyś bliskiej osobie" — w kosmogramie Asi. W polszczyźnie to natychmiast widoczne i osobiście bolesne (treść „o mnie" w cudzym rodzaju). Fix: przekazywać do promptu formę gramatyczną (z imienia lub jawnego wyboru przy tworzeniu kosmogramu: ona/on/forma neutralna) + golden test na zgodność rodzaju.
- Rusycyzm „**Wenera** i Pluton" (powinno być Wenus), „skarbem zakopany w ziemi" (→ zakopanym), „zdolność do emocjonalnego samowystarczalności" (→ emocjonalnej), tooltip „ASCENDENT W SKORPION" (→ w Skorpionie — odmiana znaków w UI musi być z mapy deklinacji, nie sklejana).
- Skróty znaków: „MC 19° **Pan**" — Panna skrócona do „Pan" czyta się jak „pan". Używać pełnych nazw lub glifów.

**Fix systemowy:** etap korekty językowej w pipeline (drugi, tani przebieg modelu: „popraw wyłącznie błędy językowe, nie zmieniaj treści") + golden testy na deklinację i rodzaj.

## 2.3 Strona share rozdaje wszystko i ma błędy

- **Cała treść premium (8 pełnych modułów) jest publiczna** w share linku. Każdy link = darmowy pełny odczyt dla nieograniczonej liczby osób. Rekomendacja: share pokazuje koło + Wielką Trójkę + 1–2 moduły wybrane przez właściciela + tytuły pozostałych z CTA — wirusowość zostaje, wartość premium nie wycieka.
- **Data i miejsce urodzenia publicznie** (1986-12-04, Suwałki) — niezgodne z ustaleniami P0.4. Domyślnie ukryte, opcjonalny toggle właściciela.
- Meta description: „Stwórz swój własny na **cosmogram.pl**" — zła domena (literówka w meta, jest cosmo-gram.com).
- Brak OG image — link udostępniony na Messengerze/IG wygląda jak goły tekst. To największa zmarnowana okazja wirusowa (analogicznie do OG matcha z promptu P1-2: koło + Wielka Trójka + imię).
- Link „Chat" na publicznej stronie prowadzi do `/app/chat` (strefa zalogowana) — ślepy zaułek dla gościa.

---

# 3. Koło kosmogramu — UX

1. **Znaki zodiaku jako fioletowe „kafelki emoji"** gryzą się z resztą: koło jest eleganckie, liniowe, złote — a na nim 12 błyszczących ikonek jak z iOS. Jeden język wizualny: glify rysowane linią (jak ikony Słońca/Księżyca na kartach), złoto/fiolet duotone.
2. **Stellium = kolizja planet**: przy skupisku w Strzelcu planety nakładają się na siebie (Wenus/Pluton/Merkury niemal jedno na drugim). Potrzebny algorytm rozsuwania (fan-out po łuku + cienka linia prowadząca do realnej pozycji). To częsty układ — co czwarty kosmogram ma stellium.
3. **Aspekty prawie niewidoczne** — ciemnozielone linie na ciemnym tle. A to połowa magii koła. Fix: wyraźniejsza paleta (harmonijne vs napięte: kolor + styl linii), interakcja „tap planety podświetla jej aspekty", legenda. Domyślnie top aspekty, reszta po tapnięciu.
4. **Martwy środek**: duży czarny dysk w centrum nic nie robi. Pomysły: dzisiejszy tranzyt („dziś Księżyc aktywuje Twoje Słońce" — zapowiedź premium), bilans żywiołów, albo po prostu mniejszy dysk = więcej miejsca dla planet.
5. **„Najedź na symbol"** — instrukcja hover na produkcie, który jest PWA mobile-first. Na dotyku: tap. A jeśli interfejs wymaga instrukcji tekstowej, to znaczy, że affordance jest za słaba — lepiej delikatny puls pierwszego symbolu przy wejściu.
6. Tooltip energii znaku (świetny pomysł) działa tylko dla Wielkiej Trójki? Powinien działać dla każdej planety na kole — to darmowa eksploracja, która uczy usera astrologii i wydłuża sesję.

---

# 4. Prezentacja treści (8 modułów)

1. **Dwie kolumny długiego tekstu obok siebie** na desktopie — oko skacze między równoległymi narracjami. Czytanie o sobie to lektura immersyjna: jedna kolumna (max ~70 znaków), moduły jeden po drugim.
2. **Brak nawigacji po 25+ minutach czytania**: sticky mini-spis (8 kropek/ikon z nazwami), progress czytania, „czytasz 3/8". Rama „8 rozdziałów o Tobie" podnosi postrzeganą wartość — to nie strona, to portret.
3. **Brak warstwy „skąd to wiem"**: pod nagłówkiem modułu chipy źródłowe („Na podstawie: Wenus w XII · Wenus∠Pluton · Księżyc w Koziorożcu w II"). Tekst to zawiera, ale chipy dają skanowalność i wiarygodność, a po tapnięciu mogą podświetlać te punkty na kole — domknięcie pętli koło↔treść.
4. **Paski metryk**: opisy pod paskami są świetne („mięsień rzadko używany — jest, czeka na trening" to wzorcowe pozytywne ramowanie niskiej wartości — utrzymać ten standard wszędzie). Brakuje kontekstu skali — co znaczy 38? Delikatne strefy na pasku lub etykieta słowna obok liczby.
5. **Emoji w nagłówkach modułów** (⚡❤️🚀🌑) — tanie obok serif i złota. Własne ikony liniowe w stylu kart.
6. Mobile: ściana tekstu — rozdziały zwijane do leadu (pierwszy akapit + „czytaj dalej") z zapamiętanym stanem przeczytania.

---

# 5. Wow — szybkie wygrane (poza tym, co już jest w promptach P1)

1. **Quote cards**: każdy cytat-nagłówek jako generowana grafika 9:16 (Instagram story) z brandingiem — przycisk „zapisz/udostępnij" przy cytacie. Osiem darmowych nośników marketingu na każdego usera. To najtańszy wzrost organiczny, jaki ten produkt może mieć.
2. **OG image dla share natala** (koło + Wielka Trójka + imię) — wymienione w 2.3, technicznie to samo co OG matcha z P1-2.
3. **Bilans żywiołów i modalności** jako wizual (już jest „Dominuje Woda" — rozwinąć w 4-segmentowy pasek z 1 zdaniem interpretacji).
4. **„Dziś na Twoim niebie"** w centrum koła lub nad modułami — zszywa natal z horoskopem tranzytowym (P1-1) i daje powód codziennego powrotu do kosmogramu.
5. Wersja audio interpretacji (TTS, premium) — „posłuchaj swojego portretu" w drodze do pracy; do rozważenia po P2, notuję, bo pasuje do formatu 25-minutowej treści.

---

# 6. Priorytety wykonania

| # | Zadanie | Dlaczego najpierw |
|---|---|---|
| 1 | Rejestr metryk + dedup tagów (2.1) | łamie zaufanie płacącego usera |
| 2 | Rodzaj gramatyczny + korekta językowa w pipeline (2.2) | jw., błędy widać natychmiast |
| 3 | Share: ograniczenie treści, ukrycie danych urodzenia, domena w meta, OG image (2.3) | wyciek premium + RODO + wirusowość |
| 4 | Aspekty widoczne + interaktywne, fan-out stellium (3.2–3.3) | główny wow koła dziś niewidoczny |
| 5 | Jedna kolumna + sticky nav + chipy źródłowe (4.1–4.3) | komfort 25-min lektury |
| 6 | Spójność ikon (znaki na kole, emoji w nagłówkach) (3.1, 4.5) | szlif języka wizualnego |
| 7 | Quote cards + bilans żywiołów (5.1, 5.3) | wzrost organiczny, mały koszt |

Punkty 1–3 to de facto P0-bis (zaufanie i wyciek wartości), 4–7 to P1-bis (wow). Mogę przygotować prompt dla Claude Code obejmujący całość w tej kolejności.
