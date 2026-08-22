-- Dayflow HRMS schema for Supabase Postgres + Realtime.
-- Apply through the Supabase SQL editor or the Supabase CLI.

create type public.dayflow_role as enum ('employee', 'hr', 'admin');
create type public.attendance_status as enum ('present', 'absent', 'half_day', 'leave');
create type public.leave_type as enum ('paid', 'sick', 'unpaid');
create type public.leave_status as enum ('pending', 'approved', 'rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  employee_code text unique not null,
  full_name text not null,
  email text not null,
  role public.dayflow_role not null default 'employee',
  department text not null default 'People Ops',
  job_position text not null default 'Team member',
  manager text,
  location text default 'Bengaluru',
  phone text,
  address text,
  start_date date,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.salary_structures (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  wage numeric(12,2) not null check (wage >= 0),
  basic_rate numeric(5,2) not null default 50,
  hra_rate numeric(5,2) not null default 50,
  standard_allowance numeric(12,2) not null default 4167,
  performance_bonus_rate numeric(5,2) not null default 8.33,
  lta_rate numeric(5,2) not null default 8.33,
  fixed_allowance numeric(12,2) not null default 0,
  pf_rate numeric(5,2) not null default 12,
  professional_tax numeric(12,2) not null default 200,
  effective_from date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  attendance_date date not null,
  check_in_at timestamptz,
  check_out_at timestamptz,
  status public.attendance_status not null default 'absent',
  worked_minutes integer not null default 0 check (worked_minutes >= 0),
  notes text,
  source text not null default 'app',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, attendance_date)
);

create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  leave_type public.leave_type not null,
  start_date date not null,
  end_date date not null,
  days integer not null check (days > 0),
  remarks text,
  status public.leave_status not null default 'pending',
  reviewer_id uuid references public.profiles(id),
  review_comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table public.payslips (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  period_year integer not null,
  period_month integer not null check (period_month between 1 and 12),
  gross_salary numeric(12,2) not null,
  deductions numeric(12,2) not null default 0,
  net_salary numeric(12,2) not null,
  payable_days integer not null default 0,
  attendance_days integer not null default 0,
  pdf_path text,
  generated_at timestamptz not null default now(),
  unique (profile_id, period_year, period_month)
);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index attendance_date_idx on public.attendance_records(attendance_date);
create index leave_status_idx on public.leave_requests(status);
create index activity_created_idx on public.activity_events(created_at desc);

alter table public.profiles enable row level security;
alter table public.salary_structures enable row level security;
alter table public.attendance_records enable row level security;
alter table public.leave_requests enable row level security;
alter table public.payslips enable row level security;
alter table public.activity_events enable row level security;

create or replace function public.is_hr() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role in ('hr', 'admin'));
$$;

-- Employees may edit contact/profile details, but never identity, payroll, or role fields.
-- HR/Admin use the separate policy below for deliberate workforce administration.
create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_hr() and (
    new.role is distinct from old.role
    or new.employee_code is distinct from old.employee_code
    or new.email is distinct from old.email
  ) then
    raise exception 'Only HR or Admin can change role, employee code, or email';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_security_fields on public.profiles;
create trigger protect_profile_security_fields
before update on public.profiles
for each row execute function public.prevent_profile_privilege_escalation();

create policy "profile self read" on public.profiles for select using (id = auth.uid() or public.is_hr());
create policy "profile self update safe" on public.profiles for update
  using (id = auth.uid() and role = 'employee')
  with check (id = auth.uid() and role = 'employee');
create policy "profile hr update" on public.profiles for update
  using (public.is_hr())
  with check (public.is_hr());
create policy "salary self or hr read" on public.salary_structures for select using (profile_id = auth.uid() or public.is_hr());
create policy "attendance self or hr read" on public.attendance_records for select using (profile_id = auth.uid() or public.is_hr());
create policy "attendance self write" on public.attendance_records for insert with check (profile_id = auth.uid());
create policy "attendance self update safe" on public.attendance_records for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
create policy "attendance hr update" on public.attendance_records for update
  using (public.is_hr())
  with check (public.is_hr());
create policy "leave self or hr read" on public.leave_requests for select using (profile_id = auth.uid() or public.is_hr());
create policy "leave self create" on public.leave_requests for insert with check (profile_id = auth.uid());
create policy "leave hr review" on public.leave_requests for update using (public.is_hr());
create policy "payslip self or hr read" on public.payslips for select using (profile_id = auth.uid() or public.is_hr());
create policy "activity self or hr read" on public.activity_events for select using (actor_id = auth.uid() or public.is_hr());

alter publication supabase_realtime add table public.attendance_records;
alter publication supabase_realtime add table public.leave_requests;
alter publication supabase_realtime add table public.activity_events;
