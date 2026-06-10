create table if not exists user_consents (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  consent_type    text not null,   -- 'terms' | 'marketing' | 'email_horoscope' | 'digital_content_delivery'
  granted         boolean not null,
  wording_version text not null default '2026-06-10',
  created_at      timestamptz not null default now()
);

create index if not exists user_consents_user_id_idx on user_consents(user_id);

alter table user_consents enable row level security;

create policy "Users can read own consents"
  on user_consents for select
  using (auth.uid() = user_id);
