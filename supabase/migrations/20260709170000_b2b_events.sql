-- Migration 006: B2B events (roadmap 4.1).
-- Leads come from a PUBLIC form (anon insert, admin-only read). Events are
-- owned by event_manager users (admin-provisioned via set_event_manager).
-- Attendees must hold an account and register through the QR landing page.

-- ============ b2b_leads ============

create type public.lead_status as enum ('new', 'contacted', 'closed');

create table public.b2b_leads (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  contact_name text not null,
  email text not null,
  phone text,
  message text,
  status public.lead_status not null default 'new',
  created_at timestamptz not null default now()
);

alter table public.b2b_leads enable row level security;

-- Public lead capture: insert only, always status 'new'. No select for
-- submitters — the form is fire-and-forget.
create policy "leads: public insert"
  on public.b2b_leads for insert
  to anon, authenticated
  with check (status = 'new');

create policy "leads: admin select"
  on public.b2b_leads for select
  to authenticated
  using ((select public.is_admin()));

create policy "leads: admin update"
  on public.b2b_leads for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ============ events ============

create type public.event_status as enum ('draft', 'live', 'finished');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references public.profiles (id) on delete cascade,
  brand_name text not null,
  title text not null,
  venue text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  qr_slug text not null unique
    default substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
  status public.event_status not null default 'draft',
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index events_manager_idx on public.events (manager_id);

alter table public.events enable row level security;

create policy "events: manager all"
  on public.events for all
  to authenticated
  using ((select auth.uid()) = manager_id)
  with check (
    (select auth.uid()) = manager_id
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role in ('event_manager', 'admin')
    )
  );

-- QR landing page works pre-signup: live events are publicly readable.
create policy "events: live are public"
  on public.events for select
  to anon, authenticated
  using (status = 'live');

-- ============ event_registrations ============

create table public.event_registrations (
  event_id uuid not null references public.events (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  registered_at timestamptz not null default now(),
  service_claimed_at timestamptz,
  primary key (event_id, profile_id)
);

alter table public.event_registrations enable row level security;

-- Attendees keep access to their event history after it finishes.
create policy "events: registered attendees select"
  on public.events for select
  to authenticated
  using (
    id in (
      select r.event_id from public.event_registrations r
      where r.profile_id = (select auth.uid())
    )
  );

create policy "registrations: attendee select own"
  on public.event_registrations for select
  to authenticated
  using ((select auth.uid()) = profile_id);

create policy "registrations: attendee insert for live event"
  on public.event_registrations for insert
  to authenticated
  with check (
    (select auth.uid()) = profile_id
    and service_claimed_at is null
    and event_id in (select e.id from public.events e where e.status = 'live')
  );

create policy "registrations: manager select"
  on public.event_registrations for select
  to authenticated
  using (
    event_id in
      (select e.id from public.events e where e.manager_id = (select auth.uid()))
  );

-- Managers mark services claimed at the activation.
create policy "registrations: manager update"
  on public.event_registrations for update
  to authenticated
  using (
    event_id in
      (select e.id from public.events e where e.manager_id = (select auth.uid()))
  )
  with check (
    event_id in
      (select e.id from public.events e where e.manager_id = (select auth.uid()))
  );

-- Managers need names for the check-in list, but a profiles RLS policy would
-- expose whole rows (phone, location — PII). A definer function returns only
-- the columns managers may see.
create or replace function public.event_attendees(p_event_id uuid)
returns table (
  profile_id uuid,
  first_name text,
  last_name text,
  registered_at timestamptz,
  service_claimed_at timestamptz
)
language sql
security definer
set search_path = ''
stable
as $$
  select r.profile_id, p.first_name, p.last_name, r.registered_at, r.service_claimed_at
  from public.event_registrations r
  join public.profiles p on p.id = r.profile_id
  where r.event_id = p_event_id
    and exists (
      select 1 from public.events e
      where e.id = p_event_id and e.manager_id = auth.uid()
    );
$$;

revoke all on function public.event_attendees(uuid) from public, anon;
grant execute on function public.event_attendees(uuid) to authenticated;

-- ============ Admin provisioning ============

create or replace function public.set_event_manager(user_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid;
begin
  if not (select public.is_admin()) then
    raise exception 'only admins can provision event managers';
  end if;

  select u.id into target from auth.users u where lower(u.email) = lower(user_email);
  if target is null then
    raise exception 'no account with that email — they must sign up first';
  end if;

  perform set_config('app.bypass_role_guard', 'on', true);
  update public.profiles set role = 'event_manager' where id = target and role = 'client';
  if not found then
    raise exception 'account is not a client (role unchanged)';
  end if;
end;
$$;

revoke all on function public.set_event_manager(text) from public, anon;
grant execute on function public.set_event_manager(text) to authenticated;

-- Trigger functions guarded elsewhere; keep RPC surface clean for new ones.
