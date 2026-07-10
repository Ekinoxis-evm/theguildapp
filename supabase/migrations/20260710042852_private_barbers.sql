-- Migration 008: private barbers + premium client addresses (roadmap 3.1).
-- Private barbers apply like shops (founder-approved). They serve at-home,
-- so booking one is premium-only; premium is granted manually by the admin
-- until Stripe lands (interim decision 2026-07-10).

-- ============ private_barbers ============

create table public.private_barbers (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  bio text,
  self_photo_path text,
  setup_photo_path text,
  base_price_cents integer not null default 0 check (base_price_cents >= 0),
  status public.barbershop_status not null default 'pending',
  services_fulfilled_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.private_barbers enable row level security;

create policy "private_barbers: owner select"
  on public.private_barbers for select
  to authenticated
  using ((select auth.uid()) = profile_id);

create policy "private_barbers: approved visible"
  on public.private_barbers for select
  to authenticated
  using (status = 'approved');

create policy "private_barbers: admin select"
  on public.private_barbers for select
  to authenticated
  using ((select public.is_admin()));

create policy "private_barbers: owner insert pending"
  on public.private_barbers for insert
  to authenticated
  with check (
    (select auth.uid()) = profile_id
    and status = 'pending'
    and services_fulfilled_count = 0
  );

create policy "private_barbers: owner update"
  on public.private_barbers for update
  to authenticated
  using ((select auth.uid()) = profile_id)
  with check ((select auth.uid()) = profile_id);

create trigger private_barbers_guard_status
  before update on public.private_barbers
  for each row execute function public.prevent_shop_status_self_change();

create trigger private_barbers_set_updated_at
  before update on public.private_barbers
  for each row execute function public.set_updated_at();

-- Approval mirrors approve_barbershop.
create or replace function public.approve_private_barber(barber_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.is_admin()) then
    raise exception 'only admins can approve private barbers';
  end if;

  perform set_config('app.bypass_role_guard', 'on', true);

  update public.private_barbers
  set status = 'approved'
  where profile_id = barber_id and status = 'pending';
  if not found then
    raise exception 'barber not found or not pending';
  end if;

  update public.profiles
  set role = 'private_barber'
  where id = barber_id and role = 'client';
end;
$$;

revoke all on function public.approve_private_barber(uuid) from public, anon;
grant execute on function public.approve_private_barber(uuid) to authenticated;

-- ============ coverage_areas ============

create table public.coverage_areas (
  id uuid primary key default gen_random_uuid(),
  private_barber_id uuid not null references public.private_barbers (profile_id) on delete cascade,
  country text not null,
  state text not null,
  city text not null,
  zip_codes text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index coverage_areas_barber_idx on public.coverage_areas (private_barber_id);

alter table public.coverage_areas enable row level security;

create policy "coverage: owner all"
  on public.coverage_areas for all
  to authenticated
  using ((select auth.uid()) = private_barber_id)
  with check ((select auth.uid()) = private_barber_id);

create policy "coverage: visible for approved barbers"
  on public.coverage_areas for select
  to authenticated
  using (
    private_barber_id in
      (select pb.profile_id from public.private_barbers pb where pb.status = 'approved')
  );

-- ============ barber services ============
-- services gains the private_barber_id leg planned in DATA_MODEL.

alter table public.services
  add column private_barber_id uuid references public.private_barbers (profile_id) on delete cascade;

alter table public.services drop constraint services_barbershop_id_check;
alter table public.services add constraint services_exactly_one_owner
  check (num_nonnulls(barbershop_id, private_barber_id) = 1);

create index services_barber_idx on public.services (private_barber_id);

create policy "services: barber owner all"
  on public.services for all
  to authenticated
  using ((select auth.uid()) = private_barber_id)
  with check ((select auth.uid()) = private_barber_id);

create policy "services: active visible for approved barbers"
  on public.services for select
  to authenticated
  using (
    active
    and private_barber_id in
      (select pb.profile_id from public.private_barbers pb where pb.status = 'approved')
  );

-- ============ client_addresses (premium only) ============
-- The single most sensitive field in the product: separate table, owner-only.
-- The assigned barber of an active at-home booking gets the frozen
-- address_snapshot on the booking row instead of table access.

create table public.client_addresses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  street_address text not null,
  unit text,
  city text not null,
  state text not null,
  zip_code text not null,
  lat double precision,
  lng double precision,
  is_default boolean not null default true,
  created_at timestamptz not null default now()
);

create index client_addresses_profile_idx on public.client_addresses (profile_id);

alter table public.client_addresses enable row level security;

create policy "addresses: premium owner all"
  on public.client_addresses for all
  to authenticated
  using ((select auth.uid()) = profile_id)
  with check (
    (select auth.uid()) = profile_id
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.tier = 'premium'
    )
  );

-- ============ at-home bookings ============

alter table public.bookings alter column barbershop_id drop not null;
alter table public.bookings
  add column private_barber_id uuid references public.private_barbers (profile_id) on delete cascade,
  add column address_snapshot jsonb,
  add constraint bookings_exactly_one_provider
    check (num_nonnulls(barbershop_id, private_barber_id) = 1);

create index bookings_barber_idx on public.bookings (private_barber_id, scheduled_at desc);

-- Premium clients book approved barbers whose service is active; the address
-- snapshot must be present for at-home service.
create policy "bookings: premium client insert at-home"
  on public.bookings for insert
  to authenticated
  with check (
    (select auth.uid()) = client_id
    and status = 'pending'
    and scheduled_at > now()
    and private_barber_id in
      (select pb.profile_id from public.private_barbers pb where pb.status = 'approved')
    and service_id in
      (select s.id from public.services s
       where s.private_barber_id = bookings.private_barber_id and s.active)
    and address_snapshot is not null
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.tier = 'premium'
    )
  );

create policy "bookings: barber select"
  on public.bookings for select
  to authenticated
  using ((select auth.uid()) = private_barber_id);

create policy "bookings: barber update"
  on public.bookings for update
  to authenticated
  using ((select auth.uid()) = private_barber_id)
  with check ((select auth.uid()) = private_barber_id);

-- Status transitions for barbers reuse guard_booking_update: extend the shop
-- check to include the assigned private barber.
create or replace function public.guard_booking_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  is_client boolean;
  is_shop boolean;
begin
  if uid is null then
    return new;
  end if;

  if new.client_id is distinct from old.client_id
     or new.barbershop_id is distinct from old.barbershop_id
     or new.private_barber_id is distinct from old.private_barber_id
     or new.service_id is distinct from old.service_id
     or new.location_id is distinct from old.location_id
     or new.address_snapshot is distinct from old.address_snapshot
     or new.scheduled_at is distinct from old.scheduled_at
     or new.duration_minutes is distinct from old.duration_minutes
     or new.style_confirmed_at is distinct from old.style_confirmed_at then
    raise exception 'booking details cannot be edited; cancel and rebook';
  end if;

  if new.status = old.status then
    return new;
  end if;

  is_client := uid = old.client_id;
  is_shop := old.barbershop_id in (select public.my_shop_ids())
             or uid = old.private_barber_id;

  if is_client and old.status in ('pending', 'confirmed') and new.status = 'cancelled' then
    return new;
  end if;

  if is_shop and (
       (old.status = 'pending' and new.status in ('confirmed', 'cancelled'))
    or (old.status = 'confirmed' and new.status in ('completed', 'cancelled', 'no_show'))
  ) then
    return new;
  end if;

  raise exception 'transition % -> % not allowed', old.status, new.status;
end;
$$;

-- Completed at-home bookings bump the barber's counter.
create or replace function public.bump_fulfilled_counter()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    perform set_config('app.bypass_role_guard', 'on', true);
    if new.barbershop_id is not null then
      update public.barbershops
      set services_fulfilled_count = services_fulfilled_count + 1
      where id = new.barbershop_id;
    end if;
    if new.private_barber_id is not null then
      update public.private_barbers
      set services_fulfilled_count = services_fulfilled_count + 1
      where profile_id = new.private_barber_id;
    end if;
  end if;
  return new;
end;
$$;

-- Style photos: assigned private barber reads while booking active.
create policy "style_photos: booked barber select"
  on public.style_photos for select
  to authenticated
  using (
    profile_id in (
      select bk.client_id from public.bookings bk
      where bk.private_barber_id = (select auth.uid())
        and bk.status in ('pending', 'confirmed')
    )
  );

create policy "user media: booked barber reads style photos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'style-photos'
    and (storage.foldername(name))[1] in (
      select bk.client_id::text from public.bookings bk
      where bk.private_barber_id = (select auth.uid())
        and bk.status in ('pending', 'confirmed')
    )
  );

-- ============ barber-photos bucket (private) ============

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('barber-photos', 'barber-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "barber photos: owner all"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'barber-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'barber-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Approved barbers' photos are viewable by signed-in clients (signed URLs).
create policy "barber photos: approved visible"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'barber-photos'
    and (storage.foldername(name))[1] in
      (select pb.profile_id::text from public.private_barbers pb where pb.status = 'approved')
  );

-- ============ premium tier (interim: admin-granted) ============

create or replace function public.set_client_tier(user_email text, new_tier public.client_tier)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid;
begin
  if not (select public.is_admin()) then
    raise exception 'only admins can change client tier';
  end if;

  select u.id into target from auth.users u where lower(u.email) = lower(user_email);
  if target is null then
    raise exception 'no account with that email';
  end if;

  perform set_config('app.bypass_role_guard', 'on', true);
  update public.profiles set tier = new_tier where id = target;
end;
$$;

revoke all on function public.set_client_tier(text, public.client_tier) from public, anon;
grant execute on function public.set_client_tier(text, public.client_tier) to authenticated;

-- Trigger-function hygiene for anything recreated above.
revoke execute on function public.guard_booking_update() from anon, authenticated, public;
revoke execute on function public.bump_fulfilled_counter() from anon, authenticated, public;
