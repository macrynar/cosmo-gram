-- AI-generated monthly summaries per premium user
-- One row per (user_id, year, month), regenerated when month changes.
create table if not exists monthly_summaries (
  id           bigserial primary key,
  user_id      uuid        not null references auth.users(id) on delete cascade,
  year         int         not null,
  month        int         not null,
  windows_json jsonb       not null default '[]',
  summary_text text        not null,
  generated_at timestamptz not null default now(),
  unique (user_id, year, month)
);

create index if not exists monthly_summaries_user_ym_idx
  on monthly_summaries (user_id, year, month);

alter table monthly_summaries enable row level security;

create policy "users read own summaries"
  on monthly_summaries for select
  using (auth.uid() = user_id);
