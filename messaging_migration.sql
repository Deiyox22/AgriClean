-- ============================================================
-- AgriClean – Migration messagerie instantanée
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

-- Table des conversations
create table if not exists conversations (
  id              bigint generated always as identity primary key,
  type            text not null,   -- 'direct_employee' | 'direct_client' | 'mission'
  mission_id      bigint references missions(id) on delete cascade,
  employee_id     bigint references employees(id) on delete cascade,
  client_id       bigint references clients(id) on delete cascade,
  title           text,
  last_message_at timestamptz default now(),
  created_at      timestamptz default now()
);

-- Table des messages
create table if not exists messages (
  id               bigint generated always as identity primary key,
  conversation_id  bigint references conversations(id) on delete cascade not null,
  sender_type      text not null,  -- 'manager' | 'employee' | 'client'
  sender_id        bigint,         -- employee_id ou client_id (null pour manager)
  sender_name      text not null,
  content          text not null,
  read_by_manager  boolean default false,
  created_at       timestamptz default now()
);

-- Sécurité (RLS ouverte comme le reste du projet)
alter table conversations enable row level security;
alter table messages enable row level security;

create policy "anon_all" on conversations
  for all to anon using (true) with check (true);

create policy "anon_all" on messages
  for all to anon using (true) with check (true);

-- Index pour les performances
create index if not exists messages_conversation_id_idx on messages(conversation_id);
create index if not exists messages_created_at_idx on messages(created_at);
create index if not exists conversations_last_message_at_idx on conversations(last_message_at desc);
