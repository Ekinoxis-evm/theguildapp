# Environment & Tooling Setup

## Environments (the ambient architecture)

Two deployed ambients, one Vercel project, env vars scoped per environment:

| Ambient | URL | Git | Supabase project | Stripe | Data |
|---|---|---|---|---|---|
| **Production** | theguildapp.vercel.app | `main` | `jkpxoasqextvneuixzmz` (prod) | test mode now → **live keys at launch** | real users only |
| **Demo** | stable preview URL of the `demo` branch (aliasable to e.g. `demo-theguildapp.vercel.app`) | `demo` | `theguildapp-demo` (separate project) | **always test mode** | seeded dummies — safe to reset/trash |
| Local dev | localhost:3000 | any | demo project by default | test mode | same seed |

Rules:

- **Vercel env scoping is the switch**: Production-scoped vars point at the prod Supabase + (later) live Stripe; Preview-scoped vars point at the demo Supabase + test Stripe. `vercel env add <NAME> production` / `vercel env add <NAME> preview`. Code never branches on environment — it just reads its env.
- **Migrations flow demo-first**: apply every migration to the demo project, verify, then to prod (`supabase link --project-ref <ref>` per target, `supabase db push`; MCP `apply_migration` fallback). Both projects always share the same schema version.
- **Seeding**: `pnpm seed:test-users` targets whatever `ENV_FILE` points at (default `.env.local`). Demo: keep a `.env.demo` (never committed) with the demo project's URL/keys and run `pnpm seed:demo`. Once the demo ambient exists, the role test accounts live THERE — prod gets cleaned of them before launch.
- Stripe live keys only ever enter **Production** env vars. The demo ambient stays on test mode forever — demo checkout uses card `4242 4242 4242 4242`.

## Prerequisites (already installed on the founder's machine)

- Node 24 + pnpm 10 · Supabase CLI · Vercel CLI · Stripe CLI · gh CLI — all authenticated.

## Environment variables

Copy `.env.example` → `.env.local` and fill in:

| Variable | Where to get it | Scope |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API | public |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | same (publishable `sb_publishable_...` key) | public |
| `SUPABASE_SECRET_KEY` | same (secret `sb_secret_...` key) — **server only**; powers the Stripe webhook + customer linking (bypasses RLS) | secret |
| `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY` | Google Cloud Console (Maps JS + Places, HTTP-referrer restricted) | public |
| `GOOGLE_MAPS_SERVER_KEY` | Google Cloud Console (Geocoding, IP-restricted) | secret |
| `STRIPE_SECRET_KEY` | Stripe dashboard (test mode until launch) — **server only** | secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe dashboard (`pk_...` — never the `sk_` secret key). Unused while Checkout is Stripe-hosted; reserved for embedded elements | public |
| `STRIPE_WEBHOOK_SECRET` | prod: webhook endpoint in Stripe dashboard → Webhooks; local: `stripe listen --forward-to localhost:3000/api/stripe/webhook` | secret |
| `STRIPE_PREMIUM_PRICE_ID` | Stripe dashboard → Products → The Guild Premium ($19.99/mo, lookup key `premium_monthly`) | secret |
| `RESEND_API_KEY` | resend.com after domain setup (Phase 0.7) | Phase 2 |

Sync with Vercel: `vercel env pull .env.local` / add prod vars with `vercel env add`.

## Testing

```bash
pnpm test            # offline unit tests (tests/unit/) — pure logic: format, ICS
pnpm test:security   # anonymous RLS probes against the live project (tests/security/)
                     # read-only; asserts anon users see zero sensitive rows,
                     # cannot write, cannot call admin RPCs, buckets stay private
```

Run both before every deploy alongside `pnpm build` + `pnpm lint`. Add a
`tests/security` probe whenever a migration adds a table or bucket.

## MCP servers (for AI agents — `.mcp.json`, project scope)

- `supabase` → `https://mcp.supabase.com/mcp?project_ref=<ref>` (OAuth on first use)
- `vercel` → `https://mcp.vercel.com` (OAuth)
- `stripe` → `https://mcp.stripe.com` (OAuth; authenticate when Phase 3 starts)

Claude Code plugins already provide Supabase/Vercel/Stripe skills; `.claude/skills/` adds the project-specific workflows.

## Supabase local ↔ remote

```bash
supabase link --project-ref <ref>     # once per machine
supabase migration new <name>         # write SQL in the generated file
supabase db push                      # apply to remote
supabase gen types typescript --linked > src/lib/database.types.ts
```

## Deploy

```bash
vercel                # preview
vercel --prod         # production (normally: merge to main instead)
```
