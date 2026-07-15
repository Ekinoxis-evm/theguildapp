# AGENTS.md — The Guild App

Instructions for AI coding agents. The canonical, detailed version is [`CLAUDE.md`](CLAUDE.md) — read it first. Summary:

- **Product spec**: `docs/PRODUCT.md` (source of truth) · **Plan**: `docs/ROADMAP.md` · **Schema**: `docs/DATA_MODEL.md` · **Security rules**: `docs/SECURITY.md` · **Env/tooling**: `docs/SETUP.md`
- Stack: Next.js App Router + TypeScript + Tailwind, Supabase (Postgres/Auth/Storage), Vercel, Stripe (live, test mode — hosted Checkout + $19.99/mo premium subscription + webhook), Google Maps, Resend.
- Barber-centric: `private_barbers` is a self-managed professional profile (certifications, optional shop enrollment, at-home flag); premium gates only at-home booking.
- Every table needs RLS in its creation migration. All storage buckets are private (signed URLs); cert documents readable by owner + admin only. Exact addresses only for premium users, never exposed publicly.
- Payment/subscription columns are written only by the Stripe webhook (service-role); DB triggers block authenticated writes. Never trust client-supplied prices — re-read from DB.
- Schema changes only via `supabase/migrations/` (CLI hangs → Supabase MCP `apply_migration` with same SQL+name); regenerate `src/lib/database.types.ts` after; add a `tests/security` RLS probe per new table/bucket.
- Before commit: `pnpm build` + `pnpm lint` + `pnpm test`. Before deploy: `pnpm test:security`. Deploy with `vercel deploy --prod`. Update `docs/ROADMAP.md` when a feature lands.
