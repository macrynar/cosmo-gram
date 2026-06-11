# PROMPT 1/4 DLA CLAUDE CODE — P1: Silnik tranzytów + horoskop tranzytowy + personalne Dni Mocy

> Fundament całego P1 — z tego silnika będą korzystać: horoskop, kalendarz, e-maile, chat (prompt 3/4) i push (P2). Wykonaj jako pierwszy.

---

Pracujesz w repo aplikacji Cosmogram (www.cosmo-gram.com): Next.js 16 App Router, TypeScript, Supabase, Vercel Cron. Obliczenia astrologiczne: Swiss Ephemeris (`/api/chart`) + `astronomy-engine` (tranzyty w kalendarzu). Modele AI: natal = claude-sonnet-4-6, treści premium = claude-haiku-4-5, treści masowe = gemini-3.1-flash-lite (warstwa providerów w `src/lib/ai/`, tryb AI_MOCK z fixtures, logowanie do `ai_call_logs`). Plany: free (horoskop znaku z `daily_sign_horoscopes`) i premium (horoskop personalny). Feature flag `personal_power_days` istnieje (wyłączony). Testy: Playwright e2e + unit w CI.

Cel: zastąpić horoskop oparty o znak Słońca **prawdziwymi tranzytami do kosmogramu natalnego usera** i spersonalizować Dni Mocy. To główny differentiator produktu.

Pracuj fazami, po każdej: testy zielone, commit.

---

## FAZA 1 — Silnik tranzytów (`src/lib/astro/transits.ts`)

1. Funkcja `getTransitsForDate(natalChart, date)`: pozycje planet tranzytujących (Słońce–Pluton) liczone lokalnie (astronomy-engine — już używane w kalendarzu) → aspekty do pozycji NATALNYCH usera (koniunkcja, opozycja, kwadratura, trygon, sekstyl). Orby: koniunkcja/opozycja 3°, kwadratura/trygon 2,5°, sekstyl 2°.
2. **Ranking istotności** każdego tranzytu: waga planety tranzytującej (wolne > szybkie: Pluton/Neptun/Uran/Saturn/Jowisz wysokie, Mars/Wenus/Merkury średnie, Słońce/Księżyc niskie ale codzienne) × waga aspektu (koniunkcja > opozycja > kwadratura > trygon > sekstyl) × ciasnota orbu (im bliżej dokładności, tym wyżej) × waga punktu natalnego (Słońce/Księżyc/ASC/MC > planety osobiste > pozostałe).
3. Funkcja `getDayWeather(transits)`: „pogoda astrologiczna" dnia — intensywność 1–5 + dominujący żywioł + jednowyrazowy charakter dnia (np. „dynamiczny", „refleksyjny") — czysto deterministyczna, bez AI.
4. Funkcja `getUpcomingSignificantTransits(natalChart, days=14)`: nadchodzące istotne tranzyty (do zapowiedzi i do chatu w prompcie 3/4).
5. **Testy jednostkowe przeciwko wartościom referencyjnym**: min. 8 przypadków z ręcznie zweryfikowanymi tranzytami (data + kosmogram → oczekiwane aspekty z orbami ±0,1°). Plus przypadki brzegowe: kosmogram bez godziny urodzenia (bez ASC/MC i Księżyca w rankingu — Księżyc bez godziny jest niepewny ±7°, wyklucz go), tranzyt aplikacyjny vs separacyjny (oznacz w wyniku).
6. Silnik jest czysty (pure functions), zero wywołań AI, zero I/O — wszystko testowalne.

## FAZA 2 — Personalny horoskop tranzytowy (premium)

1. Nowy prompt `daily-horoscope-personal` w `ai_prompts` (panel admina, wersjonowany). Wejście (pseudonimizowane — bez imion i dat urodzenia): top 1–3 tranzyty z rankingiem, pogoda dnia, pozycje natalne dotknięte tranzytem. Model: gemini-3.1-flash-lite.
2. Struktura outputu (JSON, walidowany zod): `headline` (nagłówek dnia od dominującego tranzytu, max 80 znaków), `main` (co ten tranzyt znaczy KONKRETNIE dla usera, 2–3 akapity, musi cytować konkretne pozycje: „tranzytujący Saturn w kwadraturze do Twojego natalnego Słońca w Bliźniętach"), `reflection` (jedno pytanie refleksyjne LUB mikro-praktyka na dziś, 1–2 zdania), `weather` (przepisana pogoda dnia). Ton: symboliczne lustro, druga osoba, bez przepowiadania przyszłości jako pewnika.
3. **Reguła konkretu jako test**: dodaj do golden testów automatyczny check — output musi zawierać co najmniej 2 odwołania do konkretnych elementów kosmogramu usera (nazwy planet/znaków/aspektów z wejścia). Output bez konkretu = fail.
4. Generowanie: cron nocny (batch, partiami po N userów premium) zapisuje do tabeli `daily_personal_horoscopes` (user_id, date, content JSON, transits_used). Strona `/app/horoscope` czyta z tabeli (zero generacji on-request; jeśli brak wpisu — wygeneruj on-demand jako fallback i zapisz). RLS standardowo.
5. UI `/app/horoscope` dla premium: pogoda dnia jako wyróżnik wizualny u góry (intensywność + żywioł, spójne z dark crystal style), headline, treść, sekcja refleksji wyraźnie oddzielona. Free widzi horoskop znaku + zajawkę premium (bez zmian) — ale dodaj free userom samą „pogodę dnia" wyliczaną z ich kosmogramu (deterministyczna, koszt zero) jako przedsmak personalizacji.
6. E-mail dzienny premium: przepnij na ten sam content z `daily_personal_horoscopes` (szablon React Email — headline + skrót + link do aplikacji). Free dostają wersję znaku (bez zmian).

## FAZA 3 — Personalne Dni Mocy (premium)

1. `getPowerDays(natalChart, month)`: dni miesiąca rankowane tranzytami **wolnych planet (Jowisz–Pluton) do pozycji natalnych usera** (nie ogólnymi pozycjami jak dotąd). Top 5 w miesiącu = personalne Dni Mocy. Deterministyczne, cache w tabeli `personal_power_days` (user_id, month, days JSON) — licz raz na miesiąc per user, inwaliduj przy zmianie kosmogramu.
2. Włącz feature flag `personal_power_days` dla premium. Free widzi dotychczasowe ogólne Dni Mocy + delikatny lock „Twoje osobiste Dni Mocy — w premium".
3. **Widok dnia** (klik w dzień): jaki tranzyt czyni ten dzień mocnym, do czego w kosmogramie usera, na co go wykorzystać. Wyjaśnienie tranzytu generuj na żądanie (haiku — bo premium content, krótkie) i cache'uj w `calendar_notes`-podobnej tabeli per (user, date) — raz wygenerowane nie generuje się ponownie.
4. Zapowiedź: na `/app/horoscope` i dashboardzie banner „za X dni [planeta] aktywuje Twój [punkt]" z `getUpcomingSignificantTransits` (deterministyczne, bez AI).

## FAZA 4 — Jakość i domknięcie

1. Golden testy: 5 przypadków referencyjnych dla horoskopu personalnego (różne typy tranzytów) + check reguły konkretu; przegeneruj fixtures AI_MOCK.
2. E2E: premium widzi horoskop tranzytowy z pogodą dnia; free widzi horoskop znaku + pogodę + lock; kalendarz premium pokazuje inne Dni Mocy niż ogólne (asercja na danych dwóch różnych userów — ich dni MUSZĄ się różnić); widok dnia generuje i cache'uje wyjaśnienie.
3. PostHog eventy: `personal_horoscope_viewed`, `power_day_clicked`, `upcoming_transit_banner_clicked`, `horoscope_weather_viewed` (free — do mierzenia konwersji z przedsmaku).
4. Koszty: zaloguj w `ai_call_logs`; cron batch ma działać w partiach i zmieścić się w limicie czasu Vercel (jeśli userów dużo — kolejkowanie przez wiele wywołań crona).
5. Zaktualizuj dokument statusu projektu.

## Zasady

- Wszystko co deterministyczne (tranzyty, pogoda, ranking, Dni Mocy) liczy się lokalnie bez AI — AI tylko ubiera wynik w język.
- Pseudonimizacja obowiązuje: do modeli idą wyłącznie dane astrologiczne.
- Nie ruszaj horoskopu free poza dodaniem pogody dnia.
- Niejasności → zatrzymaj się i zapytaj.
