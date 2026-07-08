-- Trigger functions must not be callable through the PostgREST RPC API
-- (flagged by security advisor 0028/0029). They only run via triggers,
-- which execute as the table owner regardless of these grants.

revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.prevent_role_tier_self_change() from anon, authenticated, public;
revoke execute on function public.set_updated_at() from anon, authenticated, public;

-- Default for future functions in this schema: no public execute.
alter default privileges in schema public revoke execute on functions from anon, authenticated, public;
