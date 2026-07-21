# Roadmap

> Product-management tracker. Statuses: `todo` · `in-progress` · `done` · `blocked`. Update when work lands. One PR should reference one item where possible.

## Up next (state at end of 2026-07-20 session)

The app is **role-complete and testable end-to-end**: every role has a branded, mobile-first surface and a seeded test account. Remaining, in rough priority order:

1. **Founder QA pass** — walk each role on a phone with the test accounts; log anything off.
2. **Blocked on Diana**: KUMO font files (licensed .otf/.woff2 — one-line swap at `--font-display`) and the GU isotype PNG/SVG (favicon + app icon + PWA manifest).
3. **ES localization sweep (5.2)** — inner surfaces (shops, bookings, my-shop, my-barber, admin, onboarding) still EN-only; extend `src/lib/dictionaries.ts` per page.
4. **Launch checklist (founder)**: Stripe live keys + live-mode price/webhook, Google OAuth client (0.8), Supabase dashboard toggles (leaked-password protection, MFA — 1.7).
5. Later: PWA install polish, B2B reporting (5.4), Privy (5.3), staff↔barber-profile roster merge (6.1 note).

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
| 0.9 | Test harness: Vitest unit tests + anonymous RLS security probes (`pnpm test`, `pnpm test:security`) | done (2026-07-14) — 9 unit + 19 security probes green |

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
| 3.5 | Payouts: 15% platform fee, rest to barber/shop via Stripe Connect (Express dashboard, destination charges) | done (2026-07-15) — Connect platform enabled by founder, verified operational; controller-based classic API for now (migrate to Accounts v2 when Stripe enables it on the account) |

## Phase 4 — B2B events

| # | Item | Status |
|---|---|---|
| 4.1 | Migration 004: b2b_leads, events, event_registrations + RLS | done |
| 4.2 | Public B2B lead form → sales notification (Resend) | done — `/partners`; email sends once RESEND_API_KEY + SALES_EMAIL set |
| 4.3 | `event_manager` role + event creation with QR registration form | done — admin promotes at `/admin`; QR at `/my-events` |
| 4.4 | Attendee flow: QR → signup → event registration → service claim | done — `/e/[slug]` |
| 4.5 | Events section (current + historical) for attendees | done — `/events` |

## Phase 6 — Barber-centric platform _(founder vision 2026-07-14, sequencing TBD)_

> Barbers are the main asset. Every barber gets a first-class, self-managed profile (LinkedIn-style), independent of — but linkable to — a barbershop.

| # | Item | Status |
|---|---|---|
| 6.1 | Barber identity: self-owned profiles (headline, bio, specialties, years, photos); `offers_home_service` flag — shop enrollment optional, pure at-home professionals supported | done (2026-07-14) — built on `private_barbers`; staff-roster merge deferred |
| 6.2 | Certifications & credentials: uploads (private `barber-certs` bucket, owner+admin only), issuer/date, admin verification badge (`verify_certification`) | done (2026-07-14) |
| 6.3 | Service history: per-barber track record from completed bookings (counts, services, tenure per shop) — public stats, private details | done (2026-07-15) — `barber_service_history` RPC, "Track record" on profile |
| 6.4 | Enrollment model: `barber_affiliations` (barber ↔ shop, role, started/ended history), self-declared LinkedIn-style, optional | done (2026-07-15) — shop confirms/revokes trust badge at /my-shop |
| 6.5 | Public barber profile page (headline, specialties, certifications w/ badge, work history, current shop) + barber directory open to all signed-in users; premium gates only at-home booking | done (2026-07-14) |
| 6.6 | Shop-enrolled barbers may also offer private services | done (2026-07-15) — founder: barbers fully independent, no shop approval/cut; enrollment badge is informational |
| 6.7 | Booking flow: pick a specific barber at a shop (optional "Any available barber" default) | done (2026-07-15) — `bookings.staff_id` validated to shop, staff picker in booking form, barber shown in all booking lists, shop page Barbers section with Guild-profile links |

## Phase 5 — Brand & expansion

| # | Item | Status |
|---|---|---|
| 5.1 | Branding pass (brand package received 2026-07-20: doctrine PDF + logos) | in-progress — tokens (#0B0B0C/#FFC300/bone) + branded landing shipped 2026-07-20; KUMO font files pending from Diana; app-shell restyle next |
| 5.7 | Entry role-choice flow: after first sign-in, pick Person / Barber / Business → routed onboarding per path | done (2026-07-20) — `/welcome` (branded, EN/ES); dashboard redirects brand-new accounts there; routes to /onboarding, /my-barber, /partners |
| 5.8 | Role-branded mobile app shell (bottom nav per role) + surface-by-surface restyle onto brand tokens | done (2026-07-20) — shell + full surface sweep: all (app) pages and partners//e/[slug] on guild-black with yellow-signal buttons, sharp corners; terms/privacy on bone; KUMO + GU icon still pending from Diana |
| 5.5 | Per-role dashboard consoles: role-specific stats + role-ordered sections on `/dashboard` for client / shop owner / private barber / event manager / admin (EN + ES) | done (2026-07-19) |
| 5.9 | Ambient split: dedicated **demo environment** — own Supabase project (dummy data, resettable), Stripe test-mode forever, `demo` branch with Preview-scoped Vercel env vars; prod cleaned of test accounts before launch | in-progress (2026-07-21) — architecture in SETUP.md; seed script env-parameterized (`pnpm seed:demo`) + booking-history dummies; **next: `supabase login` (or founder creates `theguildapp-demo` in dashboard) → push migrations, seed, scope Preview env vars, cut `demo` branch** |
| 5.6 | Role test accounts: `pnpm seed:test-users` seeds one account per role (founder-inbox plus-aliases) + sample approved shop, at-home barber, live event | done (2026-07-19) |
| 5.2 | Spanish (ES) localization | in-progress (2026-07-15) — cookie locale + typed dictionaries (`src/lib/dictionaries.ts`) + EN/ES switcher; landing, dashboard, premium translated; remaining surfaces pending (extend the dict per page) |
| 5.3 | Privy integration (wallets) — scope TBD | todo |
| 5.4 | B2B reporting for partner brands | todo |
