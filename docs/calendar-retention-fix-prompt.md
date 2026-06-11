# PROMPT DLA CLAUDE CODE — Kalendarz: przebudowa w silnik retencji (naprawczy)

> Zastępuje FAZĘ 3 z p1-1-transits-engine-prompt.md w zakresie UI/UX kalendarza + domyka braki z tamtego promptu. Obecny kalendarz ma wdrożony silnik (transits.ts, getPowerDays, golden/unit/E2E), ale UX jest zepsuty — szczegóły niżej. To NIE jest kosmetyka: przebuduj warstwę prezentacji wg tej specyfikacji dokładnie.

---

Pracujesz w repo aplikacji Cosmogram: Next.js 16, TypeScript, Supabase, Framer Motion. Wdrożone: `src/lib/astro/transits.ts` (ranking, pogoda dnia, getUpcomingSignificantTransits), `getPowerDays`, `daily_personal_horoscopes` + cron + e-mail, widget wyjaśnienia dnia, banner tranzytów, golden/unit/E2E. Modele: masowe treści = gemini-3.1-flash-lite, premium = claude-haiku-4-5.

## Zdiagnozowane problemy (napraw wszystkie)

1. **Inflacja wyjątkowości**: każdy dzień dostaje badge „Wyjątkowy dzień" i pełną interpretację → żaden dzień nie jest wyjątkowy. Scarcity = wartość.
2. **Redundancja treści**: ten sam tekst występuje 3× w panelu dnia (podsumowanie u góry = treść „CO SPRZYJA" = treść „NA CO UWAŻAĆ" sklejone).
3. **Deklinacja**: „Saturn w Baran", „Pluton w Wodnik", „Księżyc w Baran" — mapa odmian (i18n.ts) NIE jest używana w kalendarzu. Każda nazwa znaku w UI przechodzi przez mapę deklinacji. Bez wyjątków.
4. **Brak persystencji**: wygenerowana interpretacja dnia znika — musi być zapisywana i czytana z cache na zawsze.
5. **Rozjechany przycisk** „Wygeneruj interpretację — szczególnie wartościowe dziś" — layout + AI-owe copy do wymiany.
6. **Martwa siatka**: dni miesiąca to puste prostokąty — zero informacji na rzut oka.
7. **Podejrzenie legacy**: logi AI idą przez funkcję `deepSeekChat` — zweryfikuj, czy to tylko stara nazwa wrappera, czy realnie stary path. Wrapper przemianuj zgodnie z obecną architekturą; potwierdź w raporcie, jaki model faktycznie generuje treści kalendarza.

---

## FAZA 0 — Weryfikacja i higiena

1. Audyt path'u generacji kalendarza: jaki model, jaki prompt, czy przechodzi przez warstwę `src/lib/ai/` z logowaniem i pseudonimizacją. Przemianuj `deepSeekChat` → neutralna nazwa (np. `aiComplete`). Jeśli gdziekolwiek został realny endpoint DeepSeek — usuń (miało go nie być).
2. Wymuś mapę deklinacji we wszystkich tekstach kalendarza (badge, sekcje, banner, e-mail). Unit test: render panelu dnia dla 12 znaków → asercja poprawnych form miejscownika.

## FAZA 1 — Architektura informacji: hierarchia dni (serce naprawy)

Zdefiniuj w kodzie (deterministycznie, z istniejącego rankingu tranzytów) **4 klasy dnia** — i konsekwentnie różnicuj prezentację:

| Klasa | Ile w miesiącu | Siatka | Panel dnia |
|---|---|---|---|
| **Dzień Mocy** | ~5 (z getPowerDays) | złoty pierścień + delikatny glow | pełna interpretacja AUTO (premium), gotowa rano z crona |
| **Dzień znaczący** | ~5–8 (ranking > próg) | subtelna kropka koloru kategorii | sekcje sprzyja/uważaj (deterministyczne zdania) + interpretacja ON-DEMAND |
| **Dzień zwykły** | większość | sama intensywność tła (patrz Faza 2) | pogoda dnia + 1 zdanie z puli statycznej („Spokojny dzień — dobry na domykanie drobiazgów"), BEZ przycisku generowania |
| **Wyjątkowy dzień** | 0–2 (ranking > wysoki próg, np. dokładny tranzyt wolnej planety do Słońca/ASC/MC) | wyróżnienie + ikona ★ | badge „Wyjątkowy dzień" TYLKO tutaj + pełna interpretacja auto |

Zasady: badge „Wyjątkowy dzień" znika z dni klasy 1–3. Progi klas w configu (`src/lib/astro/dayClasses.ts`), z testami na rozkład (miesiąc referencyjny → liczność klas w widełkach powyżej; jeśli próg generuje 15 dni znaczących — kalibruj wagi, nie akceptuj inflacji).

## FAZA 2 — Siatka miesiąca: glanceable

1. **Tekstura miesiąca**: każda komórka dnia ma subtelną intensywność (pogoda dnia 1–5 → opacity/ciepło tła w skali złota; ledwo widoczne dla 1, wyraźne dla 5). Efekt: miesiąc wygląda jak mapa pogody — widać falowanie energii bez klikania. To jest główny wow siatki.
2. Dni Mocy: złoty pierścień (jak obecnie zaznaczone 10/11), Wyjątkowy dzień: pierścień + ★. NIE podświetlaj pełnym tłem grupy dni (obecne 1–3 wyglądają jak zaznaczenie myszą).
3. Fazy Księżyca: pełnia/nów jako cienki glif księżyca w rogu komórki (nie szara kropka myląca się z dniem znaczącym).
4. Dziś: wyraźna obwódka koloru akcentu, zawsze odróżnialna od Dni Mocy.
5. Legenda: max 3 elementy (Dzień Mocy / pełnia·nów / intensywność), jednolinijkowa, bez „(~5 / mies.)".
6. Hover/tap dnia: mini-tooltip (klasa dnia + headline 5 słów) zanim user kliknie — zachęta do eksploracji.

## FAZA 3 — Panel dnia: jedna narracja, zero powtórzeń

Struktura panelu od góry (sztywna kolejność, każda informacja występuje RAZ):

1. **Nagłówek dnia**: data + chip klasy dnia (tylko klasa 1/4 ma chip) + pogoda dnia (intensywność + żywioł) + Księżyc w znaku (odmieniony!) — jedna linia meta.
2. **Headline dnia** (1 zdanie, max 90 znaków) — deterministyczny szablon z dominującego tranzytu LUB z interpretacji jeśli wygenerowana. NIE powtarza treści sekcji niżej.
3. **Sekcje sprzyja/uważaj** — TYLKO gdy są realne tranzyty danej kategorii (klasa 2–4); zdania deterministyczne z map tekstów tranzytów (asset planeta×aspekt×punkt, odmiana z i18n), NIE kopiowane do headline. Dzień zwykły: zamiast sekcji jedno zdanie z puli + pogoda.
4. **Interpretacja personalna**:
   - klasa 1 i 4 (premium): auto, z crona, czytana z tabeli;
   - klasa 2 (premium): przycisk „Odczytaj ten dzień" (spójny z design system, napraw layout) → generacja haiku → **zapis do tabeli `day_interpretations` (user_id, date, content, transits_used, created_at; RLS)** → kolejne wejścia czytają z cache. Przycisk znika po wygenerowaniu;
   - klasa 3: BRAK przycisku (scarcity); free: lock z copy „Osobisty odczyt dni — w premium".
5. **Pytanie refleksyjne + notatka** (istnieje) — zostaje, ale pytanie tylko dla klasy 1/2/4 (dzień zwykły: samo pole notatki). Prompt streak „Zacznij serię" — USUŃ do czasu P2 (Moon Diary); zostaje czyste pole notatki.
6. E2E: dwukrotne wejście w ten sam dzień = jedna generacja (asercja na `ai_call_logs`); panel nie zawiera tego samego zdania 2× (asercja tekstowa).

## FAZA 4 — Filtry kategorii: nadaj im semantykę albo usuń

Chipy Miłość/Kariera/Energia/Komunikacja zostają TYLKO jeśli działają tak: filtr = podświetlenie w siatce dni, których tranzyty dotykają punktów natalnych kategorii (deterministyczna mapa: Miłość = Wenus/Księżyc/dom V i VII; Kariera = MC/Saturn/Słońce/dom X; Energia = Mars/Słońce; Komunikacja = Merkury/dom III). Wybrany filtr przyciemnia resztę dni i pokazuje pod siatką listę „najlepsze dni na X w tym miesiącu" (top 3 z datami). Use case: „kiedy rozmawiać o podwyżce". Emoji w chipach → ikony liniowe (spójność z natal). Jeśli to za dużo na teraz — usuń chipy całkowicie (pusta atrapa jest gorsza niż brak).

## FAZA 5 — „Twoje nadchodzące okna" — szlif

1. Max 3 pozycje, tylko klasa 2+ — to działa dobrze, zostaje.
2. Format: „**Mars trygon Twojego Księżyca** · peak dziś · jeszcze 2 dni" — odmiana przez i18n (nie „Twoim Księżycem" po „trygon" — ustal jedną poprawną konwencję frazową i stosuj wszędzie).
3. Dzwoneczki/„0/3 powiadomień": USUŃ do czasu pushy (P2) — martwy UI mylący usera.
4. Klik w okno → przejście do dnia peak w kalendarzu.

## FAZA 6 — Domknięcie braków z poprzedniego promptu

1. **E-mail premium** (FAZA 2.6 tamtego promptu): szablon bierze `headline` + skrót z `daily_personal_horoscopes` (nie stary szablon znaku Słońca). Test: snapshot szablonu z fixture.
2. **Free w kalendarzu** (FAZA 3.2): free widzi siatkę z intensywnością (pogoda dnia — deterministyczna, koszt zero) + ogólne Dni Mocy + lock „Twoje osobiste Dni Mocy — w premium" w miejscu personalnych + zablokowany panel interpretacji. Intensywność siatki to przedsmak — zostawiamy ją free świadomie.
3. **Dokument statusu projektu** (FAZA 4.5): zaktualizuj o cały zakres P1-1 + tę przebudowę.

## FAZA 7 — QA wizualne (warunek zakończenia)

1. Napraw rozjechany przycisk i przejdź panel dnia + siatkę na 390×844 i desktop — screenshot testy Playwright dla: dzień mocy, dzień znaczący, dzień zwykły, wyjątkowy, free z lockiem.
2. Asercje językowe: zero mianownika po „w" (regex na „w Baran|w Wodnik|w Bliźnięta…" po wszystkich znakach), zero powtórzonych zdań w panelu.
3. Rozkład klas dni dla 3 kosmogramów referencyjnych w widełkach z Fazy 1.
4. PostHog: `calendar_day_opened` (z klasą dnia), `day_interpretation_generated`, `calendar_filter_used`, `upcoming_window_clicked`.

## Zasady

- Scarcity jest funkcją, nie brakiem: dni zwykłe MAJĄ być ciche. Nie dodawaj treści „żeby coś było".
- Wszystko deterministyczne poza interpretacją personalną; AI nie pisze sekcji sprzyja/uważaj (mapa tekstów).
- Każda nazwa znaku w UI przez mapę deklinacji — bez wyjątków.
- Niejasności → zatrzymaj się i zapytaj.
