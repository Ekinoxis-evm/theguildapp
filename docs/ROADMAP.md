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
| 0.7 | Resend: use founder's existing account — API key needed when Phase 2 emails ship | done — RESEND_API_KEY + SALES_EMAIL in Vercel (2026-07-10) |
| 0.8 | Google Maps Platform API key + Google OAuth client (one Google Cloud Console sitting covers both) | Maps keys done (2026-07-10); OAuth client + Supabase provider config still **founder** |

## Phase 1 — Auth, onboarding & profiles (B2C core)

| # | Item | Status |
|---|---|---|
| 1.1 | DB migration 001: profiles, roles, legal_acceptances + RLS | done |
| 1.2 | Terms & Conditions + Privacy Policy pages (v1 placeholder — needs counsel review) + acceptance at signup | done |
| 1.3 | Auth: email OTP live; Google sign-in coded behind `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED`, blocked on Google OAuth credentials (item 0.8) | done (Google off) |
| 1.4 | Client onboarding wizard (profile pic → name → phone → location → haircut method → 4 style photos) | done |
| 1.5 | Private storage buckets (avatars, style-photos) + signed URL access | done |
| 1.6 | Profile section: edit personal info + My Style photo management | done |
| 1.7 | Security pass: `get_advisors` clean, RLS tests | done — anon + cross-user probes pass; 2 advisor WARNs remain (leaked-password protection, MFA options — **founder** dashboard toggles, N/A while OTP-only) |

## Phase 2 — Barbershops & bookings

| # | Item | Status |
|---|---|---|
| 2.1 | Migration 002: barbershops, locations, services, staff + RLS | done |
| 2.2 | Barbershop signup + profile builder (Google Maps place picker for locations) | done — incl. Places autocomplete (manual entry fallback) |
| 2.3 | Services portfolio CRUD (name, price, duration) | done |
| 2.4 | Staff roster (name, email, phone, skills) | done — staff link by signup email |
| 2.5 | Client: Barbershops map + shop profile page (services, prices, fulfilled-services count) | done — incl. map with pins + navigate links |
| 2.6 | Booking flow incl. **style-check gate** (confirm/update 4 photos) | done |
| 2.7 | Bookings section (current + history) + Add-to-calendar (ICS + Google link) | done |
| 2.8 | Booking notifications: email via Resend + calendar attachment | done — sends once RESEND_API_KEY set (0.7) |
| 2.9 | Admin: barbershop application approvals (`/admin`) | done |

## Phase 3 — Private barbers, premium & payments

| # | Item | Status |
|---|---|---|
| 3.1 | Migration 003: private_barbers, coverage_areas + RLS | done — incl. client_addresses, at-home bookings, barber-photos bucket |
| 3.2 | Private barber onboarding (profile, self photo, setup photo, prices, coverage regions) | done — `/my-barber`, founder-approved at `/admin` |
| 3.3 | Premium client tier: exact-address collection, at-home booking with private barbers | done — premium granted manually at `/admin` until Stripe (3.4) |
| 3.4 | Stripe: checkout for bookings/deposits + premium subscription; webhooks | done (2026-07-14) — test mode; full payment upfront, premium $19.99/mo, webhook syncs paid_at/tier; **founder**: SUPABASE_SECRET_KEY env + live keys at launch |
| 3.5 | Payout/pricing model decision for private barbers (founder input) | todo — **founder** |

## Phase 4 — B2B events

| # | Item | Status |
|---|---|---|
| 4.1 | Migration 004: b2b_leads, events, event_registrations + RLS | done |
| 4.2 | Public B2B lead form → sales notification (Resend) | done — `/partners`; email sends once RESEND_API_KEY + SALES_EMAIL set |
| 4.3 | `event_manager` role + event creation with QR registration form | done — admin promotes at `/admin`; QR at `/my-events` |
| 4.4 | Attendee flow: QR → signup → event registration → service claim | done — `/e/[slug]` |
| 4.5 | Events section (current + historical) for attendees | done — `/events` |

## Phase 5 — Brand & expansion

| # | Item | Status |
|---|---|---|
| 5.1 | Figma MCP branding pass (founder provides brand package) | todo |
| 5.2 | Spanish (ES) localization | todo |
| 5.3 | Privy integration (wallets) — scope TBD | todo |
| 5.4 | B2B reporting for partner brands | todo |
