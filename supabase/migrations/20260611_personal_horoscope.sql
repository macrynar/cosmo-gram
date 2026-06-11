-- Daily personal horoscopes (premium) — generated nightly by cron batch
create table if not exists daily_personal_horoscopes (
  id            bigserial primary key,
  user_id       uuid        not null references auth.users(id) on delete cascade,
  date          date        not null,
  headline      text        not null,
  main          text        not null,
  reflection    text        not null,
  weather_intensity smallint not null check (weather_intensity between 1 and 5),
  weather_element text      not null,
  weather_character text    not null,
  transits_used jsonb       not null default '[]',
  prompt_version text       not null default 'v1',
  model         text        not null default 'claude-haiku-4-5-20251001',
  created_at    timestamptz not null default now(),
  unique (user_id, date)
);

create index if not exists daily_personal_horoscopes_user_date_idx
  on daily_personal_horoscopes (user_id, date desc);

alter table daily_personal_horoscopes enable row level security;

create policy "users read own horoscopes"
  on daily_personal_horoscopes for select
  using (auth.uid() = user_id);

-- Personal power days cache — recalculated monthly
create table if not exists personal_power_days (
  id         bigserial primary key,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  month      text        not null, -- "2026-06"
  days       jsonb       not null, -- array of { date, score, topTransit }
  created_at timestamptz not null default now(),
  unique (user_id, month)
);

create index if not exists personal_power_days_user_month_idx
  on personal_power_days (user_id, month);

alter table personal_power_days enable row level security;

create policy "users read own power days"
  on personal_power_days for select
  using (auth.uid() = user_id);

-- Power day explanations cache — generated on demand (haiku), never regenerated
create table if not exists power_day_explanations (
  id         bigserial primary key,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  date       date        not null,
  content    text        not null,
  transit    jsonb       not null, -- the transit that makes it a power day
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

alter table power_day_explanations enable row level security;

create policy "users read own explanations"
  on power_day_explanations for select
  using (auth.uid() = user_id);
