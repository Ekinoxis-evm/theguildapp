-- Trigger functions from the Phase 2 migrations must not be RPC-callable
-- (advisor 0028/0029), same hardening as 20260708233044. The remaining
-- definer functions (approve_barbershop, link_staff_by_email, my_shop_ids)
-- keep authenticated EXECUTE intentionally: they enforce their own auth
-- internally and are used by the app / RLS policies.

revoke execute on function public.prevent_shop_status_self_change() from anon, authenticated, public;
revoke execute on function public.guard_booking_update() from anon, authenticated, public;
revoke execute on function public.bump_fulfilled_counter() from anon, authenticated, public;

-- Belt-and-braces: definer helpers must never be anon-callable.
revoke execute on function public.approve_barbershop(uuid) from anon, public;
revoke execute on function public.link_staff_by_email() from anon, public;
revoke execute on function public.my_shop_ids() from anon, public;
