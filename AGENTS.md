# AGENTS.md — The Guild App

Instructions for AI coding agents. The canonical, detailed version is [`CLAUDE.md`](CLAUDE.md) — read it first. Summary:

- **Product spec**: `docs/PRODUCT.md` (source of truth) · **Plan**: `docs/ROADMAP.md` · **Schema**: `docs/DATA_MODEL.md` · **Security rules**: `docs/SECURITY.md` · **Env/tooling**: `docs/SETUP.md`
- Stack: Next.js App Router + TypeScript + Tailwind, Supabase (Postgres/Auth/Storage), Vercel, Stripe (live, test mode — hosted Checkout + $19.99/mo premium subscription + webhook), Google Maps, Resend.
- **Brand is live** (2026-07-20): guild-black `#0B0B0C` dominates, guild-yellow `#FFC300` intervenes, bone for light reading; sharp corners; role-aware bottom nav in `(app)/layout.tsx`; display font behind `--font-display` (KUMO pending). Brand sources live in `../BRANDING/` outside the repo — never commit them.
- Test accounts: `pnpm seed:test-users` — one per role (founder-inbox plus-aliases); passwords in `.env.local`. Role-choice entry for new users at `/welcome`.
- Barber-centric: `private_barbers` is a self-managed professional profile (certifications, optional shop enrollment, at-home flag); premium gates only at-home booking.
- Every table needs RLS in its creation migration. All storage buckets are private (signed URLs); cert documents readable by owner + admin only. Exact addresses only for premium users, never exposed publicly.
- Payment/subscription columns are written only by the Stripe webhook (service-role); DB triggers block authenticated writes. Never trust client-supplied prices — re-read from DB.
- Schema changes only via `supabase/migrations/` (CLI hangs → Supabase MCP `apply_migration` with same SQL+name); regenerate `src/lib/database.types.ts` after; add a `tests/security` RLS probe per new table/bucket.
- Before commit: `pnpm build` + `pnpm lint` + `pnpm test`. Before deploy: `pnpm test:security`. Deploy with `vercel deploy --prod`. Update `docs/ROADMAP.md` when a feature lands.
