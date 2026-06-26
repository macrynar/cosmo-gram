-- Per-user AI cost monitoring: attribute each AI call to a user.
-- Nullable — anonymous / system (cron) calls have no user.

alter table ai_call_logs
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists ai_call_logs_user_called_at_idx
  on ai_call_logs (user_id, called_at desc);
