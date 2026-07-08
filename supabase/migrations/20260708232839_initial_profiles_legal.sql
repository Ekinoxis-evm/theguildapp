-- Migration 001: identity foundation — profiles + legal acceptances.
-- Contract: docs/DATA_MODEL.md, security rules: docs/SECURITY.md.
-- Every table: RLS enabled here, default deny, narrow policies only.

-- ============ Enums ============

create type public.user_role as enum (
  'client',
  'barbershop_owner',
  'private_barber',
  'event_manager',
  'admin'
);

create type public.client_tier as enum ('standard', 'premium');

create type public.haircut_method as enum ('scissors', 'machine', 'mixed');

create type public.legal_document as enum ('terms', 'privacy');

-- ============ profiles ============
-- 1:1 with auth.users. Created automatically on signup via trigger.
-- Coarse location (country/state/city/zip) lives here; exact street
-- addresses (premium only) get their own harder-locked table later.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'client',
  tier public.client_tier not null default 'standard',
  first_name text,
  last_name text,
  phone text,
  avatar_path text,
  haircut_method public.haircut_method,
  country text,
  state text,
  city text,
  zip_code text,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: owner can read own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles: owner can update own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Role/tier self-escalation guard: column-level, enforced by trigger
-- (RLS with_check cannot compare old vs new values).
create or replace function public.prevent_role_tier_self_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role or new.tier is distinct from old.tier then
    -- service_role bypasses RLS and triggers run for it too; allow only
    -- requests not made through the authenticated PostgREST path.
    if (select auth.uid()) is not null then
      raise exception 'role and tier cannot be changed by the user';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_guard_role_tier
  before update on public.profiles
  for each row execute function public.prevent_role_tier_self_change();

-- No insert/delete policies: rows are created by the signup trigger
-- (security definer) and removed via auth.users cascade only.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============ legal_acceptances ============
-- Append-only record of T&C / privacy acceptance, per document version.

create table public.legal_acceptances (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  document public.legal_document not null,
  version text not null,
  accepted_at timestamptz not null default now(),
  unique (profile_id, document, version)
);

create index legal_acceptances_profile_idx
  on public.legal_acceptances (profile_id);

alter table public.legal_acceptances enable row level security;

create policy "legal: owner can read own"
  on public.legal_acceptances for select
  to authenticated
  using ((select auth.uid()) = profile_id);

create policy "legal: owner can insert own"
  on public.legal_acceptances for insert
  to authenticated
  with check ((select auth.uid()) = profile_id);

-- Append-only: no update/delete policies.
