-- Stripe Connect payouts (roadmap 3.5). Founder decision 2026-07-15:
-- 15% platform fee, rest to the barber/shop via destination charges.
-- One connected account per user (covers barber profile and/or owned shop).
-- Rows are written exclusively server-side (service role): account ids stay
-- invisible to everyone but the owner and admin.

create table public.connect_accounts (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  stripe_account_id text not null unique,
  payouts_ready_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.connect_accounts enable row level security;

create policy "connect: owner reads"
  on public.connect_accounts for select
  to authenticated
  using ((select auth.uid()) = profile_id);

create policy "connect: admin reads"
  on public.connect_accounts for select
  to authenticated
  using (public.is_admin());

-- No insert/update/delete policies for authenticated: service-role only.
