-- Cloud sync store for the web app (src/services/cloudSync.ts).
-- Every record the app keeps (members, shifts, schedules, attendance, floors, rooms, tasks,
-- skills, staff identity, requests, messages, settings) is one row here, keyed by
-- (org_id, collection, id). Last write wins per record. Deletes are soft (deleted = true) so
-- devices that poll instead of using Realtime still see them.

create table if not exists public.app_records (
  org_id     text        not null,
  collection text        not null,
  id         text        not null,
  data       jsonb       not null,
  deleted    boolean     not null default false,
  updated_by text,
  updated_at timestamptz not null default now(),
  primary key (org_id, collection, id)
);

create index if not exists app_records_org_updated_idx on public.app_records (org_id, updated_at);

create or replace function public.app_records_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists app_records_touch on public.app_records;
create trigger app_records_touch
  before insert or update on public.app_records
  for each row execute function public.app_records_touch();

-- The app has no per-user Supabase Auth yet: the kiosk, admin console and member portal all use
-- the publishable (anon) key, so anon gets read/write. Anyone holding the key can read and write
-- these rows; move to Supabase Auth + per-member policies before storing sensitive data.
alter table public.app_records enable row level security;

drop policy if exists app_records_anon_select on public.app_records;
drop policy if exists app_records_anon_insert on public.app_records;
drop policy if exists app_records_anon_update on public.app_records;

create policy app_records_anon_select on public.app_records for select to anon, authenticated using (true);
create policy app_records_anon_insert on public.app_records for insert to anon, authenticated with check (true);
create policy app_records_anon_update on public.app_records for update to anon, authenticated using (true) with check (true);
-- no delete policy: the app only soft-deletes

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'app_records'
  ) then
    alter publication supabase_realtime add table public.app_records;
  end if;
end $$;
