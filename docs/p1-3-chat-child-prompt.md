# PROMPT 3/4 DLA CLAUDE CODE — P1: Cosmo Chat jako osobisty astrolog + synastria rodzic–dziecko

> Wymaga wdrożonego promptu 1/4 (silnik tranzytów) i 2/4 (synastry.ts). Cel: chat, który pamięta i zna „dziś"; moduł dziecka jako najsilniejsza emocjonalnie funkcja.

---

Pracujesz w repo aplikacji Cosmogram: Next.js 16, TypeScript, Supabase. Chat: kontekst kosmogramu w system prompcie (prompt caching Anthropic), historia tylko w sesji, model claude-haiku-4-5, limity 3 lifetime free / 150 mies. premium / add-on +100. Kosmogram dziecka: `/api/ai-child` (streaming, haiku), tabela `children`, biblioteka `/app/library`, premium z limitem 3 profili. Istnieją: `src/lib/astro/transits.ts`, `src/lib/astro/synastry.ts`, `ai_call_logs`, golden testy.

Pracuj fazami, po każdej: testy zielone, commit.

---

## FAZA 1 — Pamięć chatu między sesjami

1. Tabele: `chat_sessions` (id, user_id, started_at, summary, summary_updated_at) i `chat_messages` (session_id, role, content, created_at). RLS: user widzi swoje; **test negatywny obowiązkowo** (treści rozmów to najwrażliwsze dane w aplikacji).
2. Historia: po powrocie user widzi poprzednie rozmowy (lista sesji + kontynuacja ostatniej). Nowa sesja po 24h nieaktywności lub ręcznie.
3. **Podsumowania zamiast pełnej historii w kontekście**: po zakończeniu sesji (cron lub lazy przy następnym wejściu) generuj 3–5-zdaniowe podsumowanie (gemini-3.1-flash-lite — to treść techniczna, nie premium): tematy, wątki emocjonalne, do czego user chciał wracać. System prompt kolejnych sesji dostaje: kontekst kosmogramu (cache) + podsumowania ostatnich max 5 sesji. Pełne wiadomości NIGDY nie wracają do kontekstu (koszty + prywatność).
4. Usuwanie: user może skasować sesję lub całą historię w ustawieniach prywatności (kasuje też podsumowania). Dopisz do polityki prywatności TODO w raporcie końcowym (zmiana dokumentu to decyzja właściciela).
5. Retencja: sesje starsze niż 12 miesięcy — automatyczne kasowanie (cron), opisz w dokumentacji.

## FAZA 2 — Świadomość czasu (tranzyty w chacie)

1. System prompt chatu dostaje codziennie świeżą sekcję: dzisiejsze top 3 tranzyty usera + pogoda dnia (z `transits.ts`, deterministyczne, pseudonimizowane). Sekcja poza cache (zmienna), kontekst kosmogramu w cache (stały) — zachowaj strukturę cache-friendly: stałe na początku, zmienne na końcu.
2. **Proaktywne otwarcie**: gdy user wchodzi do chatu z aktywnym istotnym tranzytem (ranking > próg), pierwsza wiadomość asystenta nawiązuje do niego („Saturn jest dziś dokładnie na Twoim natalnym Słońcu — to dobry moment, żeby porozmawiać o…"). Generowane raz dziennie przy pierwszym wejściu, nie przy każdym otwarciu.
3. Instrukcje bezpieczeństwa w system prompcie (zweryfikuj/uzupełnij): tematy zdrowia psychicznego, leków, diagnoz → empatyczne przekierowanie do specjalisty; bez przewidywania konkretnych zdarzeń (śmierć, choroba, rozwód jako pewnik); bez porad finansowych/prawnych; spójne z regulaminem. Dodaj golden testy na te granice (min. 4 przypadki: pytanie o leki, o śmierć, o decyzję inwestycyjną, kryzys emocjonalny).

## FAZA 3 — Pusta strona chatu (najczęstszy moment porzucenia)

1. **3 sugerowane pytania** (chipy pod polem tekstowym) generowane z kosmogramu + dzisiejszych tranzytów (gemini-3.1-flash-lite, raz dziennie per user, cache w tabeli; fallback: statyczna pula pytań dopasowana do znaku). Klik = wysłanie jako wiadomość user.
2. Po każdej odpowiedzi asystenta: 2 chipy kontynuacji (model zwraca je w tej samej odpowiedzi — rozszerz format o `suggested_followups`, walidacja zod; nie generuj osobnym wywołaniem).
3. Empty state z charakterem: krótki tekst „Znam Twój kosmogram. Zapytaj mnie o cokolwiek" + chipy.

## FAZA 4 — Synastria rodzic–dziecko (emocjonalny hook premium)

1. Nowa sekcja w kosmogramie dziecka: **„Wy dwoje"** — synastria kosmogramu rodzica (główny zapisany kosmogram usera) z kosmogramem dziecka. Aspekty z `synastry.ts`, interpretacja haiku, struktura (zod): `instant_understanding` (gdzie rozumiecie się bez słów), `friction_points` (gdzie musisz świadomie nadrabiać — język wspierający, NIGDY obwiniający dziecko ani rodzica), `how_to_support` (konkretne wskazówki na trudne momenty), `what_to_nurture` (mocne strony do pielęgnowania). Reguła konkretu obowiązuje.
2. Ton promptu: ciepły, rodzicielski, zero straszenia („kwadratura nie jest wyrokiem — to zaproszenie do uważności"). Golden test na ton: treść nie może zawierać przypisywania dziecku negatywnych cech jako faktów.
3. UI w `/app/library` przy profilu dziecka: sekcja „Wy dwoje" pod istniejącą interpretacją; generowana on-demand przy pierwszym otwarciu, cache w tabeli `children` (kolumna JSON), regeneracja przy bulk regen.
4. Jeśli user ma więcej zapisanych kosmogramów — wybór, który rodzic (dropdown), wynik cache per para.

## FAZA 5 — Domknięcie

1. E2E: historia chatu przetrwa wylogowanie/logowanie; podsumowanie sesji powstaje i trafia do kontekstu (asercja na payloadzie przy AI_MOCK); proaktywne otwarcie przy aktywnym tranzycie; chipy działają; limit 3 wiadomości free → paywall (regresja); „Wy dwoje" renderuje się i cache'uje; user B nie odczyta sesji usera A (security test).
2. Fixtures AI_MOCK: nowe formaty (odpowiedź z followups, podsumowanie, „Wy dwoje").
3. PostHog: `chat_session_resumed`, `chat_proactive_opener_shown`, `chat_chip_clicked`, `parent_child_synastry_viewed`.
4. Zaktualizuj dokument statusu projektu.

## Zasady

- Treści rozmów: maksymalna ostrożność — RLS przetestowany, brak treści wiadomości w logach (`ai_call_logs` bez content), brak w Sentry.
- Pseudonimizacja: imię dziecka nie idzie do modelu (placeholder `{{child_name}}`, interpolacja po stronie aplikacji).
- Koszt: podsumowania i chipy na flash-lite, rozmowa na haiku z cache — nie zmieniaj tego przypisania.
- Niejasności → zatrzymaj się i zapytaj.
