# PROMPT DLA CLAUDE CODE — Roadmapa P1.4: Cosmo Match — z wyniku tekstowego na przeżycie

> Zastępuje draft `p1-2-match-wow-prompt.md` (11.06) — tamten powstał przed design system v1, werdyktem modeli i przebudową koła natalnego. Ten dokument jest jedynym źródłem prawdy dla tego etapu.
>
> **Załącz do sesji również `docs/design-system.md` — obowiązuje w całości (tokeny, motion, anty-wzorce).**

---

Pracujesz w repo aplikacji Cosmogram (www.cosmo-gram.com): Next.js 16 App Router, TypeScript, Supabase (RLS), Framer Motion 12, Vercel.

Stan zastany:

- **Match dziś:** formularz 2 osób (wybór z zapisanych kosmogramów lub ręcznie, geocoding) → `/api/astro-match` (JSON mode + retry) → score + synergie + napięcia + wskazówki; zapis w `astro_matches`; share `/share/match/[id]`; limit free: 1 match.
- **Modele:** natal = claude-sonnet-4-6; wszystko inne, w tym match = **claude-haiku-4-5** (Gemini niewdrożony, DeepSeek usunięty). Warstwa providerów `src/lib/ai/` (`aiComplete`), tryb AI_MOCK z fixtures, logi w `ai_call_logs`, prompty wersjonowane w `ai_prompts` (panel admina), golden testy w panelu evali.
- **Silnik astro:** `src/lib/astro/transits.ts` (aspekty, orby, ranking istotności, pure functions), `dayClasses.ts`, `powerDays.ts`, deklinacje PL w `src/lib/i18n/astro.ts`.
- **Koło natalne (kanon):** SVG, fan-out glifów z limitem ±12° i kropką pozycji, linie aspektów po REALNYCH pozycjach przez całe wnętrze koła, harmonijne ciągłe / napięte kreskowane, hover na planecie → podświetlenie jej aspektów + przygaszenie reszty do .2.
- **Korekta językowa:** przebieg korekty + detektory form rodzajowych w golden testach; obejmuje wszystkie pola outputu.

Cel etapu: match, którego wynik ludzie pokazują sobie nawzajem. Cztery dźwignie: wizualizacja synastrii, dramaturgia reveal, score w 5 wymiarach, share jako kanał wzrostu.

Pracuj fazami, po każdej: testy zielone, commit.

---

## FAZA 1 — Silnik synastrii (deterministyczny, zero AI)

1. `src/lib/astro/synastry.ts` — pure functions, konwencje z `transits.ts`:
   - `getSynastryAspects(chartA, chartB)`: aspekty MIĘDZY kosmogramami (planety A × planety B + ASC/MC, jeśli dostępne). Te same aspekty i orby co w silniku tranzytów (koniunkcja/opozycja 3°, kwadratura/trygon 2,5°, sekstyl 2°).
   - Klasyfikacja: harmonijne (trygon, sekstyl) / napięte (kwadratura, opozycja) / koniunkcja — neutralna, charakter zależny od pary planet (tabela: Wenus–Mars ≠ Saturn–Księżyc).
   - Ranking istotności jak w tranzytach (waga planet × waga aspektu × ciasnota orbu × waga punktu: Słońce/Księżyc/ASC/Wenus/Mars wysoko w kontekście relacji).
   - **Brak godziny urodzenia** (u jednej lub obu osób): bez ASC/MC tej osoby, Księżyc wykluczony z rankingu (niepewność ±7°) — flaga w wyniku, UI komunikuje łagodnie („bez godziny urodzenia pomijamy Księżyc i Ascendent").
2. `getSynastryScore(aspects)` — **score liczy kod, nie AI** (ten sam wynik za każdym razem; regenerowany match z innym score zabija magię):
   - 5 wymiarów 0–100: komunikacja (Merkury), emocje (Księżyc), namiętność (Wenus/Mars), konflikt (napięte Mars/Saturn/Pluton — skala odwrócona: wyżej = mniej tarcia), długoterminowość (Saturn/Jowisz + aspekty do ASC/MC). Mapowanie planeta→wymiar + wagi w jednym czytelnym pliku konfiguracyjnym.
   - Score ogólny = średnia ważona wymiarów. Kalibracja: losowe pary ~40–65, silne ~75–90; 100 praktycznie nieosiągalne. Bez godziny urodzenia wymiar „emocje" liczony z mniejszą pewnością — oznacz.
3. Testy jednostkowe: 3 referencyjne pary kosmogramów z ręcznie zweryfikowanymi aspektami (±0,1°) i oczekiwanymi przedziałami score; przypadki brzegowe (brak godziny, ta sama osoba ×2 → wysoka koniunkcyjność, puste przecięcie orbów).

## FAZA 2 — Treść AI na nowej strukturze

1. Nowa wersja promptu `match` w `ai_prompts` (stare rekordy `astro_matches` zostają czytelne — wersjonuj strukturę JSON, bez migracji).
2. Wejście (pseudonimizowane — **bez imion i dat urodzenia**, etykiety „Osoba A"/„Osoba B"): lista aspektów synastrycznych z rankingiem + wyliczone wymiary. Model: claude-haiku-4-5.
3. Output (zod): per wymiar 2–3 zdania + sekcje synergie/napięcia/wskazówki. **Reguła konkretu:** każdy akapit cytuje konkretny aspekt z wejścia („Wenus Osoby A w trygonie do Marsa Osoby B…") — imiona wstawia aplikacja po stronie klienta/serwera, nie model. Forma neutralna 2 os. (tu: o parze — „macie", „łączy was"), zero form rodzajowych.
4. AI **nie zwraca liczb** — score i wymiary przychodzą z FAZY 1; przy rozjeździe treści z liczbami treść przegrywa (walidacja: model nie wymyśla aspektów spoza listy wejściowej).

## FAZA 3 — SynastryWheel (środek wow)

1. Rozbuduj istniejący komponent koła natalnego (nie pisz od zera; wydziel część wspólną, nie zmieniając zachowania koła w natal): zewnętrzny ring planet = Osoba A, wewnętrzny = Osoba B, **linie aspektów między realnymi pozycjami planet obu osób** przez wnętrze koła.
2. Style linii wg kanonu i design systemu: harmonijne ciągłe / napięte kreskowane, rozróżnione też kolorem z tokenów (czytelne dla daltonistów: kolor + styl, nigdy sam kolor). Kolory planet tylko wewnątrz koła (§1 design systemu).
3. Domyślnie top 15 aspektów wg rankingu, „pokaż wszystkie" zwija resztę. Hover/tap na linii → tooltip „Wenus Anny w trygonie do Marsa Tomka — naturalny magnetyzm" (deklinacje z `i18n/astro.ts`). Tap planety → podświetlenie jej aspektów, reszta do .2 (kanon natal). Mobile: tap + lista aspektów pod kołem, 390 px bez poziomego scrolla.
4. Wydajność: SVG, transform/opacity only, render < 100 ms dla ~30 linii.

## FAZA 4 — Dramaturgia reveal

Sekwencja po submit (Framer Motion, motion language §4 design systemu: ease-out-quint, elementy się wyłaniają, linie się **kreślą** przez stroke-dashoffset). Całość 8–12 s, skip po tapnięciu, `prefers-reduced-motion` → instant (piękny kadr zamiast sceny):

1. Koło Osoby A buduje się (planety wyłaniają się kolejno, ~2 s) → koło Osoby B (~2 s).
2. Linie aspektów kreślą się od najistotniejszych (~3 s) — w tym czasie realnie czeka się na AI; jeśli AI skończy wcześniej, animacja się nie skraca; jeśli trwa dłużej — subtelny stan „odczytujemy połączenia…".
3. Score: count-up 0→wynik (tabular-nums) + wejście breakdownu 5 wymiarów (animowane paski, stagger 80 ms).
4. Sekcje tekstowe: progressive reveal przy scrollu (raz, IntersectionObserver).
5. **Stan błędu AI:** koło, aspekty, score i wymiary (deterministyczne!) renderują się ZAWSZE — pada najwyżej treść, z retry. Nigdy pusty ekran.
6. Query param `?reveal=instant` do testów e2e.

## FAZA 5 — Share jako kanał wzrostu

Decyzja właściciela (wiążąca): **share pokazuje PEŁNĄ treść** — mechanizm akwizycji „ja też chcę". Nie ograniczaj treści na stronie share.

1. `/share/match/[id]`: statyczny SynastryWheel + score + pełny breakdown + pełne sekcje. CTA „Sprawdź swoją zgodność → zrób darmowy kosmogram" rozłożone przez całą stronę (góra, środek, finał) — druga osoba z matcha to najcieplejszy lead.
2. **OG image** (`@vercel/og` / ImageResponse): imiona/pseudonimy podane przez usera, score, nazwa najpiękniejszego aspektu („Słońce w trygonie do Księżyca"), branding, tło `--bg-sky` + akcent bursztynowy. **Bez dat i godzin urodzenia** — dane urodzenia domyślnie ukryte także na stronie share (pokazanie = świadoma zgoda właściciela).
3. Share tworzy się wyłącznie po świadomym kliknięciu właściciela (nigdy automatycznie); ID = UUID; revoke działa (konwencje z audytu P0.4). Przycisk: native share API na mobile, kopiowanie linku na desktop.
4. PostHog — pełny lejek wirusowy: `match_revealed`, `match_shared`, `match_share_visited`, `match_share_signup`.

## FAZA 6 — Limity i monetyzacja (server-side)

1. Free: 1 match — wynik = score + wizualizacja + **jedna sekcja**, pozostałe sekcje zablurowane z tytułami (wzór blur modułów natal) + paywall. Uwaga: blur dotyczy wyniku free usera w aplikacji, NIE strony share (share zawsze pełny).
2. Premium: 10 pełnych analiz/mies. Add-on `single_match_report` 9,99 zł — pojedynczy pełny raport, dostępny też dla free (Stripe one-time payment, odblokowuje konkretny rekord `astro_matches`).
3. Wszystkie limity egzekwowane **po stronie serwera** (P0.4); UI tylko odzwierciedla stan.

## FAZA 7 — Jakość i domknięcie

1. Golden testy: 3 pary referencyjne (deterministyczne aspekty + score — unit) + 2 golden testy treści (reguła konkretu: min. 2 cytowane aspekty per sekcja; detektory form rodzajowych; zakaz aspektów spoza wejścia).
2. Korekta językowa obejmuje WSZYSTKIE pola nowej struktury (sekcje wymiarów, tooltipy, wskazówki).
3. E2E: pełny flow z reveal (`?reveal=instant`), free widzi score + 1 sekcję + paywall, add-on odblokowuje pełny raport, share pokazuje pełną treść bez danych urodzenia, OG image zwraca 200 + poprawny content-type, limit free egzekwowany server-side (request 2. matcha = 4xx).
4. Fixtures AI_MOCK dla nowej struktury JSON.
5. `docs/MATCH-V2-VERIFY.md` (wzór CALENDAR-V4-VERIFY): screenshoty SynastryWheel desktop/390px, przebieg reveal, share + OG image, wyniki goldenów.
6. Zaktualizuj `docs/PROJECT-STATUS.md` (sekcja Cosmo Match + release log).

## Zasady

- **Kod liczy, AI pisze:** aspekty, score i wymiary są deterministyczne z `synastry.ts`; AI wyłącznie ubiera je w język i nie wymyśla ani liczb, ani aspektów.
- Pseudonimizacja: do modelu idą aspekty i pozycje („Osoba A/B"), imiona wstawia aplikacja.
- Design system v1 obowiązuje w całości: tylko tokeny, motion language §4, anty-wzorce §6, checklist §7 przed merge.
- Forma neutralna 2 os., polska typografia (półpauzy, cudzysłowy drukarskie, deklinacje z mapy odmian).
- Nie zmieniaj zachowania koła natalnego w module natal — wydzielenie części wspólnej ma być refaktorem bez regresu (screenshot test natal przed/po).
- Niejasności → zatrzymaj się i zapytaj.
