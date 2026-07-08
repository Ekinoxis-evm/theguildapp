# Decision Log

Newest first. One line of context beats archeology later.

| Date | Decision | Why |
|---|---|---|
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
