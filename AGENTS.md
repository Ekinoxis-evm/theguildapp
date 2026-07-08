# AGENTS.md — The Guild App

Instructions for AI coding agents. The canonical, detailed version is [`CLAUDE.md`](CLAUDE.md) — read it first. Summary:

- **Product spec**: `docs/PRODUCT.md` (source of truth) · **Plan**: `docs/ROADMAP.md` · **Schema**: `docs/DATA_MODEL.md` · **Security rules**: `docs/SECURITY.md`
- Stack: Next.js App Router + TypeScript + Tailwind, Supabase (Postgres/Auth/Storage), Vercel, Stripe (Phase 2), Google Maps.
- Every table needs RLS in its creation migration. Style photos = private bucket + signed URLs. Exact addresses only for premium users, never exposed publicly.
- Schema changes only via `supabase/migrations/`; regenerate `src/lib/database.types.ts` after.
- `pnpm build` must pass before committing. Update `docs/ROADMAP.md` when a feature lands.
