-- Monitoring kosztu AI per user (§2.8). Wymaga kolumny ai_call_logs.user_id
-- (migracja 20260625_ai_call_logs_user_id.sql) — wcześniej koszt per-user był nieliczalny.
--
-- Ceny per 1M tokenów (Anthropic, 2026 — zweryfikuj w konsoli przy zmianie modeli):
--   Sonnet 4.6 (claude-sonnet-4-6): $3 input / $15 output
--   Haiku  4.5 (claude-haiku-4-5):  $1 input / $5  output
-- Uruchom w Supabase SQL editor.

with priced as (
  select
    user_id,
    called_at,
    date_trunc('week', called_at) as week,
    coalesce(input_tokens, 0)  as in_tok,
    coalesce(output_tokens, 0) as out_tok,
    case
      when model like '%sonnet%' then coalesce(input_tokens,0)/1e6*3  + coalesce(output_tokens,0)/1e6*15
      when model like '%haiku%'  then coalesce(input_tokens,0)/1e6*1  + coalesce(output_tokens,0)/1e6*5
      else 0
    end as cost_usd
  from ai_call_logs
  where status = 'ok'
)

-- 1) Tygodniowy koszt AI per user (top spenders w ostatnich 8 tygodniach)
select
  week,
  user_id,
  count(*)                    as calls,
  sum(in_tok)                 as input_tokens,
  sum(out_tok)                as output_tokens,
  round(sum(cost_usd)::numeric, 4) as cost_usd
from priced
where called_at >= now() - interval '8 weeks'
group by week, user_id
order by week desc, cost_usd desc;

-- 2) Tygodniowy koszt blended na aktywnego płatnika (marża) — odkomentuj:
-- with weekly as (
--   select date_trunc('week', called_at) as week, sum(cost_usd) as total_cost
--   from priced where called_at >= now() - interval '8 weeks' group by 1
-- ),
-- payers as (
--   select count(*) as active_payers from subscriptions where status in ('active','trialing')
-- )
-- select w.week,
--        round(w.total_cost::numeric, 2)                              as total_ai_cost_usd,
--        p.active_payers,
--        round((w.total_cost / nullif(p.active_payers,0))::numeric, 4) as cost_per_payer_usd
-- from weekly w cross join payers p
-- order by w.week desc;
