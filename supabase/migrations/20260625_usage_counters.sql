-- Delete-proof anti-abuse counters for AI generation features.
-- Counts CREATIONS per calendar month (period_ym = 'YYYY-MM'), never decremented
-- on delete — so delete+recreate cannot bypass a monthly/lifetime cap.
-- kind ∈ 'natal' | 'child' | 'match'.

create table if not exists usage_counters (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  kind       text        not null check (kind in ('natal', 'child', 'match')),
  period_ym  text        not null,                 -- 'YYYY-MM'
  count      int         not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, kind, period_ym)
);

create index if not exists usage_counters_lookup_idx
  on usage_counters (user_id, kind, period_ym);

-- RLS: owner may read their own counters; writes go through service_role /
-- the security-definer RPC below. service_role (supabaseAdmin) bypasses RLS.
alter table usage_counters enable row level security;

drop policy if exists "users_read_own_usage_counters" on usage_counters;

create policy "users_read_own_usage_counters" on usage_counters
  for select using (auth.uid() = user_id);

-- Atomic increment for the current period. Returns the new count so callers can
-- log it. Never decrements; recreating a deleted record still hits the same row.
create or replace function increment_usage_counter(
  p_user_id   uuid,
  p_kind      text,
  p_period_ym text
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  insert into usage_counters (user_id, kind, period_ym, count)
    values (p_user_id, p_kind, p_period_ym, 1)
    on conflict (user_id, kind, period_ym)
    do update set count = usage_counters.count + 1, updated_at = now()
    returning count into v_count;
  return v_count;
end;
$$;
