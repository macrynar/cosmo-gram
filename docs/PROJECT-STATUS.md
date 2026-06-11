---
title: Cosmogram — Project Status
type: project-status
owner: Mac
last_updated: 2026-06-11
---

# Cosmogram — dokument statusu projektu

## Cel produktu

Aplikacja AI + astrologia dla rynku polskiego. Pozycjonowanie: „symboliczne lustro" — narzędzie do refleksji i samopoznania, nie wyrocznia. Kosmogram urodzeniowy (natal) jako centrum wartości; kolejne moduły budują warstwę retencji i konwersji na premium.

**Cel biznesowy (6–12 mies):** stabilny wzrost aktywnych userów, rosnący przychód z subskrypcji, wysoka retencja płatnych userów.

---

## Stack technologiczny

### Frontend
| Technologia | Wersja | Rola |
|---|---|---|
| Next.js | 16.1.6 | Framework (App Router, client-rendered PWA) |
| React | 19.2.3 | UI |
| TypeScript | 5.x | Język |
| Tailwind CSS | 4.x | Stylowanie |
| Framer Motion | 12.x | Animacje |
| Lucide React | 0.577 | Ikony |
| React Markdown | 10.x | Renderowanie treści AI |

### Backend / Infrastruktura
| Technologia | Rola |
|---|---|
| Supabase (Postgres + Auth + RLS) | Baza danych, uwierzytelnienie, Row Level Security |
| Vercel | Hosting, deploy, Vercel Cron Jobs |
| Next.js API Routes | Wszystkie endpointy backendu (brak osobnego serwera) |

### AI
| Model / Provider | Zastosowanie |
|---|---|
| Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) | Szybkie endpointy: interprertacja dnia, wyjaśnienie Dnia Mocy, dzienny horoskop batch |
| Claude Sonnet 4.6 (`claude-sonnet-4-6`) | Jakościowe generowanie: kosmogram, dziecięcy kosmogram, match, chat |
| Fallback offline | Każdy endpoint AI ma fallback przy pustym/błędnym output modelu |

### Astrologia
| Biblioteka | Zastosowanie |
|---|---|
| `astronomy-engine` | Obliczenia pozycji planet, tranzytów |
| `tz-lookup` | Lookup strefy czasowej po współrzędnych |
| Swiss Ephemeris (custom) | Precyzyjne obliczenia kosmogramu (`/api/chart`) |

### Płatności i analityka
| Serwis | Rola |
|---|---|
| Stripe (Subscriptions + Checkout + Webhook) | Płatności, subskrypcja premium |
| PostHog | Analityka produktowa, event tracking |
| Resend | Email transakcyjny i marketing (welcome email, dzienny horoskop) |

### Email
- Provider: **Resend**
- Domena nadawcy: `hello@cosmo-gram.com`
- Szablony: `src/emails/WelcomeEmail.tsx`, `src/emails/DailyHoroscopeEmail.tsx` (React Email)
- Welcome email: wysyłany po potwierdzeniu adresu email (`/api/email/welcome`, idempotentny)
- Dzienny horoskop: cron Vercel `0 6 * * *` → `/api/cron/daily-horoscope`

---

## Architektura aplikacji

```
www.cosmo-gram.com
├── / (landing page)
│   ├── /cosmogram     – landing Kosmogram
│   ├── /calendar      – landing Kalendarz astrologiczny
│   ├── /match         – landing Cosmo Match
│   ├── /cosmo-chat    – landing Cosmo Chat
│   ├── /pricing       – cennik
│   └── /blog          – blog
│
├── /signup            – rejestracja (3-krokowy wizard: dane urodzenia → konto → check email)
├── /login             – logowanie
├── /auth/callback     – obsługa OAuth + email confirmation, autostart kosmogramu
│
└── /app/*             – strefa zalogowana (wymaga sesji)
    ├── /app/cosmogram      – kosmogram natalny + dziecięcy
    ├── /app/calendar       – kalendarz astrologiczny (Dni Mocy, tranzity)
    ├── /app/horoscope      – dzienny horoskop
    ├── /app/match          – Cosmo Match (porównanie kosmogramów)
    ├── /app/chat           – Cosmo Chat (AI astrolog)
    ├── /app/library        – biblioteka kosmogramów dzieci
    ├── /app/map            – Cosmo Map (mapa astrologiczna)
    ├── /app/solar-return   – Solar Return (rocznica urodzin)
    ├── /app/settings/*     – ustawienia (profil, subskrypcja, powiadomienia, prywatność)
    └── /app/admin/*        – panel admina (prompty, evale, golden tests)
```

---

## Wdrożone funkcje (stan na 2026-06-10)

### ✅ Kosmogram natalny
- Zbieranie danych: data, godzina (opcjonalna), miejsce (z geocodingiem)
- Obliczenia: Swiss Ephemeris przez `/api/chart`
- Interpretacja AI: 8 modułów równolegle (DeepSeek), każdy z retry i fallback
- Karta astrologiczna (Karta Zawodnika): cache localStorage + Supabase
- Zapis, rename, delete, historia; history selector w UI
- Share: publiczny link `/share/reading/[id]`
- Limit 1 kosmogram na konto free (paywall na kolejne)

### ✅ Kosmogram dziecka
- Osobny moduł z dedykowanym promptem (ton rodzicielski, potrzeby emocjonalne)
- Generowanie przez `/api/ai-child` (streaming)
- Zapis w tabeli `children`, biblioteka w `/app/library`
- Regeneracja wszystkich kart naraz (bulk regen)
- Funkcja premium (paywall)

### ✅ Kalendarz astrologiczny
- 4-poziomowy system klas dni: normal / significant / power / exceptional
- Intensywność wizualna 1–5 (złoty gradient na komórkach)
- Osobiste Dni Mocy dla userów premium: `getPowerDays()` → top 5 wg score tranzytowego
- Wyjątkowe dni (exceptional): podzbiór power days z tight orb do Słońce/Księżyc/ASC/MC
- CalendarGrid: ring-only dla power, ring+fill dla exceptional, ★ gwiazdka, glify fazy księżyca
- DayPanel: ścisły porządek sekcji, zdania z deklinacją PL, bez powtórzeń
- Interpretacja premium on-demand: Haiku (~300 tokenów), cache w `day_interpretations`
- Horoskop osobisty dla power/exceptional: cron Sonnet batch 03:00 UTC, fallback on-demand
- Email z nagłówkiem horoskopu (headline) zamiast znaku zodiaku — dla userów premium
- Free users: upsell banner w siatce + lock card w DayPanel
- UpcomingEvents: max 3 okna, klik → nawigacja do dnia szczytu, deklaratywna deklinacja PL
- Notatki dzienne (`calendar_notes`) zapisywane w Supabase

### ✅ Cosmo Match
- Formularz dla 2 osób z wyborem z zapisanych kosmogramów lub wpisem ręcznym
- Geocoding z dropdownem dla obu osób
- Analiza synastryczna przez `/api/astro-match` (DeepSeek, JSON mode + retry)
- Wynik: score, synergie, napięcia, wskazówki
- Zapis, rename, delete, historia matchów
- Share: publiczny link `/share/match/[id]`
- Limit 1 match na konto free (paywall)

### ✅ Cosmo Chat
- Chat kontekstowy osadzony w kosmogramie usera
- Historia wiadomości w sesji
- Endpoint AI z full kontekstem kosmogramu jako system prompt

### ✅ Dzienny horoskop
- Spersonalizowany horoskop dla znaku Słońca
- Strona `/app/horoscope`
- Email dzienny: cron Vercel codziennie o 6:00 UTC → Resend

### ✅ Rejestracja (signup flow)
- 3-krokowy wizard: dane urodzenia → konto → sprawdź email
- Dane urodzenia zbierane przed rejestracją (wyższy commitment)
- `localStorage` przechowuje `cosmogram_pending_chart` przez potwierdzenie emaila
- Po kliknięciu linku w mailu → `/auth/callback` → `/app/cosmogram?autostart=true` → automat generuje kosmogram
- Obsługa Google OAuth + email/password

### ✅ Email
- Welcome email po pierwszym logowaniu (idempotentny)
- Dzienny horoskop email (opt-in, unsubscribe jednym kliknięciem)
- Preferencje email w `/app/settings/notifications`
- Tabela `user_preferences` z `email_horoscope` i `welcome_sent`

### ✅ Płatności
- Stripe Subscriptions + Checkout
- Webhook (`/api/stripe-webhook`) synchronizuje subskrypcje do Supabase
- Portal klienta przez `/api/create-portal-session`
- `SubscriptionContext` dostępny globalnie w strefie `/app/*`

### ✅ PWA / Mobile
- `viewport-fit=cover`, `safe-area-inset-bottom` dla iPhone z notchem
- Bottom tab navigation (`BottomNav`) na mobile w strefie `/app/*`
- `touch-action: manipulation`, `-webkit-tap-highlight-color: transparent`
- `overscroll-behavior: none`

### ✅ Landing page (pre-login)
- Strona główna z sekcjami: Hero, Features, HowItWorks, Pricing, FAQ, CTA
- Dedykowane strony funkcji: `/cosmogram`, `/calendar`, `/match`, `/cosmo-chat`
- Nawigacja: Kosmogram · Kalendarz · Cosmo Match · Cosmo Chat · Blog · Cennik

### ✅ Panel admina
- Zarządzanie promptami AI (CRUD, wersjonowanie przez `ai_prompt_version`)
- Golden tests i ewaluacje jakości outputu AI
- Few-shot examples management

---

## Baza danych (Supabase)

Główne tabele:
| Tabela | Zawartość |
|---|---|
| `saved_readings` | Kosmogramy natalne userów |
| `children` | Kosmogramy dzieci |
| `astro_matches` | Wyniki Cosmo Match |
| `user_preferences` | Preferencje email (`email_horoscope`, `welcome_sent`) |
| `calendar_notes` | Notatki w kalendarzu |
| `subscriptions` | Status subskrypcji Stripe |
| `ai_prompts` | Wersjonowane prompty AI (panel admin) |
| `daily_personal_horoscopes` | Personalne horokospy dzienne dla premium (cron + on-demand) |
| `day_interpretations` | Interpretacje dni „significant" — cache per (user_id, date) |
| `cron_runs` | Log przebiegów cronów |
| `ai_call_logs` | Log wywołań AI z modelem, tokenami, taskiem |

RLS włączony na wszystkich tabelach userów. Supabase Auth obsługuje OAuth (Google) i email/password.

---

## Zmienne środowiskowe (wymagane)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
ANTHROPIC_API_KEY=

# Płatności
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_STRIPE_PRICE_ID=

# Email
RESEND_API_KEY=
RESEND_FROM=Cosmogram <hello@cosmo-gram.com>   # opcjonalnie (jest fallback)

# Cron
CRON_SECRET=                         # zabezpieczenie endpointu cron

# App
NEXT_PUBLIC_APP_URL=https://www.cosmo-gram.com

# Analityka
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
```

---

## Deploy

- **Hosting:** Vercel (auto-deploy z `main` branch)
- **Produkcja:** [www.cosmo-gram.com](https://www.cosmo-gram.com)
- **Cron:** Vercel Cron Jobs skonfigurowany w `vercel.json` (`0 6 * * *`)
- **Supabase Auth redirect:** skonfigurowany na `https://www.cosmo-gram.com/auth/callback`
- **Resend DNS:** SPF/DKIM/DMARC skonfigurowane na `cosmo-gram.com` (OVH)

---

## Znane ograniczenia i ryzyka

| Ryzyko | Opis |
|---|---|
| AI output quality | DeepSeek może generować pusty/niepoprawny JSON — każdy endpoint ma retry + fallback, ale jakość treści wymaga regularnej walidacji |
| Koszty AI | Przy skalowaniu liczby userów koszt wywołań AI rośnie proporcjonalnie — brak cache'owania na poziomie API dla natal |
| Supabase RLS | Każda nowa tabela wymaga ręcznego ustawienia polityk RLS — ryzyko przy szybkim developmencie |
| Email deliverability | Resend + domena `cosmo-gram.com` — wymaga monitorowania SPF/DKIM i bounce rate |
| Cron niezawodność | Vercel Cron na planie darmowym ma ograniczenia; przy wzroście bazy emaili może wymagać podziału na batche |

---

## Priorytety dalszego rozwoju

### P0 — Stabilność i jakość core
1. Regularna walidacja outputu AI (natal, child, match)
2. Monitoring błędów 5xx na głównych endpointach
3. Testy end-to-end dla flow: rejestracja → autostart kosmogramu → wynik

### P1 — Retencja
1. Push notifications (PWA Web Push) — dzienny horoskop jako powiadomienie
2. Streak w kalendarzu
3. Dziennik astrologiczny (Moon Diary) — zapisywanie refleksji przy każdym Dniu Mocy

### P2 — Wzrost
1. Blog z artykułami SEO (już istnieje struktura `/blog`)
2. Udostępnianie kosmogramu (share page już istnieje, wymaga dopracowania)
3. Onboarding tour dla nowych userów
4. A/B test CTA na landing page

### P3 — Nowe funkcje
1. Solar Return (strona `/app/solar-return` istnieje, wymaga dopracowania)
2. Cosmo Map (mapa astrologiczna, `/app/map` istnieje)
3. Natywna aplikacja mobilna (dopiero przy 1000+ płatnych userów)

---

## KPI do śledzenia

| Metryka | Cel |
|---|---|
| Natal completion rate | onboarding → wygenerowany kosmogram |
| D1 / D7 retention | powrót po 1 i 7 dniach |
| Paywall view → conversion | % userów przechodzących na premium |
| Email open rate | dzienny horoskop email |
| AI failure rate | % pustych/błędnych odpowiedzi AI |
| Match usage per user | średnio ile matchów na aktywnego usera |

---

## Release log

### [2026-06-11] P1-1: Silnik tranzytów + przebudowa kalendarza

**Zakres P1-1 (tranzytowy silnik retencji):**
- `src/lib/astro/transits.ts` — nowy silnik tranzytów: oblicza aktywne aspekty transit→natal z orb, aplikacja/separacja, `DayData.score`, `topSupporting/topChallenging`, `powerDayMap`
- `src/lib/astro/powerDays.ts` + `getPowerDays()` — top 5 Dni Mocy w miesiącu dla premium
- `src/lib/astro/dayClasses.ts` — 4-klasowy system: exceptional / power / significant / normal
- `src/lib/i18n/astro.ts` — deklinacje PL: SIGN_LOCATIVE, PLANET_GENITIVE, PLANET_INSTRUMENTAL, `natalInstrumental()`, `inSign()`
- `aiComplete` — rename `deepSeekChat` → `aiComplete` we wszystkich 12 plikach (nazwa legacy, zawsze był Claude)
- `day_interpretations` — nowa tabela Supabase, migration `20260611_day_interpretations.sql`
- `/api/day-interpretation` — POST, on-demand interpretacja dnia Haiku (300 tokenów, cache)
- `/api/cron/daily-personal-horoscope` — cron Sonnet batch 03:00 UTC, email z `headline` w temacie
- CalendarGrid — pełny rewrite: intensity textures, ring styles, ★ exceptional, glify księżyca, upsell banner dla free
- DayPanel — pełny rewrite: strict section order, deklinacja PL, cache interpretacji, lock dla free
- UpcomingEvents — rewrite: brak dzwonków, max 3, klik → nawigacja do dnia
- Kalendarz page — usunięto filtry (CalendarFilter/IntentionFilter), dodano `powerDayMap`, `selectedDayClass`
- Email: `sendDailyHoroscopeEmail` przekazuje `headline` dla premium userów

**Do zrobienia po release:**
- Uruchomić migrację `20260611_day_interpretations.sql` na produkcji Supabase
- Zweryfikować cron `daily-personal-horoscope` w Vercel Dashboard

---

### [2026-06-10] Kompletny relaunch UX + email + PWA
**Zmiany w core natal:**
- Rewrite signup flow: 3-krokowy wizard, dane urodzenia zbierane przed rejestracją
- Autostart kosmogramu po potwierdzeniu email (`?autostart=true`)
- Fix: `emailRedirectTo` w `signUp` — mail prowadził na `/#` zamiast `/auth/callback`

**Co dowieziono:**
- Pełna integracja Resend (welcome email + dzienny horoskop cron)
- PWA mobile: dolna nawigacja, viewport-fit=cover, safe-area-inset-bottom, touch fixes
- Landing page: dedykowane strony dla każdej funkcji (`/cosmogram`, `/calendar`, `/match`, `/cosmo-chat`)
- Nowa nawigacja publiczna: Kosmogram · Kalendarz · Cosmo Match · Cosmo Chat · Blog · Cennik
- Cosmo Match: styl dark crystal + wybór z zapisanych kosmogramów w formularzu
- `user_preferences` tabela (Supabase) + settings notifications page
- Usunięto Dziennik z nawigacji app (nie gotowy na produkcję)

**Co otwarte:**
- Push notifications (Web Push API)
- Solar Return i Cosmo Map wymagają dopracowania
- Streak i Moon Diary w kalendarzu

**Ryzyka po release:**
- Cron dzienny horoskop: przy wzroście bazy emaili wymagany podział na batche
- Jakość AI outputu wymaga regularnej walidacji po każdej zmianie promptów

**Następny focus:** retencja (push notifications, streak), dopracowanie onboardingu, monitoring konwersji.

---

### [2026-06-03] Rozszerzenie dokumentu statusowego
- Rozbudowano dokument o pełny opis core funkcji (natal i child) jako filarów produktu.
- Dodano priorytety release, definicję „release gotowy" oraz KPI.
- Urealniono sekcje stanu technicznego i ryzyk.

---

## Definicja „release gotowy"
1. Natal i Child przechodzą testy manualne bez regresji.
2. Brak nowych błędów 5xx na głównych endpointach AI.
3. Główne flow działają end-to-end: rejestracja → kosmogram → daily → match.
4. Ten dokument zaktualizowany.
