---
name: db-migration
description: Create and apply a Supabase schema change for The Guild the safe way — migration file, RLS, types regen, advisors check, security probe. Use for ANY database schema change (new table, column, policy, index, bucket).
---

# Database migration workflow

Never run DDL directly against the remote project (no ad-hoc `execute_sql` for schema). Always:

1. **Design first**: check `docs/DATA_MODEL.md` — does the change fit the documented model? Update the doc in the same commit.
2. **Create the migration file** in `supabase/migrations/` named `<YYYYMMDDHHMMSS>_<snake_name>.sql` (`supabase migration new <name>`, or `date -u +%Y%m%d%H%M%S` for the timestamp when the CLI hangs).
3. **RLS is part of the table, not a follow-up.** In the same migration:
   ```sql
   alter table <t> enable row level security;
   -- then narrow policies; default is deny
   ```
   PII rules live in `docs/SECURITY.md`. Columns that only trusted server code may write (payments, subscriptions, verifications) get strip-on-insert + reject-on-update triggers for authenticated sessions — the service-role path (`auth.uid() is null`) is the writer.
4. **Apply**: `supabase db push`. The CLI hangs intermittently — the equivalent fallback is Supabase MCP `apply_migration` with the **same name and SQL** (it records migration history identically).
5. **Regenerate types** and commit them: `supabase gen types typescript --linked > src/lib/database.types.ts`, or MCP `generate_typescript_types` when the CLI stalls.
6. **Verify**: Supabase MCP `get_advisors` (type `security`, then `performance`) — resolve or document every finding. Accepted standing WARNs are listed in `docs/SECURITY.md`.
7. **Add a probe**: every new table/bucket/RPC gets an anonymous-access assertion in `tests/security/anon-rls.test.ts`; run `pnpm test:security`.
8. Storage buckets: create via migration (`insert into storage.buckets ... public = false`) — all user-content buckets are **private**; access via signed URLs. Path convention `{auth.uid()}/...` with owner-scoped policies.
