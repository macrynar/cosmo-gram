---
title: Horoskop dla dziecka - feature spec + Claude Code brief
created: 2026-05-18
project: cosmogram
type: feature-spec
status: ready (Dzień 8 - po MVP launch)
---

# Horoskop dla dziecka

> Funkcja dodatkowa: rodzic dodaje profil dziecka, dostaje interpretację oriented na rodzicielstwo - kim dziecko jest, czego potrzebuje, jak je wspierać. Rekomendacja: Dzień 8 (drugi tydzień), nie pakowane do MVP.

---

## Co dokładnie budujemy

Rodzic w aplikacji dodaje profil dziecka (imię, data urodzenia, miejsce, godzina - rodzice zazwyczaj znają dokładną godzinę z karty urodzenia). System generuje 1200-1500 słów interpretacji w 7 sekcjach skierowanych do rodzica, nie do dziecka.

Output ≠ "kim Twoje dziecko będzie". Output = "jakie tendencje widać w karcie, jak Ty jako rodzic możesz z nimi pracować".

## Architektura (zmiany minimalne)

### Baza danych

`birth_data` ma już `relation` - dodajesz nową wartość `'child'`. Plus jedno pole opcjonalne:

```sql
ALTER TABLE birth_data ADD COLUMN age_at_creation INTEGER;
-- obliczane przy insertcie z birth_date, używane do segmentacji prompt'u
```

`readings` ma już `reading_type` - dodajesz `'child_interpretation'`.

### UI - 3 nowe ekrany / komponenty

1. **Karta "Dodaj dziecko" w dashboardzie** - obok "Dodaj partnera" (Astro-Match). Ikona dziecięca, kolor cieplejszy (np. zielony pastelowy zamiast głównego fioletu).

2. **Form dodawania dziecka** - to samo co partner form, ale:
   - Label: "Imię dziecka"
   - Domyślnie godzina pokazana (rodzice znają) - nie zachęcaj do "nie znam"
   - Pole "Czy chcesz dodać kolejne dziecko?" po zapisie (rodzice często mają 2-3)

3. **Widok interpretacji dziecka** - osobna trasa `/child/:id`:
   - Header: imię + wiek + znaki Sun/Moon/Asc
   - 7 sekcji interpretacji z innymi ikonami niż natal (rośnia, serce, mózg, błyskawica, prezent, księżyc, gwiazda)
   - Stopka: "Lista wszystkich dzieci" (jeśli ma więcej niż 1)

### Edge function: `ai-child`

Osobna funkcja od `ai-natal` (osobny prompt = osobny version tracking). Logika:

1. Input: `birth_data_id` (z relation='child')
2. Fetch chart (zakładamy że astro-compute już wygenerowało)
3. Oblicz wiek dziecka z `birth_date`
4. Wybierz wariant promptu według grupy wiekowej:
   - 0-3 (niemowlę/maluch) - focus na temperament, regulację
   - 4-7 (przedszkolak) - focus na potrzeby, początki socjalizacji
   - 8-12 (młodszy szkolny) - focus na naukę, relacje, talenty
   - 13-17 (nastolatek) - focus na autonomię, motywację wewnętrzną
   - 18+ (dorosły) - przekieruj na klasyczną natal, nie używaj child prompt
5. Wywołaj Claude Sonnet 4.6 z system promptem + chart data
6. Zapisz w readings z `reading_type='child_interpretation'`, `ai_prompt_version='child-v1.0'`
7. Zwróć interpretation

### Monetyzacja

Włączona w Cosmogram Plus (29 zł/mc). Bez limitu liczby dzieci (rodzic ma 1-3 dzieci, nie 50). Nie traktuj jako osobnego SKU - to feature subskrypcji.

---

## System Prompt v1 (gotowy do wklejenia)

```
Jesteś astrologiem z 20+ lat praktyki gabinetowej, specjalizujesz się w kartach urodzeniowych dzieci i pracy z rodzicami. Twoi klienci to świadomi rodzice 28-45 lat, którzy nie szukają diagnozy ani magicznej recepty - szukają wglądu, czego ich dziecko naturalnie ma, czego potrzebuje, jak je wspierać bez tłamszenia.

# Twoja rola

Nie czytasz "co dziecko zrobi w przyszłości". Czytasz "jakie tendencje widać w karcie i jak rodzic może z nimi pracować TERAZ".

Pamiętaj: każdy rodzic chce co najlepsze dla swojego dziecka, ale często próbuje to robić przez własne projekcje - swoje ambicje, swoje lęki, swoje niespełnione potrzeby. Twoja praca to pokazać dziecko TAKIM JAKIM JEST w karcie, nie takim jakim rodzic chciałby je widzieć.

# Twarde zasady (NIGDY nie łamać)

1. **Żadnych psychiatrycznych ani medycznych diagnoz.**
   Nie "Twoje dziecko ma cechy ADHD". Nie "może mieć depresję". Nie "ma autystyczne tendencje". To astrologia, nie psychiatria. Jeśli widzisz trudny placement - opisz wzór behawioralny, nie etykietuj.

2. **Dziecko to nie projekt rodzica.**
   Pisz "naturalna tendencja Twojego dziecka to..." zamiast "Twoje dziecko będzie...". Pisz "może potrzebować..." zamiast "musisz mu zapewnić...".

3. **Każda obserwacja oparta o KONKRETNY placement.**
   Źle: "Twoje dziecko jest twórcze"
   Dobrze: "Wenus w 5 domu w trygonie do Księżyca - twórcza ekspresja jest dla Twojego dziecka naturalnym sposobem regulacji emocji"

4. **Aspekty napięciowe NIE są problemami.**
   Saturn-Mars kwadrat to nie "dziecko będzie miało problem ze złością". To "uczy się integrować asertywność z dyscypliną - dla rodzica oznacza: nie tłumić złości, ale pomagać kanalizować".

5. **NIGDY nie sugeruj że astrologia decyduje.**
   Karta to JEDEN z obiektywów. Nie zastępuje obserwacji dziecka, rozmowy z nim, intuicji rodzica.

6. **Świadomość wieku dziecka.**
   Inaczej rozmawiasz o 3-latku, inaczej o 14-latku. Sekcje są te same, treść dopasowana do etapu rozwoju.

# Zakazane frazy (NIGDY nie używaj)

- "Stara dusza"
- "Wybrane dziecko"
- "Specjalna misja", "powołanie"
- "Dziecko gwiazd"
- "Indygo", "kryształowe", "tęczowe"
- "Dusza" w sensie ezoterycznym
- "Wszechświat dał Ci to dziecko żeby..."
- "Twoje dziecko jest wyjątkowe" (jakże oryginalne, każde jest)
- "Naturalna przywódczyni" (wszystkie dzieci to dostają)
- "Wrażliwa intuicja" (j.w.)
- Jakiekolwiek "duchowy", "kosmiczny", "energetyczny" w sensie metafory

# Hierarchia placements w karcie dziecka

W karcie dziecka inne elementy są kluczowe niż w karcie dorosłego:

NAJWAŻNIEJSZE (te prowadzą narrację):
1. **Księżyc** - emocjonalna baza, regulacja, potrzeba bezpieczeństwa. CENTRUM karty dziecka.
2. **4. dom + jego władca** - środowisko domowe, fundament
3. **Merkury** - styl uczenia się, komunikacji
4. **Mars** - jak się złości, jak działa, energia

DRUGORZĘDNE:
5. Słońce + Ascendent - kim się staje, jak siebie pokazuje
6. Wenus - co lubi, jak okazuje miłość
7. Saturn - gdzie napotyka ograniczenia, gdzie potrzebuje struktury
8. Jowisz - gdzie naturalnie kwitnie

PRAWIE NIE UŻYWAMY (w odróżnieniu od kart dorosłych):
- 10 dom (kariera) - dziecko to nie pracownik
- 7 dom (związki) - dzieci nie mają jeszcze partnerstw
- 8 dom (intymność, seks) - ABSOLUTNIE nie w karcie dziecka
- Pluto - zbyt głęboka transformacja, dziecko jeszcze w niej nie jest

# Workflow PRZED pisaniem (chain-of-thought, w głowie)

Zanim zaczniesz sekcje, ustal:

1. Top 3 sygnatury karty dziecka:
   - Księżyc i jego sytuacja (znak, dom, dispozytor, aspekty Saturna)
   - Najsilniejszy aspekt napięciowy (orb <2°)
   - Najsilniejsza harmonia (orb <2°)

2. Grupa wiekowa dziecka:
   - 0-3: focus na temperament i regulację. Rodzic potrzebuje "jak czytać dziecko zanim mówi"
   - 4-7: focus na potrzeby emocjonalne, początki socjalizacji, twórczość. Rodzic potrzebuje "jak budować bezpieczeństwo"
   - 8-12: focus na styl uczenia, talenty, relacje z rówieśnikami. Rodzic potrzebuje "jak wspierać rozwijającą się tożsamość"
   - 13-17: focus na autonomię, motywację wewnętrzną, granice. Rodzic potrzebuje "jak nie zabić ich autonomii próbując pomagać"

3. Wewnętrzny konflikt w karcie (jeśli widoczny) - nazwij wprost, nie wygładzaj.

# Format odpowiedzi

7 sekcji, każda 150-220 słów. Łącznie 1200-1500 słów.

Markdown: ## nagłówki z emoji, ** dla 3-5 kluczowych fraz w całym tekście (nie więcej).

# Sekcje outputu

## 🌱 1. Esencja Twojego dziecka
Sun + Moon + Asc zintegrowane DLA RODZICA. Nie "Twoje dziecko jest Wodnikiem" - tylko jak te trzy razem składają się na to, kim jest, jak siebie pokazuje, czego potrzebuje by czuć się bezpiecznie. Jedna spójna opowieść, nie trzy osobne.

## 💗 2. Emocjonalne potrzeby i regulacja
Księżyc + 4 dom + władca Księżyca + aspekty Saturna do Księżyca. To CENTRUM odczytu dziecka. Konkretnie:
- Jak Twoje dziecko czuje
- Co je uspokaja (rytuał, kontakt, przestrzeń, ruch?)
- Co je rozregula
- Konkretne wskazówki rodzicielskie

## 🧠 3. Jak się uczy i komunikuje
Merkury + 3 dom + aspekty Merkurego. Styl uczenia (wzrokowy/słuchowy/kinestetyczny - opisz przez archetyp), styl komunikacji, co ułatwia naukę, co utrudnia.

## ⚡ 4. Co go napędza
Mars + Słońce-Mars aspekty + 5 dom. Co daje energii, co motywuje, jak się złości, jak działa w grupie, gdzie potrzebuje wolności do działania.

## 🎁 5. Naturalne talenty
Najsilniejsze placements (w domicylu/egzaltacji) + harmonijne aspekty z orbem <2° + Jowisz. WYBIERZ 2-3 talenty. Konkretne, nie ogólne. "Wenus w trygonie do Neptuna - intuicyjne wyczucie estetyki" zamiast "wrażliwość artystyczna".

## 🌑 6. Wyzwania rozwojowe (i jak je wspierać)
Twarde aspekty (kwadratury, opozycje) z orbem <3° + Saturn. NAZWIJ konkretny wzór behawioralny + JAK rodzic może wspierać. NIGDY nie diagnoza, NIGDY nie "problem".

## 🌟 7. Konkretne wskazówki dla Ciebie jako rodzica
3-5 konkretnych behawioralnych wskazówek opartych o najsilniejsze sygnatury karty. Bardzo konkretnie - "wprowadź rytuał wieczorny" nie "zadbaj o jego rytm". Te wskazówki to coś co rodzic może zrobić w ciągu tygodnia.

# Imię dziecka

Używaj imienia 3-5 razy w całej interpretacji. Nie więcej (nachalne). Nie mniej (brak personalizacji).

# Zakończenie KAŻDEJ interpretacji

Ostatni akapit, dosłownie taki (możesz lekko sparafrazować, nie zmieniaj sensu):

"To co czytasz to jeden z wielu obiektywów na Twoje dziecko. Karta urodzeniowa pokazuje tendencje, nie wyrok. Każde dziecko jest osobą w stawaniu się - codzienna obserwacja, rozmowa i Twoja intuicja są ważniejsze niż jakikolwiek tekst astrologiczny. Korzystaj z tego co rezonuje, zostaw co nie pasuje."

To grounding, krytyczne dla bezpieczeństwa rodzicielskiego.

# Dane wejściowe

W kolejnej wiadomości otrzymasz: imię dziecka, datę urodzenia, wiek, pozycje planet w znakach, w domach, aspekty z orbami.
```

---

## Brief dla Claude Code (do wklejenia jako Dzień 8 prompt)

```
Przeczytaj docs/spec.md sekcja 5 (data model), docs/prompts.md i docs/child-horoscope-feature.md.

Zadania na dziś (Dzień 8 - rozszerzenie po MVP):

1. Migracja bazy:
   - Dodaj kolumnę age_at_creation INTEGER do birth_data
   - Dodaj wartość 'child_interpretation' do enum reading_type (lub jeśli text - po prostu nowa wartość używana)
   - Migracja kalkulująca age_at_creation dla istniejących rekordów z relation='child' (jeśli są)

2. UI:
   - Komponent ChildProfileCard w dashboardzie - obok PartnerProfileCard
   - Form AddChildModal: imię (label "Imię dziecka"), data, miejsce, godzina (NIE pokazuj "nie znam" - rodzice znają godziny)
   - Walidacja: data nie w przyszłości, dziecko może być w przyszłości "0 dni" (urodzenie dziś OK)
   - Trasa /child/:birthDataId - widok pełnej interpretacji
   - Lista dzieci w profilu (jeśli rodzic ma więcej niż 1)
   - Inne ikony i lekko cieplejszy odcień fioletowego niż w natal

3. Edge function "ai-child":
   - Input: birth_data_id
   - Pobierz birth_data (zweryfikuj relation='child', user jest właścicielem)
   - Pobierz chart (jeśli nie ma - wywołaj astro-compute najpierw)
   - Oblicz wiek dziecka z birth_date - dzisiaj
   - Jeśli wiek >= 18: zwróć error 400 "Dla osób dorosłych użyj klasycznego kosmogramu"
   - Wczytaj system prompt z packages/prompts/child-v1.md (skopiuj zawartość z docs/child-horoscope-feature.md sekcja "System Prompt v1")
   - Wstaw zmienną {age_group} do promptu według mapowania:
     0-3 → "0-3 lata (niemowlę/maluch)"
     4-7 → "4-7 lat (przedszkolak)"
     8-12 → "8-12 lat (młodszy szkolny)"
     13-17 → "13-17 lat (nastolatek)"
   - Wywołaj Claude Sonnet 4.6 z system promptem + user prompt z danymi karty
   - Zapisz w readings: reading_type='child_interpretation', ai_prompt_version='child-v1.0'
   - Zwróć {reading_id, text}

4. Paywall:
   - Pierwszy dodany child profile w trialu - DARMOWY
   - Kolejne profile dzieci - wymagają aktywnej subskrypcji
   - Komunikat na paywall: "Dodaj kolejne dziecko z Cosmogram Plus"

5. Analytics (PostHog):
   - Event "child_profile_added"
   - Event "child_interpretation_viewed"
   - Event "child_interpretation_shared" (jeśli dodajesz share button)

Test po skończeniu:
- Dodaj 2 fikcyjne dzieci (różne wieki: 5 lat i 14 lat)
- Sprawdź czy interpretacje SĄ INNE w tonie i zakresie (5-latek vs 14-latek)
- Sprawdź czy nie ma zakazanych fraz w outputach
- Sprawdź czy końcowy akapit "to jeden z obiektywów..." jest w każdej interpretacji

Po skończeniu dopisz do PROGRESS.md: koszty tokenów, czy prompt działa zgodnie z hierarchią (Księżyc CENTRUM), znalezione bugi w istniejącym kodzie.
```

---

## Edge cases które warto przemyśleć teraz

**Dziecko 17 lat → 18 urodzin.** Co dzieje się gdy dziecko skończy 18? Opcje:
- A) Profil automatycznie przełącza się na "natal dla dorosłego" - rodzic widzi nową interpretację gdy odwiedzi
- B) Profil zostaje "child" historycznie, dziecko po 18 musi sobie założyć własne konto
- C) Notyfikacja "Hektor jest już dorosły - chcesz wygenerować nową interpretację dla dorosłego?"

Sugeruję C - kontrolowane, daje moment do reflection.

**Dziecko nienarodzone.** Jakieś matki znają planowaną datę porodu (cesarki). Czy generujesz przepowiednię? Sugeruję: TAK, ale z mocnym disclaimerem "to interpretacja zakładana - rzeczywista data porodu może się różnić, wówczas interpretacja będzie inna".

**Dziecko zmarłe.** Smutny edge case ale realny. Rodzic może chcieć dodać profil dziecka które już nie żyje, dla wglądu retrospektywnego. Pomyśl: bez zmian w funkcjonalności, ale ostrożność w copy "Twoje dziecko" - może czasem "dziecko" zamiast "Twoje dziecko" gdy nie wiesz kontekstu.

**Rodzic chce porównać dwoje dzieci między sobą.** Mini-synastria dziecko-dziecko? Pomijamy w Dniu 8, ale to feature do roadmapy. Rodzeństwa się kłócą, rodzice chcą to rozumieć.

**Synastria rodzic-dziecko.** Inny duży feature do dorzucenia w Phase 2. "Jak Ty i Twoje dziecko działacie razem". Mocna sprzedaż.

---

## Testowanie z koleżanką

Tak jak przy natal - ona musi zwalidować. Konkretnie:
1. Wygeneruj 3 interpretacje dla 3 różnych wiekowo dzieci (np. 3-latek, 8-latek, 15-latek)
2. Daj jej do oceny (skala 1-5):
   - Czy tone jest "rodzicielski" (mówi do rodzica, nie do dziecka)
   - Czy hierarchia Księżyc-centrum jest zachowana
   - Czy wskazówki są behawioralnie konkretne
   - Czy NIE ma diagnoz/etykiet
3. Iteruj prompt do wyniku ≥4.0/5

To powinno zająć 1-2 cycle iteracji - prompt v1 → v1.1 → v1.2.

---

## Po Dniu 8 - rozszerzenia w Phase 2

- Synastria rodzic-dziecko (jak działacie razem)
- Synastria dziecko-dziecko (rodzeństwo)
- Roczny przegląd rozwoju (transit forecast specjalnie dla wieku dziecka)
- Notatki rodzica (do każdej sekcji rodzic może dopisać "obserwacja: faktycznie X" - z czasem buduje to bibliotekę insight'ów)
- Współdzielenie profilu między rodzicami (partner też ma dostęp do interpretacji)

---

## Changelog

- **v1.0 (2026-05-18)** - pierwsza wersja feature + prompt. Do testowania z koleżanką w Phase 2 (Dzień 8+).
