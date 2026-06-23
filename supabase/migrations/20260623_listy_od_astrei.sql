-- Listy od Astrei — model danych (Faza 1)
-- Tabele: astrea_letter_templates (katalog, admin-only), user_letters (instancje, owner-only),
--         inbox_items (uniwersalna skrzynka, owner-only), letter_purchases (raporty one-time, owner-only).
-- Treści Listów i Raportów = najwrażliwsze dane (tematy egzystencjalne) → RLS owner-only + test negatywny.
-- service_role (supabaseAdmin) omija RLS — cron/generacja/webhook piszą przez niego.
-- Bezpieczne do ponownego uruchomienia (IF NOT EXISTS / DROP POLICY IF EXISTS).

-- ─── 1. KATALOG — astrea_letter_templates (zarządzany jak prompt_versions: admin-only) ───
create table if not exists astrea_letter_templates (
  id               uuid        primary key default gen_random_uuid(),
  slug             text        not null unique,
  title            text        not null,
  theme            text        not null,
  placement_inputs jsonb       not null default '{}'::jsonb,   -- które punkty kosmogramu zasilają prompt
  trigger_type     text        not null default 'time' check (trigger_type in ('time','event')),
  trigger_value    jsonb       not null default '{}'::jsonb,   -- time: {"days_from_natal":5}; event: {"condition":"solar_return"}
  tier             text        not null check (tier in ('free','premium','one_time')),
  kind             text        not null default 'letter' check (kind in ('letter','report')),
  wellbeing_level  text        not null default 'standard' check (wellbeing_level in ('standard','delikatny')),
  prompt_slug      text        not null,                       -- → prompt_versions.prompt_name
  word_min         int         not null default 250,
  word_max         int         not null default 450,
  sort_order       int         not null default 0,
  is_active        boolean     not null default true,
  created_at       timestamptz not null default now()
);

create index if not exists idx_letter_templates_active
  on astrea_letter_templates(is_active, kind, sort_order);

-- ─── 2. INSTANCJE — user_letters (owner-only) ───
create table if not exists user_letters (
  id                 uuid        primary key default gen_random_uuid(),
  user_id            uuid        not null references auth.users(id) on delete cascade,
  letter_slug        text        not null references astrea_letter_templates(slug) on update cascade,
  status             text        not null default 'scheduled' check (status in ('scheduled','generated','delivered','read')),
  content_md         text,
  placement_snapshot jsonb,
  prompt_version_id  uuid        references prompt_versions(id),
  ai_prompt_version  text,                                     -- snapshot wersji (anti-pattern: zawsze wersjonować)
  model              text,
  source             text        not null default 'drip' check (source in ('drip','one_time_purchase')),
  deliver_at         timestamptz,                              -- kiedy ma trafić do skrzynki (drip: dzień „due")
  generated_at       timestamptz,
  delivered_at       timestamptz,
  read_at            timestamptz,
  created_at         timestamptz not null default now()
);

-- Idempotencja dripu: jeden list danego szablonu na usera.
-- Raporty one-time mogą się powtarzać (np. Prognoza roczna co rok) → poza ograniczeniem.
create unique index if not exists uq_user_letters_drip
  on user_letters(user_id, letter_slug)
  where source = 'drip';

create index if not exists idx_user_letters_user on user_letters(user_id, created_at desc);
create index if not exists idx_user_letters_due
  on user_letters(status, deliver_at) where status in ('scheduled','generated');

-- ─── 3. SKRZYNKA — inbox_items (owner-only) ───
create table if not exists inbox_items (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  type         text        not null check (type in ('letter','report','announcement','system','forecast')),
  ref_id       uuid,                                           -- letter/report → user_letters.id
  title        text        not null,
  preview      text,
  read_at      timestamptz,
  delivered_at timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists idx_inbox_user   on inbox_items(user_id, created_at desc);
create index if not exists idx_inbox_unread on inbox_items(user_id) where read_at is null;

-- ─── 4. RAPORTY ONE-TIME — letter_purchases (owner-only; flow Stripe w P1/Faza 7) ───
-- Wzór ledgera chat_credit_transactions: unikalny stripe_session_id = idempotencja webhooka.
create table if not exists letter_purchases (
  id                    uuid        primary key default gen_random_uuid(),
  user_id               uuid        not null references auth.users(id) on delete cascade,
  report_slug           text        not null,
  stripe_session_id     text        unique,
  stripe_payment_intent text,
  amount_total          int,                                   -- grosze (Stripe amount_total)
  currency              text        default 'pln',
  user_letter_id        uuid        references user_letters(id),
  created_at            timestamptz not null default now()
);

create index if not exists idx_letter_purchases_user on letter_purchases(user_id, created_at desc);

-- ─── 5. Opt-out maili z listami ───
alter table user_preferences
  add column if not exists email_letters boolean not null default true;

-- ─── 6. RLS ───
-- 6a. Katalog — admin-only (jak prompt_versions). Aplikacja czyta katalog przez service_role.
alter table astrea_letter_templates enable row level security;
drop policy if exists admin_only_letter_templates on astrea_letter_templates;
create policy admin_only_letter_templates on astrea_letter_templates for all
  using (exists (select 1 from admin_users where user_id = auth.uid()));

-- 6b. user_letters — właściciel CZYTA; mutacje (generacja, status) tylko przez service_role.
alter table user_letters enable row level security;
drop policy if exists users_read_own_letters on user_letters;
create policy users_read_own_letters on user_letters for select
  using (auth.uid() = user_id);

-- 6c. inbox_items — właściciel CZYTA; insert/update(read_at)/delete tylko przez service_role (API).
alter table inbox_items enable row level security;
drop policy if exists users_read_own_inbox on inbox_items;
create policy users_read_own_inbox on inbox_items for select
  using (auth.uid() = user_id);

-- 6d. letter_purchases — właściciel CZYTA; zapis przez webhook (service_role).
alter table letter_purchases enable row level security;
drop policy if exists users_read_own_letter_purchases on letter_purchases;
create policy users_read_own_letter_purchases on letter_purchases for select
  using (auth.uid() = user_id);
