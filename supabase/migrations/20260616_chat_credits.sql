-- Chat credit balance on user_preferences
alter table user_preferences
  add column if not exists chat_credit_balance int not null default 0;

-- Migrate existing pack holders
update user_preferences
  set chat_credit_balance = chat_credit_balance + 100
  where chat_pack_purchased = true
    and chat_credit_balance = 0;

-- Audit ledger for purchases and consumption
create table if not exists chat_credit_transactions (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references auth.users(id) on delete cascade,
  delta             int         not null,
  reason            text        not null,        -- 'purchase' | 'consume'
  stripe_session_id text,
  created_at        timestamptz not null default now()
);

create unique index if not exists chat_credit_transactions_session_id_idx
  on chat_credit_transactions (stripe_session_id)
  where stripe_session_id is not null;

-- Atomic deduction: subtract 1 credit if balance > 0
create or replace function deduct_chat_credit(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update user_preferences
    set chat_credit_balance = chat_credit_balance - 1
    where user_id = p_user_id
      and chat_credit_balance > 0;

  if found then
    insert into chat_credit_transactions (user_id, delta, reason)
      values (p_user_id, -1, 'consume');
  end if;
end;
$$;

-- Atomic addition: add credits on purchase
create or replace function add_chat_credits(p_user_id uuid, p_delta int)
returns void
language plpgsql
security definer
as $$
begin
  insert into user_preferences (user_id, chat_credit_balance)
    values (p_user_id, p_delta)
    on conflict (user_id)
    do update set chat_credit_balance = user_preferences.chat_credit_balance + excluded.chat_credit_balance;
end;
$$;
