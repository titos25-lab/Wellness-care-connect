-- Wellness Care Connect: initial relational schema for Supabase.
-- Apply only after reviewing privacy, licensing and data-protection requirements.
create extension if not exists pgcrypto;

create type public.app_role as enum ('patient','professional','admin');
create type public.request_status as enum ('new','under_review','awaiting_confirmation','confirmed','rescheduled','completed','cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  role public.app_role not null default 'patient',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.specialties (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true
);

create table public.professionals (
  id uuid primary key references public.profiles(id) on delete cascade,
  specialty_id uuid references public.specialties(id),
  bio text,
  qualifications text,
  institution text,
  registration_reference text,
  location text,
  modalities text[] not null default '{}',
  indicative_fee numeric(12,2),
  currency text not null default 'MZN',
  approval_status text not null default 'pending' check (approval_status in ('pending','approved','rejected','suspended')),
  created_at timestamptz not null default now()
);

create table public.professional_documents (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  storage_path text not null,
  document_type text not null,
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected')),
  created_at timestamptz not null default now()
);

create table public.appointment_requests (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id),
  specialty_id uuid references public.specialties(id),
  preferred_professional_id uuid references public.professionals(id),
  modality text not null check (modality in ('online','in_person','either')),
  preferred_date date,
  preferred_time text,
  administrative_note text,
  status public.request_status not null default 'new',
  assigned_professional_id uuid references public.professionals(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid unique references public.appointment_requests(id),
  patient_id uuid not null references public.profiles(id),
  professional_id uuid not null references public.professionals(id),
  starts_at timestamptz not null,
  ends_at timestamptz,
  modality text not null check (modality in ('online','in_person')),
  status text not null default 'pending' check (status in ('pending','confirmed','completed','cancelled')),
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id),
  payer_id uuid references public.profiles(id),
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'MZN',
  method text,
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded')),
  external_reference text,
  created_at timestamptz not null default now()
);

create table public.commissions (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id),
  professional_id uuid references public.professionals(id),
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'MZN',
  status text not null default 'pending' check (status in ('pending','payable','paid','void')),
  created_at timestamptz not null default now()
);

create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null references public.profiles(id),
  subject text not null,
  message text not null,
  status text not null default 'open' check (status in ('open','in_review','resolved','closed')),
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  created_at timestamptz not null default now()
);

-- Role helper reads the user's own profile. Admin role must be granted securely
-- by a trusted server-side process; never accept role changes from the client.
create or replace function public.current_app_role()
returns public.app_role
language sql stable security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

alter table public.profiles enable row level security;
alter table public.specialties enable row level security;
alter table public.professionals enable row level security;
alter table public.professional_documents enable row level security;
alter table public.appointment_requests enable row level security;
alter table public.appointments enable row level security;
alter table public.notifications enable row level security;
alter table public.payments enable row level security;
alter table public.commissions enable row level security;
alter table public.complaints enable row level security;
alter table public.audit_logs enable row level security;

create policy "Users read own profile" on public.profiles for select using (id = auth.uid() or public.current_app_role() = 'admin');
create policy "Users update own basic profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = public.current_app_role());
create policy "Read active specialties" on public.specialties for select using (is_active or public.current_app_role() = 'admin');
create policy "Read approved professional directory" on public.professionals for select using (approval_status = 'approved' or id = auth.uid() or public.current_app_role() = 'admin');
create policy "Professional updates own profile" on public.professionals for update using (id = auth.uid() or public.current_app_role() = 'admin') with check (id = auth.uid() or public.current_app_role() = 'admin');
create policy "Patient creates own request" on public.appointment_requests for insert with check (patient_id = auth.uid() and public.current_app_role() = 'patient');
create policy "Patient and assigned professional read request" on public.appointment_requests for select using (patient_id = auth.uid() or assigned_professional_id = auth.uid() or preferred_professional_id = auth.uid() or public.current_app_role() = 'admin');
create policy "Admin manages requests" on public.appointment_requests for all using (public.current_app_role() = 'admin') with check (public.current_app_role() = 'admin');
create policy "Participants read appointments" on public.appointments for select using (patient_id = auth.uid() or professional_id = auth.uid() or public.current_app_role() = 'admin');
create policy "Admin manages appointments" on public.appointments for all using (public.current_app_role() = 'admin') with check (public.current_app_role() = 'admin');
create policy "Users read own notifications" on public.notifications for select using (user_id = auth.uid() or public.current_app_role() = 'admin');
create policy "Users mark own notifications read" on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users read own payments" on public.payments for select using (payer_id = auth.uid() or public.current_app_role() = 'admin');
create policy "Admin manages payments" on public.payments for all using (public.current_app_role() = 'admin') with check (public.current_app_role() = 'admin');
create policy "Admin reads commissions" on public.commissions for select using (public.current_app_role() = 'admin');
create policy "User submits complaint" on public.complaints for insert with check (submitted_by = auth.uid());
create policy "Complaint owner or admin reads" on public.complaints for select using (submitted_by = auth.uid() or public.current_app_role() = 'admin');
create policy "Admin manages complaints" on public.complaints for update using (public.current_app_role() = 'admin') with check (public.current_app_role() = 'admin');
create policy "Admin reads audit logs" on public.audit_logs for select using (public.current_app_role() = 'admin');
