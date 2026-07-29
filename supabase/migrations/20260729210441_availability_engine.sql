-- Availability engine (roadmap 7.1): opening hours per location, real slot
-- generation, and hard conflict prevention (no double-booking).

create extension if not exists btree_gist;

-- Hours are local wall-clock times; each location declares its timezone.
alter table public.barbershop_locations
  add column timezone text not null default 'America/New_York';

-- ── location_hours ──────────────────────────────────────────────────────────
-- One open/close range per weekday (0=Sunday). No row = closed that day.
create table public.location_hours (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.barbershop_locations (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  opens_at time not null,
  closes_at time not null,
  created_at timestamptz not null default now(),
  check (closes_at > opens_at),
  unique (location_id, weekday)
);

create index location_hours_location_idx on public.location_hours (location_id);

alter table public.location_hours enable row level security;

create policy "location_hours: owner manages"
  on public.location_hours for all
  to authenticated
  using (
    location_id in (
      select l.id
      from public.barbershop_locations l
      join public.barbershops b on b.id = l.barbershop_id
      where b.owner_id = (select auth.uid())
    )
  )
  with check (
    location_id in (
      select l.id
      from public.barbershop_locations l
      join public.barbershops b on b.id = l.barbershop_id
      where b.owner_id = (select auth.uid())
    )
  );

-- Signed-in users read hours of approved shops (needed to pick a slot).
create policy "location_hours: signed-in read approved"
  on public.location_hours for select
  to authenticated
  using (
    location_id in (
      select l.id
      from public.barbershop_locations l
      join public.barbershops b on b.id = l.barbershop_id
      where b.status = 'approved'
    )
  );

-- ── hard overlap guards (database-level, race-proof) ────────────────────────
-- A specific staff barber can never hold two active bookings at once.
alter table public.bookings
  add constraint bookings_staff_no_overlap
  exclude using gist (
    staff_id with =,
    tsrange(
      timezone('utc', scheduled_at),
      timezone('utc', scheduled_at) + (duration_minutes * interval '1 minute')
    ) with &&
  )
  where (staff_id is not null and status in ('pending', 'confirmed'));

-- A private barber can never hold two active at-home bookings at once.
alter table public.bookings
  add constraint bookings_private_barber_no_overlap
  exclude using gist (
    private_barber_id with =,
    tsrange(
      timezone('utc', scheduled_at),
      timezone('utc', scheduled_at) + (duration_minutes * interval '1 minute')
    ) with &&
  )
  where (private_barber_id is not null and status in ('pending', 'confirmed'));

-- ── within-hours + shop-capacity trigger ────────────────────────────────────
-- Client-facing writes only; the service-role path (seeds, webhook) passes.
-- Hours are enforced only once the location has configured any — shops that
-- have not set hours keep today's behavior.
create or replace function public.enforce_booking_slot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tz text;
  v_local timestamp;
  v_end_local timestamp;
  v_hours record;
  v_capacity int;
  v_overlapping int;
begin
  if (select auth.uid()) is null then
    return new;
  end if;
  if new.status not in ('pending', 'confirmed') then
    return new;
  end if;
  if new.barbershop_id is null then
    return new;
  end if;

  if new.location_id is not null
     and exists (select 1 from public.location_hours h where h.location_id = new.location_id)
  then
    select l.timezone into v_tz
    from public.barbershop_locations l
    where l.id = new.location_id;

    v_local := new.scheduled_at at time zone coalesce(v_tz, 'America/New_York');
    v_end_local := v_local + make_interval(mins => new.duration_minutes);

    select h.* into v_hours
    from public.location_hours h
    where h.location_id = new.location_id
      and h.weekday = extract(dow from v_local);

    if v_hours is null then
      raise exception 'shop is closed on that day';
    end if;
    if v_local::time < v_hours.opens_at
       or v_end_local::time > v_hours.closes_at
       or v_end_local::date <> v_local::date then
      raise exception 'time is outside opening hours';
    end if;
  end if;

  -- Capacity: concurrent active shop bookings are limited by the roster size.
  select greatest(count(*), 1) into v_capacity
  from public.barbershop_staff s
  where s.barbershop_id = new.barbershop_id;

  select count(*) into v_overlapping
  from public.bookings b
  where b.barbershop_id = new.barbershop_id
    and b.id is distinct from new.id
    and b.status in ('pending', 'confirmed')
    and tstzrange(b.scheduled_at, b.scheduled_at + make_interval(mins => b.duration_minutes))
        && tstzrange(new.scheduled_at, new.scheduled_at + make_interval(mins => new.duration_minutes));

  if v_overlapping >= v_capacity then
    raise exception 'that time is fully booked';
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_booking_slot() from anon, authenticated, public;

create trigger bookings_enforce_slot
  before insert or update of scheduled_at, duration_minutes, status on public.bookings
  for each row execute function public.enforce_booking_slot();

-- ── available_slots ─────────────────────────────────────────────────────────
-- Returns bookable start times (UTC) for a location+service on a local day,
-- on a 30-minute grid, respecting hours, existing bookings, and either a
-- specific staff barber or overall shop capacity. Times only — no PII.
create or replace function public.available_slots(
  p_location_id uuid,
  p_service_id uuid,
  p_day date,
  p_staff_id uuid default null
)
returns setof timestamptz
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_tz text;
  v_shop uuid;
  v_dur int;
  v_hours record;
  v_capacity int;
  v_slot timestamp;
  v_slot_utc timestamptz;
  v_end_utc timestamptz;
begin
  if (select auth.uid()) is null then
    raise exception 'authentication required';
  end if;

  select l.timezone, l.barbershop_id into v_tz, v_shop
  from public.barbershop_locations l
  join public.barbershops b on b.id = l.barbershop_id
  where l.id = p_location_id and b.status = 'approved';
  if v_shop is null then return; end if;

  select s.duration_minutes into v_dur
  from public.services s
  where s.id = p_service_id and s.barbershop_id = v_shop and s.active;
  if v_dur is null then return; end if;

  select h.* into v_hours
  from public.location_hours h
  where h.location_id = p_location_id and h.weekday = extract(dow from p_day);
  if v_hours is null then return; end if;

  if p_staff_id is not null then
    -- Staff member must belong to this shop.
    if not exists (
      select 1 from public.barbershop_staff st
      where st.id = p_staff_id and st.barbershop_id = v_shop
    ) then return; end if;
  else
    select greatest(count(*), 1) into v_capacity
    from public.barbershop_staff st
    where st.barbershop_id = v_shop;
  end if;

  v_slot := p_day + v_hours.opens_at;
  while v_slot + make_interval(mins => v_dur) <= p_day + v_hours.closes_at loop
    v_slot_utc := v_slot at time zone v_tz;
    v_end_utc := v_slot_utc + make_interval(mins => v_dur);

    if v_slot_utc > now() then
      if p_staff_id is not null then
        if not exists (
          select 1 from public.bookings b
          where b.staff_id = p_staff_id
            and b.status in ('pending', 'confirmed')
            and tstzrange(b.scheduled_at, b.scheduled_at + make_interval(mins => b.duration_minutes))
                && tstzrange(v_slot_utc, v_end_utc)
        ) then
          return next v_slot_utc;
        end if;
      else
        if (
          select count(*)
          from public.bookings b
          where b.barbershop_id = v_shop
            and b.status in ('pending', 'confirmed')
            and tstzrange(b.scheduled_at, b.scheduled_at + make_interval(mins => b.duration_minutes))
                && tstzrange(v_slot_utc, v_end_utc)
        ) < v_capacity then
          return next v_slot_utc;
        end if;
      end if;
    end if;

    v_slot := v_slot + interval '30 minutes';
  end loop;
end;
$$;

revoke all on function public.available_slots(uuid, uuid, date, uuid) from anon, public;
grant execute on function public.available_slots(uuid, uuid, date, uuid) to authenticated;
