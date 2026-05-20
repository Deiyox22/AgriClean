-- Migration : table prospects (démarchage commercial)
create table if not exists prospects (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  contact_name  text,
  phone         text,
  email         text,
  type          text not null default 'avicole',   -- avicole | agricole | industriel | mixte
  department    text,                               -- 22 | 29 | 35 | 56
  status        text not null default 'a_contacter', -- a_contacter | contacte | devis_envoye | client
  notes         text,
  last_contact_at timestamptz,
  created_at    timestamptz not null default now()
);

alter table prospects enable row level security;

create policy "anon_all" on prospects for all to anon using (true) with check (true);
