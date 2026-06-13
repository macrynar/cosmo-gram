-- Week and year AI interpretation cache tables
-- week_interpretations: generated on-demand, cached per (reading_id, iso_week)
create table if not exists week_interpretations (
  id            bigserial primary key,
  user_id       uuid        not null references auth.users(id) on delete cascade,
  reading_id    uuid        not null references readings(id) on delete cascade,
  iso_week      text        not null,  -- e.g. "2026-W24"
  content       text        not null,
  transits_used jsonb       not null default '[]',
  prompt_version text       not null default '1',
  model         text        not null default 'claude-haiku-4-5-20251001',
  created_at    timestamptz not null default now(),
  unique (reading_id, iso_week)
);

create index if not exists week_interpretations_reading_idx
  on week_interpretations (reading_id, iso_week desc);

alter table week_interpretations enable row level security;

create policy "users read own week interpretations"
  on week_interpretations for select
  using (auth.uid() = user_id);

create policy "users insert own week interpretations"
  on week_interpretations for insert
  with check (auth.uid() = user_id);

-- year_interpretations: generated once per (reading_id, year)
create table if not exists year_interpretations (
  id            bigserial primary key,
  user_id       uuid        not null references auth.users(id) on delete cascade,
  reading_id    uuid        not null references readings(id) on delete cascade,
  year          integer     not null,
  content       text        not null,
  seasons_used  jsonb       not null default '[]',  -- transit_keys of seasons at generation time
  prompt_version text       not null default '1',
  model         text        not null default 'claude-haiku-4-5-20251001',
  created_at    timestamptz not null default now(),
  unique (reading_id, year)
);

create index if not exists year_interpretations_reading_idx
  on year_interpretations (reading_id, year desc);

alter table year_interpretations enable row level security;

create policy "users read own year interpretations"
  on year_interpretations for select
  using (auth.uid() = user_id);

create policy "users insert own year interpretations"
  on year_interpretations for insert
  with check (auth.uid() = user_id);

-- Add reading_id to day_interpretations (was missing in original migration)
alter table day_interpretations
  add column if not exists reading_id uuid references readings(id) on delete cascade;

create index if not exists day_interpretations_reading_date_idx
  on day_interpretations (reading_id, date desc);
