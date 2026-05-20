-- Table des abonnements Web Push
-- À exécuter dans Supabase > SQL Editor

create table if not exists push_subscriptions (
  id           bigint generated always as identity primary key,
  user_type    text not null,   -- 'manager' | 'employee' | 'client'
  user_id      bigint,          -- employee_id ou client_id (null pour manager)
  endpoint     text not null unique,  -- identifiant unique par navigateur/appareil
  subscription jsonb not null,
  created_at   timestamptz default now()
);

alter table push_subscriptions enable row level security;
create policy "anon_all" on push_subscriptions for all to anon using (true) with check (true);

create index if not exists push_subs_user_idx on push_subscriptions(user_type, user_id);
