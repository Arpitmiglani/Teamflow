-- Roles enum and table
create type public.app_role as enum ('admin', 'manager', 'employee');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users view own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);
create policy "Admins view all roles" on public.user_roles for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins manage roles" on public.user_roles for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  avatar_initials text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Users view own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Admins/managers view all profiles" on public.profiles for select to authenticated using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'manager'));
create policy "Users update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);

-- Tasks
create type public.task_status as enum ('pending', 'in_progress', 'completed');
create type public.task_priority as enum ('low', 'medium', 'high');

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status task_status not null default 'pending',
  priority task_priority not null default 'medium',
  assignee_id uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  due_date timestamptz,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.tasks enable row level security;
create index idx_tasks_assignee on public.tasks(assignee_id);
create index idx_tasks_status on public.tasks(status);

create policy "Assignee views own tasks" on public.tasks for select to authenticated using (auth.uid() = assignee_id);
create policy "Managers/admins view all tasks" on public.tasks for select to authenticated using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'manager'));
create policy "Assignee updates own tasks" on public.tasks for update to authenticated using (auth.uid() = assignee_id) with check (auth.uid() = assignee_id);
create policy "Managers/admins manage tasks" on public.tasks for all to authenticated using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'manager')) with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'manager'));

-- Attendance
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  check_in timestamptz not null default now(),
  check_out timestamptz,
  location text,
  hours numeric(4,2),
  created_at timestamptz not null default now()
);
alter table public.attendance enable row level security;
create index idx_attendance_user on public.attendance(user_id, check_in desc);

create policy "Users view own attendance" on public.attendance for select to authenticated using (auth.uid() = user_id);
create policy "Managers/admins view all attendance" on public.attendance for select to authenticated using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'manager'));
create policy "Users insert own attendance" on public.attendance for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own attendance" on public.attendance for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger tasks_touch before update on public.tasks for each row execute function public.touch_updated_at();

-- Auto-create profile + default role on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  fname text := coalesce(new.raw_user_meta_data->>'full_name', '');
  initials text;
begin
  initials := upper(left(regexp_replace(coalesce(nullif(fname,''), split_part(new.email,'@',1)), '[^a-zA-Z ]', '', 'g'), 2));
  insert into public.profiles (id, full_name, phone, avatar_initials)
  values (new.id, fname, new.raw_user_meta_data->>'phone', initials);
  insert into public.user_roles (user_id, role) values (new.id, 'employee');
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();