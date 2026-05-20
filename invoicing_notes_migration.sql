-- Migration : ajout des colonnes manquantes aux tables invoices et quotes
alter table invoices add column if not exists note text;

alter table quotes add column if not exists note text;
alter table quotes add column if not exists valid_until text;
alter table quotes add column if not exists recurrence text;
alter table quotes add column if not exists invoice_id bigint references invoices(id) on delete set null;
