# PROMPT DLA CLAUDE CODE — Listy od Astrei (+ Raporty jednorazowe)

> **Załącz do sesji:** `docs/listy-od-astrei-koncept.md` (pełny koncept, źródło prawdy), `docs/content-voice-guide.md` (głos), `docs/design-system.md` (tokeny, motion, anty-wzorce, forma neutralna). Wszystkie obowiązują w całości.
>
> Cel biznesowy: zamienić jednorazowe „wow" kosmogramu w rozwijającą się relację. To główny mechanizm retencji premium (North Star: retencja płatnych 30 dni). Ten sam silnik napędza Raporty jednorazowe (druga noga przychodu).

---

Pracujesz w repo aplikacji Cosmogram (www.cosmo-gram.com): Next.js 16 App Router, TypeScript, Supabase (RLS), Framer Motion 12, Resend, Stripe, Vercel (cron).

## Stan zastany (na czym budujesz, nie wymyślaj od zera)

- **Silnik kosmogramu:** deterministyczne pozycje (Swiss Ephemeris przez `/api/chart`), zapisany natal usera. Punkty (Słońce, Księżyc, planety, domy, MC, węzły, aspekty) liczy kod.
- **Silnik tranzytów:** `src/lib/astro/transits.ts` (`getTransitsForDate()`, `getUpcomingSignificantTransits()`, ranking istotności, progi). Pure functions.
- **Warstwa AI:** `src/lib/ai/` (`aiComplete`), `AI_MOCK` z fixtures, `ai_call_logs` (metadane: model, tokeny, task), prompty wersjonowane w `ai_prompts`, golden testy + detektory form rodzajowych + przebieg korekty językowej.
- **Modele:** natal = `claude-sonnet-4-6`, reszta = `claude-haiku-4-5`. **Listy i Raporty idą na Sonnet** (jakość ma znaczenie, to treści egzystencjalne).
- **Email:** Resend, szablony React Email (`src/emails/`), maile tygodniowe i miesięczne z prognozą + welcome. Domena `hello@cosmo-gram.com`.
- **Płatności:** Stripe Subscriptions + add-ony (wzór `chat_pack_100`). Webhook synchronizuje do Supabase.
- **Cron:** wzór `daily-personal-horoscope` (Vercel cron, log w `cron_runs`).
- **Render treści:** react-markdown. Strefa `/app/*` z dolną nawigacją.

Pracuj fazami, po każdej: testy zielone, commit. Niejasności → zatrzymaj się i zapytaj.

---

## FAZA 1 — Model danych + katalog listów

1. Tabele (RLS na wszystkich userowych, **test negatywny obowiązkowy** — user A nie odczyta listów usera B; to treści egzystencjalne, najwrażliwsza warstwa obok chatu):
   - `astrea_letter_templates`: `slug`, `title`, `theme`, `placement_inputs` (jsonb — które punkty kosmogramu zasilają prompt), `trigger_type` (`time`|`event`), `trigger_value` (dni od natalu | warunek tranzytowy), `tier` (`free`|`premium`|`one_time`), `sort_order`, `wellbeing_level` (`standard`|`delikatny`), `prompt_slug` (→ `ai_prompts`), `kind` (`letter`|`report`).
   - `user_letters`: `user_id`, `letter_slug`, `status` (`scheduled`|`generated`|`delivered`|`read`), `content_md`, `placement_snapshot` (jsonb), `ai_prompt_version`, `model`, `generated_at`, `delivered_at`, `read_at`, `source` (`drip`|`one_time_purchase`).
   - `inbox_items` (uniwersalna skrzynka — warstwa powierzchni i stanu przeczytania, FAZA 4): `user_id`, `type` (`letter`|`announcement`|`system`|`forecast`|`report`), `ref_id` (dla `letter`/`report` → `user_letters.id`), `title`, `preview`, `read_at`, `created_at`, `delivered_at`. Badge = `count(read_at IS NULL)`. List/raport tworzy pozycję typu `letter`/`report`; inne powiadomienia (ogłoszenia, alerty) tworzą pozycje innych typów bez maszynerii generacji. RLS + test negatywny.
   - Raporty jednorazowe: dołóż `letter_purchases` LUB rozszerz istniejącą logikę add-onów (wybierz spójne ze Stripe, uzasadnij w raporcie).
2. Seed katalogu: 8 listów fundamentalnych z koncepcji (sekcja 3a) + meta (fundament, odsłona, tier). Każdy `prompt_slug` → wpis w `ai_prompts` (wersjonowany).
3. Migracja SQL + RLS policies + test negatywny w pakiecie regresji.

## FAZA 2 — Silnik generacji (resolver + prompt + cache)

1. **Resolver placementów:** dla (user, template) pobiera deterministyczne punkty z natalu wg `placement_inputs`. Kod liczy, które punkty; AI ich nie zgaduje.
2. **Budowa promptu:** pseudonimizowany (bez imienia i surowych danych urodzenia — zasada warstwy systemowej bez wyjątku), wstrzykuje konkretne pozycje + instrukcję głosu (content-voice-guide) + poziom wellbeing.
3. **Generacja:** Sonnet. Zapis `ai_prompt_version` (anti-pattern: zawsze wersjonować). `ai_call_logs` tylko metadane, **nigdy treść listu**.
4. **Walidacja outputu:** długość (List 250-450 słów, Raport 1500-3000), brak żargonu w ciele, brak predykcji konkretnych zdarzeń, struktura (otwarcie → rozwinięcie osadzone w punktach → zaproszenie do refleksji). Detektory form rodzajowych + korekta językowa na treści. Fallback przy pustym/błędnym output.
5. **Cache:** zapis `content_md`, generacja **raz** na (user, letter). Nigdy auto-regen (koszt + spójność emocjonalna).
6. `AI_MOCK` fixtures: list standardowy, list `delikatny` (cień), raport.

## FAZA 3 — Scheduler (drip czasowy)

1. Cron dzienny (wzór `daily-personal-horoscope`): skanuje płatnych, kto „due" wg `trigger_value` (dni od daty natalu). Log w `cron_runs`.
2. **Pre-generacja 24-48 h przed dostarczeniem** (ukrywa latencję Sonnet, daje bufor na walidację). Status `scheduled` → `generated` → `delivered`.
3. Idempotencja per (user, letter). **Dyscyplina częstotliwości: maks. ~1 list/tydzień łącznie** (czasowe + eventowe).

## FAZA 4 — Dostarczanie: Skrzynka (inbox) + email

1. **Skrzynka jako uniwersalna powierzchnia, NIE podstrona w nawigacji.** Ikona koperty (linearna, z zestawu, stroke 1.5) w nagłówku strefy `/app/*`, góra po prawej, obecna na każdym ekranie (desktop i mobile). Do skrzynki trafiają Listy od Astrei ORAZ inne powiadomienia od nas (ogłoszenia, nowe funkcje, „prognoza gotowa", alert o nadchodzącym Dniu Mocy). Feed = tabela `inbox_items` (FAZA 1); pozycja typu `letter` referuje `user_letters`.
2. **Otwarcie:** klik w kopertę otwiera panel wysuwany (drawer z prawej na desktopie, pełny arkusz/sheet na mobile) — pozycje od najnowszych: ikona wg typu, tytuł, zajawka, czas, kropka nieprzeczytanego. Pozycja `letter`/`report` → otwiera czytnik (react-markdown + podpis fundamentu jako chip). Inne typy → ich CTA. Motion wg design-system (wyłanianie/stagger; bez emoji, ikony linearne).
3. **Bardzo czytelny wskaźnik nieprzeczytanego (wymóg Maca):** bursztynowy badge z licznikiem (`--accent`) na kopercie, gdy `count(read_at IS NULL) > 0`, plus delikatna poświata. Liczba widoczna od razu. Otwarcie pozycji ustawia `read_at` i zmniejsza licznik; przy zero badge znika. Pierwszemu pojawieniu może towarzyszyć jednorazowe delikatne wyłonienie (nie pętla — design-system).
4. **Email (Resend, React Email, głos Astrei, open-loop):** „Astrea napisała do Ciebie list" + 2-3 zdania zajawki + CTA „Przeczytaj w aplikacji". **Pełna treść NIE w mailu** — mail prowadzi do skrzynki (napędza powrót). Opt-out w `user_preferences`.
5. Mail tygodniowy wspomina, gdy w skrzynce czeka nowy list (bez duplikacji treści).
6. **Push:** później, opcjonalnie (nie macie, nie warunek).

## FAZA 5 — Free teaser + ściana

1. List 1 „Twoja misja" generowany **free** po wygenerowaniu kosmogramu (wabik konwersji). 
2. Ściana na liście 2: „Kolejne listy Astrea pisze dla subskrybentów" + jasny paywall. Egzekwowanie po stronie serwera.

## FAZA 6 — Listy wyzwalane tranzytem [P1, może być osobny commit]

1. Z `transits.ts`: Solar Return (rocznica urodzin), Powrót Saturna (tranzyt Saturna na natalny Saturn, ~29-30 / ~58 r.ż.), Sezon przemiany (duży tranzyt Plutona/Saturna/Urana do osobistych planet powyżej progu). `trigger_type = event`.
2. Reguła konkretu: list eventowy cytuje konkretny tranzyt. Spina się z Dniami Mocy w kalendarzu.

## FAZA 7 — Raporty jednorazowe [P1]

1. Katalog raportów (koncept 7b): Złoty Kompas (kariera), Bagaż Karmiczny (węzły), Prognoza roczna. `kind = report`, dłuższy `max_tokens`.
2. Stripe one-time (reuse flow add-onów). Po zakupie: generacja tym samym silnikiem (FAZA 2), zapis, dostarczenie jako pozycja skrzynki typu `report` (otwiera czytnik). Kupione raporty nie wygasają — pozostają w skrzynce/archiwum.
3. Prognoza roczna kupowalna ponownie co rok (nowa warstwa czasu). Pakiet 3 raporty (test 99 zł).

## FAZA 8 — Jakość, wellbeing, domknięcie

1. **Golden testy per szablon** (przed wypuszczeniem każdego): brak predykcji konkretnych zdarzeń, brak żargonu w ciele, forma neutralna, osadzenie w realnych punktach. Dla `wellbeing_level: delikatny` (cień, karma): ton wzmacniający i normalizujący, **zero determinizmu, zero diagnozy klinicznej, cień jako zaproszenie do wzrostu, nie wyrok**. Fail = wróżba, zimna lista cech albo straszenie.
2. **E2E:** drip wyznacza i pre-generuje list (asercja na payloadzie przy `AI_MOCK`); cache nie regeneruje przy drugim otwarciu; nowa pozycja w skrzynce podnosi **badge z licznikiem**, otwarcie pozycji ustawia `read_at` i zmniejsza badge, przy zero badge znika; free teaser „Twoja misja" powstaje, lista 2 → ściana (regresja); email zawiera zajawkę, klik prowadzi do skrzynki; user B nie odczyta listów ani `inbox_items` usera A (RLS negatywny); raport po „zakupie" (Stripe test) ląduje w skrzynce jako `report` i jest czytelny.
3. PostHog: `inbox_opened`, `letter_delivered`, `letter_opened`, `letter_email_clicked`, `letter_paywall_hit`, `report_purchased`, `report_opened`.
4. `docs/LISTY-VERIFY.md` (wzór `CHAT-V2-VERIFY`): screenshoty ikony koperty z badge licznika (desktop/390 px), otwartej skrzynki (drawer/sheet), listu otwartego z podpisem fundamentu, maila zajawki, wyniki goldenów (w tym `delikatny`), dowód testu negatywnego RLS.
5. Zaktualizuj `docs/PROJECT-STATUS.md` (nowa sekcja Listy od Astrei + release log).
6. TODO dla właściciela (NIE wdrażaj, to decyzje Maca): aktualizacja polityki prywatności o nowe przetwarzanie (treści egzystencjalne), zatwierdzenie cen raportów, decyzja o ostatecznym zestawie MVP.

## Zasady

- **Treści Listów i Raportów = najwrażliwsze dane** (tematy egzystencjalne): RLS + test negatywny; treść **nigdy** w `ai_call_logs` (tylko metadane: model, tokeny, task), nigdy w Sentry, nigdy w logach Vercel.
- **Deterministyczne liczy kod** (które punkty, tranzyty, progi, kto „due"); AI tylko pisze.
- **Koszt:** Sonnet, generacja **raz + cache**, nigdy auto-regen. Monitoruj koszt listów/raportów w `ai_call_logs` i raportuj koszt na aktywnego płatnika.
- **Pseudonimizacja:** bez imienia i surowych danych urodzenia w prompcie.
- **Głos:** content-voice-guide + design-system, forma neutralna 2 os., **introspekcja nie wyrocznia**, cień jako zaproszenie. Żargon tylko w podpisie fundamentu, nigdy w ciele. Bez emoji, ikony linearne, tokeny.
- **Częstotliwość:** maks. ~1 list/tydzień łącznie — to ma być wydarzenie, nie spam.
- Nie ruszaj istniejących mechanik chatu, kalendarza i natalu poza punktami integracji opisanymi wyżej.
- Niejasności → zatrzymaj się i zapytaj.
