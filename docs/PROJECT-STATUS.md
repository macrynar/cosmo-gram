---
title: Cosmogram - Project Status
type: project-status
owner: Mac
update_rule: aktualizuj_po_kazdym_release
last_updated: 2026-06-03
---

# Cosmogram - dokument statusu projektu

## Po co ten dokument
Ten plik jest jednym miejscem prawdy dla:
- zalozen biznesowych,
- celu produktu,
- core funkcji produktu,
- aktualnego stanu developmentu,
- historii release'ow i decyzji.

Ten dokument ma byc aktualizowany po kazdym release.

## Zalozenia biznesowe
1. Produkt: aplikacja AI + astrologia dla rynku PL, pozycjonowanie jako "symboliczne lustro" (wsparcie refleksji, nie wyrocznia).
2. Trzon wartosci: spersonalizowana interpretacja kosmogramu urodzeniowego oraz kosmogram dzieciecy dla rodzica.
3. Model przychodu: subskrypcja premium + monetyzacja kontekstowa (paywall na wybrane funkcje i limity uzycia).
4. Retencja: codzienny rytual (daily), dziennik, streak, wydarzenia cykliczne (moon phases, solar return), funkcje relacyjne (astro-match / couple mode).
5. Przewaga: personalizacja AI + domenowa jakosc tresci astrologicznych + lokalny jezyk i kontekst.
6. Priorytet operacyjny: najpierw dzialajacy i stabilny core flow, potem kolejne warstwy premium i automatyzacja.

## Cel produktu
Krotki cel:
- Zbudowac codziennie uzywana aplikacje astrologiczna z realna retencja i zdrowa konwersja na premium.

Cel biznesowy (6-12 mies):
- stabilny wzrost liczby aktywnych userow,
- rosnacy przychod z subskrypcji,
- wysoka retencja platnych userow.

## Core funkcje produktu (najwazniejsze)

### 1) Kosmogram urodzeniowy (natal) - absolutny fundament
Zakres funkcji:
- zebranie danych urodzeniowych (data, miejsce, godzina opcjonalna),
- obliczenie kosmogramu,
- generowanie interpretacji AI po polsku,
- fallback dla braku godziny urodzenia,
- zapis i ponowne otwieranie interpretacji.

Dlaczego to jest core:
- to pierwszy moment "wow" i glowny powod wejscia usera do produktu,
- to zrodlo kontekstu dla kolejnych funkcji (daily, chat, match),
- bez tej funkcji reszta produktu traci sens i trafnosc.

Stan na teraz:
- funkcja jest wdrozona i dziala w glownej sciezce,
- endpoint interpretacji dziala na DeepSeek,
- fallback i bezpieczne zachowanie przy braku AI sa utrzymane,
- to jest krytyczna sciezka, ktora nie moze byc regresowana przy dalszych zmianach.

### 2) Kosmogram dzieciecy - drugi filar produktu
Zakres funkcji:
- dodanie profilu dziecka,
- generowanie interpretacji skierowanej do rodzica,
- dostosowanie tresci do wieku dziecka,
- nacisk na potrzeby emocjonalne, regulacje, styl uczenia i wsparcie rodzicielskie.

Dlaczego to jest core:
- otwiera silny segment rodzicielski (wyzsza sklonnosc do platnosci),
- zwieksza liczbe scenariuszy uzycia i retencje,
- wzmacnia wartosc subskrypcji przez wieloprofilowosc rodzinna.

Stan na teraz:
- funkcja jest obecna i podlaczona do UI,
- endpoint ai-child dziala i jest migrowany na model DeepSeek,
- to obszar wymagajacy stalej walidacji jakosci tresci i tonu odpowiedzi.

### 3) Funkcje wspierajace core
- Daily reading,
- Astro Match,
- Chat kontekstowy,
- Kalendarz retencyjny,
- mechaniki premium i paywalle.

Uwaga strategiczna:
- te funkcje sa wazne, ale nie moga oslabic inwestycji w natal i child.
- kazdy release musi odpowiadac na pytanie: czy poprawia jakosc i stabilnosc core?

## Aktualny stan developmentu (snapshot: 2026-06-03)

### 1) Product status
- Onboarding, auth, generowanie kosmogramu i podstawowe flow dzialaja.
- Natal (kosmogram urodzeniowy) dziala jako glowna sciezka wartosci.
- Child (kosmogram dzieciecy) jest aktywna funkcja i pozostaje priorytetem domenowym.
- Astro Match, Chat, Daily Reading oraz Kalendarz sa obecne i rozwijane iteracyjnie.
- Warstwa retencyjna kalendarza jest wdrazana etapami (filtry, kolory, dziennik, streak, notyfikacje).

### 2) AI i backend
- Generatywne endpointy sa oparte o DeepSeek przez wspolny klient w src/lib/deepseek.ts.
- Daily Reading ma strategie niezawodnosci: JSON mode + retry modelu + fallback offline.
- Astro Match ma stabilizacje parsowania: JSON mode + retry + bezpieczny fallback zamiast 500.
- Child API korzysta z dedykowanego promptu i strumieniowania odpowiedzi.

### 3) Frontend i UX
- Dostepne sa strony i flow dla: natal, daily, children, match, chat, settings.
- Trwaja prace nad rozbudowa kalendarza do roli silnika retencji.
- W projekcie istnieja punkty premium gating i scenariusze upsell.

### 4) Ostatnie releasy (z git)
- 86fac1d - Retencja P0.5/P0.6/P0.8/P0.9 (Dziennik, Streak, Transit duration, Bell)
- 0a465d8 - Warstwa retencyjna Faza 1 (filtry, kolory, drawer, Moon Diary)
- 2cf6df7 - Ujednolicenie gradacji i kontekstu DayPanel
- 42154c4 - Poprawki DayPanel i UpcomingEvents
- d78ce68 - Poprawa wizualizacji siatki i tabeli zdarzen

### 5) Ryzyka / uwagi
- Kluczowe ryzyko: stabilnosc API AI (format odpowiedzi i puste outputy modelu).
- Obszar do stalej kontroli: koszt i niezawodnosc wywolan AI pod obciazeniem.
- Obszar krytyczny: jakosc outputu natal i child (spojnosc tonu, trafnosc, brak regresji po zmianach promptu/modelu).
- Obszar do domkniecia produktowo: pelna walidacja scenariuszy retencyjnych po stronie UX i analityki.

## Priorytety release (kolejnosc)
1. Stabilnosc i jakosc kosmogramu urodzeniowego.
2. Stabilnosc i jakosc kosmogramu dzieciecego.
3. Daily + Match + Chat bez bledow krytycznych.
4. Rozwoj mechanik retencyjnych kalendarza.
5. Rozwoj i optymalizacja premium gates.

## Definicja "release gotowy"
Release uznajemy za gotowy dopiero gdy:
1. Natal i Child przechodza testy manualne bez regresji.
2. Brak nowych bledow krytycznych 5xx na glownych endpointach AI.
3. Najwazniejsze flowy UI dzialaja end-to-end (generate, child, daily, match).
4. Zaktualizowany jest ten dokument i PROGRESS.

## KPI do sledzenia po release
1. Natal completion rate: onboarding -> wygenerowany kosmogram.
2. Child adoption rate: ilu userow dodaje profil dziecka.
3. Daily return D1/D7.
4. Match usage per aktywny user.
5. Paywall view -> conversion.
6. AI failure rate (empty/invalid response).
7. Sredni czas odpowiedzi endpointow AI.

## Zasada aktualizacji po kazdym release (obowiazkowa)
Po kazdym release dopisz nowy wpis w sekcji "Release log" i zaktualizuj:
1. last_updated w naglowku pliku,
2. sekcje "Core funkcje produktu" (czy zaszla zmiana w natal/child),
3. "Aktualny stan developmentu" (co realnie sie zmienilo),
4. ryzyka / blokery,
5. metryki (jesli sa dostepne),
6. nastepny focus.

## Release log

### [2026-06-03] Rozszerzenie dokumentu statusowego
- Rozbudowano dokument o pelny opis core funkcji (natal i child) jako filarow produktu.
- Dodano priorytety release, definicje "release gotowy" oraz KPI.
- Urealniono sekcje stanu technicznego i ryzyk.
- Nastepny focus: utrzymanie wysokiej jakosci i stabilnosci core przy dalszych releasach retencyjnych.

## Szablon wpisu release (kopiuj przy kolejnych wydaniach)

### [YYYY-MM-DD] Nazwa release
- Zmiany w core natal:
- Zmiany w core child:
- Co dowiezione:
- Co poprawione:
- Co nadal otwarte:
- Ryzyka po release:
- Metryki (jesli sa):
- Nastepny focus:
