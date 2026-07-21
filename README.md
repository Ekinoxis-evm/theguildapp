<div align="center">

# THE GUILD — Grooming Standard

**Premium barbershop platform · B2C bookings + B2B event activations**

Built with Next.js · Supabase · Vercel · Stripe

</div>

---

## What is this?

The Guild is a premium men's grooming brand (Miami-born, black & gold, industrial design) with two business lines:

- **B2C** — Clients discover barbershops on a map and browse the **barber directory** — every Guild barber has a self-managed, LinkedIn-style professional profile (headline, specialties, certifications with a Guild-verified badge, shop enrollment history). Clients book and **pay in full upfront via Stripe**; premium subscribers ($19.99/mo) can book at-home service from barbers who offer it. Everyone manages a haircut style profile (4 reference photos of their current cut).
- **B2B** — Brands hire The Guild for event activations (e.g. Inter Miami match-day pop-ups). Event managers create QR check-in forms; attendees sign up to claim their grooming service. Public lead form at `/partners`.

**Status:** Phases 0–4 + Stripe payments + barber-centric profiles + the **full brand pass** are live in production (test-mode payments). The app is role-complete: branded landing → role-choice entry (`/welcome`) → per-role dashboards with mobile bottom navigation, every surface on the black/gold brand system. One seeded test account per role exists for end-to-end testing (`pnpm seed:test-users`; credentials in `.env.local` and the team Notion). See [`docs/ROADMAP.md`](docs/ROADMAP.md) for the item-by-item state and what's next.

Full product spec: [`docs/PRODUCT.md`](docs/PRODUCT.md) · Roadmap: [`docs/ROADMAP.md`](docs/ROADMAP.md)

## Stack

| Layer | Technology |
|---|---|
| Frontend + API | Next.js (App Router, TypeScript, Tailwind CSS) |
| Database, Auth, Storage | Supabase (Postgres + RLS, Auth with email OTP; Google sign-in coded, awaiting OAuth client) |
| Hosting | Vercel |
| Payments | Stripe — hosted Checkout (bookings paid upfront), $19.99/mo premium subscription, signature-verified webhook. Test mode until launch |
| Maps | Google Maps Platform (Places autocomplete, shop map, navigation links) |
| Email | Resend (booking/payment confirmations with calendar invites, B2B lead alerts) |
| Tests | Vitest — `pnpm test` (unit) + `pnpm test:security` (anonymous RLS probes vs live DB) |
| Wallets (later) | Privy (deferred) |

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in values — see docs/SETUP.md
pnpm dev
```

## Repo map

```
src/                 Next.js app (App Router); Stripe webhook at src/app/api/stripe/webhook
supabase/            Database migrations (13 applied) + local config
tests/               Vitest — unit/ (offline) + security/ (anon RLS probes)
docs/                Product docs — PRD, data model, roadmap, decisions, security, setup
.claude/             Claude Code workspace: skills, agents, settings
.mcp.json            MCP servers (Supabase, Vercel, Stripe) for AI agents
CLAUDE.md            Instructions for AI coding agents (canonical)
AGENTS.md            Same, for non-Claude agents
```

## Development workflow

1. Every change starts from a `docs/ROADMAP.md` item — keep it updated.
2. Database changes go through `supabase/migrations/` (never edit prod schema directly); regenerate `src/lib/database.types.ts` after.
3. Before every deploy: `pnpm build` + `pnpm lint` + `pnpm test` + `pnpm test:security`.
4. Deploys: `vercel deploy --prod` (GitHub auto-deploy is not wired).
5. All tables must have Row Level Security enabled — user photos and addresses are sensitive PII. See `docs/SECURITY.md`.

## Environments

| | URL | Notes |
|---|---|---|
| Production | https://theguildapp.vercel.app | deployed from `main` via `vercel deploy --prod` |
| Local | http://localhost:3000 | `pnpm dev` |
