# Security & Data Protection

The founder's requirement: client data (photos, addresses, phones) must have **maximum security**. This file defines what that means concretely. Treat violations as release blockers.

## Data classification

| Class | Data | Rules |
|---|---|---|
| **Highly sensitive** | Style photos (4 haircut pics), exact street addresses (premium), avatar photos | Private buckets, signed URLs (≤1h), RLS owner-only + explicit booking-scoped grants. Never in logs, never in public URLs, never cached publicly. |
| **Sensitive** | Phone numbers, emails, full names, city/zip | RLS owner-only; shown to counterparty only within an active booking. Never in public shop/barber listings. |
| **Public** | Barbershop name/locations/services/prices, private barber display profile, service counters | Readable by authenticated users (or public pages where intended). |

## Non-negotiables

1. **RLS on every table**, enabled in the same migration that creates it. Default deny; add narrow policies.
2. **Storage**: all buckets private. Access exclusively via signed URLs generated server-side after an authorization check. No `public/` bucket paths for user content.
3. **Service-role key** (`SUPABASE_SECRET_KEY`) only in server code (route handlers, server actions, edge functions). Never shipped to the client, never committed.
4. **Legal**: T&C + Privacy Policy acceptance recorded (`legal_acceptances`) before any PII is collected in onboarding.
5. **Least exposure in queries**: select explicit columns; public-facing reads go through views that exclude PII.
6. **Webhooks** (Stripe, later): verify signatures; idempotent handlers.
7. **Secrets hygiene**: `.env.local` git-ignored; production secrets only in Vercel env vars; rotate anything that ever leaks into a commit.

## Recurring checks (run after every schema change / before every release)

- `supabase` MCP → `get_advisors` (security + performance) must be clean or have documented exceptions.
- Grep for `SUPABASE_SECRET`/service-role usage outside `src/lib/supabase/server*` and API routes.
- Verify new endpoints: can user A read user B's photos/address/phone? (Write an RLS test.)
- Semgrep scan (plugin available) on PRs touching auth/storage/payments.

## Privacy operations (build in Phase 1–2)

- Account deletion: cascade profile, photos (storage objects included), addresses; keep anonymized booking rows for accounting.
- Data export on request (GDPR/CCPA-style) — manual is acceptable at MVP, documented here.
