-- Tracks cron job invocations for health monitoring
create table if not exists cron_runs (
  id         bigserial primary key,
  name       text        not null,
  ran_at     timestamptz not null default now(),
  status     text        not null check (status in ('ok', 'error', 'partial')),
  metadata   jsonb
);

-- Only keep last 90 days; a cron job on this could clean it but an index + policy is enough for now
create index if not exists cron_runs_name_ran_at_idx on cron_runs (name, ran_at desc);

-- RLS: no direct client access — only service role
alter table cron_runs enable row level security;
