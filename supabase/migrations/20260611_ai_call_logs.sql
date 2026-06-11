-- Tracks every AI call for observability and cost monitoring
create table if not exists ai_call_logs (
  id          bigserial primary key,
  called_at   timestamptz not null default now(),
  task        text        not null,  -- e.g. "natal-module:purpose", "chat", "daily-reading"
  model       text        not null,
  input_tokens  integer,
  output_tokens integer,
  latency_ms  integer,
  status      text        not null check (status in ('ok', 'error', 'retry')),
  error_msg   text
);

create index if not exists ai_call_logs_called_at_idx on ai_call_logs (called_at desc);
create index if not exists ai_call_logs_task_idx      on ai_call_logs (task, called_at desc);

-- RLS: no direct client access
alter table ai_call_logs enable row level security;
