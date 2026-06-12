# PROMPT DLA CLAUDE CODE — Natal: naprawa zaufania + wow prezentacji (wg audytu)

> Źródło: docs/natal-ux-quality-audit.md. Fazy 1–3 to naprawa zaufania (wykonaj najpierw), 4–7 to wow prezentacji.

---

Pracujesz w repo aplikacji Cosmogram (www.cosmo-gram.com): Next.js 16 App Router, TypeScript, Supabase, Framer Motion. Natal: claude-sonnet-4-6, 8 modułów, cache interpretacji (hash pozycji + wersja promptu + model), golden testy w panelu admina, AI_MOCK fixtures, e2e w CI. Istnieje komponent koła kosmogramu (SVG), karty Wielkiej Trójki (Słońce/ASC/Księżyc), share page `/share/reading/[id]`, OG image dla matcha (`@vercel/og` — z pakietu P1-2).

Pracuj fazami, po każdej: testy zielone, commit.

---

## FAZA 1 — Rejestr metryk i tagów (deterministyczny)

Problem: moduły AI wymyślają własne metryki — ta sama etykieta ma różne wartości („Głębokość percepcji" 88 i 92 na jednej stronie), a quasi-duplikaty („Dostępność emocjonalna" / „Próg otwarcia emocjonalnego" / „Gotowość do bliskości") mają rozrzucone wartości. Tagi powtarzają się w 7/8 modułów.

1. Stwórz `src/lib/astro/metrics.ts`: **kanoniczny rejestr ~48 metryk** zorganizowany w 8 pul tematycznych po ~6 metryk (pula per moduł: tożsamość, supermoce, korzenie, miłość, powołanie, cienie, ród, misja). Każda metryka: jedna nazwa, jedna wartość 0–100 liczona DETERMINISTYCZNIE z kosmogramu (jawny algorytm: pozycje, aspekty, władcy, wagi — udokumentowany w kodzie). Ta sama osoba = zawsze te same liczby. Uwaga arytmetyczna: 8 modułów × 3 rozłączne metryki = minimum 24 użyte — rejestr musi być wyraźnie większy, stąd 48.
2. **Selekcja per kosmogram**: z puli modułu wybierane są 3 metryki NAJBARDZIEJ istotne dla danego kosmogramu (deterministyczny ranking istotności: jak mocno konfiguracja usera aktywuje daną metrykę — np. „odwaga w wyrażaniu potrzeb" jest istotna przy napiętej Wenus, nieciekawa przy harmonijnej). Efekt: różni userzy widzą RÓŻNE metryki — to dodatkowa warstwa personalizacji, nie tylko różne wartości. Metryki rozłączne między modułami (pule są rozłączne z definicji). Model dostaje wyliczone wartości i pisze TYLKO podpisy pod paskami (te kapitalne jednolinijkowce: „mięsień rzadko używany — jest, czeka na trening") — wartości nie wolno mu zmieniać ani wymyślać (walidacja zod: wartość z wejścia musi się zgadzać).
3. Tagi: pula **~120 tagów** w rejestrze, pogrupowana semantycznie (klastry synonimów — „wytrwały/niezłomny/długodystansowy" w jednym klastrze), przypisanie deterministyczne (z dominant kosmogramu), max 4 na moduł, **max 1 tag z danego klastra w całym dokumencie** poza jednym jawnym „motywem przewodnim" (celowo wspólny dla całości, np. „intensywny" — raz jako motyw, nie pięć razy przypadkiem).
4. Golden test: wygeneruj 3 kosmogramy referencyjne → asercja: brak duplikatów etykiet z różnymi wartościami w całym dokumencie, brak tagów powtórzonych >1 raz poza motywem przewodnim.
5. Regeneracja: po wdrożeniu zbumpuj wersję promptów → istniejące kosmogramy regenerują się przy następnym wejściu (mechanizm cache to obsłuży); nie regeneruj masowo cronem.

## FAZA 2 — Neutralna forma rodzajowa (przez styl) i korekta językowa

1. **Styl bezrodzajowy w 2. osobie** — twarda instrukcja stylu we WSZYSTKICH promptach generatywnych (natal, child, match, chat, horoskop):
   - Podstawa: 2. osoba czasu teraźniejszego („widzisz", „budujesz", „twoja siła") — naturalnie bezrodzajowa i intymna.
   - ZAKAZ: czas przeszły i tryb przypuszczający w 2. osobie („powiedziałbyś/powiedziałabyś", „zrobiłeś/zrobiłaś") oraz przymiotniki/imiesłowy rodzajowe o userze („gotowy/gotowa", „sam/sama").
   - ZAKAZ ucieczki w chłodne bezosobowe opisy („można funkcjonować", „potrafi się przyciągać") — to brzmi jak opis cudzej osoby, nie lustro. Przeformułowanie zawsze w stronę „ty": zamiast „co powiedziałbyś bliskiej osobie" → „co usłyszałaby od ciebie bliska osoba"; zamiast „można funkcjonować tam, gdzie inni się rozpadają" → „funkcjonujesz tam, gdzie inni się rozpadają".
   - Dodaj tę instrukcję jako współdzielony fragment promptu (jedno źródło, include we wszystkich promptach przez panel admina).
2. **Przebieg korekty**: po wygenerowaniu każdego modułu — drugi przebieg na **claude-haiku-4-5** (UWAGA: lżejszym modelem w stacku jest haiku — Gemini nie jest używany): „popraw wyłącznie błędy językowe polszczyzny (deklinacja, rusycyzmy typu Wenera→Wenus) ORAZ naruszenia stylu bezrodzajowego wg powyższych reguł; niczego nie dodawaj, nie zmieniaj treści ani stylu poza tym". Diff logowany do `ai_call_logs` (ile poprawek — metryka jakości modelu bazowego).
3. **Deklinacja w UI**: mapa odmian nazw znaków (mianownik/miejscownik/dopełniacz: Skorpion/w Skorpionie/Skorpiona itd.) w `src/lib/astro/i18n.ts` — używana wszędzie, gdzie UI skleja teksty (tooltipy „Ascendent w Skorpionie", chipy, zapowiedzi tranzytów). Zero sklejania mianownikiem.
4. Skróty znaków w chipach: zamiast 3-literowych („Sko", „Pan") — pełne nazwy lub glify astrologiczne; „Pan" jako skrót Panny jest niedopuszczalny.
5. Golden testy: detektor form rodzajowych (regex po końcówkach -łbyś/-łabyś/-łeś/-łaś w 2. os. + lista rodzajowych przymiotników o userze) — KAŻDE wystąpienie = fail; test deklinacji UI; test rusycyzmów (lista zakazanych słów); test „chłodu" (heurystyka: udział konstrukcji bezosobowych „można/potrafi się/warto by" powyżej progu = warning do review).

## FAZA 3 — Share page jako mechanizm akwizycji

1. **Pełna treść zostaje publiczna** (wszystkie 8 modułów — cudzy portret nie zastępuje własnego, tylko dowodzi głębi i budzi „ja też chcę"). Zamiast ograniczania treści — **CTA pracujące przez całą długość strony**:
   - sticky CTA dla gości (dyskretny pasek dolny): „Stwórz swój kosmogram — bezpłatnie",
   - po 3. module: pełnoprawna karta CTA w rytmie treści („Te 8 rozdziałów powstało z jednej daty urodzenia. Zobacz swoje."),
   - na końcu: obecne CTA zostaje, wzmocnione bilansem („Twoje niebo wygląda inaczej — sprawdź jak").
   - CTA nie pojawiają się właścicielowi kosmogramu (tylko niezalogowanym / nie-właścicielom).
2. **Dane urodzenia**: data i miejsce domyślnie UKRYTE na share; toggle właściciela „pokaż datę urodzenia" przy tworzeniu/edycji share. Godzina nigdy publicznie. (Treść interpretacji może zostać w całości — chronimy dane, nie prozę.)
3. **Meta**: napraw domenę w description (`cosmogram.pl` → `cosmo-gram.com`); tytuł i description per kosmogram (imię + Wielka Trójka: „Asia — Słońce w Strzelcu, ASC w Skorpionie").
4. **OG image** (`@vercel/og`, wzór z matcha): koło uproszczone + imię + Wielka Trójka + branding, dark crystal. Twitter card `summary_large_image`.
5. Link „Chat" na share page → usuń lub zamień na CTA do `/generate` (gość nie ma wstępu do `/app/*`).
6. Istniejące share linki: zastosuj nowe zasady do wszystkich (to widok, nie dane — bez migracji).
7. E2E: share zawiera wszystkie 8 modułów, NIE zawiera daty/miejsca urodzenia przy domyślnym toggle (asercja na HTML), sticky CTA widoczny dla gościa i niewidoczny dla właściciela, OG image 200, meta poprawne.

## FAZA 4 — Koło: aspekty i stellium

1. **Aspekty widoczne i interaktywne**: paleta rozróżnialna na ciemnym tle (harmonijne vs napięte: różny kolor I styl linii — ciągła/kreskowana; czytelne dla daltonistów), domyślnie top 8 aspektów wg rankingu (użyj wag z `src/lib/astro/` jeśli silnik z P1-1 wdrożony; jeśli nie — lokalny ranking orbów), legenda 2-elementowa pod kołem. **Tap/klik planety → podświetlenie jej aspektów + przygaszenie reszty** (reużyj istniejącego efektu dim z hovera kart) + lista aspektów tej planety z 1-zdaniowymi opisami (deterministyczne, z mapy tekstów planeta×aspekt×planeta — wygeneruj raz jako asset).
2. **Fan-out stellium**: algorytm kolizji — planety bliżej niż ~8° rozsuwane po łuku równomiernie, cienka linia prowadząca od glifu do realnej pozycji na obwodzie. Test wizualny na kosmogramie z 5+ planetami w jednym znaku (przypadek Asi: stellium w Strzelcu).
3. Tooltip „energii" działa dla KAŻDEJ planety na kole (tap na mobile, hover na desktop), nie tylko Wielkiej Trójki — treści z mapy planeta×znak (assety z P1-4, jeśli wdrożone — reużyj minifakty).
4. Usuń instrukcję „Najedź na symbol" — zamiast niej delikatny puls jednego glifu przy pierwszym wejściu (raz, potem nigdy).
5. Centrum koła: zmniejsz martwy dysk; jeśli silnik tranzytów (P1-1) wdrożony — pokaż „dziś na Twoim niebie" (1 linia: najważniejszy dzisiejszy tranzyt, premium teaser dla free).

## FAZA 5 — Layout lektury (8 modułów)

1. **Jedna kolumna** treści (max ~70 znaków szerokości linii) zamiast dwóch równoległych; moduły sekwencyjnie.
2. **Sticky mini-nawigacja**: 8 ikon/kropek z nazwami modułów (rozdziały), aktywny podświetlony, klik = smooth scroll; pasek postępu czytania. Rama językowa „8 rozdziałów o Tobie" w nagłówku sekcji (zamiast „Karta astrologiczna · 8 modułów").
3. **Chipy źródłowe** pod nagłówkiem każdego modułu: „Na podstawie: Wenus w XII · Wenus∠Pluton · Księżyc w Koziorożcu" (dane z wejścia modułu — model już je dostaje; renderuj z danych, nie z treści AI). Tap na chip → scroll do koła + podświetlenie tego punktu (pętla koło↔treść).
4. Paski metryk: dodaj kontekst skali — subtelne strefy na pasku lub etykieta słowna przy liczbie (np. 38 → „obszar rozwoju", 85 → „mocna strona"); progi w rejestrze metryk z Fazy 1.
5. Mobile: moduły zwijane do leadu (cytat + pierwszy akapit + „czytaj dalej"), stan przeczytania zapamiętany (subtelny znacznik ✓ w mini-nawigacji).

## FAZA 6 — Spójność języka wizualnego

1. Znaki zodiaku na kole: zamiast fioletowych kafelków-emoji — glify liniowe spójne z ikonami kart Wielkiej Trójki (duotone złoto/fiolet, SVG własne).
2. Nagłówki modułów: zamiast emoji (⚡❤️🚀🌑) — własne ikony liniowe w tym samym stylu (8 sztuk, SVG w repo).
3. Tytuł strony: „Twój kosmogram natalny" (polska kapitalizacja zdaniowa, nie Title Case).
4. Przejrzyj całość widoku natal + share pod kątem mieszania stylów ikon (emoji 📅📍 na share też zamień na ikony liniowe).

## FAZA 6B — Cytaty-nagłówki: optymalizacja najmocniejszego elementu

Cytaty („Dom, który nosiło się w sobie, zanim nauczono się mówić") to językowa wizytówka produktu i przyszłe quote cards — dostają własne reguły jakości:

1. **Reguły w prompcie + walidacja zod**: 40–90 znaków; bez imienia; styl bezrodzajowy; musi wynikać z KONKRETU kosmogramu modułu (nie uniwersalny aforyzm — test: czy ten cytat pasowałby każdemu? jeśli tak — fail); zakaz frazesów z listy (~30 pozycji: „podróż w głąb siebie", „odkryj swój potencjał", „magia gwiazd", „wszechświat ma plan"… — utrzymywana w panelu admina); bez znaku zapytania (cytat to teza, nie pytanie); kropka lub myślnik w środku dozwolone, kropka na końcu zakazana (konwencja typograficzna cytatów).
2. **Unikalność wewnątrz dokumentu**: 8 cytatów usera nie może dzielić głównej metafory (heurystyka: brak powtórzonego rzeczownika-klucza między cytatami; „głębia" w 3 cytatach = fail → regeneracja nagłówka).
3. **Golden test cytatów**: osobny eval — 10 referencyjnych kosmogramów, ocena: konkret (związek z pozycjami), świeżość (brak frazesów), długość. Cytaty generuje Sonnet razem z modułem (bez osobnego wywołania), ale walidacja może odrzucić sam nagłówek → regeneracja TYLKO nagłówka (tanie wywołanie haiku z treścią modułu jako kontekstem).

## FAZA 6C — Brak godziny urodzenia (częsty przypadek, dziś nieobsłużony wprost)

Znaczna część userów nie zna godziny urodzenia — to nie edge case, to segment:

1. Kosmogram bez godziny = bez Ascendentu, domów i wiarygodnego Księżyca (±7°): moduły dostają flagę `no_birth_time` i wariant promptu (treść opiera się na pozycjach planet w znakach i aspektach; ZERO odwołań do domów i ASC; Księżyc tylko jeśli pozycja pewna w całej dobie). Walidacja: treść bez godziny nie może zawierać „dom", „Ascendent", „MC".
2. UI: karta Wielkiej Trójki pokazuje Słońce + Księżyc/„?" + w miejscu ASC kartę „Nieznana godzina urodzenia" z wyjaśnieniem (1 zdanie) i CTA „Uzupełnij godzinę" → edycja → pełna regeneracja (z teatrem generowania).
3. Metryki zależne od ASC/domów wykluczone z selekcji (FAZA 1.2 to obsłuży naturalnie — ranking istotności = 0).
4. E2E: pełny flow bez godziny + flow uzupełnienia godziny.

## FAZA 6D — Domknięcia funkcjonalne (małe, a decydują o „działa świetnie")

1. **Częściowa awaria generacji**: gdy z 8 modułów 1–2 padną — pokazuj gotowe, w miejscu brakujących karta „Ten rozdział jeszcze się pisze" z auto-retry w tle (max 3) i ręcznym „spróbuj ponownie". Nigdy: całość czeka na najwolniejszy/zepsuty moduł.
2. **Edycja danych urodzenia** po wygenerowaniu (literówka w dacie/miejscu): dostępna z poziomu kosmogramu, z ostrzeżeniem „interpretacja zostanie wygenerowana na nowo" + teatr generowania. Stary wynik nadpisany (cache po hashu pozycji to obsłuży).
3. **Feedback per moduł**: dyskretne „Trafione?" (tak/częściowo/nie) na końcu każdego modułu → PostHog event z (moduł, prompt_version, model). To jedyne realne źródło danych do tuningu promptów — golden testy mierzą formę, to mierzy rezonans.
4. **Most do Cosmo Chat**: pod każdym modułem chip „Porozmawiaj o tym w Cosmo Chat" → otwiera chat z prefillem kontekstu („Chcę pogłębić temat moich Cieni"). Natal sprzedaje chat, chat buduje retencję — domknięcie pętli między dwoma najmocniejszymi modułami.
5. **Eksport PDF (premium)**: „Pobierz swój portret (PDF)" — elegancki layout (cytaty serif, koło na pierwszej stronie, stopka z brandem). Ludzie drukują i pokazują takie rzeczy — fizyczny artefakt = marketing. Implementacja prosta: print stylesheet + window.print lub react-pdf; nie przeinwestuj.

## FAZA 7 — Quote cards + bilans żywiołów (wzrost organiczny)

1. **Quote cards**: przy każdym cytacie-nagłówku przycisk „udostępnij cytat" → generowana grafika 9:16 (1080×1920; `@vercel/og` lub canvas): cytat w serif, imię/pseudonim opcjonalnie, glify Wielkiej Trójki, branding cosmogram + URL, dark crystal tło. Native share na mobile / download na desktop. Endpoint publiczny rate-limitowany, generacja deterministyczna z cache.
2. **Bilans żywiołów i modalności**: rozwiń „Dominuje Woda" w wizual — 4-segmentowy pasek żywiołów + 3-segmentowy modalności (deterministyczne z pozycji) + 1 zdanie interpretacji z mapy tekstów (asset, nie AI). Umieść między kołem a modułami.
3. PostHog: `quote_card_shared` (który moduł), `chart_aspect_explored`, `source_chip_clicked`, `share_module_locked_cta` — uzupełnij lejek.

## Zasady

- Liczby, metryki, tagi, aspekty, bilanse — wyłącznie deterministyczne z kodu; AI pisze prozę i podpisy. Nigdzie odwrotnie.
- Wszystkie nowe teksty UI po polsku z poprawną deklinacją (mapa z Fazy 2.3).
- Regeneracje treści przez bump wersji promptu + cache, nie masowe crony.
- Po całości: przegeneruj fixtures AI_MOCK, odpal pełne golden testy + e2e, zaktualizuj dokument statusu projektu.
- Niejasności → zatrzymaj się i zapytaj.
