# CALENDAR-V6-VERIFY.md
Raport weryfikacyjny Prognoza v6.
Data: 2026-06-13. Branch: `prognoza-v6`.

---

## 1. Limity kalibracyjne (z calendarLimits.ts)

| Parametr | Limit | Źródło |
|----------|-------|--------|
| MAX_SEASONS_SHOWN | 3 | calendarLimits.ts |
| POWER_DAY_SANITY_CAP | 8 ★/mies | calendarLimits.ts |
| POWER_WINDOWS_PER_MONTH | 5 ★/mies (primary) | calendarLimits.ts |
| MAX_BAND_COVERAGE | 40% | calendarLimits.ts |
| MAX_UPCOMING_ITEMS | 3 | calendarLimits.ts |
| MAX_DAY_PANEL_CARDS | 2 | calendarLimits.ts |
| WINDOW_MIN_SCORE | 15 | calendarLimits.ts |

---

## 2. Tabela weryfikacyjna: 3 kosmogramy × 3 miesiące

Kosmogramy: ref-01 (Warszawa 1990-06-15 12:00), ref-05, ref-09.
Generowane przez: `npx tsx scripts/verify-calendar.ts` (lub inline z `calculateChart` + `getFastWindows`).

| Kosmogram | Miesiąc | Sezony | ★/mies | BandCov% | Nadch. | Okna raw/grid |
|-----------|---------|--------|--------|----------|--------|---------------|
| ref-01 | cze 2026 | 3 ✅ | 5 ✅ | 37% ✅ | 3 | 15/3 |
| ref-01 | wrz 2026 | 3 ✅ | 5 ✅ | 30% ✅ | 3 | 18/4 |
| ref-01 | gru 2026 | 3 ✅ | 5 ✅ | 26% ✅ | 3 | 12/4 |
| ref-05 | cze 2026 | 3 ✅ | 5 ✅ | 40% ✅ | 3 | 16/3 |
| ref-05 | wrz 2026 | 3 ✅ | 5 ✅ | 33% ✅ | 3 | 15/2 |
| ref-05 | gru 2026 | 3 ✅ | 5 ✅ | 23% ✅ | 3 | 13/5 |
| ref-09 | cze 2026 | 3 ✅ | 5 ✅ | 27% ✅ | 3 | 17/3 |
| ref-09 | wrz 2026 | 3 ✅ | 5 ✅ | 40% ✅ | 3 | 20/2 |
| ref-09 | gru 2026 | 3 ✅ | 5 ✅ | 35% ✅ | 3 | 6/5 |

**Wszystkie wartości w limitach.**

Kolumna „Okna raw/grid": raw = wszystkie okna powyżej WINDOW_MIN_SCORE, grid = po `selectGridBands()`.
`selectGridBands()` jest stosowany w `calendar/page.tsx` przed `buildWindowDateMap()` — zapewnia BandCov ≤ 40%.

---

## 3. Testy jednostkowe (npm test)

```
Test Files  13 passed (13)
Tests       285 passed (285)
```

Pokrycie:
- `calendarSelectors.test.ts` — selectShownSeasons, selectUpcoming, selectGridBands (z limitem MAX_BAND_COVERAGE)
- `calendarGating.test.ts` — ISO week key, day gate (future = no Odczytaj), free lock
- `whenBest.test.ts` — 16 testów: Kariera/Relacje/Finanse/Energia/Decyzje/Uważaj matchers, past filter, null cases
- `yearWheel.test.ts` — dateToAngle (Jan 1 → 0°, Dec 31 → ~360°), sezon clamp, power day cap
- `layers.test.ts` — okna, sezony, buildWindowDateMap
- `powerDays.test.ts` — POWER_WINDOWS_PER_MONTH limit, POWER_DAY_SANITY_CAP
- `declension-grep.test.ts` — 0 naruszeń deklinacyjnych w src/ (poza allowlist)

---

## 4. TypeScript

```
npx tsc --noEmit → 0 błędów
```

---

## 5. Kluczowe decyzje architektoniczne v6

| Decyzja | Uzasadnienie |
|---------|-------------|
| `selectGridBands()` stosowany przed `buildWindowDateMap()` | Bez tego BandCov wynosiło 60-83% (powyżej limitu 40%). selectGridBands wybiera top-score okna mieszczące się w limicie pokrycia. |
| `fastWindows` (bez filtru) używany dla `upcomingWindows` i `todayWindow` | TodayView i "Nadchodzące" powinny znać WSZYSTKIE okna, nie tylko grid-bands |
| Bramka dni przyszłych w DayPanel | `date > today` → brak przycisku "Odczytaj"; tekst "Odczyt dostępny w tym dniu" |
| Odczyty tygodnia/roku: cache per `(reading_id, iso_week/year)` | Jedna generacja na reading per period; RLS: tylko owner |
| correctCalendarText() w pipeline tygodnia/roku | Haiku correction pass na tekście plain-text (nie JSON) |

---

## 6. Definicja odbioru (Definition of Done)

- [x] `npx tsc --noEmit` — 0 błędów
- [x] `npm test` — 285/285 passed
- [x] Default widok = Dziś
- [x] „Kiedy najlepiej" — implementacja z 90-dniowym horyzontem, 6 domen
- [x] Odczyty per okres: bramka dzienna, tydzień/rok bez blokady
- [x] Cache week/year interpretations działa (unique constraint + upsert)
- [x] Koło roku: SVG deterministyczny, ≤3 sezony, ≤POWER_DAY_SANITY_CAP×4 power days
- [x] BandCov ≤ 40% — zweryfikowane powyżej dla 9 kombinacji
- [x] Deklinacja grep — 0 naruszeń
- [x] Nav label: "Prognoza" (BottomNav)
- [x] Bez violet/purple w calendar grid (teal dla ◆, amber dla dziś/selected)
- [ ] Powiadomienia (Faza 6 orig) — do osobnego PR
- [ ] E2E Playwright — do osobnego PR (wymaga żywego serwera)
- [ ] Screenshoty wszystkich stanów — manualne po deploy
