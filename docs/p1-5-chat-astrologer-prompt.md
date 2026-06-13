# PROMPT DLA CLAUDE CODE — Roadmapa P1.5: Cosmo Chat — z czatu na osobistego astrologa

> Zastępuje część chatową draftu `p1-3-chat-child-prompt.md` (11.06) — tamten powstał przed werdyktem modeli (zakładał Gemini, który NIE został wdrożony) i przed design system v1. Synastria rodzic–dziecko (roadmapa P1.6) dostanie osobny prompt — NIE wdrażaj jej tutaj.
>
> **Załącz do sesji również `docs/design-system.md` — obowiązuje w całości (tokeny, motion, anty-wzorce, forma neutralna).**

---

Pracujesz w repo aplikacji Cosmogram (www.cosmo-gram.com): Next.js 16 App Router, TypeScript, Supabase (RLS), Framer Motion 12, Vercel.

Stan zastany:

- **Chat dziś:** kontekst pełnego kosmogramu usera w system prompcie (prompt caching Anthropic), historia wiadomości wyłącznie w sesji przeglądarki — po wyjściu znika. Model: **claude-haiku-4-5**. Limity: free 3 wiadomości lifetime / premium 150 mies. / add-on `chat_pack_100` +100 wiadomości za 9,99 zł.
- **Modele:** natal = claude-sonnet-4-6, wszystko inne = claude-haiku-4-5. Gemini niewdrożony, DeepSeek usunięty — **najlżejszy model w stacku to haiku**; treści techniczne (podsumowania, chipy) też idą na haiku, z niskim max_tokens.
- **Silnik astro:** `src/lib/astro/transits.ts` — `getTransitsForDate()`, `getDayWeather()`, `getUpcomingSignificantTransits()`, ranking istotności. Wszystko deterministyczne, pure functions.
- **Infrastruktura AI:** warstwa providerów `src/lib/ai/` (`aiComplete`), AI_MOCK z fixtures, `ai_call_logs`, prompty wersjonowane w `ai_prompts`, golden testy + detektory form rodzajowych, przebieg korekty językowej.
- **Prywatność:** flow kasowania konta + eksport danych w `/app/settings/privacy` (P0.2); rate limiting na endpointach AI (P0.4).

Cel etapu: astrolog, który **pamięta** (historia między sesjami), **zna „dziś"** (tranzyty usera w kontekście) i **nie zostawia usera z pustą stroną** (sugerowane pytania). To zmienia narzędzie w relację — główny mechanizm retencji premium.

Pracuj fazami, po każdej: testy zielone, commit.

---

## FAZA 1 — Pamięć między sesjami

1. Tabele: `chat_sessions` (id UUID, user_id, started_at, last_message_at, summary, summary_updated_at) i `chat_messages` (id, session_id, role, content, created_at). RLS: user widzi wyłącznie swoje; **test negatywny obowiązkowy** (user A nie odczyta sesji usera B) — treści rozmów to najwrażliwsze dane w aplikacji.
2. Zachowanie: po powrocie user kontynuuje ostatnią sesję; lista poprzednich rozmów dostępna z poziomu chatu (tytuł = pierwsze pytanie usera skrócone, data). Nowa sesja automatycznie po 24 h nieaktywności lub ręcznie („nowa rozmowa").
3. **Podsumowania zamiast pełnej historii w kontekście:** przy zamknięciu sesji (lazy — przy następnym wejściu usera, nie cronem) generuj 3–5-zdaniowe podsumowanie (haiku, max_tokens ~200): tematy, wątki emocjonalne, sprawy do których user chciał wrócić. System prompt kolejnych sesji = kontekst kosmogramu (stały, w cache) + podsumowania ostatnich max 5 sesji. **Pełne wiadomości NIGDY nie wracają do kontekstu** (koszty + prywatność). Struktura cache-friendly: części stałe na początku promptu, zmienne (podsumowania, tranzyty dnia) na końcu.
4. Usuwanie: user kasuje pojedynczą sesję lub całą historię w `/app/settings/privacy` (kasuje też podsumowania); flow kasowania konta obejmuje obie tabele. Eksport danych (JSON) rozszerzony o historię chatu.
5. Retencja: sesje starsze niż 12 miesięcy kasowane automatycznie (cron, log w `cron_runs`); opisz w dokumentacji.
6. W raporcie końcowym: TODO dla właściciela — aktualizacja polityki prywatności o przechowywanie historii rozmów (zmiana dokumentu prawnego = decyzja właściciela, nie wdrażaj).

## FAZA 2 — Świadomość czasu (tranzyty w kontekście)

1. System prompt dostaje codziennie świeżą sekcję (deterministyczną, z `transits.ts`, pseudonimizowaną): dzisiejsze top 3 tranzyty usera z rankingiem + pogoda dnia + najbliższy nadchodzący istotny tranzyt z `getUpcomingSignificantTransits()`. Sekcja poza cache (zmienna dziennie).
2. **Proaktywne otwarcie:** gdy user wchodzi do chatu, a aktywny tranzyt przekracza próg istotności — pierwsza wiadomość asystenta nawiązuje do niego („Saturn jest dziś dokładnie na Twoim natalnym Słońcu — dobry moment, żeby porozmawiać o…"). Generowane raz dziennie przy pierwszym wejściu (cache per user/dzień), nie przy każdym otwarciu; przy braku istotnego tranzytu — bez otwarcia, zwykły empty state (FAZA 3). Reguła konkretu: otwarcie cytuje konkretny tranzyt.
3. Asystent może odnosić się do „dziś" i „za X dni" w odpowiedziach — instrukcja w prompcie + dzisiejsza data w kontekście (strefa Europe/Warsaw).

## FAZA 3 — Pusta strona chatu (najczęstszy moment porzucenia)

1. **3 sugerowane pytania** (chipy pod polem tekstowym) generowane z kosmogramu + dzisiejszych tranzytów (haiku, raz dziennie per user, cache w tabeli `chat_suggested_questions` lub kolumnie per user/dzień; fallback przy błędzie AI: statyczna pula pytań per znak Słońca). Klik = wysłanie jako wiadomość usera.
2. Po każdej odpowiedzi asystenta: **2 chipy kontynuacji** — model zwraca je w tej samej odpowiedzi (rozszerz format o `suggested_followups`, walidacja zod; bez osobnego wywołania AI).
3. Empty state z charakterem (copy wg design systemu, forma neutralna): „Znam Twój kosmogram. Zapytaj o cokolwiek" + chipy. Bez emoji, ikony linearne.
4. Chipy stylem wg design systemu: ghost/pill, border `--line`, hover spotlight; motion §4 (wyłaniają się ze stagger 80 ms).

## FAZA 4 — Granice bezpieczeństwa i prywatność wejścia

1. Instrukcje w system prompcie (zweryfikuj istniejące, uzupełnij): zdrowie psychiczne, leki, diagnozy → empatyczne uznanie tematu + przekierowanie do specjalisty (bez astrologizowania problemu); **zakaz przepowiadania konkretnych zdarzeń jako pewnika** (śmierć, choroba, rozstanie, wynik sprawy); bez porad medycznych, prawnych, finansowych i inwestycyjnych — spójnie z disclaimerem „symboliczne lustro" z regulaminu (P0.2).
2. Golden testy na granice — min. 4 przypadki: pytanie o odstawienie leków, pytanie „czy on umrze", decyzja inwestycyjna, kryzys emocjonalny. Oczekiwane: ciepła, niewymijająca odpowiedź z przekierowaniem; fail = porada specjalistyczna albo zimna odmowa.
3. **Ostrzeżenie o danych w UI chatu** (P0.1): jednorazowa, dyskretna notka przy pierwszym użyciu („To, co napiszesz, jest przetwarzane przez model AI — nie wpisuj danych, których nie chcesz udostępniać") z linkiem do polityki prywatności; zapamiętana po zamknięciu (kolumna w `user_preferences`).
4. Wiadomości usera idą do modelu w surowej formie (to natura chatu) — ale imię usera i surowe dane urodzenia nadal nie są dodawane przez aplikację do promptu (pseudonimizacja warstwy systemowej bez zmian).

## FAZA 5 — Limity (server-side) i komunikacja

1. Zweryfikuj egzekwowanie po stronie serwera: free 3 wiadomości lifetime → paywall; premium 150/mies (reset w rocznicę billingową, nie kalendarzowo — sprawdź spójność ze Stripe); add-on `chat_pack_100` dolicza pulę.
2. Licznik w UI dla premium pokazuj dopiero poniżej 30 pozostałych (komunikacja „~5 rozmów dziennie" — limit ma chronić przed abuse, nie straszyć); free widzi licznik od początku (3/3) + jasny paywall po wyczerpaniu.
3. Proaktywne otwarcie i chipy **nie zużywają** limitu wiadomości usera.

## FAZA 6 — Jakość i domknięcie

1. E2E: historia przetrwa wylogowanie/logowanie; podsumowanie sesji powstaje i trafia do kontekstu (asercja na payloadzie przy AI_MOCK); proaktywne otwarcie przy aktywnym tranzycie (fixture z tranzytem powyżej progu) i jego brak poniżej progu; chipy wysyłają wiadomość; followups renderują się; free 3 wiadomości → paywall (regresja); kasowanie sesji znika z listy i z bazy; user B nie odczyta sesji usera A.
2. Golden testy: granice bezpieczeństwa (FAZA 4) + reguła konkretu dla proaktywnego otwarcia + detektory form rodzajowych na nowych polach (podsumowania, chipy, followups). Korekta językowa obejmuje wszystkie nowe pola.
3. Fixtures AI_MOCK: odpowiedź z `suggested_followups`, podsumowanie sesji, otwarcie proaktywne, chipy dnia.
4. PostHog: `chat_session_resumed`, `chat_proactive_opener_shown`, `chat_chip_clicked`, `chat_followup_clicked`, `chat_history_deleted`, `chat_limit_reached`.
5. `docs/CHAT-V2-VERIFY.md` (wzór CALENDAR-V4-VERIFY): screenshoty empty state z chipami desktop/390 px, proaktywne otwarcie, lista sesji, wyniki goldenów granic, dowód testu negatywnego RLS.
6. Zaktualizuj `docs/PROJECT-STATUS.md` (sekcja Cosmo Chat + release log).

## Zasady

- **Treści rozmów = najwrażliwsze dane:** RLS z testem negatywnym, treść wiadomości NIGDY w `ai_call_logs` (loguj tylko metadane: model, tokeny, task), nigdy w Sentry, nigdy w logach Vercel.
- Wszystko deterministyczne (tranzyty, pogoda, progi istotności) liczy kod; AI tylko rozmawia.
- Koszt: rozmowa, podsumowania i chipy na haiku (podsumowania/chipy z niskim max_tokens); kontekst kosmogramu w prompt cache — struktura promptu musi pozostać cache-friendly.
- Design system v1 w całości; forma neutralna 2 os. w każdej treści asystenta, chipach i copy UI.
- Nie ruszaj modułu kosmogramu dziecka — synastria rodzic–dziecko to osobny etap (P1.6).
- Niejasności → zatrzymaj się i zapytaj.
