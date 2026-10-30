-- Kaigo facility (shisetsu) module: floors, rooms, room tasks, skills, staff identity,
-- coverage rules, member requests (希望休 / cuti), two-way messages and publication state.
-- The web app currently persists these in localStorage (facilityService.ts); this schema is
-- the server-side shape for when the module moves to Supabase.

create table if not exists facility_profiles (
  organization_id uuid primary key references organizations(id) on delete cascade,
  facility_type text not null default 'KAIGO_TOKUYOU'
    check (facility_type in ('KAIGO_TOKUYOU','KAIGO_ROKEN','GROUP_HOME','DAY_SERVICE','OFFICE')),
  facility_name text not null,
  resident_capacity int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists floors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  level int not null,
  name text not null,
  description text,
  unique (organization_id, level)
);

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  floor_id uuid not null references floors(id) on delete cascade,
  name text not null,
  name_jp text,
  category text not null default 'OTHER'
    check (category in ('BATH','DINING','RESIDENT','NURSE','REHAB','OFFICE','LAUNDRY','OTHER')),
  resident_count int,
  notes text
);

create table if not exists skills (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  code text not null,
  name text not null,
  name_jp text,
  category text not null check (category in ('QUALIFICATION','CARE','OPERATION')),
  unique (organization_id, code)
);

create table if not exists room_tasks (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  name text not null,
  start_time time not null,
  end_time time not null,
  days_of_week smallint[] not null default '{0,1,2,3,4,5,6}',
  shift_ids uuid[] not null default '{}',
  required_skill_ids uuid[] not null default '{}',
  min_staff int not null default 1 check (min_staff >= 1),
  notes text
);

create table if not exists staff_profiles (
  member_id uuid primary key references members(id) on delete cascade,
  employment_type text not null default 'SEISHAIN'
    check (employment_type in ('SEISHAIN','KEIYAKU','PART','HAKEN','TOKUTEI')),
  qualification text not null default 'NONE'
    check (qualification in ('NONE','SHONIN','JITSUMU','FUKUSHISHI','NURSE','CAREMANAGER')),
  level smallint not null default 1 check (level between 1 and 5),
  skill_ids uuid[] not null default '{}',
  allowed_shift_ids uuid[] not null default '{}',
  home_floor_id uuid references floors(id) on delete set null,
  can_float boolean not null default true,
  max_night_per_month int not null default 0,
  monthly_off_target int,
  paid_leave_balance numeric(4,1) not null default 10,
  pin_hash text not null,
  notes text
);

create table if not exists coverage_rules (
  id uuid primary key default gen_random_uuid(),
  floor_id uuid not null references floors(id) on delete cascade,
  shift_id uuid not null references shifts(id) on delete cascade,
  min_staff int not null default 0,
  weekend_min_staff int,
  unique (floor_id, shift_id)
);

create table if not exists scheduling_rules (
  organization_id uuid primary key references organizations(id) on delete cascade,
  monthly_off_days int not null default 9,
  max_consecutive_work_days int not null default 5,
  request_off_max_per_month int not null default 3,
  request_off_max_per_day int not null default 2,
  request_deadline_day int not null default 20,
  night_shift_id uuid references shifts(id),
  early_shift_id uuid references shifts(id),
  late_shift_id uuid references shifts(id),
  off_after_ake boolean not null default true,
  forbid_late_to_early boolean not null default true
);

create table if not exists off_requests (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  request_date date not null,
  reason text,
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED','CANCELLED')),
  admin_note text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create unique index if not exists off_requests_active_uniq
  on off_requests (member_id, request_date) where status in ('PENDING','APPROVED');

create table if not exists leave_requests (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  leave_type text not null check (leave_type in ('PAID','SICK','SPECIAL','UNPAID')),
  start_date date not null,
  end_date date not null check (end_date >= start_date),
  days int not null,
  reason text not null,
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED','CANCELLED')),
  admin_note text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

-- sender/recipient: 'ADMIN', a member uuid, or 'ALL' (broadcast)
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  thread_id uuid not null,
  sender_id text not null,
  recipient_id text not null,
  category text not null check (category in ('FEEDBACK','WARNING','NOTICE','SYSTEM','REPLY')),
  subject text not null,
  body text not null,
  read_by text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists messages_thread_idx on messages (thread_id, created_at);

create table if not exists published_schedules (
  organization_id uuid not null references organizations(id) on delete cascade,
  month char(7) not null, -- YYYY-MM
  published_at timestamptz not null default now(),
  primary key (organization_id, month)
);

-- schedules: new cell types and floor placement
alter table schedules add column if not exists floor_id uuid references floors(id) on delete set null;
alter table schedules drop constraint if exists schedules_schedule_type_check;
alter table schedules add constraint schedules_schedule_type_check
  check (schedule_type in ('SHIFT','OFF','LEAVE','SICK','HOLIDAY','AKE','REQ_OFF'));
