# PROGRESS.md — Dziennik postępu Cosmogram

---

## Dzień 7 (2026-05-20)

### Co zrobione

- **PWA**: `public/manifest.json`, ikony 192px i 512px (rsvg-convert z SVG), `public/sw.js` (cache + offline fallback + push notifications skeleton), rejestracja SW w layout
- **Offline page**: `/offline` — ładna strona gdy brak internetu
- **PostHog analytics**: zainstalowany `posthog-js`, `PostHogProvider` (nie inicjalizuje gdy placeholder lub brak klucza), tracking events: `signup`, `first_natal_view`, `first_match`, `first_chat`, `trial_started`
- **Identify users**: po `SIGNED_IN` wywołuje `posthog.identify(userId)`
- **Waitlist API**: `/api/waitlist` — zapisuje do tabeli `waitlist` w Supabase (z graceful fallback jeśli tabela nie istnieje), podpięte do formularza na landing
- **Layout**: `lang="pl"`, PWA metadata, apple-web-app, ikony, SW registration script

### Decyzje techniczne

- Playwright E2E pominięty na Day 7 — za czasochłonny dla soft launcha do 10 znajomych. Dobry kandydat na tydzień 2.
- Service worker: strategia network-first (nie cache-first) żeby AI responses zawsze świeże. Cache tylko nawigacje.
- PostHog: używa EU endpoint (`eu.i.posthog.com`) dla GDPR
- Track tylko kluczowe konwersje funnel, nie każde kliknięcie

### Do zrobienia przed launch (lista dla Maca)

1. **Stripe**: uzupełnij w `.env.local`:
   - `STRIPE_SECRET_KEY` — z dashboard.stripe.com → Developers → API keys
   - `STRIPE_PRICE_MONTHLY` i `STRIPE_PRICE_YEARLY` — ID cen produktu Cosmogram Plus
   - `STRIPE_WEBHOOK_SECRET` — z `stripe listen --forward-to localhost:3000/api/stripe-webhook` (lokalnie) lub Stripe Dashboard webhook (prod)

2. **PostHog**: uzupełnij `NEXT_PUBLIC_POSTHOG_KEY` — z app.posthog.com → Settings → Project API key

3. **SQL w Supabase** — uruchom jeśli tabele nie istnieją:

```sql
-- Tabela waitlist
create table if not exists waitlist (
  email text primary key,
  created_at timestamptz default now()
);

-- Tabela subscriptions
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status text not null default 'free',
  price_id text,
  cancel_at_period_end boolean default false,
  cancel_at timestamptz,
  current_period_end timestamptz,
  updated_at timestamptz default now(),
  unique(user_id)
);

-- Tabela conversations (chat)
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null default 'Nowa rozmowa',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabela messages (chat)
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

-- RLS
alter table waitlist enable row level security;
alter table subscriptions enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;

-- Policies subscriptions
create policy "Users read own subscription" on subscriptions for select using (auth.uid() = user_id);
create policy "Service role manages subscriptions" on subscriptions for all using (auth.role() = 'service_role');

-- Policies conversations
create policy "Users CRUD own conversations" on conversations for all using (auth.uid() = user_id);

-- Policies messages (through conversation ownership)
create policy "Users CRUD messages in own conversations" on messages for all
  using (exists (select 1 from conversations c where c.id = messages.conversation_id and c.user_id = auth.uid()));
create policy "Service role manages messages" on messages for all using (auth.role() = 'service_role');
```

4. **Stripe Customer Portal**: włącz w Stripe Dashboard → Billing → Customer portal → Activate

5. **Vercel**: ustaw wszystkie env vars (te same co `.env.local`, ale `NEXT_PUBLIC_APP_URL` zmień na prod URL)

6. **Soft launch**: dodaj 5-10 znajomych przez Stripe coupon (100% off, limited redemptions)

### Problemy / uwagi

- `currentPeriodEnd` w Settings zawsze `null` — kolumna `current_period_end` nie jest zapisywana przez webhook (używamy `cancel_at`). Do poprawy w tygodniu 2, nie krytyczne.
- Paywall dla dzieci wyłączony celowo — Mac decyduje kiedy włączyć

---

## Dni 1-6 (2026-05-18 – 2026-05-19)

### Co zrobione (podsumowanie)

- **Dzień 1-2**: scaffold Next.js 16 + Supabase Auth + landing page + generowanie kosmogramu (`/generate`) z obliczeniami natury (astronomy-engine), interpretacją AI (Claude Sonnet 4.6), codziennym odczytem
- **Dzień 3**: historia kosmogramów, zapis do Supabase, HistorySelector
- **Dzień 4**: Astro Match (synastria) — `/astro-match`, obliczenia dwóch kart, AI kompatybilność (4 kategorie + score), zapis historii matchów
- **Dzień 5**: Chat — `/chat`, konwersacje + wiadomości, kontekst natury w każdej odpowiedzi, starter questions, PaywallModal po 3 wiadomościach
- **Dzień 6**: Stripe Checkout Sessions, webhook handler, PaywallModal (29zł/mc i 290zł/rok, 7-day trial), Settings page (konto + zmiana hasła + subskrypcja), Navbar z wszystkimi linkami
- Horoscop dziecka — `/children`, generowanie interpretacji dla dzieci przez AI
- Resend emails — pominięte celowo (decyzja Maca)
