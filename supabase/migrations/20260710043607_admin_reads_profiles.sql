-- Admin (founder) needs applicant names/contact for shop and barber
-- approvals, and general account administration.
create policy "profiles: admin select"
  on public.profiles for select
  to authenticated
  using ((select public.is_admin()));
