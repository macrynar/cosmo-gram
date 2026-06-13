# PROMPT DLA CLAUDE CODE — Kalendarz v2: model okien + naprawa bugów jakości

> Iteracja po wdrożeniu calendar-retention-fix-prompt.md. Diagnoza: system 4 klas dnia był błędny koncepcyjnie — wolne tranzyty trwają tygodniami, więc klasyfikacja dzień-po-dniu produkuje serie gwiazdek (8–12 lipca z rzędu) i dwa konkurujące oznaczenia (Dzień Mocy vs Wyjątkowy), których user nie odróżnia. Nowy model mentalny: **OKNA z jednym dniem peak**. Plus krytyczne bugi jakości tekstu.

---

Pracujesz w repo Cosmogram. Wdrożone: silnik tranzytów z rankingiem, okna w „Twoje nadchodzące okna" (start/peak/długość — działa poprawnie), `daily_personal_horoscopes`, `day_interpretations`, klasy dni (do zastąpienia), intensywność siatki, golden/E2E.

## FAZA 0 — Bugi krytyczne jakości (najpierw, bez tego reszta nie ma sensu)

1. **Obce alfabety w polskim tekście**: na produkcji „家owego ciepła" (chiński znak) i „uderzaет" (cyrylica) — znany glitch gemini-flash-lite. Walidacja każdego outputu AI: regex dopuszczający wyłącznie łacinę z polskimi diakrytykami + interpunkcję; wykrycie obcego skryptu = retry (max 2), potem fallback na claude-haiku-4-5 dla tej generacji. Zaloguj w `ai_call_logs` jako `script_glitch` — jeśli rate > 2%, rozważymy zmianę modelu masowego.
2. **Teksty ucięte w pół zdania** („stare sposoby o", „pozwolić sobie na"): sprawdź `finish_reason`/`max_tokens` — podnieś limit tokenów dla horoskopu i odczytu dnia; walidacja: output kończy się znakiem końca zdania, inaczej retry. Sprawdź też, czy UI nie przycina (line-clamp/overflow) — jeśli tak, usuń clamp.
3. **Struktura JSON nie jest renderowana**: panel pokazuje surowy tekst pod podwójnym tytułem („DZIENNY HOROSKOP" + „Dzienny horoskop"). Renderuj pola: `headline` jako tytuł (serif), `main`, `reflection` jako wyróżnioną sekcję. Jeden tytuł. Jeśli rekordy w bazie mają płaski tekst (stary format) — regeneruj przy odczycie.
4. **Deklinacja — nadal dziury**: „Pluton w Wodniaku" (→ w Wodniku). Mapa deklinacji ma być JEDYNYM źródłem form; dodaj brakujące przypadki + rozszerz test regex o wszystkie błędne formy miejscownika (Wodniaku|Baran |Wodnik |Bliźnięta …).
5. **Konwencja frazy tranzytu** (jedna, wszędzie — linie okien, panel dnia, banner, e-mail):
   `[Planeta] w [znak-miejscownik] · [aspekt] do Twojego/Twojej [punkt natalny] w [znak-miejscownik]`
   np. „Mars w Byku · opozycja do Twojej Wenus w Skorpionie". Zaimek wg rodzaju gramatycznego PUNKTU (Twojego Słońca/Marsa, Twojej Wenus/Twojego Księżyca). Obecne „Mars opozycja Twoją Wenus w Byku" czyta się, jakby natalna Wenus była w Byku — to błąd komunikacji, nie astrologii.
6. **Wyścig przycisku generowania**: stan deterministyczny — dzień z auto-interpretacją (dziś/peak premium) NIGDY nie pokazuje przycisku (od razu skeleton → treść); dzień on-demand pokazuje przycisk, klik → skeleton → treść → przycisk znika na zawsze (czyta z `day_interpretations`). Żadnych stanów przejściowych z mignięciem przycisku.

## FAZA 1 — Jeden model mentalny: OKNA (zastępuje klasy dni)

1. `src/lib/astro/windows.ts`: okno = ciągły zakres dni, w którym tranzyt utrzymuje orb (silnik już to liczy dla „nadchodzących okien" — wydziel i reużyj). Atrybuty: tranzyt, start, **peak (dzień najściślejszego orbu — dokładnie JEDEN)**, koniec, siła (ranking), kategoria (miłość/kariera/energia/komunikacja), charakter (wspierające/wymagające).
2. **Dzień Mocy = peak okna** (top ~5 okien miesiąca wg siły). Jedno pojęcie, jedna gwiazdka. Pojęcie „Wyjątkowy dzień" USUWAMY z UI całkowicie (badge, legenda, panel). Test: w żadnym miesiącu referencyjnym nie ma dwóch ★ obok siebie — peak to punkt, nie pasmo.
3. **Siatka**: dni okna = cienkie pasmo u dołu komórek w kolorze charakteru okna (wspierające złoto / wymagające ambra — przebiega przez kolejne dni jak podkreślenie zakresu); peak = ★ na paśmie. Intensywność tła zostaje (FAZA 4 weryfikuje, czy faktycznie widać). Legenda: „━ okno tranzytu · ★ Dzień Mocy (peak) · ● pełnia/nów" — 3 elementy.
4. Hover/tap dnia w oknie: tooltip „Okno: Jowisz w Lwie · trygon do Twojego Ascendentu — dzień 3 z 5, peak jutro".

## FAZA 2 — „Twój miesiąc" (narracja, której teraz brakuje — to jest wow)

1. Karta nad siatką: **„Twój lipiec"** — 2–4 okna miesiąca jako lista: nazwa-fraza tranzytu, zakres dat, charakter, JEDNO zdanie znaczenia (AI haiku, raz na miesiąc per user, cache w tabeli `monthly_summaries`, regeneracja przy zmianie miesiąca). Na końcu jedno zdanie syntezy miesiąca.
   Wzór: „**8–12 lip** · Jowisz w Lwie · trygon do Twojego Ascendentu ★10 — okno rozpędu: dobre dni na ekspozycję i decyzje, które wymagają odwagi."
2. Klik okna na karcie → podświetlenie zakresu w siatce + scroll do peak.
3. Free: widzi listę okien (daty + frazy tranzytów — deterministyczne), zdania znaczenia zablokowane („Co te okna znaczą dla Ciebie — w premium").
4. To zastępuje też redundancję: panel dnia NIE powtarza opisu okna — linkuje do niego („część okna: Jowisz → ASC, zobacz wyżej").

## FAZA 3 — Panel dnia: dziś ≠ przyszłość

1. **Dziś**: nagłówek „Dziś, czwartek 11 czerwca" + horoskop z `daily_personal_horoscopes` (headline/main/reflection — renderowane pola, patrz FAZA 0.3). To jedyne miejsce ze słowem „horoskop".
2. **Inny dzień**: nagłówek „Piątek, 10 lipca" + kontekst okna (jeśli w oknie) + „Odczyt dnia" (on-demand/auto wg FAZY 0.6). NIE nazywaj tego „dziennym horoskopem" — horoskop dotyczy dziś, odczyt dotyczy wybranego dnia. Copy przycisku: „Odczytaj ten dzień".
3. „Generuj ponownie" — usuń z UI usera (regeneracja = bump wersji promptu, narzędzie admina). User nie powinien myśleć o treści jako o losowaniu.
4. Peak dnia premium: odczyt auto z crona porannego (tylko dla peaków bieżącego tygodnia — nie generuj całego miesiąca z góry).

## FAZA 4 — QA i kalibracja (warunek zakończenia)

1. Screenshot testy: miesiąc z nakładającymi się oknami, miesiąc spokojny (0–1 okno), free z lockami, panel dziś vs przyszły dzień, mobile 390px.
2. Test rozkładu na 3 kosmogramach referencyjnych × 3 miesiące: ★ = 3–6/mies., żadnych sąsiadujących ★, pasma okien ≤ 40% dni miesiąca (inaczej kalibruj próg siły okna).
3. Test intensywności siatki: zrzut komórek dnia o intensywności 1 i 5 — różnica musi być widoczna (asercja na computed style, nie tylko na oko).
4. Testy językowe: skrypt łaciński (FAZA 0.1), koniec zdania (0.2), konwencja frazy (0.5), deklinacja (0.4) — wszystkie w CI.
5. PostHog: `month_summary_viewed`, `window_clicked`, `day_reading_generated`, `calendar_day_opened` — zaktualizuj istniejące eventy o atrybut okna.
6. Zaktualizuj dokument statusu + usuń martwy kod klas dni.

## Zasady

- User widzi JEDEN system: okna z peakami + intensywność tła. Żadnych równoległych taksonomii.
- Peak jest punktem — jeden dzień na okno, bez wyjątków.
- AI pisze tylko: zdania okien (raz/mies.), horoskop dziś, odczyty dni. Wszystko inne deterministyczne z map tekstów.
- Każda fraza tranzytu przez konwencję z FAZY 0.5 i mapę deklinacji.
- Niejasności → zatrzymaj się i zapytaj.
