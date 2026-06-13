---
title: Landing v2 — masterplan: treści, struktura konwersyjna, plan dojścia
type: plan + content-spec
owner: Mac
created: 2026-06-12
scope: tylko landing page (poligon design systemu dla całej aplikacji)
decisions: logo zostaje bez zmian · typografia = charakterny sans (nie Poppins, nie serif w hero) · social proof = cytaty z odczytów + testimoniale testerów, zero zmyślonych liczb
revised: 2026-06-12 — audyt copy (ludzki język, test czytania na głos), godzina urodzenia opcjonalna wszędzie, mocniejsze haki marketingowe (dane NASA, wiedza tysiącleci), produkt na landingu w formie uniwersalnej (nie screenshoty)
---

# 1. Diagnoza obecnego landingu (na bazie screenów)

**Co działa — nie ruszać:**
- Hero z animowanym układem planet — to jest podpis wizualny marki, zostaje i dostaje upgrade.
- Logo — zostaje bez zmian (decyzja Maca).
- Ciemna, kosmiczna tonacja i ciepły akcent — kierunek właściwy.
- Struktura informacyjna strony — OK, problem jest w egzekucji, nie w mapie.

**Co zabija konwersję i robi efekt „AI-generic":**
1. **Nigdzie nie widać produktu.** Cały landing OPOWIADA o kosmogramie, ale go nie POKAZUJE. User kupuje jakość interpretacji i piękno koła natalnego — a nie zobaczy ani jednego, ani drugiego przed rejestracją. To luka konwersyjna #1.
2. **Poppins-podobny font** = statystyczna średnia internetu. Geometryczny, okrągły, bez charakteru.
3. **Sekcje pod hero zapadają się w generyk**: równy grid 4 identycznych kart, niski kontrast szarości na granacie (tekst na screenach jest ledwo czytelny — to też problem WCAG), accordiony FAQ jak z każdego szablonu.
4. **Niespójny akcent**: CTA pomarańczowe, badge'e złote, ikony w 4 różnych kolorach (fiolet/niebieski/róż/zielony w kartach modułów) — paleta się rozjeżdża.
5. **Brak dowodu** — żadnego cytatu z odczytu, żadnej opinii, żadnego fragmentu produktu.

**Teza przewodnia redesignu: pokazuj, nie opisuj.** Każda sekcja ma zawierać kawałek prawdziwego produktu (koło, fragment interpretacji, kartę matcha, wiadomość z chatu), a nie ikonę + akapit marketingu.

---

# 2. Strategia konwersji — logika sekwencji

Landing prowadzi przez sekwencję: **zaciekawienie → dowód jakości → zrozumienie mechanizmu → zaufanie → cena → domknięcie.** Jeden cel konwersyjny: rejestracja (darmowy kosmogram). Jeden styl CTA primary na całej stronie; wszystko inne wizualnie podrzędne.

Zasada anty-generyczna: **żadnych dwóch sekcji o tym samym układzie.** Rytm strony = zmiana kompozycji co sekcję (pełna szerokość → asymetria 60/40 → poziomy strumień → editorial cytat → …).

---

# 3. Struktura sekcji + draft treści (v2 po audycie językowym)

Forma gramatyczna: neutralna 2 os. (decyzja produktowa). Ton: ludzki język — proste zdania, zero kalk z angielskiego, zero poetyzowania na siłę. **Test każdego zdania: czy powiedział(a)byś to znajomemu przy kawie?** Dwa haki marketingowe przewijające się przez stronę: (1) dane astronomiczne NASA, (2) AI nakarmiona wiedzą astrologiczną gromadzoną od tysięcy lat.

## S1 — Hero (animacja orbit zostaje, dostaje głębię)

- **H1:** `Horoskop, który naprawdę jest o Tobie.`
  (wariant B do testu: `Zrozum siebie i swoje relacje z pomocą gwiazd.` — obecny, jest dobry)
- **Sub:** `Cosmogram łączy dane astronomiczne NASA z wiedzą astrologiczną gromadzoną od tysięcy lat. AI zamienia je w Twój osobisty portret — taki, w którym rozpoznasz siebie, a nie jedną dwunastą ludzkości.`
- **CTA primary:** `Odkryj swój kosmogram →` + microcopy: `Za darmo · bez karty · wystarczy data i miejsce urodzenia`
  (świadomie BEZ godziny w microcopy — godzina pojawia się dopiero w formularzu jako opcja „znasz godzinę? będzie precyzyjniej")
- Upgrade animacji orbit: głębia (paralaksa 2–3 warstw gwiazd), planety z poświatą, orbity reagujące subtelnie na ruch myszy; `prefers-reduced-motion` → statyczny kadr.
- Scroll cue na dole — strona ma wciągać w dół.

## S2 — Produkt jako dowód (NOWA — najważniejsza sekcja strony)

**Forma uniwersalna, nie screenshot.** Wizual budujemy jako stylizowane komponenty w kodzie landingu: koło natalne (linie aspektów kreślą się przy wejściu w viewport) + fragment interpretacji jako typografia. Pokazujemy esencję produktu, nie jego aktualny piksel — landing nie wymaga aktualizacji przy każdym release.

- **Nagłówek sekcji:** `To nie horoskop z gazety. To kilkadziesiąt stron o Tobie.`
- **Sub:** `O tym, jak kochasz, czego unikasz i co przychodzi Ci łatwiej niż innym. Napisane tak, że czyta się jak list od kogoś, kto zna Cię od dawna.`
- Pull-quote z odczytu (serif, duży): wybrać z realnych interpretacji wyimek, który przejdzie korektę językową; przykładowy kierunek tonu: *„Twoja siła nie jest głośna. I właśnie dlatego działa."* — krótko, poprawnie, bez ozdobników.
- **CTA secondary:** `Zobacz przykładowy kosmogram →` (publiczna strona share jako demo).
- Serif tylko tu i w S5 — jako „głos produktu", kontrast z sansem UI.

## S3 — Jak to działa: „Kod liczy. AI pisze."

Mechanizm zaufania i oba haki marketingowe. Trzy kroki połączone linią orbity (nie grid kart):

1. `Podajesz datę i miejsce urodzenia` — *„Znasz godzinę? Świetnie, portret będzie precyzyjniejszy. Nie znasz? Kosmogram i tak powstanie."*
2. `Liczymy Twoje niebo` — *„Pozycje planet wyznaczamy na podstawie danych astronomicznych NASA — z dokładnością, z jaką planuje się misje kosmiczne. Zero zgadywania."*
3. `AI pisze Twój portret` — *„Naszą AI nakarmiliśmy wiedzą astrologiczną zbieraną od tysięcy lat — od Babilonu po współczesną astrologię psychologiczną. Pisze o Tobie tak, jakby Cię znała."*

- **Nagłówek:** `Kod liczy. AI pisze. Ty decydujesz, co z tym zrobisz.`

## S4 — Cztery moduły jako historia, nie grid

Hierarchia: Kosmogram flagowy (duży), pod nim trzy mniejsze w zygzaku. Mini-podglądy modułów również w **formie uniwersalnej** (stylizowane karty kodowane w landingu, nie zrzuty z aplikacji):

- **Kosmogram** — `Portret, do którego się wraca.` Tożsamość, relacje, mocne strony, rzeczy do przepracowania.
- **Cosmo Match** — `Dwa kosmogramy, jedna relacja.` Zobacz, co was do siebie ciągnie i o co będziecie się spierać.
- **Kalendarz astrologiczny** — `Dni mocy i dni na przeczekanie.` Twój osobisty kalendarz liczony z Twojego nieba — nie ogólny horoskop dla wszystkich Baranów.
- **Cosmo Chat** — `Zapytaj o cokolwiek.` Rozmawiasz z AI, która zna Twój kosmogram i odpowiada konkretnie o Tobie.

## S5 — Social proof (cytaty z odczytów + testimoniale testerów)

Bez zmyślonych liczb:
- **Warstwa 1:** 2–3 wyimki z prawdziwych interpretacji w dużym serifie — każdy po korekcie językowej (patrz krok 2 planu), żaden „prosto z modelu".
- **Warstwa 2:** 2–3 testimoniale testerów; atrybucja: imię + znak słońca („Marta · Słońce w Pannie").
- **Nagłówek:** `Czytasz o sobie i myślisz: skąd oni to wiedzą?`

## S6 — Cennik

Free (pełny kosmogram bazowy — lejek) vs Plus 19,90 zł/mies. Kotwica roczna. Microcopy: `Anulujesz jednym kliknięciem, kiedy chcesz.`

- **Nagłówek:** `Zacznij za darmo. Płać tylko wtedy, gdy chcesz więcej.`

## S7 — FAQ jako rozbrajanie obiekcji

1. `Nie wierzę w astrologię. Czy to coś dla mnie?` — wprost: nie musisz wierzyć; traktuj to jak lustro i dobrą rozmowę o sobie.
2. `Czym to się różni od horoskopów z internetu?` — tam: jeden tekst dla 1/12 ludzkości; tu: Twoje niebo, policzone co do stopnia z danych NASA.
3. `Nie znam godziny urodzenia. Czy to problem?` — **nie.** Dostajesz pełny kosmogram z pozycji planet; godzina dodaje ascendent i domy — możesz ją uzupełnić później (podpowiadamy, jak ją znaleźć: akt urodzenia, szpital).
4. `Czy moje dane są bezpieczne?` — dane urodzenia zostają u nas, do AI trafiają tylko wyliczone pozycje planet; konto usuwasz jednym kliknięciem.
5. `Co dokładnie dostaję za darmo?` — konkretna lista, bez gwiazdek.

## S8 — Finałowe CTA (klamra z hero — te same orbity, ciaśniejszy kadr)

- **H2:** `Odkryj, co Twój kosmogram mówi o Tobie.` (obecny tekst — jest dobry, zostaje)
- **CTA:** `Odkryj swój kosmogram →` + microcopy zaufania jak w hero.

## Stopka
Bez zmian strukturalnych; dopilnować: dane podmiotu, linki prawne, spójna typografia.

---

# 4. Art direction — decyzje do design-system.md v1

- **Typografia:** charakterny grotesk zamiast Poppins — kandydaci: **General Sans**, **Cabinet Grotesk**, **Space Grotesk** (test na polskich znakach: ą, ż, ł w dużych stopniach!). Serif (np. Fraunces/Spectral) tylko jako „głos produktu" w cytatach z odczytów. Tabular numbers dla stopni i cen.
- **Paleta — uporządkować do 1+1+1:** tło = głęboki kosmos z gradientem (nie jednolity #0D0B14 — nokturn z winietą i subtelnym grain), akcent ciepły = JEDEN (zdecydować: bursztyn vs pomarańcz — koniec z dwoma), neutralne biele/szarości o kontraście min. AA (obecne szarości za ciemne). Kolorowe ikony modułów → ujednolicić do akcentu + linii.
- **Motion language:** wszystko „niebiańskie" — powolne, eliptyczne, ease-out 300–600ms; elementy *wyłaniają się* (fade + drift w górę 12px), nigdy nie wskakują. Linie aspektów i orbity *kreślą się* (stroke-dashoffset). Reduced-motion zawsze obsłużone.
- **Anty-wzorce wizualne (zakazy do każdego prompta UI):** emoji jako ikony · równy grid identycznych kart · fioletowe gradienty na tekście · glassmorphism · box-shadow bez intencji · tekst poniżej kontrastu AA · więcej niż jeden styl CTA primary · screenshoty aplikacji jako wizuale produktu (tylko stylizowane komponenty uniwersalne).
- **Anty-wzorce językowe (zakazy do każdego prompta copy):** kalki z angielskiego i przetłumaczony marketing-speak · poetyzowanie na siłę i metafory piętrowe · bezosobowe konstrukcje („nosiło się", „nauczono się") · zdania, których nie powiedziałoby się na głos · obietnice wymagające godziny urodzenia jako warunku wejścia · zmyślone liczby i nagrody.

---

# 5. Plan krok po kroku (kolejność, nie kalendarz)

**Krok 1 — Fundament: `design-system.md` v1.** Tokeny (paleta z hexami, skala typograficzna, spacing, radius, motion), wybór fontu po teście polskich znaków, anty-wzorce. Krótki dokument-konstytucja, dołączany do każdego prompta UI.

**Krok 2 — Copy finalne + rygor językowy.** Z draftu w sekcji 3 robimy finalny tekst całej strony (Mac tnie/akceptuje). Każde zdanie przechodzi: (a) test czytania na głos, (b) test „znajomemu przy kawie", (c) korektę polonistyczną (deklinacja, rodzaj, kalki). Wyimki z odczytów do S2/S5 wybieramy z realnych interpretacji i REDAGUJEMY przed publikacją — nic nie idzie na landing „prosto z modelu". Zebrać: 2–3 zredagowane wyimki, 2–3 testimoniale testerów.

**Krok 3 — Prototyp hero (poligon właściwy).** Single-file HTML: nowa typografia, upgrade animacji orbit (głębia, poświaty, paralaksa, reakcja na mysz), CTA, scroll cue. Iterujemy na screenshotach aż będzie wow — hero ustawia poprzeczkę dla reszty.

**Krok 4 — Pozostałe sekcje prototypu, po kolei: S2 → S3 → S4 → S5 → S6 → S7 → S8.** Każda sekcja przechodzi squint test (jedna dominanta wizualna) i test rytmu (czy różni się kompozycyjnie od sąsiadek).

**Krok 5 — Audyt całości:** konwersja (hierarchia CTA, czy każda sekcja prowadzi w dół), dostępność (kontrast AA, focus states, reduced-motion), wydajność (animacje na transform/opacity, LCP hero < 2,5 s), mobile (hero i koło na 390px), polska typografia („cudzysłowy", półpauzy, niełamliwe spacje przed jednoliterowymi spójnikami).

**Krok 6 — Prompt wdrożeniowy do repo** w formacie `*-prompt.md` (React/Tailwind, tokeny jako CSS variables/Tailwind config) **+ `design-system.md` v2** wzbogacony o wzorce wypracowane na landingu — kręgosłup do późniejszej optymalizacji UI całej aplikacji.

**Weryfikacja końcowa:** prototyp obok obecnego landingu — porównanie screen-w-screen + checklista z sekcji 4 (anty-wzorce) i sekcji 2 (cele konwersyjne).
