---
name: deploy
description: Ship The Guild app to Vercel — preview or production — with the pre-flight checks. Use when asked to deploy, ship, or release.
---

# Deploy workflow

## Pre-flight (always)

1. `pnpm lint && pnpm build && pnpm test` — must pass locally.
2. `pnpm test:security` — anonymous RLS probes against the live project must be green.
3. Pending migrations? Apply them first (`db-migration` skill) — schema must be live **before** code that depends on it.
4. New env vars? Add to Vercel (`vercel env add <NAME> production`) and update `.env.example` + `docs/SETUP.md`. Env changes only take effect on the next deploy.

## Production

`vercel deploy --prod` — GitHub auto-deploy is **not** wired; pushing to `main` alone does not ship. Commit + push first so the deploy matches the repo.

## Post-deploy

- Smoke-test the affected routes with curl (status codes) and one core flow on https://theguildapp.vercel.app.
- The Stripe webhook must answer 400 (not 3xx) to unsigned POSTs at `/api/stripe/webhook`.
- Check runtime errors: Vercel MCP `get_deployment` / `get_runtime_errors`, or `vercel logs <url>`.
- Update `docs/ROADMAP.md` item status to `done`.

## Rollback

`vercel rollback` (or promote the previous deployment in the dashboard). DB migrations don't auto-rollback — write a compensating migration.
