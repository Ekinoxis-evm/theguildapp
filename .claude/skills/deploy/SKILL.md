---
name: deploy
description: Ship The Guild app to Vercel — preview or production — with the pre-flight checks. Use when asked to deploy, ship, or release.
---

# Deploy workflow

## Pre-flight (always)

1. `pnpm lint && pnpm build` — must pass locally.
2. Pending migrations? Apply them first (`db-migration` skill) — schema must be live **before** code that depends on it.
3. New env vars? Add to Vercel (`vercel env add <NAME> production`) and update `.env.example` + `docs/SETUP.md`.

## Preview

Push the branch — Vercel builds a preview per commit. Or manually: `vercel`.

## Production

Merge PR into `main` (preferred — keeps history clean) or `vercel --prod` for a hotfix.

## Post-deploy

- Check the deployment: Vercel MCP `get_deployment` / `get_runtime_errors`, or `vercel logs <url>`.
- Smoke-test auth + one core flow on the deployed URL.
- Update `docs/ROADMAP.md` item status to `done`.

## Rollback

`vercel rollback` (or promote the previous deployment in the dashboard). DB migrations don't auto-rollback — write a compensating migration.
