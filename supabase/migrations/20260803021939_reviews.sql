-- Reviews & ratings (roadmap 7.3). Verified-purchase only: a review exists
-- iff its booking is completed AND paid, and belongs to the reviewer. The
-- trigger stamps the review target (shop / private barber / staff) from the
-- booking row — clients can never forge who a review is about.

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  client_id uuid not null references public.profiles (id) on delete cascade,
  barbershop_id uuid references public.barbershops (id) on delete cascade,
  private_barber_id uuid references public.private_barbers (profile_id) on delete cascade,
  staff_id uuid references public.barbershop_staff (id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (num_nonnulls(barbershop_id, private_barber_id) >= 1)
);

create index reviews_shop_idx on public.reviews (barbershop_id) where barbershop_id is not null;
create index reviews_barber_idx on public.reviews (private_barber_id) where private_barber_id is not null;

alter table public.reviews enable row level security;

-- Ratings are public trust content for the signed-in marketplace. Rows carry
-- no PII beyond the reviewer's own uuid (names are never joined for display).
create policy "reviews: signed-in read"
  on public.reviews for select
  to authenticated
  using (true);

create policy "reviews: own insert"
  on public.reviews for insert
  to authenticated
  with check ((select auth.uid()) = client_id);

create policy "reviews: own update"
  on public.reviews for update
  to authenticated
  using ((select auth.uid()) = client_id)
  with check ((select auth.uid()) = client_id);

create policy "reviews: own delete"
  on public.reviews for delete
  to authenticated
  using ((select auth.uid()) = client_id);

-- Verified purchase gate + target stamping.
create or replace function public.validate_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking record;
begin
  select b.client_id, b.status, b.paid_at, b.barbershop_id, b.private_barber_id, b.staff_id
  into v_booking
  from public.bookings b
  where b.id = new.booking_id;

  if v_booking is null then
    raise exception 'booking not found';
  end if;
  if (select auth.uid()) is not null then
    if v_booking.client_id <> (select auth.uid()) then
      raise exception 'you can only review your own bookings';
    end if;
    if v_booking.status <> 'completed' or v_booking.paid_at is null then
      raise exception 'only completed, paid bookings can be reviewed';
    end if;
  end if;

  -- The booking is the single source of truth for who the review targets.
  new.client_id := v_booking.client_id;
  new.barbershop_id := v_booking.barbershop_id;
  new.private_barber_id := v_booking.private_barber_id;
  new.staff_id := v_booking.staff_id;
  return new;
end;
$$;

revoke execute on function public.validate_review() from anon, authenticated, public;

create trigger reviews_validate_insert
  before insert on public.reviews
  for each row execute function public.validate_review();

-- Edits may change rating/comment only; the booking link and targets are fixed.
create or replace function public.guard_review_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.booking_id is distinct from old.booking_id
     or new.client_id is distinct from old.client_id
     or new.barbershop_id is distinct from old.barbershop_id
     or new.private_barber_id is distinct from old.private_barber_id
     or new.staff_id is distinct from old.staff_id then
    raise exception 'only rating and comment can be edited';
  end if;
  return new;
end;
$$;

revoke execute on function public.guard_review_update() from anon, authenticated, public;

create trigger reviews_guard_update
  before update on public.reviews
  for each row execute function public.guard_review_update();

create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();
