---
title: Cosmogram — Project Status
type: project-status
owner: Mac
last_updated: 2026-06-23
---

# Cosmogram — dokument statusu projektu

Cosmogram to mobilna aplikacja AI + astrologia dla rynku polskiego, zbudowana jako PWA. Łączy kosmogram urodzeniowy, kalendarz tranzytów, dopasowanie relacyjne i chat astrologiczny, a monetyzacja opiera się o subskrypcję premium (Stripe) oraz retencję przez codzienne treści i email.

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

## Wdrożone funkcje (stan na 2026-06-14)

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

## Model biznesowy — cennik i limity (finalny, 2026-06-25)

Decyzje zatwierdzone przez Maca. Pełny model kosztowo-marżowy (interaktywny, z formułami): `docs/Cosmogram_model_biznesowy.xlsx`. Stan: **zdecydowane, wdrożenie pending** — spec w `docs/IMPLEMENTACJA-cennik-limity-PROMPT.md`.

### Cennik

| Plan | Cena | Uwaga |
|---|---|---|
| Premium miesięczny | **24,99 zł / mc** | headline (z 19,99) |
| Premium roczny | **199 zł / rok** (~16,58/mc, ~33% taniej) | lewar retencji P0 + cash upfront |
| Paczka czatu Small | **12,99 zł** / 50 wiad. | z 9,99 (zbyt niska marża) |
| Paczka czatu Medium | **34,99 zł** / 150 wiad. | z 24,99 (było stratne i podcinało sub) |
| Paczka czatu Large | **199 zł** / 500 wiad. | bez zmian |

Marża blended po kosztach AI: **~80%** (mc) / **~71%** (rok). Kontekst rynkowy: Nebula ~$25 USD/mc, Co-Star ~$15 USD — Cosmogram 2–4× tańszy. Bez triala (free ma sam łapać hooka).

### Zasada freemium: free = CZĘŚCIOWY WOW interpretacji

Free dostaje prawdziwą interpretację AI, ale część (3/8). Surowe dane bez interpretacji = słaby hook. Płatny payload jest generowany i gatowany po stronie serwera (nie „generuj pełne i schowaj").

| Funkcja | FREE | PREMIUM |
|---|---|---|
| Kosmogram dorosłego | 1 karta własna, **3/8 modułów** (Rdzeń, Supermoce, Dziecko) + share | pełne 8 modułów (Miłość, Kariera, Cienie, Korzenie, Cel) + cudze karty, do **5/mc** |
| Kosmogram dziecka | **2/6 modułów** (kim jest + potrzeby emocjonalne) | pełne 6 modułów, biblioteka, do **5/mc** |
| Cosmo Match | 1 match, **3/8 modułów** (Ogólne, Chemia, Komunikacja) | pełne 8 + czat o relacji, do **5/mc**; zablokowane: Wyzwania, Trwałość, Przeznaczenie |
| Cosmo Chat | 3 wiadomości łącznie → ściana | **50/mc** (z 150) + paczki top-up |
| Kalendarz (interpr. dnia) | siatka + klasy dni + 1 teaser | bez limitu (fair-use 60/mc) + Dni Mocy + tydz./mc/rok |
| Listy od Astrei | 1 list teaser → ściana | drip 1/tydzień + e-mail + skrzynka |
| Horoskop dnia (e-mail) | opt-in wg znaku (per-znak ≈ $0) | + nagłówek personalny |

### Capy anty-abuse (premium /mc)

Natal / dziecko / match: **5/mc każdy**, liczone od **utworzeń** (nie aktywnych rekordów — inaczej delete+add omija limit). Czat: 50/mc + paczki. Koszt free usera ograniczony do ~$0,26 one-time (limit serwerowy 1× każdy + rate-limit signup). Przy pełnym abuse (5/5/5) marża wciąż dodatnia (~+6%).

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

### [2026-06-26] Profesjonalny link aktywacyjny na własnej domenie (token_hash)

Link w mailu potwierdzającym rejestrację prowadzi teraz na `www.cosmo-gram.com`,
nie na `*.supabase.co` — **bez** płatnego Custom Domain.

- **Mechanizm:** szablon maila kieruje na `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup`, a `src/app/auth/callback/page.tsx` wymienia token na sesję przez `verifyOtp` (przed fallbackiem `getSession`), po czym leci cała istniejąca logika (welcome-mail dla `signup`, bramka RODO, pending-chart cross-device).
- **Open-redirect guard** na parametrze `redirect` (tylko ścieżki wewnętrzne `/...`).
- **Konfiguracja Supabase (ręczna):** Site URL = `https://www.cosmo-gram.com`; szablon „Confirm signup" przepięty na `token_hash`. Recovery/Magic Link NIE ruszane (recovery wymaga osobnej strony „ustaw nowe hasło" — przyszły task).
- **Custom Domain ($10/mc)** zostaje potrzebny już tylko dla ekranu zgody Google OAuth. Szczegóły: `docs/supabase-custom-domain.md`.

### [2026-06-25] Finalny model biznesowy — cennik, freemium, limity (DECYZJA, wdrożenie pending)

Domknięto model monetyzacji (szczegóły: sekcja „Model biznesowy" wyżej + `docs/Cosmogram_model_biznesowy.xlsx`).

- **Cennik zatwierdzony:** 24,99 zł/mc + 199 zł/rok; paczki czatu do przeceny (12,99 / 34,99 / 199). Bez triala.
- **Freemium = częściowy wow:** natal 3/8, match 3/8, dziecko 2/6 modułów interpretacji za darmo; reszta płatna i gatowana serwerowo.
- **Limity:** czat 50/mc (z 150) + paczki; natal/dziecko/match 5/mc (od utworzeń, delete-proof).
- **Znalezione leaki (do naprawy):** `/api/astro-match` generuje pełne 8 modułów ($0,10) dla free bez limitu; `/api/ai-child` bez gatowania subskrypcji i limitu. Fix: generuj tylko wolne moduły + premium-gate + limit serwerowy.
- **Marża:** blended ~80% (mc) / ~71% (rok); koszt free usera ograniczony ~$0,26 one-time.
- **Spec wdrożeniowy dla Claude Code:** `docs/IMPLEMENTACJA-cennik-limity-PROMPT.md`.

### [2026-06-12 → 2026-06-14] Stabilizacja po redesignach + polish UX

**Najważniejsze zmiany produktowe:**
- Match (P1.2): duży redesign doświadczenia synastrii (hero bond, SynastryWheel, 5 wymiarów, redesign kart kategorii, animacje reveal, OG image), przejście modelu na Sonnet 4.6, lepsze surfowanie błędów AI i logi diagnostyczne.
- Chat (P1.5): redesign Astrea (animacje, czystszy input, stabilne openery), pamięć sesji i kontekst tranzytów, poprawka parsera odpowiedzi JSON (naprawa przypadku z raw JSON przez nieucieczony newline).
- Kalendarz/Prognoza (P1.4): wieloetapowy redesign warstwy prognozy (koło roku, 4 poziomy zoomu, przełącznik horyzontu, warstwa języka PL, odczyty per okres, caching, CTA i jakościowe poprawki UX), plus spójność nagłówków i ikon oraz fixy stanów ładowania.
- Kosmogram natalny: redesign jakościowy kart i modułów, poprawki layoutu, source chips, partial failure handling, dopracowanie koła natalnego i aspektów.
- Kosmogram dziecka: wersja modułów v2 (6 modułów), portrety w HistorySelector, poprawki avatarów, kompatybilność starego formatu odpowiedzi i zwiększenie limitów AI (`max_tokens` 7000, `maxDuration` 180s).
- Landing: wdrożenie Landing v2 (HeroSky + NatalWheelDemo + sekcje DS), poprawki mobile (hamburger, responsywność featured card, animacje i reveal/parallax koła).
- Ustawienia: redesign strony ustawień zgodny z design systemem + afordancje UX (kopiowanie ID, live hasło, usprawnienie wylogowania).
- Email: dodane logo do maili powitalnych (`public/email/logo-cosmogram.png`).

**Najważniejsze poprawki techniczne i testowe:**
- Naprawa konwersji lokalnego czasu na UTC i pakiet testów regresji dla offsetów/stref czasowych.
- Walidacje promptu i limitów wejścia w Match (m.in. zakaz cyrylicy w promptach, limity długości).
- Drobne poprawki responsive/UI: 1 kolumna na mobile w Match, fix podkreślenia aktywnych tabów, usunięcie zdublowanych nagłówków, poprawa akcji usuwania z potwierdzeniem.

**Efekt biznesowy tego etapu:**
- Lepsza czytelność i „wow factor" modułów premium (Match, Chat, Prognoza), mniej błędów prezentacji odpowiedzi AI, wyższa gotowość produktu do dalszych testów retencji i konwersji.

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

### [2026-06-23] Listy od Astrei — P0 (Fazy 1–5) NA PRODUKCJI

Nowy mechanizm retencji premium (North Star: retencja płatnych 30 dni) — **wdrożony na produkcji**. Astrea pisze dawkowane listy odsłaniające warstwy kosmogramu; free teaser „Twoja misja" → ściana → premium drip. Silnik gotowy też pod Raporty (P1). Szczegóły i weryfikacja: `docs/LISTY-VERIFY.md`.

- **Wdrożenie:** PR #52 → main (merge `e0d5297`), Vercel deploy OK, smoke test prod (`/api/inbox`, `/api/letters` → 401). Migracje na prodzie. CI Listów zielone (Build/Lint/Typecheck/Unit/Vercel); E2E i Security audit czerwone **pre-existing** (już czerwone na main — flaky E2E + `npm audit` na `@babel`/`@opentelemetry`, do osobnego sprzątnięcia).
- **Co żyje:** free teaser przy każdej generacji kosmogramu; cron `letters-drip` (Vercel, 04:00 UTC) dawkuje płatnikom (1/tydzień, pre-gen 24–48 h); skrzynka in-app (koperta z badge, drawer/sheet, czytnik); maile „Wiadomość od Astrei: Oto …" (Resend, open-loop, opt-out).
- **Jakość/bezpieczeństwo:** Sonnet + korekta gender-neutral (Haiku) + walidacja (długość, predykcje, żargon, forma rodzajowa); generacja raz + cache. RLS owner-only + test negatywny; treść nigdy w `ai_call_logs`. 336 testów zielone.
- **Metryki (PostHog, od launchu):** `inbox_opened`, `letter_opened`, `letter_email_clicked`, `letter_paywall_hit` (klient), `letter_delivered` (serwer).
- **Odroczone:** Faza 6 (listy eventowe z `transits.ts`), Faza 7 (raporty + Stripe one-time; tabela `letter_purchases` gotowa), Faza 8 (golden testy per szablon, E2E pod `AI_MOCK`), `report_purchased/opened`, wzmianka o liście w mailu tygodniowym.
- **TODO Maca:** polityka prywatności (treści egzystencjalne), ceny raportów (test 49 zł / 99 zł pakiet), kontrola jakości treści (poza Claude), ostateczny zestaw MVP, ew. „Wiadomość" vs „List" w temacie maila.

---

## Definicja „release gotowy"
1. Natal i Child przechodzą testy manualne bez regresji.
2. Brak nowych błędów 5xx na głównych endpointach AI.
3. Główne flow działają end-to-end: rejestracja → kosmogram → daily → match.
4. Ten dokument zaktualizowany.
