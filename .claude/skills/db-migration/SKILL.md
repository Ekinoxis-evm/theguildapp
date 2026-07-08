---
name: db-migration
description: Create and apply a Supabase schema change for The Guild the safe way — migration file, RLS, types regen, advisors check. Use for ANY database schema change (new table, column, policy, index, bucket).
---

# Database migration workflow

Never run DDL directly against the remote project (no `execute_sql` for schema). Always:

1. **Design first**: check `docs/DATA_MODEL.md` — does the change fit the documented model? Update the doc in the same PR.
2. **Create the migration**:
   ```bash
   supabase migration new <snake_case_name>
   ```
   Write SQL in the generated file under `supabase/migrations/`.
3. **RLS is part of the table, not a follow-up.** In the same migration:
   ```sql
   alter table <t> enable row level security;
   -- then narrow policies; default is deny
   ```
   PII rules live in `docs/SECURITY.md` — photos/addresses/phones are owner-only plus explicit booking-scoped grants.
4. **Apply**: `supabase db push`
5. **Regenerate types** and commit them:
   ```bash
   supabase gen types typescript --linked > src/lib/database.types.ts
   ```
6. **Verify**: Supabase MCP `get_advisors` (type `security`, then `performance`) — resolve or document every finding.
7. Storage buckets: create via migration (`insert into storage.buckets ... public = false`) — all user-content buckets are **private**; access via signed URLs.
