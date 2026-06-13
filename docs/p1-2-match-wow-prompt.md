# PROMPT 2/4 DLA CLAUDE CODE — P1: Cosmo Match — z wyniku tekstowego na przeżycie

> Wymaga wdrożonego promptu 1/4 (konwencje silnika astro). Cel: match, którego wynik ludzie pokazują sobie nawzajem.

---

Pracujesz w repo aplikacji Cosmogram: Next.js 16, TypeScript, Supabase, Framer Motion 12. Istnieje komponent koła kosmogramu (wykres z planetami). Match: formularz 2 osób → `/api/astro-match` (claude-haiku-4-5, JSON mode) → score + synergie + napięcia + wskazówki; zapis w `astro_matches`; share `/share/match/[id]`; limity: free 1 (score + 1 sekcja), premium 10/mies, add-on `single_match_report`.

Pracuj fazami, po każdej: testy zielone, commit.

---

## FAZA 1 — Warstwa danych synastrii

1. `src/lib/astro/synastry.ts`: deterministyczne wyliczenie aspektów MIĘDZY dwoma kosmogramami (planety osoby A × planety osoby B, te same orby co w silniku tranzytów). Klasyfikacja: harmonijne (trygon, sekstyl) / napięte (kwadratura, opozycja) / intensywne (koniunkcja — neutralna, zależna od planet). Ranking istotności jak w tranzytach.
2. Rozszerz output `/api/astro-match` o **score breakdown w 5 wymiarach**: komunikacja, emocje, namiętność, konflikt, długoterminowość (0–100 każdy; ogólny score = średnia ważona). Wymiary liczy AI (haiku) na podstawie listy aspektów synastrycznych — ale lista aspektów do treści pochodzi z `synastry.ts`, nie z halucynacji modelu. Walidacja zod; sekcje tekstowe per wymiar (2–3 zdania każda, reguła konkretu: cytuj aspekty).
3. Zaktualizuj prompt `match` w `ai_prompts` (nowa wersja, stare matche zostają czytelne — wersjonuj strukturę JSON, migracji starych rekordów nie rób).

## FAZA 2 — Wizualizacja synastrii (środek wow)

1. Komponent `SynastryWheel`: dwa koła kosmogramów nałożone (zewnętrzny ring = osoba A, wewnętrzny = osoba B — rozbuduj istniejący komponent koła, nie pisz od zera) + **linie aspektów między planetami obu osób**: harmonijne i napięte rozróżnione kolorem (dopasuj do dark crystal palety; nie czerwony/zielony 1:1 — zadbaj o czytelność dla daltonistów: różny kolor I styl linii, np. ciągła vs kreskowana).
2. Interakcja: hover/tap na linii aspektu → tooltip „Wenus Anny trygon Mars Tomka — naturalny magnetyzm". Na mobile: tap, z listą aspektów pod kołem.
3. Wydajność: SVG, render < 100 ms dla ~30 linii; ogranicz do top 15 aspektów wg rankingu (reszta zwijana „pokaż wszystkie").

## FAZA 3 — Dramaturgia reveal

Sekwencja po submit formularza (Framer Motion, całość 8–12 s, skip po tapnięciu):
1. Budowanie koła osoby A (planety wskakują kolejno, ~2 s) → koło osoby B (~2 s).
2. Rysowanie linii aspektów jedna po drugiej, od najistotniejszych (~3 s) — w tym czasie realnie czeka się na odpowiedź AI; jeśli AI skończy wcześniej, animacja się nie skraca; jeśli AI trwa dłużej, subtelny stan „odczytujemy połączenia…".
3. Score: licznik 0→wynik z easing + jednoczesne wejście breakdownu 5 wymiarów (animowane paski/radar).
4. Sekcje tekstowe pojawiają się progressive reveal przy scrollu.
5. Stan błędu AI: koło i aspekty (deterministyczne!) pokazują się zawsze — nawet gdy treść padnie, user widzi wizualizację + retry treści. Nigdy pusty ekran.

## FAZA 4 — Share jako kanał wzrostu

1. **OG image** (`@vercel/og` / ImageResponse): generowany obraz dla `/share/match/[id]` — imiona/pseudonimy podane przez usera, ogólny score, nazwa najpiękniejszego aspektu („Słońce w trygonie do Księżyca"), branding cosmogram, dark crystal tło. Bez dat urodzenia.
2. Strona share: SynastryWheel statyczny + score + breakdown + 1–2 sekcje, reszta z CTA „Sprawdź swoją zgodność" → signup. Druga osoba z matcha to najcieplejszy lead na świecie — landing musi mieć jasną ścieżkę „zrób własny kosmogram".
3. Przycisk „Udostępnij" w wyniku matcha: native share API na mobile, kopiowanie linku na desktop. Respektuj prywatność: share tworzy się dopiero po świadomym kliknięciu właściciela (nigdy automatycznie), revoke działa (z audytu P0.4).
4. PostHog: `match_revealed`, `match_shared`, `match_share_visited`, `match_share_signup` (pełny lejek wirusowy).

## FAZA 5 — Domknięcie

1. Golden testy: 3 referencyjne pary kosmogramów z oczekiwanymi aspektami synastrycznymi (unit, deterministyczne) + 2 golden testy treści (reguła konkretu).
2. E2E: pełny flow z reveal (skip animacji w testach przez query param `?reveal=instant`), share page bez danych wrażliwych, OG image zwraca 200 i poprawny content-type, free user widzi score + 1 sekcję + paywall, add-on odblokowuje pełny raport.
3. Fixtures AI_MOCK dla nowej struktury JSON.
4. Zaktualizuj dokument statusu.

## Zasady

- Aspekty synastryczne liczy kod, AI tylko interpretuje — lista aspektów w treści musi pochodzić z `synastry.ts`.
- Animacje: 60 fps na średnim telefonie (transform/opacity, bez layout thrash), `prefers-reduced-motion` respektowane (wtedy instant reveal).
- Pseudonimizacja: do modelu idą aspekty i pozycje, imiona wstawiane po stronie aplikacji.
- Niejasności → zatrzymaj się i zapytaj.
