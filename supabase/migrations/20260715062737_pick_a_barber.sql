-- Pick-a-barber at shops (6.7), per-barber service history (6.3),
-- shop-confirmed enrollments (6.4). Founder decisions 2026-07-15:
-- barbers stay fully independent; shop confirmation is a trust badge only.

-- ── bookings: optional staff barber choice ──────────────────────────────────

alter table public.bookings
  add column staff_id uuid references public.barbershop_staff(id) on delete set null;

create index bookings_staff_id_idx on public.bookings (staff_id);

-- Client-supplied at insert: must belong to the booked shop.
create or replace function public.validate_booking_staff()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.staff_id is not null then
    if new.barbershop_id is null
       or not exists (
         select 1 from public.barbershop_staff s
         where s.id = new.staff_id and s.barbershop_id = new.barbershop_id
       ) then
      raise exception 'selected barber does not work at this barbershop';
    end if;
  end if;
  return new;
end;
$$;

create trigger bookings_validate_staff
  before insert on public.bookings
  for each row execute function public.validate_booking_staff();

-- staff_id joins the immutable core fields after creation.
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
    return new; -- service-role path (Stripe webhook)
  end if;

  if new.client_id is distinct from old.client_id
     or new.barbershop_id is distinct from old.barbershop_id
     or new.private_barber_id is distinct from old.private_barber_id
     or new.staff_id is distinct from old.staff_id
     or new.service_id is distinct from old.service_id
     or new.location_id is distinct from old.location_id
     or new.address_snapshot is distinct from old.address_snapshot
     or new.scheduled_at is distinct from old.scheduled_at
     or new.duration_minutes is distinct from old.duration_minutes
     or new.style_confirmed_at is distinct from old.style_confirmed_at
     or new.amount_cents is distinct from old.amount_cents
     or new.currency is distinct from old.currency
     or new.stripe_checkout_session_id is distinct from old.stripe_checkout_session_id
     or new.stripe_payment_intent_id is distinct from old.stripe_payment_intent_id
     or new.paid_at is distinct from old.paid_at then
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

-- ── staff directory for clients (no email/phone exposure) ───────────────────

create or replace function public.shop_staff_directory(p_shop_id uuid)
returns table (
  id uuid,
  full_name text,
  skills text[],
  guild_profile_id uuid,
  guild_headline text
)
language sql
security definer
set search_path = ''
stable
as $$
  select s.id, s.full_name, s.skills, pb.profile_id, pb.headline
  from public.barbershop_staff s
  left join public.private_barbers pb
    on pb.profile_id = s.profile_id and pb.status = 'approved'
  where s.barbershop_id = p_shop_id
    and exists (
      select 1 from public.barbershops b
      where b.id = p_shop_id and b.status = 'approved'
    )
  order by s.full_name;
$$;

-- ── per-barber completed service history (approved barbers only) ────────────

create or replace function public.barber_service_history(p_barber_id uuid)
returns table (service_name text, completed_count bigint)
language sql
security definer
set search_path = ''
stable
as $$
  select s.name, count(*)
  from public.bookings k
  join public.services s on s.id = k.service_id
  where k.private_barber_id = p_barber_id
    and k.status = 'completed'
    and exists (
      select 1 from public.private_barbers pb
      where pb.profile_id = p_barber_id and pb.status = 'approved'
    )
  group by s.name
  order by count(*) desc;
$$;

-- ── enrollment confirmation by the shop (trust badge) ───────────────────────

alter table public.barber_affiliations
  add column confirmed_at timestamptz,
  add column confirmed_by uuid references public.profiles(id);

create policy "affiliations: shop owner confirms"
  on public.barber_affiliations for update
  to authenticated
  using (
    barbershop_id in
      (select b.id from public.barbershops b where b.owner_id = (select auth.uid()))
  )
  with check (
    barbershop_id in
      (select b.id from public.barbershops b where b.owner_id = (select auth.uid()))
  );

-- Barbers edit enrollment details but never the confirmation; shop owners
-- touch only the confirmation. Substance edits clear a prior confirmation.
create or replace function public.guard_affiliation_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null or public.is_admin() then
    return new;
  end if;

  if uid = old.barber_id then
    if new.confirmed_at is distinct from old.confirmed_at
       or new.confirmed_by is distinct from old.confirmed_by then
      raise exception 'enrollment confirmation is managed by the barbershop';
    end if;
    if (new.barbershop_id, new.role_title, new.started_on)
       is distinct from (old.barbershop_id, old.role_title, old.started_on) then
      new.confirmed_at := null;
      new.confirmed_by := null;
    end if;
    return new;
  end if;

  -- shop-owner path: only the confirmation fields may change
  if (new.barber_id, new.barbershop_id, new.role_title, new.started_on, new.ended_on)
     is distinct from (old.barber_id, old.barbershop_id, old.role_title, old.started_on, old.ended_on) then
    raise exception 'only the barber edits enrollment details';
  end if;
  if new.confirmed_at is null then
    new.confirmed_by := null;
  else
    new.confirmed_by := uid;
  end if;
  return new;
end;
$$;

create trigger barber_affiliations_guard_update
  before update on public.barber_affiliations
  for each row execute function public.guard_affiliation_update();

-- Barbers must not self-confirm at insert either.
create or replace function public.strip_affiliation_confirmation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null then
    new.confirmed_at := null;
    new.confirmed_by := null;
  end if;
  return new;
end;
$$;

create trigger barber_affiliations_strip_confirmation
  before insert on public.barber_affiliations
  for each row execute function public.strip_affiliation_confirmation();

-- ── grants ──────────────────────────────────────────────────────────────────

revoke execute on function public.validate_booking_staff() from anon, authenticated, public;
revoke execute on function public.guard_affiliation_update() from anon, authenticated, public;
revoke execute on function public.strip_affiliation_confirmation() from anon, authenticated, public;
revoke all on function public.shop_staff_directory(uuid) from public, anon;
grant execute on function public.shop_staff_directory(uuid) to authenticated;
revoke all on function public.barber_service_history(uuid) from public, anon;
grant execute on function public.barber_service_history(uuid) to authenticated;
