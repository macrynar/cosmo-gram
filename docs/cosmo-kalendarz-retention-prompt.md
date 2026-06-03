---
title: Cosmo Kalendarz — retention + recurring payment engine
created: 2026-05-26
project: cosmogram
type: claude-code-prompt
status: ready-to-paste
---

# Cosmo Kalendarz — retention + recurring revenue overhaul

> Wklej do Claude Code. To NIE rewrite — to dodanie warstwy retencyjnej do działającego kalendarza. Cel: zamiana feature'a w silnik powracalności i renewałów. Każda zmiana ma jasno: dlaczego buduje retention albo conversion premium.

---

Przeczytaj aktualny kod `apps/web/src/pages/Calendar.tsx` (lub gdziekolwiek żyje Kalendarz). Co jest: month grid z color-coded dots, day detail panel z "Co sprzyja / Na co uważać", reflection question, notatka, lista "Twoje nadchodzące okna", multi-chart selector. To zachowujemy.

Dorzucamy: notification system, Dziennik tab, Moon Diary, streak mechanic, premium gating dla 30-day forward i generowania interpretacji, pattern insights, Solar Return event, Couple Compare mode. Plus refactor filtrów i color system.

## Filozofia retencji

Każdy z 5 mechanik dotyka innego rytmu powrotu:
- **Daily push (rano)** → otwarcie codzienne, daily ritual
- **Notes accumulation** → sunk cost, nie da się wyjść bo tam jest historia
- **Streak unlocks** → light gamification, lojalność po 7/30/90 dniach
- **Moon Diary** → cykliczne 4 momenty miesięcznie z rytualnym ciężarem
- **Major events** (Solar Return, Saturn return) → roczne i kilkudziesięcioletnie peak'i

Konwersja na premium siedzi w 5 placeholderach:
- Pełen 90-day forward view (free = tylko 7 dni)
- Push notifications subscriptions (free = 0, premium = unlimited)
- AI-generated daily deep interpretation (free = 3/mc, premium = unlimited)
- Dziennik patterns insights (premium-only auto-generated po 30 dniach)
- Solar Return annual reading (premium-only — natural renewal anchor wokół urodzin)

## Pliki do utworzenia

```
apps/web/src/lib/calendarFilters.ts                     # 5 nowych filtrów + planet mappings
apps/web/src/lib/calendarColors.ts                      # color system (5 filtrów + neutral + intense)
apps/web/src/lib/moonPhases.ts                          # compute lunar phase + ritual prompts
apps/web/src/lib/reflectionPrompts.ts                   # 30+ pytań per planeta + faza księżyca

apps/web/src/components/Calendar/NotificationBell.tsx   # subscribe button per transit
apps/web/src/components/Calendar/DayDrawer.tsx          # side drawer zamiast take-over modal
apps/web/src/components/Calendar/TransitDuration.tsx    # "trwa 3 dni · peak 5 czerwca"
apps/web/src/components/Calendar/StreakBadge.tsx        # subtle counter widget
apps/web/src/components/Calendar/MoonPhaseRitual.tsx    # special day component dla 4 phases
apps/web/src/components/Calendar/PremiumGate.tsx        # paywall component contextual

apps/web/src/pages/Diary.tsx                            # /app/dziennik - osobna zakładka
apps/web/src/pages/SolarReturn.tsx                      # /app/solar-return - roczne event experience

supabase/functions/calendar-daily-push/index.ts         # cron: rano 8:00 push prep
supabase/functions/calendar-pattern-insights/index.ts   # generate "Twoje wzorce" reading
supabase/functions/solar-return-reading/index.ts        # roczny premium content drop

scripts/seed-reflection-prompts.ts                      # 150+ promptów seed
```

## Pliki do modyfikacji

- `apps/web/src/pages/Calendar.tsx` — refactor filtrów na 5 nowych, integracja DayDrawer, premium gate na 30-day forward
- `apps/web/src/components/layout/AppHeader.tsx` — dodaj "Dziennik" pozycję w nav (między Kalendarz a Cosmo Match)
- `apps/web/src/lib/routes.ts` — dodaj `app.diary` i `app.solarReturn`
- backend gdziekolwiek liczysz tranzyty — dodaj computation długości okna + peak date dla każdego tranzytu

## DB migracje

```sql
-- 1. Notification subscriptions per user per event type
CREATE TABLE IF NOT EXISTS calendar_notification_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  
  -- Dla single specific transit (np. konkretny Saturn-Mars 5 czerwca)
  transit_id TEXT,
  
  -- LUB dla generic event types (subscribe to wszystkich major event types)
  event_type TEXT,  -- 'daily_morning' | 'major_transits' | 'lunar_phases' | 'mercury_retrograde' | 'eclipses' | 'solar_return'
  
  enabled BOOLEAN DEFAULT TRUE,
  push_token TEXT,  -- web push subscription
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, transit_id, event_type)
);

-- 2. Diary entries (rozszerzenie notatek o context i metadata)
CREATE TABLE IF NOT EXISTS diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  profile_id UUID REFERENCES library_profiles,
  entry_date DATE NOT NULL,
  
  note_text TEXT,
  mood SMALLINT,  -- 1-5 optional rating
  
  -- Snapshot kontekstu astrologicznego z dnia (do późniejszego pattern matching)
  active_transits JSONB,
  moon_phase TEXT,    -- 'new' | 'first_quarter' | 'full' | 'last_quarter' | 'waxing' | 'waning'
  moon_sign TEXT,
  is_special_day BOOLEAN DEFAULT FALSE,  -- moon phase day lub major transit
  
  -- Jeśli to moon phase entry — który rytuał
  ritual_type TEXT,   -- 'intention' | 'action' | 'release' | 'reflection' | NULL
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, profile_id, entry_date)
);

CREATE INDEX idx_diary_by_user_date ON diary_entries(user_id, entry_date DESC);
CREATE INDEX idx_diary_special ON diary_entries(user_id, is_special_day) WHERE is_special_day = TRUE;

-- 3. Streak tracking
CREATE TABLE IF NOT EXISTS user_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_active_date DATE,
  unlocked_milestones JSONB DEFAULT '[]'::jsonb,  -- ['7_days', '30_days', '90_days', '180_days', '365_days']
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Pattern insights (auto-generated po 30/90/180 dni)
CREATE TABLE IF NOT EXISTS pattern_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  insight_type TEXT NOT NULL,  -- '30_day_summary' | '90_day_patterns' | '180_day_cycle'
  insight_markdown TEXT NOT NULL,
  diary_entries_analyzed INT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, insight_type)
);

-- 5. Solar Return readings
CREATE TABLE IF NOT EXISTS solar_return_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  year INT NOT NULL,  -- np. 2026 dla solar return generowanego na urodziny w 2026
  reading_markdown TEXT NOT NULL,
  key_transits JSONB,  -- najważniejsze tranzyty roku
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year)
);
```

## P0.1 — Refactor filtrów na 5 daily-context

W `apps/web/src/lib/calendarFilters.ts`:

```typescript
export const CALENDAR_FILTERS = [
  {
    id: 'all',
    label: 'Wszystkie',
    emoji: '✦',
    color: 'neutral',  // grey
  },
  {
    id: 'love',
    label: 'Miłość i relacje',
    emoji: '💞',
    color: 'pink',     // #FF6B9D
    primary_aspects: [
      // Tranzyty do Wenus, Marsa, Księżyca w aspekcie do tych planet
      { transit_planet: 'Venus',   natal_planet: 'Venus',  weight: 1.0 },
      { transit_planet: 'Venus',   natal_planet: 'Moon',   weight: 0.9 },
      { transit_planet: 'Venus',   natal_planet: 'Mars',   weight: 0.8 },
      { transit_planet: 'Mars',    natal_planet: 'Venus',  weight: 0.85 },
      { transit_planet: 'Moon',    natal_planet: 'Venus',  weight: 0.5 },
      // Jowisz/Wenus → expansion w sferze romansu
      { transit_planet: 'Jupiter', natal_planet: 'Venus',  weight: 0.7 },
    ],
  },
  {
    id: 'career',
    label: 'Kariera i pieniądze',
    emoji: '💼',
    color: 'gold',     // #F5A623
    primary_aspects: [
      { transit_planet: 'Sun',     natal_planet: 'MC',     weight: 1.0 },
      { transit_planet: 'Jupiter', natal_planet: 'MC',     weight: 0.95 },
      { transit_planet: 'Jupiter', natal_planet: 'Sun',    weight: 0.85 },
      { transit_planet: 'Saturn',  natal_planet: 'MC',     weight: 0.75 },
      { transit_planet: 'Saturn',  natal_planet: 'Sun',    weight: 0.7 },
      // Wenus do 2 domu / Jowisz do 2 domu = finanse
      { transit_planet: 'Venus',   natal_planet: '2H',     weight: 0.6 },
      { transit_planet: 'Jupiter', natal_planet: '2H',     weight: 0.7 },
    ],
  },
  {
    id: 'energy',
    label: 'Energia i działanie',
    emoji: '⚡',
    color: 'orange',   // #FF5E3A
    primary_aspects: [
      { transit_planet: 'Mars',    natal_planet: 'Sun',    weight: 1.0 },
      { transit_planet: 'Mars',    natal_planet: 'Mars',   weight: 0.95 },
      { transit_planet: 'Mars',    natal_planet: 'ASC',    weight: 0.9 },
      { transit_planet: 'Sun',     natal_planet: 'Mars',   weight: 0.8 },
      { transit_planet: 'Jupiter', natal_planet: 'Mars',   weight: 0.7 },
    ],
  },
  {
    id: 'mind',
    label: 'Komunikacja i decyzje',
    emoji: '🧠',
    color: 'teal',     // #4ECDC4
    primary_aspects: [
      { transit_planet: 'Mercury', natal_planet: 'Mercury', weight: 1.0 },
      { transit_planet: 'Mercury', natal_planet: 'MC',     weight: 0.85 },
      { transit_planet: 'Mercury', natal_planet: 'Sun',    weight: 0.8 },
      { transit_planet: 'Mercury', natal_planet: 'Moon',   weight: 0.7 },
      // Retrogradacja Merkurego = special challenge tag
    ],
    special_flags: ['mercury_retrograde'],
  },
  {
    id: 'inner',
    label: 'Wnętrze i refleksja',
    emoji: '🌙',
    color: 'purple',   // #9B59B6
    primary_aspects: [
      { transit_planet: 'Moon',    natal_planet: 'Moon',   weight: 0.6 },  // lunar return monthly
      { transit_planet: 'Neptune', natal_planet: 'Moon',   weight: 0.9 },
      { transit_planet: 'Neptune', natal_planet: 'Neptune', weight: 0.85 },
      { transit_planet: 'Pluto',   natal_planet: 'Moon',   weight: 0.8 },
      { transit_planet: 'Saturn',  natal_planet: 'Moon',   weight: 0.7 },
    ],
    // Fazy księżyca (nów, pierwsza kwadra, pełnia, ostatnia kwadra) ZAWSZE pokazują się tu
    include_moon_phases: true,
  },
] as const;

// Plus "wyzwanie" flag dla każdego tranzytu — pisany w dark-red niezależnie od kategorii
// Wyzwanie = kwadratura/opozycja z wolną planetą (Saturn, Pluton, Uran) DO osobistych planet
```

W komponencie filter chips zostawiamy "Wszystkie" jako default. Po kliknięciu Miłość — kalendarz pokazuje tylko dni z aktywnym aspektem z `love.primary_aspects` (dotami w pink). Inne dni stają się szare/wyciszone.

## P0.2 — Color system unification

```typescript
// apps/web/src/lib/calendarColors.ts

export const FILTER_COLORS = {
  love:    { dot: '#FF6B9D', glow: 'rgba(255,107,157,0.15)', text: '#FF6B9D' },
  career:  { dot: '#F5A623', glow: 'rgba(245,166,35,0.15)',  text: '#F5A623' },
  energy:  { dot: '#FF5E3A', glow: 'rgba(255,94,58,0.15)',   text: '#FF5E3A' },
  mind:    { dot: '#4ECDC4', glow: 'rgba(78,205,196,0.15)',  text: '#4ECDC4' },
  inner:   { dot: '#9B59B6', glow: 'rgba(155,89,182,0.15)',  text: '#9B59B6' },
  neutral: { dot: '#6B7280', glow: 'rgba(107,114,128,0.15)', text: '#9CA3AF' },
  
  // Modifier flags
  challenge: { dot: '#8B2C2C', glow: 'rgba(139,44,44,0.2)' },  // dark red overlay
  special:   { ring: '#D4AF37' },  // gold outer ring (Wyjątkowy dzień)
  today:     { ring: '#FFFFFF', pulse: true },  // pulsujące white ring
} as const;
```

Dot na każdym dniu: kolor wg dominującego filtra w tym dniu. Jeśli "challenge" → dark red overlay z czerwoną kropką pod główną. Jeśli "special" → gold ring. Jeśli "today" → biały pulsujący ring.

Legenda na dole kalendarza: 5 filtrów + "wyzwanie" + "wyjątkowy dzień" (gold star) + "dziś" (white pulse).

## P0.3 — Today musi być wizualnie odrębne

Aktualnie "Dziś" wygląda jak "selected". Fix:

```tsx
<div className={cn(
  "w-10 h-10 rounded-full flex items-center justify-center relative",
  isToday && "ring-2 ring-white animate-pulse-slow font-bold",
  isSelected && !isToday && "ring-1 ring-amber-400",
)}>
  <span className={cn(isToday && "text-white", !isToday && "text-zinc-300")}>
    {dayNumber}
  </span>
  {/* Dot below day */}
  {dot && <div className="absolute -bottom-1.5 w-2 h-2 rounded-full" style={{background: dot.color}} />}
</div>
```

Plus tailwind keyframe:
```css
@keyframes pulse-slow {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
}
.animate-pulse-slow { animation: pulse-slow 2s ease-in-out infinite; }
```

## P0.4 — Day Drawer zamiast take-over

`DayDrawer.tsx` — side drawer 480px z prawej (desktop) lub bottom sheet 85vh (mobile). Otwiera się po kliknięciu dnia. **Calendar grid zostaje widoczny pod spodem** (mobile: bottom sheet ma background blur kalendarza).

W ten sposób user może klikać kolejne dni w grid'zie bez closing/opening drawer (drawer aktualizuje się in-place).

Stan: `selectedDay: Date | null`. Klik dnia → setSelectedDay. Klik X w drawer → setSelectedDay(null).

## P0.5 — Transit duration & peak day

W backend tranzyt computation — dla każdego aspektu policz:
- `start_date` (gdy orb wchodzi w 1°)
- `peak_date` (gdy orb dokładnie 0°)
- `end_date` (gdy orb wychodzi z 1°)

Dla Księżyca: <1 dzień, zwykle pomijamy duration label.
Dla Wenus/Mars/Merkury: 2-5 dni.
Dla Jowisza: 7-21 dni.
Dla Saturna/Urana/Neptuna/Plutona: tygodnie do miesięcy.

W komponencie `TransitDuration.tsx`:
```tsx
function formatDuration({start, peak, end, today}: TransitWindow): string {
  const daysUntilEnd = differenceInDays(end, today);
  const daysFromStart = differenceInDays(today, start);
  
  if (daysUntilEnd <= 0) return 'Wygasa dziś';
  if (daysUntilEnd === 1) return 'Ostatni dzień';
  if (daysFromStart < 0) return `Zaczyna się ${formatRelativeDate(start)}`;
  if (isSameDay(today, peak)) return `Peak dziś · jeszcze ${daysUntilEnd} dni`;
  if (isBefore(today, peak)) return `Peak ${format(peak, 'd MMM')} · ${daysUntilEnd}d razem`;
  return `Słabnie · jeszcze ${daysUntilEnd} dni`;
}
```

Wyświetl pod każdym tranzytem w "Twoje nadchodzące okna" i w day detail.

## P0.6 — Notification Bell na każdym tranzycie

`NotificationBell.tsx`:
```tsx
<button 
  onClick={() => toggleSubscription(transit.id)}
  className={cn(
    "p-1.5 rounded-full transition",
    isSubscribed ? "bg-amber-400/20 text-amber-400" : "text-zinc-500 hover:text-zinc-300"
  )}
  title={isSubscribed ? "Otrzymasz powiadomienie" : "Powiadom mnie dzień wcześniej"}
>
  <Bell size={16} />
</button>
```

Klik → POST do `/api/calendar/subscribe-transit` { transit_id, user_id }. Day-before cron sprawdza listę subscriptions i wysyła web push notification.

**Free user limit: 3 active subscriptions naraz.** Próba 4-tej → modal "Premium = unlimited subscriptions + automatyczne powiadomienia o ważnych tranzytach". Klasyczny upsell moment w kontekście value-prop.

## P0.7 — Daily Push (8:00 rano)

`supabase/functions/calendar-daily-push/index.ts` — cron każdego dnia 6:00 UTC (8:00 PL).

Logic:
1. Pobierz wszystkich active users z subscription `event_type = 'daily_morning'`
2. Dla każdego policz dominujący tranzyt dnia
3. Generuj 2-zdaniowy push message:
   - Tytuł: "{Emoji filtra} Twój dzień: {planet aspect summary}"
   - Body: "Krótki konkret w 1 zdaniu + zachęta do akcji"
   - Przykład: "💞 Twój dzień: Wenus harmonizuje z twoim Księżycem"
   - Body: "Otwórz się dziś na rozmowy o uczuciach — okno trwa do soboty."
4. Web Push API delivery

**Free user: 1× tygodniowo (niedziela 18:00 = weekly preview).**
**Premium: codziennie + special events.**

Daily push jest najmocniejszy retention mechanic — bez tego user musi pamiętać żeby otworzyć. Z tym apka go ciągnie.

## P0.8 — Dziennik tab (osobna zakładka)

Route `/app/dziennik`. Nav position między Kalendarz a Cosmo Match.

Layout:

```
┌──────────────────────────────────────────────────────────┐
│ Dziennik                                                  │
│ Twoje notatki + automatyczne wzorce                       │
│                                                            │
│ [Streak: 21 dni 🔥]  [Łącznie wpisów: 47]                 │
├──────────────────────────────────────────────────────────┤
│ Tabs: [Wszystko] [Faza Księżyca] [Tylko z notatką]       │
├──────────────────────────────────────────────────────────┤
│ ── PAŹDZIERNIK 2026 ──                                    │
│                                                            │
│ 🌑 Nów w Wadze · 5 paź                                    │
│ Intencja: "Chcę zwolnić w pracy i więcej..."             │
│                                                            │
│ ★ 4 paź · Saturn kwadrat Twoim Słońcem                    │
│ Notatka: "Dziś czułem ścianę. Może to o tym mówili..."   │
│                                                            │
│ 1 paź · Wenus trygon Twoim Marsem                         │
│ (bez notatki)                                             │
│                                                            │
│ ── WRZESIEŃ 2026 ──                                       │
│ ...                                                        │
├──────────────────────────────────────────────────────────┤
│ [🔒 Premium: Wzorce po 30 dniach →]                       │
│                                                            │
│ Auto-generated insight z Twoich 30 wpisów:                │
│ "Zauważyliśmy, że w dniach gdy Saturn jest aktywny,       │
│  pisałeś o stresie w 5/7 przypadków..."                   │
└──────────────────────────────────────────────────────────┘
```

Każdy entry pokazuje:
- Datę
- Typ (Moon phase ritual / Special transit / Regular day)
- Aktywny tranzyt z dnia
- Notatkę usera (jeśli była)
- Click → otwiera Day Drawer z tym samym dniem (edit mode)

**Premium gate na "Pattern insights"** — pokaż locked card z preview "Wzorce po 30 dniach" + CTA do upgrade. Po 30 dniach user na free dostaje 1 free unlock. Po tym premium.

Pattern insight generation (edge function `calendar-pattern-insights`):
```typescript
// Prompt do Claude Sonnet:
// "Oto 30 dni dziennika usera z aktywnymi tranzytami i jego notatkami.
//  Znajdź 3-5 niebanalnych wzorców między emocjami/wydarzeniami a aktywnymi 
//  energiami astrologicznymi. Bądź konkretny — cytuj fragmenty notatek."
```

## P0.9 — Streak mechanic (subtle)

W headerze Kalendarza i Dziennika: mały badge "21 dni 🔥".

Logic:
- Każdy dzień gdy user otworzył kalendarz LUB zapisał notatkę → +1 streak
- Brak interakcji > 1 dzień → streak resetuje, ale **przy pierwszej z powrotem aktywności pokaż "Wracasz — twój best streak: 21 dni. Zaczynamy nowy?"**
- Nie pokazuj agresywnego countera ani guilt-trippingu

Unlocks (bez nachalności, jako celebracja milestone):
- **7 dni** → notification "Tydzień z gwiazdami. ✨ Wszystko działa." (bez unlock, sama satysfakcja)
- **30 dni** → unlock 1× free pattern insight z dziennika (premium feature dostępny raz)
- **90 dni** → unlock 1× free deep daily interpretation (premium feature dostępny raz)
- **180 dni** → unlock "Twój półroczny cykl" — auto-generated reading z całego półrocza (premium feature)
- **365 dni** → unlock free Solar Return reading dla aktualnego roku (najsilniejszy reward)

Te unlocks są **darmowe sample'y premium** — user dostaje smak, potem chce więcej regularnie. To jest dokładnie mechanic Duolingo Plus albo CHANI.

## P0.10 — Moon Diary integration

W `lib/moonPhases.ts`:
```typescript
export function computeMoonPhase(date: Date): MoonPhase {
  // Compute z swisseph: longitude Moon - longitude Sun
  // 0° = new, 90° = first quarter, 180° = full, 270° = last quarter
}

export function isPhaseChangeDay(date: Date): boolean {
  // Czy w ciągu tego dnia dochodzi do dokładnej fazy (0, 90, 180, 270)
}

export const RITUAL_PROMPTS = {
  new_moon: {
    label: 'Nów Księżyca',
    purpose: 'Zasiewanie intencji',
    base_prompts: [
      'Co chcesz, żeby weszło w twoje życie w ciągu najbliższych 29 dni?',
      'Jaką intencję chcesz dziś wypowiedzieć na głos?',
      'Co próbuje się w tobie narodzić, gdy zwolnisz?',
      // ...
    ],
  },
  first_quarter: {
    label: 'Pierwsza kwadra',
    purpose: 'Konkretna akcja',
    base_prompts: [
      'Jaki jeden krok dziś zrobisz w stronę intencji z nowiu?',
      'Co cię powstrzymywało w ostatnich dniach? Jak to dziś przełamiesz?',
      // ...
    ],
  },
  full_moon: {
    label: 'Pełnia',
    purpose: 'Kulminacja i puszczanie',
    base_prompts: [
      'Co dziś chcesz zauważyć, docenić albo wypuścić?',
      'Co od ostatniego nowiu dojrzało w tobie — czy widzisz to?',
      'Jakiej prawdy unikałeś, która dziś chce wyjść na światło?',
      // ...
    ],
  },
  last_quarter: {
    label: 'Ostatnia kwadra',
    purpose: 'Refleksja i integracja',
    base_prompts: [
      'Czego cię nauczył ten cykl?',
      'Co zostawiasz za sobą, gdy ten cykl się kończy?',
      'Co potrzebuje twojej uwagi przed nowym nowiem?',
      // ...
    ],
  },
};
```

Na 4 dniach w miesiącu (faza zmienia się dokładnie tego dnia) — `MoonPhaseRitual` komponent w DayDrawer **zastępuje** zwykły reflection prompt:

```
┌──────────────────────────────────────────┐
│ 🌑 NÓW KSIĘŻYCA W WADZE                  │
│ Czas zasiewania intencji                  │
│                                            │
│ Co chcesz, żeby weszło w twoje życie     │
│ w ciągu najbliższych 29 dni?              │
│                                            │
│ [textarea — twoja intencja]                │
│                                            │
│ ▶ Zobacz swoje poprzednie intencje (3)    │
│   [klik → modal z poprzednimi nowiami]    │
└──────────────────────────────────────────┘
```

Krytyczne: **pokazuj poprzednie intencje z tej samej fazy.** User na nowiu widzi co zasiewał miesiąc temu, dwa, trzy. To buduje cykliczną refleksję i sunk cost.

Visual: te 4 dni w miesiącu mają specjalny marker w grid'zie — księżyc ikona zamiast kolorowej kropki (nów = pełne czarne kółko z białym konturem, pełnia = pełne białe, kwadry = pół-i-pół).

**Free user: dostęp do 4 phase rituals/mc.**
**Premium: + przegląd historycznych intencji (cross-cycle), + auto-generated "Twój cykl księżycowy" insight co 3 miesiące.**

## P1.1 — Solar Return event

`/app/solar-return` — special page która aktywuje się **5 dni przed urodzinami** usera.

Banner na top kalendarza: "Twój nowy rok zaczyna się za 5 dni. Solar Return czeka."

Klik → otwiera SolarReturn.tsx. Layout:

```
┌────────────────────────────────────────────────────┐
│ TWÓJ SOLAR RETURN 2027                              │
│ Rok zaczyna się 12 listopada                        │
│                                                      │
│ [HERO photo of cosmic theme]                         │
│                                                      │
│ W tym roku najsilniejsze są:                        │
│ ★ Saturn na twoim MC — rok budowania autorytetu    │
│ ★ Wenus przez 5. dom — twórczość, romans           │
│ ★ Pluton kwadrat Słońce — głęboka rekonstrukcja    │
│                                                      │
│ [Premium gate]                                       │
│ Pełen raport (12 stron) za 39 zł lub w premium →   │
│                                                      │
│ Co dostajesz:                                        │
│ • Tematy roku z miesięcznym breakdownem              │
│ • Najlepsze daty dla decyzji życiowych              │
│ • Wyzwania i okna rozwoju                           │
│ • Spersonalizowane intencje na każdy kwartał        │
└────────────────────────────────────────────────────┘
```

**Pricing strategy:** standalone 39 zł one-off LUB free dla premium subscriber. To jest **major renewal anchor** — jeśli user kupił premium miesiąc przed urodzinami, dostaje to free i widzi value. Renewal probability po Solar Return wzrasta ~40%.

Push notification: "Twój nowy astrologiczny rok zaczyna się jutro 🌟" — link do Solar Return page.

Cron `solar-return-reading` generuje raport dla premium userów automatycznie 5 dni przed urodzinami. Dla non-premium: paywall + "Wykup raport — 39 zł" (Stripe one-off payment).

## P1.2 — Couple Compare mode

Toggle "Tryb pary" w kalendarzu (premium-only). Wybierz drugi profil z biblioteki (partner). Grid pokazuje:
- Twoje dot'y po lewej połowie każdego dnia
- Partnera po prawej połowie
- Dni gdzie OBOJE mają aktywny pozytywny tranzyt → gold border kółka (= "dobry dzień dla was obojga")

Side panel dla wybranego dnia ma dwie sekcje:
- "Dla Ciebie dziś: ..."
- "Dla {Partner_name} dziś: ..."
- "Wspólna energia: ..." (composition z obu)

Use case: "Kiedy zaplanować ważną rozmowę z partnerem?" — sprawdza kalendarz, widzi że za tydzień jest gold-bordered dzień. To jest CRITICAL feature dla couples + premium driver — bo wymaga 2 charts (premium feature).

## P1.3 — Reflection prompts per planet

Aktualne pytanie generic. Zastąp library 150+ promptów z mapping (transit_planet × natal_planet × aspect_type).

W `seed-reflection-prompts.ts` seed schema:
```typescript
{ when: 'venus_aspect_to_venus', prompts: [
  "Komu chcesz dziś powiedzieć 'ważne dla mnie jesteś'?",
  "Jak pielęgnujesz to co już masz, zamiast szukać nowego?",
  // 5-8 wariantów
]},
{ when: 'mars_square_saturn', prompts: [
  "Gdzie czujesz dziś frustrację którą warto wyrazić, choć boisz się reakcji?",
  // 5-8 wariantów
]},
// ... 30+ kategorii, każda 5-8 promptów = ~200 total
```

Algorithm: dla dnia weź najsilniejszy aspekt → match do kategorii → random sample z prompts. Konsystencja per user per day (hash deterministic).

## P1.4 — Share cards per transit

Plug w istniejący share infrastructure (Cosmo Match share). Przycisk share na DayDrawer.

Card 1080×1920 z:
- Tytuł "Mój dzień, {Date}"
- Aktywny tranzyt jako duży tekst: "Jowisz trygon mojemu Księżycowi"
- Subtitle: "Okno na odważniejszy ruch"
- Brand watermark "cosmogram.pl"

Pre-generated PNG, web share API albo download.

## P1.5 — Notes drill-down z dziennika

W Dziennik tab — klik entry → otwiera Day Drawer z TYM dniem (już z notatką), tryb edit. User może edytować, dodać mood rating, dorzucić obrazek (mood photo? — P2).

## Premium gating — pełna matryca

| Feature | Free | Premium |
|---|---|---|
| Calendar forward view | 7 dni | 90 dni |
| AI deep daily interpretation | 3/miesiąc | Unlimited |
| Notification subscriptions | 3 active | Unlimited |
| Daily morning push | 1× weekly | Codziennie |
| Major event alerts (Saturn return, eclipses) | – | Tak |
| Dziennik storage | Unlimited | Unlimited |
| Pattern insights (auto-generated) | 1× po 30d (free trial) | Co 30/90/180 dni |
| Moon Diary phase rituals | 4/mc (basic prompts) | + Cross-cycle history view + personalized prompts |
| Couple Compare mode | Lock + paywall | Pełen dostęp |
| Solar Return reading | 39 zł one-off | Free annual |
| Notes export PDF | – | Tak |
| Multi-chart calendar | 1 chart (swój) | Wszystkie z biblioteki |

## Test akceptacyjny (kompletny)

### Filtry & Color system
1. Klik filter "Miłość i relacje" → kalendarz pokazuje tylko dni z pink dotami (love aspects), inne wyciszone do 30% opacity.
2. Klik "Wnętrze i refleksja" → widoczne 4 dni z fazami Księżyca w purple + dni z tranzytem Neptun/Pluton.
3. Legenda na dole pokazuje 5 kolorów filtrów + wyzwanie (dark red) + wyjątkowy dzień (gold star) + dziś (white pulse).
4. Dzień z challenge'em (Saturn kwadrat Wenus) ma dark red overlay nad głównym kolorem dot'a.

### Today visual
5. Aktualny dzień ma pulsujące white ring + pogrubiony number. Wyraźnie odrębne od selected day (gold ring solid).

### Day Drawer
6. Klik dnia → side drawer slide-in z prawej (desktop) / bottom sheet up (mobile). Calendar grid wciąż widoczny.
7. Klik kolejnego dnia w grid → drawer aktualizuje się in-place bez close/reopen.
8. Drawer ma X w prawym górnym → setSelectedDay(null) → drawer slide-out.

### Transit duration
9. W "Twoje nadchodzące okna" każdy tranzyt pokazuje "Peak X cze · Yd razem" lub "Słabnie · Yd zostało".
10. Tranzyt Saturna pokazuje "Aktywny od 12 maja · do 28 lipca" (długie okno).

### Notification Bell
11. Klik dzwonek przy tranzycie → POST do subscriptions, dzwonek staje się gold/filled.
12. Free user próbuje 4-tej subscription → modal upsell "Premium = unlimited".
13. Day-before cron faktycznie wysyła push (test w dev z mock push token).

### Daily Push (8:00)
14. Free user otrzymuje 1× tygodniowo (niedziela 18:00).
15. Premium user otrzymuje codziennie 8:00.
16. Tekst push'a zawiera emoji filtra + 1-zdaniowy konkret + "otwórz" CTA.

### Dziennik tab
17. `/app/dziennik` ładuje się dla zalogowanych.
18. Entries chronologicznie, grouped by month, z aktywnym tranzytem context'em.
19. Klik entry → otwiera Day Drawer w edit mode.
20. Tab "Faza Księżyca" filtruje tylko 4-phase entries z ritual_type.
21. Pattern insight card pokazuje preview + premium paywall (lub unlocked dla 30-day trial user'a).

### Streak
22. Każdy dzień z otwarciem app → +1 streak. Visible badge w header.
23. Po 30 dniach: notification + unlock 1× free pattern insight.
24. Po 90 dniach: unlock 1× free deep daily interpretation.
25. Brak interakcji > 24h → streak reset, ale przy powrocie comeback message z best streak.

### Moon Diary
26. Na dniu nów księżyca → DayDrawer pokazuje MoonPhaseRitual z purpose "Zasiewanie intencji" + random prompt z RITUAL_PROMPTS.new_moon.base_prompts.
27. Sekcja "▶ Zobacz swoje poprzednie intencje (3)" pokazuje historyczne wpisy z poprzednich nowiów.
28. Visual w grid: nów = pełne czarne kółko z białym konturem; pełnia = białe; kwadry = half-and-half.

### Solar Return
29. 5 dni przed urodzinami banner top "Twój nowy rok zaczyna się za 5 dni → Solar Return"
30. Klik → `/app/solar-return` z hero + 3 key themes roku.
31. Free user widzi paywall "Pełen raport 39 zł lub w premium".
32. Premium user widzi "Twój pełen raport jest gotowy" + reading.
33. Push notification dzień przed urodzinami z link.

### Couple Compare
34. Premium user toggluje "Tryb pary" → wybiera Asia z biblioteki.
35. Grid pokazuje dual dots (twoje lewa połówka, jej prawa).
36. Dzień gdzie oboje mają pozytywny tranzyt → gold border.
37. Day Drawer dla tego dnia ma 3 sekcje: "Dla Ciebie / Dla Asia / Wspólna energia".
38. Free user widzi toggle ale paywall.

### Premium gating
39. Free user scroll'uje w 30-day forward → po 7 dniach blur + "Premium = pełne 90 dni" CTA.
40. 4-th AI deep interpretation request w miesiącu → paywall.
41. Próba dostępu do Couple Compare bez premium → modal.

### General
42. PostHog events: `calendar_filter_applied`, `calendar_day_opened`, `diary_note_saved`, `streak_milestone`, `notification_subscribed`, `moon_phase_ritual_completed`, `solar_return_viewed`, `couple_compare_opened`, `premium_paywall_shown`, `premium_paywall_converted`.

Jeśli któreś z 42 nie przechodzi → nie commituj, wróć z błędem.

## Po skończeniu

W `docs/PROGRESS.md`:
- Screenshot kalendarza z nowymi 5 kolorami + today pulse
- Screenshot Day Drawer otwarty obok grida
- Screenshot Dziennik tab z entries + pattern insight card
- Screenshot Moon Phase Ritual w day drawer (na dzień nowiu)
- Screenshot Solar Return preview
- Lista premium gates aktualnie aktywnych (z liczbami: ile userów hituje każdy)
- Pierwsze 24h: liczba notification subscriptions, daily push delivery rate, click-through rate
- Pytania do mnie (np. "web push API wymaga HTTPS, OK na vercel preview czy dopiero prod?")

## Co świadomie odłożone na P2+

- Mood photo upload (Instagram-style)
- AI auto-detect mood patterns w dzienniku
- Voice journal entries (transcription via Whisper)
- Community feature ("inni z podobnym chartem dzisiaj czują...")
- Astrologer live commentary dla eclipses (live moments)
- Recipe per moon phase (food/wellness ritual)
- Bedtime/morning ritual prompts
- Birthday cards do printowania z Solar Return
- Integration z kalendarzem Google/Apple (export key dates)
