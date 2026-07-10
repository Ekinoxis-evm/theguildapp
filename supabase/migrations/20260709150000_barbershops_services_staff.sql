-- Migration 004: barbershops, locations, services, staff (roadmap 2.1).
-- Decisions (2026-07-09): shops are founder-approved (status pending until
-- an admin approves); staff get logins by linking barbershop_staff.profile_id
-- to an existing account by email; booking model is shop + service + time.

-- ============ Role-guard bypass for definer functions ============
-- prevent_role_tier_self_change() blocks any role/tier change made through
-- the authenticated PostgREST path. Approval flows below legitimately change
-- roles from security definer functions, which still run with the caller's
-- JWT, so the guard needs a transaction-local bypass only those functions set.

create or replace function public.prevent_role_tier_self_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role or new.tier is distinct from old.tier then
    if (select auth.uid()) is not null
       and coalesce(current_setting('app.bypass_role_guard', true), '') <> 'on' then
      raise exception 'role and tier cannot be changed by the user';
    end if;
  end if;
  return new;
end;
$$;

-- ============ Enums ============

create type public.barbershop_status as enum ('pending', 'approved', 'suspended');

-- ============ barbershops ============

create table public.barbershops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  phone text,
  description text,
  status public.barbershop_status not null default 'pending',
  services_fulfilled_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id)
);

alter table public.barbershops enable row level security;

create policy "barbershops: owner select"
  on public.barbershops for select
  to authenticated
  using ((select auth.uid()) = owner_id);

create policy "barbershops: approved are visible"
  on public.barbershops for select
  to authenticated
  using (status = 'approved');

create policy "barbershops: owner insert pending"
  on public.barbershops for insert
  to authenticated
  with check (
    (select auth.uid()) = owner_id
    and status = 'pending'
    and services_fulfilled_count = 0
  );

-- Owner can edit shop details but not status/counter (guarded by trigger below).
create policy "barbershops: owner update"
  on public.barbershops for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create or replace function public.prevent_shop_status_self_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status
     or new.services_fulfilled_count is distinct from old.services_fulfilled_count then
    if (select auth.uid()) is not null
       and coalesce(current_setting('app.bypass_role_guard', true), '') <> 'on' then
      raise exception 'status and fulfilled counter cannot be changed by the owner';
    end if;
  end if;
  return new;
end;
$$;

create trigger barbershops_guard_status
  before update on public.barbershops
  for each row execute function public.prevent_shop_status_self_change();

create trigger barbershops_set_updated_at
  before update on public.barbershops
  for each row execute function public.set_updated_at();

-- ============ barbershop_locations ============
-- Manual address fields for now; google_place_id/lat/lng filled once the
-- Maps key lands (roadmap 0.8).

create table public.barbershop_locations (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops (id) on delete cascade,
  google_place_id text,
  formatted_address text not null,
  lat double precision,
  lng double precision,
  country text not null,
  state text not null,
  city text not null,
  zip_code text not null,
  created_at timestamptz not null default now()
);

create index barbershop_locations_shop_idx
  on public.barbershop_locations (barbershop_id);

alter table public.barbershop_locations enable row level security;

create policy "locations: owner all"
  on public.barbershop_locations for all
  to authenticated
  using (
    barbershop_id in
      (select b.id from public.barbershops b where b.owner_id = (select auth.uid()))
  )
  with check (
    barbershop_id in
      (select b.id from public.barbershops b where b.owner_id = (select auth.uid()))
  );

create policy "locations: visible for approved shops"
  on public.barbershop_locations for select
  to authenticated
  using (
    barbershop_id in
      (select b.id from public.barbershops b where b.status = 'approved')
  );

-- ============ services ============
-- barbershop services now; private_barber_id joins in Phase 3.

create table public.services (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid references public.barbershops (id) on delete cascade,
  name text not null,
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'USD',
  duration_minutes integer not null default 30 check (duration_minutes > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (barbershop_id is not null)
);

create index services_shop_idx on public.services (barbershop_id);

alter table public.services enable row level security;

create policy "services: owner all"
  on public.services for all
  to authenticated
  using (
    barbershop_id in
      (select b.id from public.barbershops b where b.owner_id = (select auth.uid()))
  )
  with check (
    barbershop_id in
      (select b.id from public.barbershops b where b.owner_id = (select auth.uid()))
  );

create policy "services: active visible for approved shops"
  on public.services for select
  to authenticated
  using (
    active
    and barbershop_id in
      (select b.id from public.barbershops b where b.status = 'approved')
  );

-- ============ barbershop_staff ============
-- Managed by the owner; a staff row links to a real account when the email
-- matches (claimed via link_staff_by_email below). Staff emails/phones are
-- NEVER publicly readable (docs/SECURITY.md).

create table public.barbershop_staff (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete set null,
  full_name text not null,
  email text not null,
  phone text,
  skills text[] not null default '{barber}',
  created_at timestamptz not null default now(),
  unique (barbershop_id, email)
);

create index barbershop_staff_shop_idx on public.barbershop_staff (barbershop_id);
create index barbershop_staff_profile_idx on public.barbershop_staff (profile_id);

alter table public.barbershop_staff enable row level security;

create policy "staff: owner all"
  on public.barbershop_staff for all
  to authenticated
  using (
    barbershop_id in
      (select b.id from public.barbershops b where b.owner_id = (select auth.uid()))
  )
  with check (
    barbershop_id in
      (select b.id from public.barbershops b where b.owner_id = (select auth.uid()))
  );

create policy "staff: member reads own row"
  on public.barbershop_staff for select
  to authenticated
  using (profile_id = (select auth.uid()));

-- ============ Definer functions ============

-- Links any unclaimed staff rows for the caller's email to their profile.
-- Called from the dashboard on load; idempotent.
create or replace function public.link_staff_by_email()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  linked integer;
begin
  update public.barbershop_staff s
  set profile_id = (select auth.uid())
  where s.profile_id is null
    and lower(s.email) = lower((select u.email from auth.users u where u.id = (select auth.uid())));
  get diagnostics linked = row_count;
  return linked;
end;
$$;

revoke all on function public.link_staff_by_email() from public;
grant execute on function public.link_staff_by_email() to authenticated;

-- Admin-only: approve a pending shop and promote its owner.
create or replace function public.approve_barbershop(shop_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  ) then
    raise exception 'only admins can approve barbershops';
  end if;

  perform set_config('app.bypass_role_guard', 'on', true);

  update public.barbershops
  set status = 'approved'
  where id = shop_id and status = 'pending';

  if not found then
    raise exception 'shop not found or not pending';
  end if;

  update public.profiles
  set role = 'barbershop_owner'
  where id = (select owner_id from public.barbershops where id = shop_id)
    and role = 'client';
end;
$$;

revoke all on function public.approve_barbershop(uuid) from public;
grant execute on function public.approve_barbershop(uuid) to authenticated;
