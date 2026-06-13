# CALENDAR-V6-AUDIT.md
Inwentaryzacja stanu kodu przed wdrożeniem Prognoza v6.
Data: 2026-06-13

---

## 1. Jedno źródło kosmogramu — WYNIK: BUG KRYTYCZNY ❌

### Potwierdzone źródła

| Komponent/Route | Jak dostaje chart | Czy reading_id? |
|---|---|---|
| `CalendarGrid`, `TodayBar`, `DayPanel` | `selectedReading.chart_data` z `page.tsx` props | ✅ przez `readingId` prop |
| `MonthSummary` | `/api/monthly-summary?reading_id=` → `readings.chart_data` WHERE `id=reading_id` | ✅ |
| `SeasonsCard` | `getSeasons(selectedReading.chart_data)` — inline w page.tsx | ✅ |
| `/api/day-interpretation` | `.eq("user_id").order("created_at").limit(1)` — **bierze NAJNOWSZY reading** | ❌ BRAK |
| `/api/cron/daily-personal-horoscope` | analogicznie — NAJNOWSZY reading | ❌ BRAK |

### Bug

`DayPanel.tsx:213-220` wywołuje `/api/day-interpretation` z `{ date }` — bez `reading_id`.
API (linia 51-52) pobiera chart: `.eq("user_id", user.id).order("created_at").limit(1)` — ZAWSZE najnowszy kosmogram.

`day_interpretations` (schemat: `unique(user_id, date)`) — brak kolumny `reading_id`.
Skutek: interpretacja dla 15 czerwca dla **Kosmogramu A** nadpisuje cache i pojawia się przy przeglądaniu **Kosmogramu B** — inne Ascendenty, inne Domy. To jest bug Ascendenta z produkcji.

### Naprawy wymagane w FAZIE 0/1
1. `day_interpretations`: dodać kolumnę `reading_id`, zmienić unique na `(reading_id, date)`, migracja.
2. `/api/day-interpretation`: przyjmować `reading_id` z body, query po `eq("id", reading_id)`.
3. `DayPanel.tsx`: przekazywać `reading_id` w fetch body.
4. `cron/daily-personal-horoscope`: iterować po `readings` per user, nie po pierwszym.

---

## 2. Podwójny `SeasonsCard` — POTWIERDZONY ⚠️

`page.tsx:404-413` — `hidden lg:block` (desktop)
`page.tsx:471-481` — `lg:hidden` (mobile)

To responsywny pattern show/hide, nie duplikacja danych. Oba używają tych samych `seasons`. Jednak mamy ten sam komponent dwukrotnie w DOM — podwójny mount, podwójne wywołania API `season-content` jeśli komponent ma własny fetch. Wymaga sprawdzenia czy `SeasonsCard` wywołuje API — jeśli tak, to jest problem.

**Do zrobienia w Fazie 1:** usunąć jeden, zastąpić odpowiednim CSS `sm:hidden/block` lub przenieść do odpowiedniego widoku v6.

---

## 3. Ścieżka generacji treści — OK z zastrzeżeniami ⚠️

| Route | Przez `deepseek.ts`? | task w `ai_call_logs` | Korekta Haiku? |
|---|---|---|---|
| `/api/day-interpretation` | ✅ `aiComplete()` | `day-interpretation` | ❌ brak |
| `/api/monthly-summary` | ✅ `aiComplete()` | `monthly-summary` | ❌ brak |
| `/api/season-content` | ✅ `aiComplete()` | `season-content` | ❌ brak |
| `/api/cron/daily-personal-horoscope` | ✅ `aiComplete()` | `personal-horoscope-batch` | ❌ brak |
| `/api/astro-match` | ✅ `aiComplete()` | `chat` (domyślny!) | ❌ brak |
| natal modules | ✅ `generateModuleWithRetry()` | `natal-module:${id}` | ✅ `correctModuleWithHaiku` |

**Problem:** `correctModuleWithHaiku` istnieje w `deepseek.ts` ale używany WYŁĄCZNIE w `natalGenerator.ts`. Żaden route kalendarza nie robi korekty językowej. `containsForeignScript` jako guard — tak; ale guard odrzuca i loguje, nie poprawia.

**Do zrobienia w Fazie 2:** dodać `correctPolishText` (istnieje w `deepseek.ts`) do pipeline każdego route kalendarza.

---

## 4. Wycieki deklinacji — CZĘŚCIOWE ⚠️

Grep (`w Baran`, `w Wodniaku` itd. w src/ poza i18n/astro.ts): **brak wyników** w plikach produkcyjnych. 

Jednak `DayPanel.tsx:424,438`:
```tsx
{supporting.transit_planet} w {SIGN_LOCATIVE[supporting.transit_sign] ?? supporting.transit_sign}
{challenging.transit_planet} w {SIGN_LOCATIVE[challenging.transit_sign] ?? challenging.transit_sign}
```
Używa `SIGN_LOCATIVE` bezpośrednio — nie przez `formatTransit`. Technicznie poprawna deklinacja (SIGN_LOCATIVE to locative), ale nie przez formatter. Jeśli `transit_sign` nie ma wpisu w SIGN_LOCATIVE — wypadnie mianownik (fallback `?? transit_sign`).

`calendarLimits.ts` nie ma stałych wymaganych przez spec §8 — tylko 3 z ~10.

---

## 5. Zatruty cache — STRATEGIA INVALIDACJI

### Stan
- `day_interpretations`: brak `prompt_version`. Brak możliwości globalnej invalidacji po zmianie promptu.
- `seasons`: brak `prompt_version`. Ma `generated_at`.
- `monthly_summaries`: brak `prompt_version`. Ma `created_at`.
- `daily_personal_horoscopes`: brak `prompt_version`.

### Rekomendowana strategia (bez masowego crona)
Dodać kolumnę `prompt_version text` do każdej tabeli cache. Przed zapisem: przy odczycie z cache sprawdzić czy `prompt_version = CURRENT_VERSION`. Jeśli nie — regenerować przy następnym wejściu (lazy invalidation). CURRENT_VERSION = stała w kodzie, np. `"cal-v6.0"`. Przy fazie 1 deploymentu: bump do `"cal-v6.0"` → wszystkie stare rekordy będą uznane za stałe i zregenerowane at next access.

---

## 6. `/app/today` vs `/app/calendar` — OPCJE (decyzja Maca) ❓

### Stan kodu
- `src/app/app/today/page.tsx` — **tylko redirect do `/app/cosmogram`**. Pusty, martwy.
- `src/app/app/dziennik/page.tsx` — pełna strona: lista notatek użytkownika pogrupowana po miesiącach, streak, linki do kalendarza. Osobny feature (Diary/Journal).

### Opcje

**A) Today zastępuje Prognoza, Dziennik zostaje osobno (REKOMENDACJA)**
- Route `/app/today` → redirect do `/app/calendar` (już tak działa, tyle że do cosmogram)
- `/app/dziennik` pozostaje bez zmian — to oddzielna funkcja (notatki/streak), nie koliduje z prognozą
- Etykieta nawigacji: "Kalendarz" → "Prognoza" (route `/app/calendar` zostaje)
- Pro: brak regresji w stałych linkach; dziennik = uzupełnienie Prognozy (notatki do konkretnych dni)

**B) Wszystko pod `/app/calendar`, Dziennik jako zakładka**
- `/app/dziennik` wchłonięty do Prognozy jako zakładka "Notatki"
- Pro: jedno miejsce dla wszystkich treści astro
- Contra: większy scope v6, ryzyko regresji streaku

**C) Today pozostaje jako osobny "szybki widok" (landing dnia)**
- `/app/today` = uproszczony widok Dziś z Prognozy (bez pełnego dashboardu)
- Contra: dublikacja kodu, dwa widoki do utrzymania

→ **Czekam na decyzję Maca** przed implementacją Fazy 1.

---

## 7. Martwe elementy do usunięcia

| Element | Lokalizacja | Priorytet |
|---|---|---|
| `compareMode` + `GitCompare` + violet styling | `page.tsx:91,344-374`, linie ~365 (fiolet) | **Faza 1** |
| Drugi `SeasonsCard` | `page.tsx:471-481` | **Faza 1** |
| Onboarding `cal_v4_onboarded` (localStorage) | `page.tsx:62-73` | **Faza 7** (nowy onboarding v6) |
| Wiszące "Generuję opis…" (jeśli istnieje) | `DayPanel.tsx` — do sprawdzenia | **Faza 7** |
| `HistorySelector` z chipami profili w treści | `page.tsx:320-375` | **Faza 1** (przełącznik profilu → header) |
| `solarReturnDays` banner | `page.tsx:294-312` | Zostawić (wartościowy feature) |

---

## 8. Brakujące stałe w `calendarLimits.ts`

Aktualnie jest:
```ts
WINDOW_MIN_SCORE = 15
POWER_WINDOWS_PER_MONTH = 5
POWER_DAY_SANITY_CAP = 8
```

Brakuje (wymagane spec §8):
```ts
MAX_SEASONS_SHOWN = 3
MAX_UPCOMING_ITEMS = 3
DAY_HEADLINE_MAX_CHARS = 120
MAX_BAND_COVERAGE = 0.40
MAX_DAY_PANEL_CARDS = 2
```

Brakuje też selektorów: `selectShownSeasons()`, `selectUpcoming()`, `selectGridBands()`.

---

## Pytania do Maca (blokują Fazę 1)

1. **pkt 6 — dziennik/today:** Opcja A (rekomendowana), B lub C?
2. **Bug `reading_id` w `day_interpretations`:** Zgoda na migrację DB zmieniającą `unique(user_id,date)` → `unique(reading_id,date)` + dodanie `reading_id NOT NULL`? To breaking change dla istniejących rekordów (stare będą miały `reading_id = NULL` → trzeba je wyczyścić lub ustawić default).
3. **Nawigacja:** Etykieta "Kalendarz" → "Prognoza" — tak jak rekomenduje spec?
