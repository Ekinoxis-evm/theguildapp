# CLAUDE.md — The Guild App

Premium barbershop platform: B2C bookings (barbershops + private barbers) and B2B event activations. Read `docs/PRODUCT.md` before building any feature — it is the source of truth for requirements. Track all work against `docs/ROADMAP.md`.

## Stack

- **Next.js** (App Router, TypeScript, Tailwind CSS, `src/` dir, `@/*` imports) on **Vercel**
- **Supabase**: Postgres + RLS, Auth (email OTP + Google), Storage (style photos, avatars)
- **Stripe** (Phase 2+): booking payments, premium subscriptions
- **Google Maps Platform**: places autocomplete, shop map, navigation links
- **Resend** (pending): transactional email. **Privy**: deferred.

## Commands

```bash
pnpm dev              # local dev server
pnpm build            # production build — run before pushing
pnpm lint             # eslint
supabase migration new <name>   # create migration in supabase/migrations/
supabase db push      # apply migrations to linked remote project
supabase gen types typescript --linked > src/lib/database.types.ts
```

## Hard rules

1. **Security first.** User style photos, addresses, and phone numbers are sensitive PII.
   - Every table gets RLS enabled in the same migration that creates it. No exceptions.
   - Style photos live in a **private** storage bucket; access via signed URLs only.
   - Exact street addresses are collected only for premium users; never expose them in any list/map endpoint.
   - Never put secrets in client code. `NEXT_PUBLIC_*` only for genuinely public values (Supabase URL, publishable key, Maps browser key).
2. **Schema changes only through migrations** in `supabase/migrations/` — never `execute_sql` DDL against prod directly. Use the `db-migration` skill.
3. **Regenerate DB types** after every migration (command above); commit them.
4. **Update the docs you touch**: feature work updates `docs/ROADMAP.md` status; schema work updates `docs/DATA_MODEL.md`; new decisions go in `docs/DECISIONS.md`.
5. Both B2C signup flows require Terms & Conditions + Privacy Policy acceptance — record it (`legal_acceptances` table) with timestamp and document version.

## Conventions

- Server Components by default; Client Components only when interactive.
- Data access through Supabase clients in `src/lib/supabase/` (`client.ts` browser, `server.ts` server/RSC using `@supabase/ssr`). Never instantiate ad-hoc clients elsewhere.
- Auth-gated routes live under `src/app/(app)/`; public marketing/legal under `src/app/(public)/`.
- Roles: a user has one account, `profiles.role` ∈ `client | barbershop_owner | private_barber | event_manager | admin`; clients have `tier` ∈ `standard | premium`.
- Minimal, monochrome UI for now (black/white/gold accent) — real branding lands later via Figma MCP. Do not invest in decorative styling yet.
- English-only copy for MVP, but no hardcoded strings in components deeper than page level where practical — keeps the later ES translation cheap.

## MCP servers (`.mcp.json`)

- **supabase** — scoped to this project's ref. Prefer `list_tables`/`get_advisors`/`get_logs` for inspection; migrations still go through the CLI + git.
- **vercel** — deployments, logs, env vars.
- **stripe** — Phase 2; authenticate via `/mcp` when needed.

## Workflow

1. Pick/confirm a roadmap item → break it down (use tasks).
2. Migrations first, then types, then UI. Verify RLS with `get_advisors` (security) after schema changes.
3. `pnpm build` must pass before commit. Push to a branch, PR to `main`, Vercel preview verifies, then merge.
4. After a feature ships: update `docs/ROADMAP.md`, note anything non-obvious in `docs/DECISIONS.md`.
