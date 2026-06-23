---
title: Listy od Astrei — koncept produktowy do wdrożenia
type: product-concept
owner: Mac
created: 2026-06-21
status: koncept do handoffu (Claude Code implementuje)
based_on: docs/strategia-biznesowa-v2-produkt-model.md, docs/content-voice-guide.md, docs/design-system.md
---

# Listy od Astrei

## 0. W jednym zdaniu

Astrea okazjonalnie pisze do Ciebie osobiste listy odsłaniające kolejne warstwy Twojego kosmogramu (misja, wewnętrzny świat, cień, ścieżka kariery, wzorzec karmiczny), dawkowane w czasie i wyzwalane realnymi tranzytami. To zamienia jednorazowe „wow" kosmogramu w rozwijającą się relację, która trzyma subskrypcję.

## 1. Po co to istnieje (cel strategiczny)

- **Retencja (główny cel).** Bije w jedyną zmienną decydującą o przeżyciu, czyli churn. Każdy list to nowe objawienie dostępne tylko, gdy zostajesz. North Star: retencja płatnych 30 dni.
- **Druga noga przychodu.** Ten sam list pakowany jako jednorazowy raport (39-79 zł) dla osób, które nie kupią subskrypcji.
- **Paliwo akwizycji.** „Astrea napisała mi, jaka jest moja misja" to mocny hook do share i UGC.
- **Fosa.** Pogłębia switching cost (rosnące archiwum osobistych listów) i wzmacnia brand Astrei jako obecności, która Cię zna.

To realizacja esencji marki z design-system: „nocne niebo czytane jak osobisty list".

## 2. Czym jest pojedynczy List

- Długość: 250-450 słów. Czyta się w 2-3 minuty.
- Struktura: osobiste otwarcie → odsłonięcie tematu osadzone w konkretnych punktach kosmogramu → zamknięcie zapraszające do refleksji (pytanie albo drobna praktyka, nigdy rozkaz).
- Głos: ciepła przewodniczka (patrz content-voice-guide). Forma neutralna 2 os. Bez żargonu w treści, fundament astrologiczny tylko jako subtelny podpis („na podstawie Twojego Słońca, węzła północnego i MC").
- Format: Markdown renderowany przez react-markdown (macie już), stylizacja głosu produktu (Fraunces dla cytatu-otwarcia, General Sans body).
- Generowany raz, cache na zawsze. List jest stały, nie regeneruje się przy każdym otwarciu (spójność emocjonalna plus kontrola kosztu).

## 2b. Kosmogram vs List vs Raport (trzy różne rzeczy, nie powtórzenia)

Trzy warstwy o różnej pracy. Nie powielają się.

| Warstwa | Pyta | Kształt | Czas | Monetyzacja |
|---|---|---|---|---|
| **Kosmogram (natal)** | „co jest w moim wykresie" | mapa, opis składnik po składniku (Słońce, Księżyc, domy) | statyczny | free 3/8, premium pełny |
| **List od Astrei** | „pokaż mi jeden temat, blisko" | krótka zajawka 1 tematu, ~300 słów, emocjonalna | dawkowany | free teaser + premium drip |
| **Raport** | „co mam z tym zrobić" | długa synteza całego wykresu pod JEDNO pytanie | często osadzony w czasie (tranzyty) | jednorazowo 49-79 zł |

Klucz: ludzie nie płacą za informację o wykresie (to daje kosmogram). Płacą, żeby rozwiązać jedno palące pytanie. **Kosmogram OPISUJE, raport ODPOWIADA.**

Co raport ma realnie PONAD kosmogram:
1. **Synteza ku jednemu pytaniu**, nie opis po kolei. Natal mówi „MC w Koziorożcu, Saturn w 10 domu". Raport mówi „oto Twoja ścieżka: napięcie między Słońcem a Saturnem, typ pracy dla całego Twojego wykresu, co robić przez najbliższe 2 lata".
2. **Warstwa czasu**, której statyczny natal nie zawiera: tranzyty, progresje, Solar Return. Zmienia się co roku, więc kupowana ponownie.
3. **Głębia decyzyjna** jednej domeny, 15-minutowa lektura, nie akapit.

List i Raport to ten sam temat w dwóch głębiach: List „Twoja ścieżka" zachęca (zajawka, retencja), Raport „Złoty Kompas" odpowiada (pełnia, przychód).

## 3. Katalog listów (rdzeń konceptu)

### 3a. Listy fundamentalne (dawkowane w czasie od daty kosmogramu)

| # | List | Temat | Fundament (punkty kosmogramu) | Odsłona | Tier |
|---|---|---|---|---|---|
| 1 | **Twoja misja** | sens, kierunek życia | Słońce, węzeł północny, MC | ~dzień 5-7 | **FREE (teaser)** |
| 2 | **Twój wewnętrzny świat** | emocje, czego potrzebujesz | Księżyc (znak, dom, aspekty) | ~dzień 14 | premium |
| 3 | **Jak kochasz** | miłość, pożądanie, więź | Wenus, Mars, 5 i 7 dom | ~dzień 21 | premium + raport |
| 4 | **Twoje dary** | mocne strony, talenty | Jowisz, trygony, dominanta żywiołu | ~tydzień 6 | premium |
| 5 | **Twój cień** | co przepracować | Saturn, Chiron, Pluton, 12 dom, węzeł płd. | ~tydzień 8 | premium + raport |
| 6 | **Twoja ścieżka** | powołanie, kariera | MC i 10 dom, Saturn, Słońce, 2 i 6 dom | ~tydzień 11 | premium + raport |
| 7 | **Twój wzorzec karmiczny** | lekcja duszy | oś węzłów (płn-płd), Saturn | ~tydzień 16 | premium |
| 8 | **Jak mówisz i myślisz** | komunikacja, umysł | Merkury (znak, dom, aspekty) | ~tydzień 20 | premium |

Kolejność celowa: najpierw afirmujące i fascynujące (misja, emocje, miłość, dary), cień dopiero gdy zaufanie jest zbudowane (~2 miesiąc). Drip rozciągnięty na ~5 miesięcy, czyli pięć miesięcy powodów, żeby zostać.

### 3b. Listy wyzwalane tranzytem (z istniejącego silnika tranzytów)

| List | Wyzwalacz | Fundament | Dlaczego mocny |
|---|---|---|---|
| **Twój rok** | rocznica urodzin (Solar Return) | wykres Solar Return | coroczny powód powrotu, naturalny jednorazowy raport |
| **Powrót Saturna** | tranzyt Saturna na natalny Saturn (~29-30 i ~58 r.ż.) | Saturn return | przełomowy moment życia, ogromna trafność jeśli user jest w oknie |
| **Sezon przemiany** | duży tranzyt (Pluton, Saturn, Uran do osobistych planet) aktywny | aktywny tranzyt, spięty z Dniami Mocy | „ten sezon prosi Cię o…", timely, łączy z kalendarzem |

Warstwa eventowa sprawia, że produkt żyje długo po wyczerpaniu listów fundamentalnych. Subskrybent zawsze ma kolejny list w drodze.

## 4. Kadencja i wyzwalacze (logika dostarczania)

- **Czasowe:** dni od wygenerowania kosmogramu (kolumna w katalogu). Cron sprawdza, kto jest „due".
- **Eventowe:** cron odpytuje silnik tranzytów o aktywne warunki (Solar Return w oknie, Saturn return, mocny tranzyt) per płatnik.
- **Dyscyplina częstotliwości:** maks. 1 list fundamentalny na ~1-2 tygodnie, listy eventowe ponad to, ale nigdy więcej niż ~1 list w tygodniu łącznie. To ma być wydarzenie, nie spam.
- **Pre-generacja:** generuj list 24-48 h przed dostarczeniem (ukrywa latencję modelu, daje bufor na walidację).

## 5. Dostarczanie (kanały)

- **In-app: Skrzynka (inbox), nie podstrona w nawigacji.** Ikona koperty w nagłówku strefy `/app/*` (góra po prawej), obecna na każdym ekranie. To **uniwersalna skrzynka**, do której trafiają Listy od Astrei ORAZ inne powiadomienia od nas (ogłoszenia, nowe funkcje, „prognoza gotowa", alert o nadchodzącym Dniu Mocy). Klik otwiera panel wysuwany (drawer z prawej na desktopie, pełny arkusz na mobile) z pozycjami od najnowszych. Pozycja typu „list" otwiera czytnik listu (render Markdown + podpis fundamentu).
- **Bardzo czytelny wskaźnik nieprzeczytanego:** gdy w skrzynce jest coś nowego, koperta dostaje bursztynowy badge z licznikiem (np. „2") plus delikatna poświata (token `--accent`, wg design-system). Po przeczytaniu znika. Ma być od razu widać, że jest coś do przeczytania.
- **Email (powiadomienie, open-loop):** Resend, szablon w głosie Astrei. „Astrea napisała do Ciebie list" plus 2-3 pierwsze zdania jako zajawka plus CTA „Przeczytaj w aplikacji". Mail nie zawiera całości, prowadzi do skrzynki (napędza powrót). Reuse Waszego setupu React Email.
- **Integracja z mailami tygodniowymi/miesięcznymi:** mail tygodniowy wspomina, gdy w skrzynce czeka nowy list. Bez duplikacji, listy to warstwa „specjalna", prognoza to warstwa „rytm".
- **Push:** później, opcjonalnie (nie macie, nie warunek).

## 6. Architektura techniczna (na Waszym stacku)

### 6a. Model danych (propozycja, RLS na każdej tabeli userowej)

`astrea_letter_templates` (katalog, zarządzany w panelu admin obok `ai_prompts`):
- `slug` (np. `twoja-misja`), `title`, `theme`, `placement_inputs` (jsonb, które punkty kosmogramu zasilają prompt), `trigger_type` (`time` | `event`), `trigger_value` (dni od natalu | warunek tranzytowy), `tier` (`free` | `premium` | `one_time`), `sort_order`, `wellbeing_level` (`standard` | `delikatny`), `prompt_slug` (wskazuje wersjonowany prompt w `ai_prompts`).

`user_letters` (instancje):
- `user_id`, `letter_slug`, `status` (`scheduled` | `generated` | `delivered` | `read`), `content_md` (cache wygenerowanej treści), `placement_snapshot` (jsonb, użyte punkty), `ai_prompt_version`, `model`, `generated_at`, `delivered_at`, `read_at`, `source` (`drip` | `one_time_purchase`).

`inbox_items` (uniwersalna skrzynka — warstwa powierzchni i stanu przeczytania):
- `user_id`, `type` (`letter` | `announcement` | `system` | `forecast` | …), `ref_id` (dla `letter` → `user_letters.id`), `title`, `preview`, `read_at`, `created_at`, `delivered_at`. Badge = `count(read_at IS NULL)`. List tworzy pozycję typu `letter`; inne powiadomienia (ogłoszenia, alerty) tworzą pozycje innych typów bez maszynerii generacji.

`letter_purchases` (jednorazowe, albo reuse istniejącej logiki Stripe/add-onów):
- `user_id`, `letter_slug`, `stripe_payment_id`, `price`, `created_at`.

### 6b. Pipeline generacji

1. **Resolver placementów:** dla (user, list) pobiera deterministyczne punkty z istniejącego silnika kosmogramu (zapisany natal / `/api/chart`). Kod liczy, które punkty (zgodnie z `placement_inputs`).
2. **Budowa promptu:** pseudonimizowany (bez imienia i surowych danych urodzenia, zgodnie z Waszą zasadą), wstrzykuje konkretne pozycje plus instrukcję głosu i wellbeing.
3. **Model:** Sonnet 4.6 dla listów (to są te jakościowe, gdzie głębia ma znaczenie). Zapis `ai_prompt_version` (Wasz anti-pattern: zawsze wersjonować).
4. **Walidacja:** długość, brak żargonu, brak predykcji, test struktury (otwarcie/rozwinięcie/zaproszenie). Fallback przy pustym/błędnym output (macie wzorzec).
5. **Cache:** zapis `content_md`, generacja jeden raz na (user, list). Nigdy nie regeneruj automatycznie.

### 6c. Scheduler

- Cron Vercel (dzienny, reuse wzorca `daily-personal-horoscope`). Skanuje płatnych: kto „due" czasowo, kto spełnia warunek eventowy. Enqueue pre-generacji i dostarczenia.
- Idempotencja per (user, letter), żeby nie wysłać dwa razy.

### 6d. Koszt AI (kontrola)

- Jeden list Sonnet to ~0,20-0,40 zł, generowany raz i cache. Cała seria fundamentalna (8 listów) to ~2-3 zł na całe życie subskrybenta. To najwyższy zwrot z AI w produkcie, bo idzie wprost w retencję. Mierz koszt listów w `ai_call_logs` (macie) i trzymaj go w raporcie kosztu na aktywnego płatnika.

## 7. Monetyzacja (potrójne wykorzystanie jednego silnika)

- **FREE:** List 1 „Twoja misja" za darmo po wygenerowaniu kosmogramu → „wow" → ściana: „Kolejne listy Astrea pisze dla subskrybentów". To jest mechanizm konwersji free→premium.
- **PREMIUM:** pełna seria dawkowana plus listy eventowe. Główny powód, by nie anulować przez miesiące.
- **RAPORTY JEDNORAZOWE:** pełna, długa odpowiedź na jedno pytanie życiowe (patrz katalog 7b), sprzedawana standalone osobom bez subskrypcji. Ten sam silnik co Listy, druga noga przychodu, zero powtarzalnego kosztu AI.

## 7b. Katalog raportów jednorazowych

To są produkty, które już masz w specu (Złoty Kompas, Bagaż Karmiczny, Prognoza roczna). Raport NIE powtarza kosmogramu, tylko syntetyzuje cały wykres pod jedno pytanie i dokłada warstwę czasu.

| Raport | Pytanie | Co zawiera PONAD natal | Fundament + warstwa czasu | Cena (test) |
|---|---|---|---|---|
| **Złoty Kompas** (kariera) | „co zrobić z karierą" | synteza powołania, napięcie Słońce-Saturn, typ pracy dla całego wykresu, 2-letni horyzont | MC i 10 dom, Saturn, Słońce, 2 i 6 dom + tranzyty Saturna/Jowisza do MC | 49 zł |
| **Bagaż Karmiczny** (węzły) | „jaka jest lekcja mojej duszy" | wzorzec do uwolnienia (płd) i kierunek wzrostu (płn), powtarzające się motywy życiowe | oś węzłów, Saturn, dyspozytorzy | 49 zł |
| **Prognoza roczna** | „co przyniesie mój rok" | mapa 12 miesięcy: kluczowe okna, motyw roku, miesiące przełomu | Solar Return + tranzyty + progresje na 12 mies. | 79 zł |

Każdy raport: 1500-3000 słów, generowany raz na zakup (cache), Sonnet, ten sam pseudonimizowany prompt-flow co Listy. Pakiet 3 raporty = 99 zł (test). Prognoza roczna kupowana ponownie co rok (warstwa czasu się zmienia, to jej cały sens).

**Dlaczego nie kanibalizuje subskrypcji:** raport kupuje się w momencie wysokiej intencji (kryzys w pracy, nowy rok, urodziny), jeden głęboki strzał na jedno pytanie. Subskrypcja to szerokość plus trwająca relacja plus Listy plus kalendarz. Inna praca, inny moment, często inny człowiek.

## 8. Głos i strażnicy tonu (twarde reguły)

Bazuje na content-voice-guide i design-system. W każdym liście:
- **Indywidualnie, nie generycznie.** List odwołuje się do konkretnych punktów TWOJEGO kosmogramu, nigdy „wszyscy spod znaku".
- **Introspekcja, nie wyrocznia.** „Twój kosmogram wskazuje kierunek", nigdy „zostaniesz X" albo „spotkasz Y".
- **Cień jako zaproszenie, nie wyrok.** Listy `wellbeing_level: delikatny` (cień, karma) podnoszą i normalizują, nigdy nie straszą, nie diagnozują klinicznie, nie wieszczą katastrofy. Ton ma dawać sprawczość.
- **Test czytania na głos** na każdym zdaniu.
- **Żargon tylko w podpisie** („na podstawie…"), nigdy w ciele listu.

To jest miejsce, gdzie pracuje Wasza fosa, czyli jakość silnika interpretacji. Przy temacie „sens życia" generyk niszczy zaufanie mocniej niż gdziekolwiek. Golden testy (macie) obowiązkowe dla każdego szablonu listu przed wypuszczeniem.

## 9. Metryki sukcesu

| Metryka | Po co |
|---|---|
| Retencja płatnych 30/60/90 d (kohorty z listami vs bez) | główny dowód, że działa |
| Read rate listu, czas do przeczytania | jakość zaczepienia |
| Email → klik → sesja | czy mail napędza powrót |
| Share rate listów | potencjał akwizycyjny |
| Konwersja raportów jednorazowych | druga noga przychodu |
| Koszt AI / list i / aktywny płatnik | strażnik marży |

Kluczowy test walidacyjny: czy płatnicy, którzy dostali ≥3 listy, mają wyraźnie niższy churn niż ci, którzy nie. Jeśli tak, podwajasz.

## 10. Zakres wdrożenia

**P0 (MVP, dowieźć najpierw):**
- 4 listy fundamentalne: Misja (free teaser), Wewnętrzny świat, Jak kochasz, Cień.
- Drip czasowy, skrzynka in-app `/app/letters`, powiadomienie mailem (Resend).
- Pipeline generacji z cache, Sonnet, prompt pseudonimizowany, `ai_prompt_version`, golden testy.
- Ściana free→premium na liście 2.

**P1:**
- Listy eventowe (Solar Return, Saturn return, sezon przemiany) na silniku tranzytów.
- Pozostałe listy fundamentalne (dary, ścieżka, karma, komunikacja).
- Raporty jednorazowe plus zakup Stripe one-time.

**P2:**
- Push przy nowym liście.
- Strony share listów (akwizycja), archiwum jako wzmocnienie switching cost.

## 11. Ryzyka

| Ryzyko | Mitygacja |
|---|---|
| Jakość poniżej poprzeczki (przy „sensie życia" boli podwójnie) | golden testy per szablon, Sonnet, fundament w konkretnych punktach, walidacja przed wysyłką |
| Wrażliwy temat (cień, sens) trafia w kruchą osobę | `wellbeing_level: delikatny`, ton wzmacniający, zero determinizmu i diagnozy, zaproszenie nie wyrok |
| Przekroczenie linii predykcji (prawo, pozycjonowanie) | reguła „introspekcja nie wyrocznia" w prompcie i walidacji |
| Koszt AI rośnie | generacja raz plus cache, Sonnet tylko tu, monitoring w `ai_call_logs` |
| Spam zniechęca | dyscyplina częstotliwości maks. ~1 list/tydzień, pre-generacja |
| Latencja modelu psuje dostarczanie | pre-generacja 24-48 h przed |

## 12. Decyzje dla Ciebie

1. **Free teaser.** Zgoda, że List 1 „Twoja misja" jest darmowy jako wabik konwersji?
2. **Ceny raportów jednorazowych.** Test 49 zł pojedynczy / 99 zł pakiet 3, czy inny układ?
3. **MVP zakres.** Cztery listy na start wystarczą do walidacji, czy chcesz inny zestaw startowy?
4. **Nazwa w UI.** „Listy od Astrei" zostaje, czy szukamy mocniejszej?
