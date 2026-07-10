-- The attendee-history policy on events queried event_registrations, whose
-- policies query events back — infinite recursion (42P17), caught by the
-- Phase 4 RLS tests. A security definer helper reads registrations without
-- re-entering RLS, breaking the cycle (same pattern as my_shop_ids).

drop policy "events: registered attendees select" on public.events;

create or replace function public.my_event_ids()
returns setof uuid
language sql
security definer
set search_path = ''
stable
as $$
  select r.event_id from public.event_registrations r where r.profile_id = auth.uid();
$$;

revoke all on function public.my_event_ids() from public, anon;
grant execute on function public.my_event_ids() to authenticated;

create policy "events: registered attendees select"
  on public.events for select
  to authenticated
  using (id in (select public.my_event_ids()));
