-- Migration : conversations par équipe au lieu de par mission
-- À exécuter dans Supabase > SQL Editor

alter table conversations
  add column if not exists team_id bigint references teams(id) on delete cascade;

create index if not exists conversations_team_id_idx on conversations(team_id);
