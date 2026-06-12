-- AI-generated season names/descriptions — one row per (user_id, reading_id, transit_key, phase)
-- Cache invalidated when phase changes (cron daily).
create table if not exists seasons (
  id           bigserial primary key,
  user_id      uuid        not null references auth.users(id) on delete cascade,
  reading_id   uuid        not null references readings(id) on delete cascade,
  transit_key  text        not null,  -- "${planet}-${aspect}-${natalPoint}"
  phase        text        not null,  -- "początek" | "środek" | "domykanie"
  name         text        not null,  -- AI-generated season name
  paragraph    text        not null,  -- AI-generated one-paragraph meaning
  generated_at timestamptz not null default now(),
  unique (reading_id, transit_key, phase)
);

create index if not exists seasons_reading_idx
  on seasons (reading_id, transit_key);

alter table seasons enable row level security;

create policy "users read own seasons"
  on seasons for select
  using (auth.uid() = user_id);

-- Also add reading_id to monthly_summaries for correct per-reading caching
alter table monthly_summaries
  add column if not exists reading_id uuid references readings(id) on delete cascade;

-- Drop old unique constraint (user_id, year, month) and replace with reading-aware one
alter table monthly_summaries
  drop constraint if exists monthly_summaries_user_id_year_month_key;

alter table monthly_summaries
  add constraint monthly_summaries_reading_ym_key
  unique (reading_id, year, month);
