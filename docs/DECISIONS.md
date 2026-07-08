# Decision Log

Newest first. One line of context beats archeology later.

| Date | Decision | Why |
|---|---|---|
| 2026-07-08 | Repo lives in `theguildapp/` subfolder, pushed to `Ekinoxis-evm/theguildapp`; brand PDF + vendor notes stay outside the repo | Keep private reference material out of the public-ish repo |
| 2026-07-08 | Payments deferred to Phase 3 (bookings first, pay at shop) | Faster path to working MVP; Stripe wired but unused |
| 2026-07-08 | Google Maps Platform for maps/places (not Mapbox) | Founder preference; best autocomplete + client navigation UX |
| 2026-07-08 | English-only MVP, i18n-friendly copy | Miami/US launch; ES localization in Phase 5 |
| 2026-07-08 | Privy deferred (founder), Resend pending account setup | — |
| 2026-07-08 | Supabase Auth: email OTP + Google OAuth | Founder requirement; both natively supported |
| 2026-07-08 | Exact street address stored in separate `client_addresses` table, premium clients only | Tighter RLS on the most sensitive field |
| 2026-07-08 | Minimal monochrome UI until Figma MCP branding pass | Founder will provide brand package later |
