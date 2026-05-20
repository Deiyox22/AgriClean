-- ============================================================
-- AgriClean Manager — Schéma Supabase
-- À exécuter dans : https://app.supabase.com/project/jpoprxloidndocprawve/sql
-- ============================================================

-- Clients
create table if not exists clients (
  id         bigint generated always as identity primary key,
  name       text,
  siret      text,
  type       text,
  status     text default 'actif',
  address    jsonb,
  contacts   jsonb,
  notes      text,
  documents  jsonb,
  created_at text
);

-- Employés
create table if not exists employees (
  id           bigint generated always as identity primary key,
  first_name   text,
  last_name    text,
  role         text,
  phone        text,
  email        text,
  licenses     jsonb,
  availability jsonb,
  pin          text,
  status       text default 'actif',
  notes        text,
  absences     jsonb default '[]'
);

-- Véhicules
create table if not exists vehicles (
  id           bigint generated always as identity primary key,
  name         text,
  plate        text,
  type         text,
  mileage      integer,
  next_service text,
  next_ct      text,
  status       text
);

-- Équipements
create table if not exists equipment (
  id         bigint generated always as identity primary key,
  name       text,
  category   text,
  status     text,
  last_check text
);

-- Missions (FK vers clients)
create table if not exists missions (
  id            bigint generated always as identity primary key,
  type          text,
  client_id     bigint references clients(id) on delete set null,
  site_address  text,
  date          text,
  duration      numeric,
  team_ids      jsonb,
  vehicle_id    bigint,
  status        text,
  recurrence    text,
  instructions  text,
  travel        jsonb,
  egg_data      jsonb,
  cleaning_data jsonb,
  report        jsonb,
  created_at    text
);

-- Factures (FK vers clients et missions)
create table if not exists invoices (
  id         bigint generated always as identity primary key,
  number     text,
  client_id  bigint references clients(id) on delete set null,
  mission_id bigint references missions(id) on delete set null,
  lines      jsonb,
  tax        numeric,
  status     text,
  due_date   text,
  paid_at    text,
  note       text,
  created_at text
);

-- Devis (FK vers clients et missions)
create table if not exists quotes (
  id          bigint generated always as identity primary key,
  number      text,
  client_id   bigint references clients(id) on delete set null,
  mission_id  bigint references missions(id) on delete set null,
  lines       jsonb,
  tax         numeric,
  status      text,
  note        text,
  valid_until text,
  recurrence  text,
  created_at  text
);

-- Paramètres (une seule ligne)
create table if not exists settings (
  id              bigint generated always as identity primary key,
  company         jsonb,
  default_rates   jsonb,
  legal_mentions  text,
  invoice_prefix  text,
  theme           text default 'light',
  admin_email     text,
  admin_password  text,
  travel_settings jsonb
);

-- Équipes prédéfinies
create table if not exists teams (
  id          bigint generated always as identity primary key,
  name        text not null,
  description text,
  member_ids  jsonb default '[]',
  color       text default 'green',
  created_at  text
);

-- Candidatures (portail emploi)
create table if not exists applications (
  id         bigint generated always as identity primary key,
  email      text,
  position   text,
  status     text default 'recu',
  first_name text,
  last_name  text,
  phone      text,
  message    text,
  created_at text
);

-- Contacts (formulaire landing page)
create table if not exists contacts (
  id         bigint generated always as identity primary key,
  name       text,
  email      text,
  message    text,
  created_at text
);

-- ============================================================
-- Sécurité : Row Level Security + politique open pour clé anon
-- (l'auth est gérée au niveau applicatif)
-- ============================================================

alter table clients      enable row level security;
alter table employees    enable row level security;
alter table vehicles     enable row level security;
alter table equipment    enable row level security;
alter table missions     enable row level security;
alter table invoices     enable row level security;
alter table quotes       enable row level security;
alter table settings     enable row level security;
alter table applications enable row level security;
alter table contacts     enable row level security;

create policy "anon_all" on clients      for all to anon using (true) with check (true);
create policy "anon_all" on employees    for all to anon using (true) with check (true);
create policy "anon_all" on vehicles     for all to anon using (true) with check (true);
create policy "anon_all" on equipment    for all to anon using (true) with check (true);
create policy "anon_all" on missions     for all to anon using (true) with check (true);
create policy "anon_all" on invoices     for all to anon using (true) with check (true);
create policy "anon_all" on quotes       for all to anon using (true) with check (true);
create policy "anon_all" on settings     for all to anon using (true) with check (true);
alter table teams enable row level security;
create policy "anon_all" on teams       for all to anon using (true) with check (true);
create policy "anon_all" on applications for all to anon using (true) with check (true);
create policy "anon_all" on contacts     for all to anon using (true) with check (true);
