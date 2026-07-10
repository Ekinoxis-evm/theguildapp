-- Migration 005: bookings (roadmap 2.6 schema).
-- Model (decision 2026-07-09): shop + service + time; no staff pick at
-- booking. Client books pending; the shop (owner or linked staff) confirms,
-- completes, or cancels. Completion bumps the shop's fulfilled counter.

create type public.booking_status as enum
  ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  barbershop_id uuid not null references public.barbershops (id) on delete cascade,
  location_id uuid references public.barbershop_locations (id) on delete set null,
  service_id uuid not null references public.services (id) on delete restrict,
  scheduled_at timestamptz not null,
  duration_minutes integer not null check (duration_minutes > 0),
  status public.booking_status not null default 'pending',
  style_confirmed_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bookings_client_idx on public.bookings (client_id, scheduled_at desc);
create index bookings_shop_idx on public.bookings (barbershop_id, scheduled_at desc);

alter table public.bookings enable row level security;

-- Helper: shops the caller can act for (owner or linked staff).
create or replace function public.my_shop_ids()
returns setof uuid
language sql
security definer
set search_path = ''
stable
as $$
  select b.id from public.barbershops b where b.owner_id = auth.uid()
  union
  select s.barbershop_id from public.barbershop_staff s where s.profile_id = auth.uid();
$$;

revoke all on function public.my_shop_ids() from public;
grant execute on function public.my_shop_ids() to authenticated;

create policy "bookings: client select own"
  on public.bookings for select
  to authenticated
  using ((select auth.uid()) = client_id);

create policy "bookings: shop members select"
  on public.bookings for select
  to authenticated
  using (barbershop_id in (select public.my_shop_ids()));

-- Clients create their own bookings, only pending, only at approved shops,
-- only for an active service of that shop, and only after the style gate
-- (style_confirmed_at is NOT NULL by schema).
create policy "bookings: client insert"
  on public.bookings for insert
  to authenticated
  with check (
    (select auth.uid()) = client_id
    and status = 'pending'
    and scheduled_at > now()
    and barbershop_id in
      (select b.id from public.barbershops b where b.status = 'approved')
    and service_id in
      (select s.id from public.services s
       where s.barbershop_id = bookings.barbershop_id and s.active)
  );

-- Client may cancel their own booking (status transition enforced by trigger).
create policy "bookings: client update own"
  on public.bookings for update
  to authenticated
  using ((select auth.uid()) = client_id)
  with check ((select auth.uid()) = client_id);

-- Shop members manage bookings at their shop.
create policy "bookings: shop members update"
  on public.bookings for update
  to authenticated
  using (barbershop_id in (select public.my_shop_ids()))
  with check (barbershop_id in (select public.my_shop_ids()));

-- Allowed transitions, by actor:
--   client:      pending|confirmed -> cancelled
--   shop member: pending -> confirmed|cancelled, confirmed -> completed|cancelled|no_show
-- Everything else (and edits to core fields after creation) is rejected.
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
    return new; -- service-role path
  end if;

  if new.client_id is distinct from old.client_id
     or new.barbershop_id is distinct from old.barbershop_id
     or new.service_id is distinct from old.service_id
     or new.location_id is distinct from old.location_id
     or new.scheduled_at is distinct from old.scheduled_at
     or new.duration_minutes is distinct from old.duration_minutes
     or new.style_confirmed_at is distinct from old.style_confirmed_at then
    raise exception 'booking details cannot be edited; cancel and rebook';
  end if;

  if new.status = old.status then
    return new;
  end if;

  is_client := uid = old.client_id;
  is_shop := old.barbershop_id in (select public.my_shop_ids());

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

create trigger bookings_guard_update
  before update on public.bookings
  for each row execute function public.guard_booking_update();

-- Completed bookings bump the shop's public fulfilled counter.
create or replace function public.bump_fulfilled_counter()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    perform set_config('app.bypass_role_guard', 'on', true);
    update public.barbershops
    set services_fulfilled_count = services_fulfilled_count + 1
    where id = new.barbershop_id;
  end if;
  return new;
end;
$$;

create trigger bookings_bump_counter
  after update on public.bookings
  for each row execute function public.bump_fulfilled_counter();

create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

-- Style-photo read grant for the booked shop lands with the barber-facing
-- booking detail UI (kept narrow: only while a booking is pending/confirmed).
create policy "style_photos: booked shop members select"
  on public.style_photos for select
  to authenticated
  using (
    profile_id in (
      select bk.client_id from public.bookings bk
      where bk.barbershop_id in (select public.my_shop_ids())
        and bk.status in ('pending', 'confirmed')
    )
  );

create policy "user media: booked shop reads style photos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'style-photos'
    and (storage.foldername(name))[1] in (
      select bk.client_id::text from public.bookings bk
      where bk.barbershop_id in (select public.my_shop_ids())
        and bk.status in ('pending', 'confirmed')
    )
  );
