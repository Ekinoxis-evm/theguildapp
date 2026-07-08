# The Guild — Product Requirements

> Source of truth for what we're building. Derived from the founder brief (2026-07-08) and the brand deck `TheGuild_InterMiami_v8.pdf`. When requirements change, update this file and log the change in `DECISIONS.md`.

## Brand

**The Guild | Grooming Standard** — premium men's grooming brand born in Miami. Industrial design language: black, exposed concrete, gold accents, locker-room / sport culture. Proven B2B activation track record (CrossFit Games, Jack Daniel's, Miami Open, Inter Miami CF proposal). Founded by Diana Hernandez (The Spot Barbershop, 3→40 locations 2015–2025).

Design for MVP: **minimalistic and simple** — function first. Real branding arrives later via Figma MCP handoff.

## Business lines

1. **B2C** — marketplace connecting clients with barbershops and private barbers.
2. **B2B** — event activations for brands; managed events with QR-based attendee registration.

---

## B2C

### Account types

| Role | Variants | Notes |
|---|---|---|
| Client | `standard`, `premium` | Premium unlocks at-home/delivery service → we collect their exact address |
| Barber | `barbershop` (business), `private_barber` (individual) | |

### Client signup & auth

- Email + one-time code (OTP) **or** Google sign-in (Supabase Auth supports both).
- Must accept **Terms & Conditions** and **Privacy Policy** at account creation — recorded with timestamp + document version.

### Client onboarding wizard

Collected step-by-step after signup:

1. Profile picture
2. First name, last name
3. Phone number
4. Location: country, state, city, zip code. **Exact street address only if premium** (needed for at-home service).
5. Haircut method preference: `scissors` | `machine` | `mixed`
6. **4 photos of current haircut**: front, left side, right side, back

> ⚠️ All of this is sensitive PII. Maximum security: RLS on every table, private storage bucket + signed URLs for photos, address never exposed outside the owner + an active booking's assigned barber. See `SECURITY.md`.

### Client app sections

1. **Barbershops**
   - Map (Google Maps) locating current barbershops + booking entry point.
   - Barbershop profile page: services, prices, and a **count of services provided / bookings fulfilled** by that shop.
   - **Style check on every booking**: before confirming, ask "is your current style (photos) up to date?" — if not, the client must update their 4 style photos first.
2. **Profile**
   - Personal info (editable).
   - **My Style**: the 4 haircut photos, updatable anytime.
3. **Bookings**
   - Current + historical bookings with barbers.
   - Simple **"Add to calendar"** button (ICS / Google Calendar link) per booking.

### Barbershop (business) accounts

- Profile: name, phone, **location(s)** with the same location fields as clients, created via **Google Maps place selection** so clients can navigate there easily.
- **Services portfolio**: each service with name + price (and duration for scheduling).
- **Staff roster**: add barbers by name, email, phone; tag skills per person (`barber`, `stylist`, …extensible).
- On each booking: send a **calendar invite / add-to-calendar** to the involved parties.

### Private barber accounts

- Profile like a barbershop, plus:
  - **Coverage areas/regions** they can reach (service area based on where they live/operate).
  - **Price of their service** (their own service list).
  - **Photo of themselves** and a **photo of their mobile setup** (the kit they bring to clients).

---

## B2B — Events

1. **Lead capture**: interested brands fill a contact form → sales rep follows up to scope needs.
2. **Event management**: when a deal closes, we provision an `event_manager` user who can:
   - Create events with registration forms exposed via **QR code**.
3. **Attendee flow**: attendees scan the QR → must **create a Guild account** → register for the event → get their haircut service at the activation.
4. **Events section** (for attendees): current and historical events they've joined.

---

## Legal

- Terms & Conditions and Privacy Policy pages, versioned.
- Acceptance is mandatory at signup (all roles) and recorded (`legal_acceptances`).
- Data protection posture documented in `SECURITY.md` (photos, addresses, phones).

## Later / explicitly deferred

- **Privy** wallet integration (founder: "we could do it later").
- **Stripe payments** (booking deposits/payments + premium subscription) — Phase 2 decision 2026-07-08; workspace is wired but no checkout in MVP.
- **Figma branding** pass — founder will connect Figma MCP and provide brand package.
- **Spanish (ES) localization** — English-only MVP, keep copy i18n-friendly.

## Open questions (ask the founder before building the affected feature)

- Premium: how does a client become premium — paid subscription (Stripe) or invite/manual? What's included besides at-home service?
- Booking model: pick a specific staff barber, or just shop + time slot? Duration/slots per service?
- Do barbershop staff members get their own logins, or are they managed records under the owner account?
- Private barber discovery: on the same map as shops, or matched by client zip within coverage area?
- B2B: does the event's brand get reporting (headcount, services delivered)?
