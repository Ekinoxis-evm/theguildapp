# Decision Log

Newest first. One line of context beats archeology later.

| Date | Decision | Why |
|---|---|---|
| 2026-07-10 | Repo is **PUBLIC** by founder decision — supersedes the 2026-07-08 private decision and the 07-09/07-10 re-privatizations (those were the agent enforcing the stale decision). Never store secrets or brand assets in the repo. | Founder wants it public; history verified clean of secrets |
| 2026-07-10 | Premium tier granted manually by admin (`set_client_tier` at `/admin`) until Stripe subscriptions land | Unblocks at-home bookings; founder controls who is premium |
| 2026-07-10 | Private barbers are founder-approved like shops (`approve_private_barber`); at-home booking freezes the address into `bookings.address_snapshot` — barbers never read `client_addresses` | Same curated model; narrowest address exposure |
| 2026-07-10 | Supabase CLI auth intermittently hangs; migrations applied via MCP `apply_migration` when CLI stalls (local files renamed to match recorded versions) | Keeps migration history consistent either way |
| 2026-07-09 | Booking model: shop + service + time; client does not pick a staff barber | Founder choice; simplest slot logic for MVP |
| 2026-07-09 | Staff get logins: roster rows link to accounts by signup email (`link_staff_by_email`), keep `client` role, access via `barbershop_staff.profile_id` | Founder choice; no new role/invite flow needed |
| 2026-07-09 | Barbershops are founder-approved: apply → `pending` → admin approves at `/admin` (`approve_barbershop` flips shop + owner role) | Founder choice: curated marketplace |
| 2026-07-09 | Admin account = wmb81321@gmail.com (founder's app login); ekinoxis.evm@gmail.com can be promoted when it signs up | Only real account in the app |
| 2026-07-09 | Booked shop can read a client's style photos only while the booking is pending/confirmed | Narrowest grant that satisfies the product need |
| 2026-07-09 | Repo found **public** again during 1.4–1.7 ship (Vercel deploy metadata flagged it); set back to private via `gh repo edit` | Standing decision (2026-07-08) is private; history re-scanned, no sensitive files present |
| 2026-07-09 | E2E verified with disposable users `e2e-onboarding@`/`e2e-other@example.com` (admin-generated OTP, no email delivery); their 5 storage objects + rows still need deletion — Supabase CLI login expired, storage API blocks SQL deletes | Full wizard + RLS probes without touching founder account; cleanup pending `supabase login` |
| 2026-07-08 | Sign-in emails use a 6-digit OTP code (custom `magic_link` template with `{{ .Token }}`), not a magic link | Code entry works regardless of which device opens the email |
| 2026-07-08 | Google sign-in shipped behind `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=false` | Needs founder's Google Cloud OAuth client; email OTP unblocks launch |
| 2026-07-08 | `profiles.role`/`tier` immutable via user API (trigger guard); changed server-side only | Prevent self-escalation to admin/premium |
| 2026-07-08 | Resend: reuse founder's existing account (no new signup); repo is **private** after brand PDF was briefly pushed public (erased from history) | — |
| 2026-07-08 | Repo lives in `theguildapp/` subfolder, pushed to `Ekinoxis-evm/theguildapp`; brand PDF stays outside the repo, `workspace/` vendor notes inside (founder OK) | Keep private reference material out of the repo |
| 2026-07-08 | Payments deferred to Phase 3 (bookings first, pay at shop) | Faster path to working MVP; Stripe wired but unused |
| 2026-07-08 | Google Maps Platform for maps/places (not Mapbox) | Founder preference; best autocomplete + client navigation UX |
| 2026-07-08 | English-only MVP, i18n-friendly copy | Miami/US launch; ES localization in Phase 5 |
| 2026-07-08 | Privy deferred (founder), Resend pending account setup | — |
| 2026-07-08 | Supabase Auth: email OTP + Google OAuth | Founder requirement; both natively supported |
| 2026-07-08 | Exact street address stored in separate `client_addresses` table, premium clients only | Tighter RLS on the most sensitive field |
| 2026-07-08 | Minimal monochrome UI until Figma MCP branding pass | Founder will provide brand package later |
