# Calendar v4 — Checklist weryfikacyjny

Status: **do wypełnienia po wdrożeniu na dev/staging**

---

## 1. Tabela danych (3 kosmogramy × 3 miesiące)

Uzupełnij po ręcznej weryfikacji w UI lub przez uruchomienie `src/lib/astro/layers.ts` ze znanych danych:

| Kosmogram | Miesiąc | Sezony | Okna szybkie | Peaki (★) | Dni ◆ | Sky events | Dni z ozn. | % dni oznaczonych |
|-----------|---------|--------|-------------|-----------|-------|------------|------------|-------------------|
| test-1990 | 2026-06 |        |             |           |       |            |            |                   |
| test-1990 | 2026-07 |        |             |           |       |            |            |                   |
| test-1990 | 2026-08 |        |             |           |       |            |            |                   |
| test-2000 | 2026-06 |        |             |           |       |            |            |                   |
| test-2000 | 2026-07 |        |             |           |       |            |            |                   |
| test-2000 | 2026-08 |        |             |           |       |            |            |                   |
| test-1980 | 2026-06 |        |             |           |       |            |            |                   |
| test-1980 | 2026-07 |        |             |           |       |            |            |                   |
| test-1980 | 2026-08 |        |             |           |       |            |            |                   |

**Oczekiwane:** zdecydowana mniejszość dni oznaczonych (≤ 30%); peaki (★) ≤ 5/mies; ◆ = kilka rocznie.

---

## 2. Screenshoty do wykonania

- [ ] Pełny widok desktop — siatka widoczna **bez scrolla** ← asercja kluczowa
- [ ] Pełny widok mobile 390px — siatka widoczna bez scrolla
- [ ] Panel dnia: zwykły dzień (tylko rytm Księżyca)
- [ ] Panel dnia: dzień w oknie (pasmo aktywne)
- [ ] Panel dnia: dzień ◆ (sezon dokładny)
- [ ] Panel dnia: pełnia/nów z pytaniem
- [ ] Panel dnia: zaćmienie (mocniejszy wariant)
- [ ] Free user — locki widoczne, struktura zachowana
- [ ] Coachmarki onboardingowe (pierwsza wizyta)
- [ ] Kosmogram bez godziny urodzenia — CTA „Uzupełnij godzinę"

---

## 3. Test spójności danych natalnych (FAZA 0.1)

**Procedura:**
1. Utwórz lub wybierz user z ≥2 kosmogramami
2. Wybierz kosmogram #2 (nie domyślny)
3. Sprawdź: TodayBar, SeasonsCard, MonthSummary, DayPanel — wszystkie muszą opisywać ten sam kosmogram

**Weryfikacja:** znak Ascendentu i planet musi być identyczny we wszystkich komponentach.

- [ ] Wszystkie komponenty pokazują te same dane dla kosmogramu #2
- [ ] Po zmianie na kosmogram #1 wszystko odświeża się spójnie

---

## 4. Brak wywołań AI dla dni bez wydarzeń

**Procedura:** nawigacja po 30 dniach miesiąca z kliknięciem w każdy dzień, monitoring logów AI.

- [ ] Dni bez okna/◆/pełni/nowiu: brak wywołań AI (tylko notatka)
- [ ] Sprawdź `ai_call_logs` — tylko dni z aktywnymi wydarzeniami

---

## 5. Testy grep (FAZA 4.3)

```bash
# 0 wyników każdy
grep -r "Wyjątkowy\|wyjątkowy" src/components/calendar/
grep -r "★[0-9]" src/components/
grep -r "będziesz musiał\|będziesz musiała" src/
```

- [ ] „Wyjątkowy": 0 wystąpień
- [ ] „★\d": 0 wystąpień w JSX/treściach
- [ ] Zakazane formy mianownikowe: 0 wystąpień

---

## 6. PostHog events

Potwierdź capture w devtools przy odpowiednich akcjach:

- [ ] `today_bar_viewed` — przy otwarciu kalendarza
- [ ] `season_expanded` — przy rozwinięciu SeasonsCard
- [ ] `season_exact_day_viewed` — przy otwarciu panelu dnia ◆
- [ ] `window_clicked` — przy kliknięciu okna w MonthSummary
- [ ] `moon_phase_question_answered` — przy notatce w dzień pełni/nowiu
- [ ] `month_summary_viewed` (istniejące)
- [ ] `calendar_day_opened` (istniejące)

---

## 7. Free vs Premium — tabela widoczności

| Element                           | Free oczekiwane | Premium oczekiwane | Wynik |
|-----------------------------------|-----------------|-------------------|-------|
| Dziś: Księżyc w znaku             | ✅ widoczne     | ✅ widoczne        |       |
| Dziś: dom natalny Księżyca        | — ukryte        | ✅ widoczne        |       |
| Retro/zaćmienia: ogólne znaczenie | ✅ widoczne     | ✅ widoczne        |       |
| Retro/zaćmienia: dom natalny      | lock 🔒         | ✅ widoczne        |       |
| Pasma okien w siatce              | ✅ widoczne     | ✅ widoczne        |       |
| Frazy okien + zdania znaczenia    | lock 🔒         | ✅ widoczne        |       |
| Sezony: nazwa + zakres            | ✅ widoczne     | ✅ widoczne        |       |
| Sezony: akapit znaczenia          | lock 🔒         | ✅ widoczne        |       |
| Odczyt dnia ◆                     | lock 🔒         | ✅ widoczne        |       |

---

## 8. Warunki ukończenia

- [ ] TypeScript: `npx tsc --noEmit` = 0 błędów
- [ ] Testy grep (pkt 5) przechodzą
- [ ] Siatka widoczna bez scrolla (desktop + mobile 390px)
- [ ] Nie ma wywołań AI dla dni bez wydarzeń
- [ ] Spójność danych natalnych potwierdzona
- [ ] Migracja `20260612_seasons.sql` uruchomiona na stagingu
