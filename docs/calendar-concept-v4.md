# Koncepcja produktu: Kalendarz trzech warstw czasu (v4 — przeprojektowanie)

Status: koncepcja zastępująca model „okien w miesiącu" z iteracji 1–5.

---

# 1. Dlaczego poprzednie iteracje musiały zawieść

Astrologia operuje na trzech skalach czasu jednocześnie, a my renderowaliśmy wszystkie jedną metaforą:

| Zjawisko | Skala | Co z tego robił dotychczasowy kalendarz |
|---|---|---|
| Pluton/Neptun/Uran/Saturn/Jowisz w aspekcie | miesiące–lata | „okno 1–30 czerwca", pasmo przez cały miesiąc |
| Mars/Wenus/Merkury/Słońce w aspekcie | 2–7 dni | ginęło w szumie wolnych |
| Księżyc (znak, fazy, domy) | godziny–dni | nieobecne poza kropką pełni |

Skutek: wszystko świeciło, nic nie znaczyło, a user nie miał ŻADNEGO powodu, by wrócić jutro (bo jutro wyglądało jak dziś). Żadna kalibracja progów tego nie naprawi — to błąd modelu, nie strojenia.

# 2. Model docelowy: trzy warstwy, trzy prezentacje, trzy rytmy powrotu

## Warstwa SEZONY — wolne planety (Jowisz–Pluton)

**Czym jest:** 1–3 długie tematy życia aktywne teraz („Pluton w kwadracie do Twojej Wenus · wrzesień 2025 – listopad 2026"). To rozdziały, nie wydarzenia.

**Prezentacja:** osobna karta „Twoje sezony" — nazwa tematyczna nadana przez AI („Sezon przemiany w relacjach"), fraza tranzytu, zakres dat, **faza** (początek / środek / domykanie) jako subtelny pasek postępu, jeden akapit znaczenia (premium; free widzi nazwę i zakres). Karta zwija się po przeczytaniu (stan zapamiętany) do jednej linii. Sezon NIE rysuje pasm w siatce — to tło, nie wydarzenie.

**Precyzja astrologiczna:** zakres sezonu = od PIERWSZEGO wejścia w orb do OSTATNIEGO wyjścia (retrogradacja wyprowadza planetę z orbu i wprowadza ponownie — to jeden sezon z 2–3 przejściami, nie trzy sezony); fazy wyznaczane przejściami (przed 1. dokładnością = początek, między przejściami = środek, po ostatniej = domykanie). Jowisz porusza się szybko jak na planetę wolną — jego sezony bywają 2–4-tygodniowe i to jest poprawne (sezon ma zakres dat, nie obietnicę długości). **Selekcja:** wyświetlane max 3 sezony wg ścisłości orbu i rangi planety; pozostałe pod „pokaż wszystkie".

**Jedyny ślad sezonu w siatce:** dni DOKŁADNEGO aspektu (orb < 0,3°; wolna planeta zalicza 1–3 przejścia rocznie przez aspekt ścisły) = znacznik ◆ „dzień dokładności". To są autentycznie rzadkie, najważniejsze dni astrologiczne w roku — auto-odczyt premium, kandydat na push. Naturalna rzadkość: kilka ◆ rocznie.

**Rytm powrotu:** raz na kilka tygodni + moment zmiany fazy (powiadomienie „Twój sezon przemiany wchodzi w fazę domykania").

## Warstwa OKNA — szybkie planety (Mars, Wenus, Merkury, Słońce)

**Czym jest:** aspekty trwające 2–7 dni. Dopiero ta warstwa to właściwe „okna" — i jest NATURALNIE rzadka (typowo 2–5 na miesiąc po progu istotności), bez sztucznych limitów.

**Prezentacja:** karta „Twój czerwiec" — TYLKO okna szybkie, posortowane chronologicznie, format wiersza:
`[pasmo-próbka koloru] 15–20 cze · Mars w Byku · opozycja do Twojego Merkurego — [1 zdanie znaczenia] · peak 17 cze`
(zapis „★17"/„★21" zakazany — czyta się jak liczba gwiazdek). W siatce: pasmo 3px przez dni okna + ★ na peaku (wzorzec wizualny: docs/calendar-target-design.png). Na końcu karty: 1–2 zdania syntezy miesiąca + linia charakteru („gęsty miesiąc" / „spokojny miesiąc").

**Rytm powrotu:** planowanie tygodnia — „kiedy mam dobre dni, a kiedy uważać".

## Warstwa RYTM NIEBA — Księżyc + wydarzenia kolektywne

**Czym jest:** (a) Księżyc — znak (zmiana co ~2,5 dnia), fazy (pełnia/nów z pytaniem refleksyjnym — już dobre), dla premium **Księżyc w Twoich domach** („Księżyc przechodzi przez Twój 7. dom — dni relacji"); (b) **wydarzenia kolektywne**: retrogradacje planet osobistych (Merkury — 3×/rok, najbardziej rozpoznawalne wydarzenie astro w popkulturze; Wenus i Mars — rzadsze) oraz **zaćmienia** (Słońca/Księżyca — wzmocniona wersja nowiu/pełni). Wszystko deterministyczne, zero kosztów AI; personalizacja premium: w którym TWOIM domu dzieje się retro/zaćmienie.

**Prezentacja:** pasek „Dziś" (data · Księżyc w znaku [+dom premium] · 1 zdanie rytmu · wzmianka o aktywnym oknie/retro z linkiem). W siatce: glify pełni/nowiu (zaćmienie = wyróżniony glif), delikatna ikona zmiany znaku Księżyca, znacznik ℞ na dniach stacji Merkurego. W karcie miesiąca: sekcja „Niebo dla wszystkich" z zakresem retro i datami zaćmień (1 zdanie znaczenia z mapy tekstów + premium: dom usera). Pytanie refleksyjne przy pełni/nowiu zostaje; przy zaćmieniu — mocniejszy wariant.

**Rytm powrotu:** codzienny rzut oka — brakujący dotąd powód otwierania kalendarza rano. Retro i zaćmienia to dodatkowo tematy, o których userzy słyszą w mediach i przychodzą sprawdzić „co to znaczy DLA MNIE" — darmowy trigger wejść.

**Bez godziny urodzenia:** Księżyc w domach, sezony/okna do ASC·MC i domowa personalizacja retro nie istnieją — warstwy degradują się elegancko do znaków i aspektów planetarnych (flaga `no_birth_time`, spójnie z natal FAZA 6C) + CTA „Uzupełnij godzinę urodzenia".

# 3. Pętla zaangażowania (po co user wraca)

| Częstotliwość | Akcja usera | Warstwa |
|---|---|---|
| codziennie rano | rzut oka na „Dziś" (10 s) | rytm |
| początek tygodnia | sprawdzenie okien (1 min) | okna |
| początek miesiąca | „Twój [miesiąc]" + charakter (2 min) | okna+synteza |
| kilka razy w roku | sezon: nowy/zmiana fazy/dzień ◆ (5 min, deep-dive premium) | sezony |

Każda warstwa karmi inny interwał retencji; push (P2) ma trzy naturalne triggery o różnej częstotliwości.

# 4. Free vs premium (spójnie z modelem biznesowym)

| Element | Free | Premium |
|---|---|---|
| Dziś: Księżyc w znaku, fazy, pytanie przy pełni | ✅ | ✅ |
| Księżyc w Twoich domach | — | ✅ |
| Retro i zaćmienia: zakresy, znaczenie ogólne | ✅ | ✅ |
| Retro i zaćmienia: w którym TWOIM domu | lock | ✅ |
| Okna: pasma + peaki w siatce (że SĄ) | ✅ | ✅ |
| Okna: frazy + zdania znaczenia | lock | ✅ |
| Sezony: nazwa + zakres | ✅ (zajawka premium) | ✅ |
| Sezony: znaczenie, fazy, odczyt dnia ◆ | lock | ✅ |
| Odczyt wybranego dnia | — | ✅ |

Free widzi STRUKTURĘ swojego nieba (uczciwą, osobistą) — płaci za ZNACZENIE. To czytelniejsza granica niż dotychczasowa.

# 5. Panel dnia (po kliknięciu) — sztywna struktura

1. Data (poprawna polska odmiana) + Księżyc w znaku/domu + 1 zdanie rytmu.
2. Jeśli dzień w oknie: karta okna (fraza przez formatTransit, zakres z zaznaczonym peakiem, zdanie znaczenia). Bez „dzień 30 z 30 / peak już za nami" — zamiast tego, jeśli po peaku: „okno się domyka".
3. Jeśli dzień ◆: karta sezonu z auto-odczytem (premium).
4. Jeśli pełnia/nów: karta fazy z pytaniem (jest).
5. Odczyt dnia on-demand (premium, cache w day_interpretations) — tylko dni z oknem/◆.
6. Notatka (jest).
Maksymalnie 2 karty astrologiczne na dzień — przy zbiegu okno+◆ sezon wygrywa, okno w jednej linii.

# 5b. Układ widoku i onboarding

**Kolejność sekcji** — desktop: pasek „Dziś" (1 linia) → „Twoje sezony" (DOMYŚLNIE zwinięte do 1 linii; rozwinięte tylko przy pierwszej wizycie, nowym sezonie lub zmianie fazy) → siatka → „Twój [miesiąc]" → panel dnia w kolumnie bocznej. Mobile: „Dziś" → siatka → „Twój [miesiąc]" → sezony; panel dnia jako bottom sheet. **Siatka musi być widoczna bez scrolla** — user otwiera „Kalendarz" i widzi kalendarz.

**Onboarding pojęć** (pierwsza wizyta, raz): 3 krótkie coachmarki — „━ to Twoje okna: kilka dni sprzyjającej lub wymagającej energii", „★ peak — najsilniejszy dzień okna", „Sezony to długie tematy Twojego roku — znajdziesz je u góry". Zamykalne, nie wracają.

**Strefa czasowa:** granice dni, godziny zmiany znaku Księżyca i momenty dokładności liczone w strefie usera (domyślnie Europe/Warsaw, z danych urodzenia/przeglądarki) — jawnie w implementacji, to klasyczne źródło błędów ±1 dzień.

# 6. Czego NIE ma w v4 (świadome cięcia)

- Pasm wolnych tranzytów w siatce (sezony to karta, nie siatka).
- Wskaźnika „+1" na komórkach (overflow tylko w panelu dnia).
- Tintu intensywności per dzień (rytm dnia niesie Księżyc; tint wracał jako szum — wraca najwcześniej w v5, jeśli w ogóle).
- Zapisu „★N". Gwiazdka występuje wyłącznie jako glif na peaku w siatce.
- Generowania interpretacji dla dni bez wydarzeń.
- **Filtrów kategorii** (Miłość/Kariera/…) — wycięte decyzją właściciela; wracają jako osobna funkcja po stabilizacji okien (mają sens dopiero, gdy okna działają dobrze).

# 7. Błędy z it. 5 do naprawy przy okazji wdrożenia

1. **KRYTYCZNE — niespójność danych natalnych**: panel dnia podaje „Ascendent w Strzelcu", karta miesiąca „w Skorpionie" dla tego samego kosmogramu. Jedno źródło danych natalnych dla wszystkich komponentów kalendarza (ten sam obiekt chart, nie dwa fetche) + test integracyjny porównujący frazy między komponentami.
2. Forma męska w syntezie miesiąca („będziesz musiał") — styl bezrodzajowy obowiązuje także w kalendarzu; podpiąć współdzielony fragment promptu + golden test.
3. Sortowanie chronologiczne wszystkiego, zawsze.
