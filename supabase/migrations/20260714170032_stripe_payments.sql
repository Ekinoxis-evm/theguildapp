-- Stripe payments & premium subscriptions (roadmap 3.4).
-- Bookings are paid in full upfront via Stripe Checkout; premium is a
-- $19.99/mo subscription. All payment/subscription columns are written
-- exclusively by the Stripe webhook through the service-role client —
-- authenticated users can never set or edit them (triggers below).

-- ── profiles: Stripe linkage ────────────────────────────────────────────────

alter table public.profiles
  add column stripe_customer_id text,
  add column stripe_subscription_id text,
  add column subscription_status text;

create unique index profiles_stripe_customer_id_key
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

create unique index profiles_stripe_subscription_id_key
  on public.profiles (stripe_subscription_id)
  where stripe_subscription_id is not null;

-- Extend the role/tier self-change guard to the Stripe columns.
create or replace function public.prevent_role_tier_self_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     or new.tier is distinct from old.tier
     or new.stripe_customer_id is distinct from old.stripe_customer_id
     or new.stripe_subscription_id is distinct from old.stripe_subscription_id
     or new.subscription_status is distinct from old.subscription_status then
    -- service_role bypasses RLS and triggers run for it too; allow only
    -- requests not made through the authenticated PostgREST path.
    if (select auth.uid()) is not null then
      raise exception 'role and tier cannot be changed by the user';
    end if;
  end if;
  return new;
end;
$$;

-- Users insert their own profile row at signup; never with Stripe identity
-- preset (a forged stripe_customer_id could hijack subscription webhooks).
create or replace function public.strip_profile_stripe_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null then
    new.stripe_customer_id := null;
    new.stripe_subscription_id := null;
    new.subscription_status := null;
  end if;
  return new;
end;
$$;

create trigger profiles_strip_stripe_fields
  before insert on public.profiles
  for each row execute function public.strip_profile_stripe_fields();

-- ── bookings: payment stamping ──────────────────────────────────────────────

alter table public.bookings
  add column amount_cents integer check (amount_cents >= 0),
  add column currency text,
  add column stripe_checkout_session_id text,
  add column stripe_payment_intent_id text,
  add column paid_at timestamptz;

create unique index bookings_stripe_checkout_session_id_key
  on public.bookings (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

-- Clients insert bookings under their own session; payment fields must
-- start empty and only ever be stamped by the webhook (service role).
create or replace function public.strip_booking_payment_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null then
    new.amount_cents := null;
    new.currency := null;
    new.stripe_checkout_session_id := null;
    new.stripe_payment_intent_id := null;
    new.paid_at := null;
  end if;
  return new;
end;
$$;

create trigger bookings_strip_payment_fields
  before insert on public.bookings
  for each row execute function public.strip_booking_payment_fields();

-- Extend the update guard: payment columns join the immutable core fields.
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

revoke execute on function public.prevent_role_tier_self_change() from anon, authenticated, public;
revoke execute on function public.strip_profile_stripe_fields() from anon, authenticated, public;
revoke execute on function public.strip_booking_payment_fields() from anon, authenticated, public;
revoke execute on function public.guard_booking_update() from anon, authenticated, public;
