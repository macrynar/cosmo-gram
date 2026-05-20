---
title: Cosmogram - Vibe Coding Cheat Sheet
created: 2026-05-18
project: cosmogram
type: dev-docs
---

# Vibe Coding Cheat Sheet - Cosmogram

> Krótki dokument dla Cursora / Lovable / Claude Code. Pełna specyfikacja: `2026-05-18-spec-v1.md`. Prompty AI: `prompts-v1.md`.

---

## Tech stack (decisions made, don't re-litigate)

```
Frontend:   React 18 + Vite 5 + TypeScript + Tailwind 3 + shadcn/ui
            React Router v6, Zustand (state), TanStack Query (server state)
            PWA - service worker + manifest, Web Push API
            
Backend:    Supabase (Postgres + Auth + Edge Functions Deno + Storage)
            No custom server. Edge functions dla AI calls i astro compute.

AI:         Anthropic Claude Sonnet 4.6 (primary)
            OpenAI GPT-4o (fallback)
            Wszystko przez edge function - API keys NEVER w frontend.
            
Astro:      Swiss Ephemeris przez swisseph-wasm (browser) lub 
            pyswisseph (Python edge function jeśli WASM za wolne)
            
Geocoding:  Google Places API (autocomplete + lat/lon + tz)
            Cache results w `geocoded_places` table.

Payments:   Stripe Subscriptions + Stripe Checkout + Stripe Tax
            Webhook do Supabase edge function dla status sync.
            
Analytics:  PostHog (free tier, 1M events/mc)
Email:      Resend (transactional)
Hosting:    Vercel (frontend) + Supabase (backend)
```

---

## Folder structure (monorepo lub single-repo)

Wariant single-repo (rekomendacja dla MVP solo):

```
cosmogram/
├── apps/
│   └── web/                    # React app
│       ├── src/
│       │   ├── components/
│       │   ├── pages/          # routes
│       │   ├── hooks/
│       │   ├── lib/
│       │   ├── types/
│       │   └── styles/
│       ├── public/
│       │   ├── manifest.json   # PWA manifest
│       │   └── sw.js           # service worker
│       └── vite.config.ts
├── supabase/
│   ├── functions/              # Edge functions (Deno)
│   │   ├── astro-compute/      # chart generation
│   │   ├── ai-natal/           # natal interpretation
│   │   ├── ai-daily/           # daily reading
│   │   ├── ai-synastry/        # astro-match
│   │   └── stripe-webhook/     # subscription events
│   ├── migrations/             # SQL migrations
│   └── seed.sql
├── packages/
│   ├── shared/                 # shared TS types between frontend and edge functions
│   │   ├── types/              # Chart, Reading, User types
│   │   └── astro/              # chart computation logic if shared
│   └── prompts/                # AI prompt templates (single source of truth)
│       ├── system-base.md
│       ├── natal-v1.md
│       ├── daily-v1.md
│       └── synastry-v1.md
├── docs/
│   └── spec.md                 # → link do 2026-05-18-spec-v1.md
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/                    # Playwright
├── .env.example
├── package.json
└── README.md                   # link do speca + setup instructions
```

---

## Naming conventions

- **Komponenty React:** PascalCase (`NatalChartView.tsx`)
- **Hooki:** `useThing` (`useNatalChart.ts`)
- **Edge functions:** kebab-case folders (`ai-natal/`)
- **DB tables:** snake_case (`birth_data`, `readings`)
- **DB columns:** snake_case (`birth_date`, `ai_prompt_version`)
- **TS types:** PascalCase (`type BirthData = ...`)
- **Env vars:** SCREAMING_SNAKE_CASE (`ANTHROPIC_API_KEY`)
- **Routes:** kebab-case (`/astro-match`, `/daily-reading`)
- **CSS:** Tailwind utility-first, custom classes tylko w `globals.css`

---

## Environment variables (wszystkie wymagane)

```env
# Supabase (public, OK w frontend)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Supabase service role (TYLKO w edge functions, NIGDY frontend)
SUPABASE_SERVICE_ROLE_KEY=

# AI (TYLKO edge functions)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Geocoding (frontend, restricted by HTTP referrer)
VITE_GOOGLE_PLACES_API_KEY=

# Stripe
STRIPE_SECRET_KEY=           # edge functions only
STRIPE_WEBHOOK_SECRET=       # edge functions only
VITE_STRIPE_PUBLISHABLE_KEY= # frontend OK

# Analytics
VITE_POSTHOG_KEY=
VITE_POSTHOG_HOST=

# Email
RESEND_API_KEY=              # edge functions only
```

---

## Cursor / Claude Code - starter prompts

### Pierwsza sesja: setup
```
Read docs/spec.md. We're building Cosmogram - astrology + AI app for Polish market.

Today's task: scaffold the project.
1. Init Vite + React + TS in apps/web
2. Configure Tailwind + shadcn/ui (init shadcn)
3. Set up React Router with placeholders for /, /onboarding, /dashboard, /astro-match, /settings
4. Add Supabase client wrapper in src/lib/supabase.ts
5. Add Zustand store skeleton in src/lib/store.ts
6. Set up .env.example with all keys from docs/spec.md section 12

Constraints:
- No SSR (we're PWA only)
- Mobile-first design
- TypeScript strict mode
- All copy in Polish

Don't generate placeholder content - leave routes empty for now.
```

### Sesja: onboarding flow
```
Read docs/spec.md sections 4.F1 and 4.F2. Read prompts-v1.md section 1 (system base).

Build: onboarding flow at /onboarding
- Step 1: birth date picker (date-fns, allow 1900-today only)
- Step 2: birth place autocomplete (Google Places API, restrict to "cities")
  - Use VITE_GOOGLE_PLACES_API_KEY
  - On select, store: place_name, lat, lon, timezone (from place_details)
- Step 3: birth time
  - HH:MM picker
  - Big "Nie znam godziny" button below
  - If "Nie znam" → set birth_time = null, birth_time_unknown = true
- Step 4 (only if not signed in): email/Google signup
- Submit: save to birth_data table, redirect to /dashboard

Validation:
- date required, not in future
- place required (must have lat/lon from Google)
- time optional

Show progress indicator (1/3, 2/3, 3/3).
After submit, show loading state ("Generujemy Twój kosmogram...") with rotating astro trivia.
Trigger edge function `astro-compute` then `ai-natal` (chain).
```

### Sesja: natal interpretation prompt
```
Read prompts-v1.md sections 1 and 2.

Build: supabase/functions/ai-natal edge function.

Input (POST body): { birth_data_id: string }
Steps:
1. Auth check (Bearer token, verify user_id owns birth_data_id)
2. Fetch birth_data + chart (from charts table - should be precomputed by astro-compute)
3. Determine user tier (paid → full natal prompt #2, free → teaser prompt #3, no birth time → fallback #6)
4. Load prompt from packages/prompts/ - inline as string for now (later: from DB)
5. Call Anthropic API with system prompt #1 + user prompt #2/#3/#6
6. Store result in readings table with ai_prompt_version = "natal-v1.0"
7. Return { reading_id, text }

Error handling:
- AI timeout → retry once with GPT-4o
- Both fail → return error, frontend shows "spróbuj ponownie"

Logging:
- token_count_in, token_count_out, cost_usd → readings table
- PostHog event: "natal_generated" with prompt_version
```

---

## Critical implementation order (MVP, W4-W12)

### Sprint 1 (W4-W5): Foundation
- Repo setup, deploy to Vercel + Supabase
- Auth (email magic link + Google OAuth via Supabase Auth)
- Onboarding flow F1 + F2 (form, NO API yet)
- DB migrations: users, birth_data, charts, readings, subscriptions

### Sprint 2 (W6-W7): Astro engine + natal
- `astro-compute` edge function - chart generation
- Validate: spot-check 10 charts vs Astro.com (must match to 0.1°)
- Natal chart visualization component (round chart, planets, aspects lines)
- `ai-natal` edge function - calls Claude with prompts
- F1 onboarding → chart → interpretation working end-to-end

### Sprint 3 (W8-W9): Daily reading + retention
- Transit computation (today's positions vs natal)
- `ai-daily` edge function with cache (1x/dzień per user)
- Daily reading UI - landing on app open
- Web Push notification setup (PWA installed)
- PostHog instrumentation for funnel: onboard → first daily → 3-day return

### Sprint 4 (W10-W11): Astro-Match
- "Add partner" flow (form for partner's birth data)
- Synastry computation (aspects between two charts)
- `ai-synastry` edge function
- Match results UI (compatibility score gamified, 4 categories)

### Sprint 5 (W12): Monetization + launch
- Stripe Subscriptions + Checkout + webhook
- Paywall on daily/match after trial
- 7-day trial logic
- Email: trial reminders, payment receipts (Resend)
- Pricing page + landing copy
- Soft launch to waitlist (50-100 emails)

---

## Test commands (assumed setup)

```bash
# unit + integration
pnpm test

# e2e (Playwright)
pnpm test:e2e

# prompt eval (custom script reading from golden set)
pnpm eval:prompts

# load test edge functions
pnpm test:load
```

---

## Performance targets

- Onboarding load → first chart: <15s (10s astro compute + 5s AI gen)
- Daily reading load: <3s (cached) or <10s (fresh gen)
- TTI dashboard: <2s
- Lighthouse PWA score: >90

---

## Anti-patterns (don't do these)

- ❌ Storing API keys in frontend env (only `VITE_*` public ones)
- ❌ Making AI calls from frontend directly (always edge function)
- ❌ Calling AI on every page load (cache aggressively)
- ❌ Showing AI raw output without markdown rendering (`react-markdown`)
- ❌ Generating same daily reading twice in 24h (check cache first)
- ❌ Hardcoding prompts in code (use `packages/prompts/` files)
- ❌ Skipping prompt version tag (always include `ai_prompt_version` in readings)
- ❌ "RAG" architecture for chatbot (it's structured prompting, not retrieval)
- ❌ SSR / server components (this is a PWA, client-rendered)

---

## When stuck / debugging

- AI returns garbage → check prompt version, run through golden set, escalate to Mac/koleżanka
- Astro compute mismatch → log raw ephemeris output, compare with Astro.com manually
- Stripe webhook fails silently → check Stripe dashboard webhook logs + Supabase function logs
- PWA install prompt missing → Lighthouse check, verify manifest.json + service worker
- Push notification not delivered iOS → confirmed only works on PWA-installed (Add to Home Screen), iOS 16.4+
