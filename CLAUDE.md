# CLAUDE.md — The Guild App

Premium barbershop platform, **barber-centric**: barbers are self-managed professional profiles (certifications, shop enrollment, at-home service); B2C bookings are paid in full upfront via Stripe; B2B event activations. Read `docs/PRODUCT.md` before building any feature — it is the source of truth for requirements. Track all work against `docs/ROADMAP.md`. Production: https://theguildapp.vercel.app (Phases 0–4 + Stripe + barber-centric MVP live).

## Stack

- **Next.js** (App Router, TypeScript, Tailwind CSS, `src/` dir, `@/*` imports) on **Vercel**
- **Supabase**: Postgres + RLS, Auth (email OTP live; Google coded behind `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED`), Storage (style photos, avatars, barber photos, cert documents — all private buckets)
- **Stripe** (live, test mode): hosted Checkout Sessions only — bookings paid upfront, premium $19.99/mo subscription, Customer Portal, signature-verified webhook at `src/app/api/stripe/webhook`. **Always load the `stripe:stripe-best-practices` skill before touching Stripe code.**
- **Google Maps Platform**: places autocomplete, shop map, navigation links
- **Resend**: transactional email (payment/booking confirmations + ICS, lead alerts), best-effort via `src/lib/email.ts`. **Privy**: deferred.

## Commands

```bash
pnpm dev              # local dev server
pnpm build            # production build — run before pushing
pnpm lint             # eslint
pnpm test             # offline unit tests (tests/unit/)
pnpm test:security    # anon RLS probes vs live DB (tests/security/) — run after schema changes
vercel deploy --prod  # production deploy (GitHub auto-deploy not wired)
supabase migration new <name>   # create migration in supabase/migrations/
supabase db push      # apply migrations — CLI hangs sometimes; fall back to
                      # supabase MCP apply_migration with the SAME sql + name
supabase gen types typescript --linked > src/lib/database.types.ts   # or MCP generate_typescript_types
```

## Hard rules

1. **Security first.** User style photos, addresses, and phone numbers are sensitive PII.
   - Every table gets RLS enabled in the same migration that creates it. No exceptions.
   - Style photos and certification documents live in **private** storage buckets; access via signed URLs only (cert docs: owner + admin read only — the public sees the badge, never the file).
   - Exact street addresses are collected only for premium users; never expose them in any list/map endpoint.
   - **Payment/subscription truth is webhook-only**: `bookings` payment columns and `profiles` tier/Stripe columns are written exclusively by the Stripe webhook through the service-role client (`src/lib/supabase/admin.ts`); DB triggers strip/reject them on any authenticated write. Never weaken those triggers; never trust a client-supplied price — re-read `price_cents` from the DB before creating a Checkout Session (`src/lib/booking-checkout.ts`, deliberately NOT a server action).
   - Never put secrets in client code. `NEXT_PUBLIC_*` only for genuinely public values (Supabase URL, publishable key, Maps browser key).
2. **Schema changes only through migrations** in `supabase/migrations/` — never `execute_sql` DDL against prod directly. Use the `db-migration` skill.
3. **Regenerate DB types** after every migration (command above); commit them.
4. **Update the docs you touch**: feature work updates `docs/ROADMAP.md` status; schema work updates `docs/DATA_MODEL.md`; new decisions go in `docs/DECISIONS.md`.
5. Both B2C signup flows require Terms & Conditions + Privacy Policy acceptance — record it (`legal_acceptances` table) with timestamp and document version.

## Conventions

- Server Components by default; Client Components only when interactive.
- Data access through Supabase clients in `src/lib/supabase/` (`client.ts` browser, `server.ts` server/RSC using `@supabase/ssr`). Never instantiate ad-hoc clients elsewhere.
- Auth-gated routes live under `src/app/(app)/`; public marketing/legal under `src/app/(public)/`.
- Roles: a user has one account, `profiles.role` ∈ `client | barbershop_owner | private_barber | event_manager | admin`; clients have `tier` ∈ `standard | premium` (premium = Stripe subscription via `/premium`, or manual admin grant — webhook downgrade never touches manual grants).
- **Barber-centric model** (2026-07-14): `private_barbers` is the general professional profile (headline, specialties, certifications, optional `barber_affiliations` shop enrollment, `offers_home_service` flag). Barber directory/profiles are open to all signed-in users; premium gates only the at-home booking action.
- Mutations are client-side under RLS (browser Supabase client) with SECURITY DEFINER RPCs for privileged ops; there are no server actions in `my-barber/`/`admin/`. The Stripe flows (booking actions, `/premium`, webhook) are the server-side exception.
- Minimal, monochrome UI for now (black/white/gold accent) — real branding lands later via Figma MCP. Do not invest in decorative styling yet.
- English-only copy for MVP, but no hardcoded strings in components deeper than page level where practical — keeps the later ES translation cheap.

## MCP servers (`.mcp.json`)

- **supabase** — scoped to this project's ref. Prefer `list_tables`/`get_advisors`/`get_logs` for inspection; migrations still go through the CLI + git.
- **vercel** — deployments, logs, env vars.
- **stripe** — Phase 2; authenticate via `/mcp` when needed.

## Workflow

1. Pick/confirm a roadmap item → break it down (use tasks).
2. Migrations first, then types, then UI. Verify RLS with `get_advisors` (security) after schema changes, and add a `tests/security` probe for every new table/bucket.
3. `pnpm build` + `pnpm lint` + `pnpm test` must pass before commit; run `pnpm test:security` before deploy.
4. Deploy with `vercel deploy --prod` (GitHub auto-deploy not wired), then smoke-check the affected routes.
5. After a feature ships: update `docs/ROADMAP.md`, note anything non-obvious in `docs/DECISIONS.md`; schema work updates `docs/DATA_MODEL.md`.
