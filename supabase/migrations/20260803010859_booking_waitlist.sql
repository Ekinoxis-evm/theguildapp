-- Waitlist (roadmap 7.2): clients queue for a full day; a cancellation
-- triggers a best-effort email so they can grab the freed slot.

create table public.booking_waitlist (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  location_id uuid not null references public.barbershop_locations (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  day date not null,
  staff_id uuid references public.barbershop_staff (id) on delete cascade,
  created_at timestamptz not null default now(),
  notified_at timestamptz,
  unique (client_id, location_id, day)
);

create index booking_waitlist_lookup_idx
  on public.booking_waitlist (location_id, day)
  where notified_at is null;

alter table public.booking_waitlist enable row level security;

-- Clients manage only their own waitlist entries. notified_at is written by
-- the service-role notifier; a client-side write could only silence their own
-- notification, so no extra guard is needed.
create policy "waitlist: own insert"
  on public.booking_waitlist for insert
  to authenticated
  with check ((select auth.uid()) = client_id);

create policy "waitlist: own read"
  on public.booking_waitlist for select
  to authenticated
  using ((select auth.uid()) = client_id);

create policy "waitlist: own delete"
  on public.booking_waitlist for delete
  to authenticated
  using ((select auth.uid()) = client_id);
