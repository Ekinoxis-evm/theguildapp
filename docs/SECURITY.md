# Security & Data Protection

The founder's requirement: client data (photos, addresses, phones) must have **maximum security**. This file defines what that means concretely. Treat violations as release blockers.

## Data classification

| Class | Data | Rules |
|---|---|---|
| **Highly sensitive** | Style photos (4 haircut pics), exact street addresses (premium), avatar photos, certification documents (`barber-certs` bucket) | Private buckets, signed URLs (≤1h), RLS owner-only + explicit booking-scoped grants (cert docs: owner + admin only — the public sees the verification badge, never the file). Never in logs, never in public URLs, never cached publicly. |
| **Sensitive** | Phone numbers, emails, full names, city/zip; Stripe identifiers (`stripe_customer_id`, subscription/payment ids, `paid_at`, amounts) | RLS owner-only; shown to counterparty only within an active booking. Stripe/payment columns are additionally write-locked: only the webhook (service role) can set them — triggers strip them on authenticated inserts and reject authenticated updates. Never in public shop/barber listings. |
| **Public** | Barbershop name/locations/services/prices, barber display profile (headline, specialties, cert badges, enrollment), service counters | Readable by authenticated users (or public pages where intended). |

## Non-negotiables

1. **RLS on every table**, enabled in the same migration that creates it. Default deny; add narrow policies.
2. **Storage**: all buckets private. Access exclusively via signed URLs generated server-side after an authorization check. No `public/` bucket paths for user content.
3. **Service-role key** (`SUPABASE_SECRET_KEY`) only in server code (route handlers, server actions, edge functions). Never shipped to the client, never committed.
4. **Legal**: T&C + Privacy Policy acceptance recorded (`legal_acceptances`) before any PII is collected in onboarding.
5. **Least exposure in queries**: select explicit columns; public-facing reads go through views that exclude PII.
6. **Webhooks** (live: `/api/stripe/webhook`): verify signatures (`stripe.webhooks.constructEvent`); idempotent handlers (`.is("paid_at", null)` guards); exempt from auth middleware but never from signature checks. The webhook is the ONLY writer of payment/subscription columns. Prices for Checkout are always re-read from the DB server-side (`src/lib/booking-checkout.ts` is deliberately not a server action so clients can never supply an amount).
7. **Secrets hygiene**: `.env.local` git-ignored; production secrets only in Vercel env vars; rotate anything that ever leaks into a commit.

## Recurring checks (run after every schema change / before every release)

- `pnpm test:security` — 19+ anonymous RLS probes against the live project (tests/security/): zero sensitive rows readable, writes rejected, admin RPCs rejected, buckets deny listing. **Add a probe for every new table/bucket.**
- `supabase` MCP → `get_advisors` (security + performance) must be clean or have documented exceptions (current accepted WARNs: SECURITY DEFINER RPCs with internal admin checks; two founder dashboard toggles — leaked-password protection, MFA options).
- Grep for `SUPABASE_SECRET`/service-role usage outside `src/lib/supabase/admin.ts`, `src/lib/stripe.ts`, and the webhook route.
- Verify new endpoints: can user A read user B's photos/address/phone? (Write an RLS test.)
- Semgrep scan (plugin available) on PRs touching auth/storage/payments.

## Privacy operations (build in Phase 1–2)

- Account deletion: cascade profile, photos (storage objects included), addresses; keep anonymized booking rows for accounting.
- Data export on request (GDPR/CCPA-style) — manual is acceptable at MVP, documented here.
