# Roadmap

> Product-management tracker. Statuses: `todo` · `in-progress` · `done` · `blocked`. Update when work lands. One PR should reference one item where possible.

## Phase 0 — Workspace & foundations _(2026-07-08)_

| # | Item | Status |
|---|---|---|
| 0.1 | Repo scaffold (Next.js + TS + Tailwind, pnpm) pushed to `Ekinoxis-evm/theguildapp` | done |
| 0.2 | Supabase project created + linked, MCP scoped to it | done |
| 0.3 | Vercel project created + linked | done |
| 0.4 | Agent workspace: CLAUDE.md, AGENTS.md, `.claude/` skills & agents, `.mcp.json` | done |
| 0.5 | Product docs: PRD, data model, security, roadmap | done |
| 0.6 | Stripe MCP/CLI wired (test mode) — no product usage yet | done |
| 0.7 | Resend account + domain setup | todo |
| 0.8 | Google Maps Platform API key (browser + server, billing on) | todo — **founder** |

## Phase 1 — Auth, onboarding & profiles (B2C core)

| # | Item | Status |
|---|---|---|
| 1.1 | DB migration 001: profiles, roles, legal_acceptances + RLS | todo |
| 1.2 | Terms & Conditions + Privacy Policy pages (v1) + acceptance at signup | todo |
| 1.3 | Auth: email OTP + Google sign-in (Supabase Auth), middleware, protected routes | todo |
| 1.4 | Client onboarding wizard (profile pic → name → phone → location → haircut method → 4 style photos) | todo |
| 1.5 | Private storage buckets (avatars, style-photos) + signed URL access | todo |
| 1.6 | Profile section: edit personal info + My Style photo management | todo |
| 1.7 | Security pass: `get_advisors` clean, RLS tests | todo |

## Phase 2 — Barbershops & bookings

| # | Item | Status |
|---|---|---|
| 2.1 | Migration 002: barbershops, locations, services, staff + RLS | todo |
| 2.2 | Barbershop signup + profile builder (Google Maps place picker for locations) | todo |
| 2.3 | Services portfolio CRUD (name, price, duration) | todo |
| 2.4 | Staff roster (name, email, phone, skills) | todo |
| 2.5 | Client: Barbershops map + shop profile page (services, prices, fulfilled-services count) | todo |
| 2.6 | Booking flow incl. **style-check gate** (confirm/update 4 photos) | todo |
| 2.7 | Bookings section (current + history) + Add-to-calendar (ICS + Google link) | todo |
| 2.8 | Booking notifications: email via Resend + calendar attachment | todo |

## Phase 3 — Private barbers, premium & payments

| # | Item | Status |
|---|---|---|
| 3.1 | Migration 003: private_barbers, coverage_areas + RLS | todo |
| 3.2 | Private barber onboarding (profile, self photo, setup photo, prices, coverage regions) | todo |
| 3.3 | Premium client tier: exact-address collection, at-home booking with private barbers | todo |
| 3.4 | Stripe: checkout for bookings/deposits + premium subscription; webhooks | todo |
| 3.5 | Payout/pricing model decision for private barbers (founder input) | todo |

## Phase 4 — B2B events

| # | Item | Status |
|---|---|---|
| 4.1 | Migration 004: b2b_leads, events, event_registrations + RLS | todo |
| 4.2 | Public B2B lead form → sales notification (Resend) | todo |
| 4.3 | `event_manager` role + event creation with QR registration form | todo |
| 4.4 | Attendee flow: QR → signup → event registration → service claim | todo |
| 4.5 | Events section (current + historical) for attendees | todo |

## Phase 5 — Brand & expansion

| # | Item | Status |
|---|---|---|
| 5.1 | Figma MCP branding pass (founder provides brand package) | todo |
| 5.2 | Spanish (ES) localization | todo |
| 5.3 | Privy integration (wallets) — scope TBD | todo |
| 5.4 | B2B reporting for partner brands | todo |
