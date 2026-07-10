-- Admins review barbershop applications, so they need to read shops in any
-- status (approve_barbershop() already gates the actual approval).

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create policy "barbershops: admin select"
  on public.barbershops for select
  to authenticated
  using ((select public.is_admin()));
