-- AI-generated day interpretations cache — generated on demand for "significant" days
-- Separate from calendar_notes (user-written) and daily_personal_horoscopes (power/exceptional days)
create table if not exists day_interpretations (
  id            bigserial primary key,
  user_id       uuid        not null references auth.users(id) on delete cascade,
  date          date        not null,
  content       text        not null,
  day_class     text        not null check (day_class in ('exceptional','power','significant')),
  transits_used jsonb       not null default '[]',
  model         text        not null default 'claude-haiku-4-5-20251001',
  created_at    timestamptz not null default now(),
  unique (user_id, date)
);

create index if not exists day_interpretations_user_date_idx
  on day_interpretations (user_id, date desc);

alter table day_interpretations enable row level security;

create policy "users read own interpretations"
  on day_interpretations for select
  using (auth.uid() = user_id);
