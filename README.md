<div align="center">

# THE GUILD — Grooming Standard

**Premium barbershop platform · B2C bookings + B2B event activations**

Built with Next.js · Supabase · Vercel · Stripe

</div>

---

## What is this?

The Guild is a premium men's grooming brand (Miami-born, black & gold, industrial design) with two business lines:

- **B2C** — Clients discover barbershops and private barbers on a map, book appointments, and manage their haircut style profile (reference photos of their current cut). Barbershops and private barbers manage their profile, services, prices, staff, and coverage areas.
- **B2B** — Brands hire The Guild for event activations (e.g. Inter Miami match-day pop-ups). Event managers create QR check-in forms; attendees sign up to claim their grooming service.

Full product spec: [`docs/PRODUCT.md`](docs/PRODUCT.md) · Roadmap: [`docs/ROADMAP.md`](docs/ROADMAP.md)

## Stack

| Layer | Technology |
|---|---|
| Frontend + API | Next.js (App Router, TypeScript, Tailwind CSS) |
| Database, Auth, Storage | Supabase (Postgres + RLS, Auth with email OTP + Google, Storage for style photos) |
| Hosting | Vercel |
| Payments (Phase 2) | Stripe |
| Maps | Google Maps Platform |
| Email | Resend (pending setup) |
| Wallets (later) | Privy (deferred) |

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in values — see docs/SETUP.md
pnpm dev
```

## Repo map

```
src/                 Next.js app (App Router)
supabase/            Database migrations + local config
docs/                Product docs — PRD, data model, roadmap, security
.claude/             Claude Code workspace: skills, agents, settings
.mcp.json            MCP servers (Supabase, Vercel, Stripe) for AI agents
CLAUDE.md            Instructions for AI coding agents (canonical)
AGENTS.md            Same, for non-Claude agents
```

## Development workflow

1. Every change starts from a `docs/ROADMAP.md` item — keep it updated.
2. Database changes go through `supabase/migrations/` (never edit prod schema directly). See `.claude/skills/db-migration/`.
3. Deploys: push to `main` → Vercel preview → promote. See `.claude/skills/deploy/`.
4. All tables must have Row Level Security enabled — user photos and addresses are sensitive PII. See `docs/SECURITY.md`.

## Environments

| | URL | Notes |
|---|---|---|
| Production | TBD (Vercel) | `main` branch |
| Preview | per-PR Vercel URLs | every push |
| Local | http://localhost:3000 | `pnpm dev` |
