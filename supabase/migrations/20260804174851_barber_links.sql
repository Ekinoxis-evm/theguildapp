-- Barber social hub (roadmap 8.1): every barber profile becomes their one
-- link in the bio — socials plus an external booking link (e.g. Squire).
-- Native Guild booking stays optional; the profile is the wedge.

create type public.barber_link_kind as enum
  ('instagram', 'youtube', 'tiktok', 'x', 'website', 'booking');

create table public.barber_links (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references public.private_barbers (profile_id) on delete cascade,
  kind public.barber_link_kind not null,
  url text not null check (url like 'https://%' and char_length(url) <= 300),
  label text check (label is null or char_length(label) <= 60),
  created_at timestamptz not null default now(),
  unique (barber_id, kind)
);

create index barber_links_barber_idx on public.barber_links (barber_id);

alter table public.barber_links enable row level security;

create policy "barber_links: owner manages"
  on public.barber_links for all
  to authenticated
  using ((select auth.uid()) = barber_id)
  with check ((select auth.uid()) = barber_id);

-- Signed-in users see links of approved barbers only (same visibility rule
-- as the profile itself).
create policy "barber_links: signed-in read approved"
  on public.barber_links for select
  to authenticated
  using (
    barber_id in (
      select pb.profile_id from public.private_barbers pb where pb.status = 'approved'
    )
  );
