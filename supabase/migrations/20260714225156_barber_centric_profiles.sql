-- Barber-centric profiles (roadmap 6.1, 6.2, 6.4, 6.5).
-- private_barbers is the professional barber profile — LinkedIn-style,
-- self-managed. Shop enrollment is optional and self-declared
-- (barber_affiliations); some barbers only serve at home, some only work
-- at a shop (offers_home_service=false hides them from at-home booking).

-- ── richer profile fields ───────────────────────────────────────────────────

alter table public.private_barbers
  add column headline text check (char_length(headline) <= 120),
  add column years_experience integer check (years_experience between 0 and 80),
  add column specialties text[] not null default '{}',
  add column offers_home_service boolean not null default true;

-- ── certifications ──────────────────────────────────────────────────────────

create table public.barber_certifications (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references public.private_barbers(profile_id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  issuer text not null check (char_length(issuer) between 1 and 120),
  issued_on date,
  file_path text,
  verified_at timestamptz,
  verified_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index barber_certifications_barber_id_idx
  on public.barber_certifications (barber_id);

alter table public.barber_certifications enable row level security;

create policy "certs: owner all"
  on public.barber_certifications for all
  to authenticated
  using ((select auth.uid()) = barber_id)
  with check ((select auth.uid()) = barber_id);

create policy "certs: approved barber visible"
  on public.barber_certifications for select
  to authenticated
  using (
    barber_id in
      (select pb.profile_id from public.private_barbers pb where pb.status = 'approved')
  );

create policy "certs: admin read"
  on public.barber_certifications for select
  to authenticated
  using (public.is_admin());

-- Verification is admin-only; any owner edit to the substance of a verified
-- cert clears its verification.
create or replace function public.guard_cert_verification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or public.is_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.verified_at := null;
    new.verified_by := null;
    return new;
  end if;
  if new.verified_at is distinct from old.verified_at
     or new.verified_by is distinct from old.verified_by then
    raise exception 'certification verification is admin-only';
  end if;
  if (new.title, new.issuer, new.issued_on, new.file_path)
     is distinct from (old.title, old.issuer, old.issued_on, old.file_path) then
    new.verified_at := null;
    new.verified_by := null;
  end if;
  return new;
end;
$$;

create trigger barber_certifications_guard_verification
  before insert or update on public.barber_certifications
  for each row execute function public.guard_cert_verification();

create or replace function public.verify_certification(cert_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  update public.barber_certifications
     set verified_at = now(),
         verified_by = (select auth.uid())
   where id = cert_id;
end;
$$;

-- ── shop affiliations (optional, self-declared, with history) ───────────────

create table public.barber_affiliations (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references public.private_barbers(profile_id) on delete cascade,
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  role_title text check (char_length(role_title) <= 80),
  started_on date not null default current_date,
  ended_on date check (ended_on is null or ended_on >= started_on),
  created_at timestamptz not null default now()
);

create index barber_affiliations_barber_id_idx
  on public.barber_affiliations (barber_id);
create index barber_affiliations_barbershop_id_idx
  on public.barber_affiliations (barbershop_id);
-- One open enrollment per barber+shop at a time.
create unique index barber_affiliations_current_key
  on public.barber_affiliations (barber_id, barbershop_id)
  where ended_on is null;

alter table public.barber_affiliations enable row level security;

create policy "affiliations: owner all"
  on public.barber_affiliations for all
  to authenticated
  using ((select auth.uid()) = barber_id)
  with check (
    (select auth.uid()) = barber_id
    -- only approved shops can be claimed
    and barbershop_id in
      (select b.id from public.barbershops b where b.status = 'approved')
  );

create policy "affiliations: approved barber visible"
  on public.barber_affiliations for select
  to authenticated
  using (
    barber_id in
      (select pb.profile_id from public.private_barbers pb where pb.status = 'approved')
  );

create policy "affiliations: admin read"
  on public.barber_affiliations for select
  to authenticated
  using (public.is_admin());

-- ── certification documents bucket (private; owner + admin only) ────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('barber-certs', 'barber-certs', false, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

create policy "barber certs: owner all"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'barber-certs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'barber-certs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Documents may carry personal data: the public sees the badge, not the
-- file. Admin reads for verification.
create policy "barber certs: admin read"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'barber-certs' and public.is_admin());

-- ── lock down helper functions ──────────────────────────────────────────────

revoke execute on function public.guard_cert_verification() from anon, authenticated, public;
revoke execute on function public.verify_certification(uuid) from anon, public;
