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

## Payments (live since 2026-07-14, test mode)

- Bookings are paid **in full upfront** via Stripe-hosted Checkout (founder decision 2026-07-14). Unpaid checkouts expire in 30 min and the booking auto-cancels; "Pay now" retry on /bookings.
- **Premium = $19.99/mo Stripe subscription** at `/premium` (Customer Portal for self-service), or manual admin grant at `/admin`. Premium unlocks at-home booking with barbers who offer it.

## Barber-centric model (founder direction 2026-07-14)

Barbers are the main asset. Every Guild barber owns a LinkedIn-style profile: headline, specialties, years, certifications (admin-verified badge; documents private), optional self-declared barbershop enrollment with history, and an at-home-service flag — independent at-home professionals need no shop. The barber directory and profiles are open to all signed-in users; premium gates only at-home booking. See ROADMAP Phase 6 for what remains (staff↔profile merge, pick-a-barber shop bookings).

## Later / explicitly deferred

- **Privy** wallet integration (founder: "we could do it later").
- **Stripe live keys** at launch (test mode now; recreate price + webhook in live mode).
- **Figma branding** pass — founder will connect Figma MCP and provide brand package.
- **Spanish (ES) localization** — English-only MVP, keep copy i18n-friendly.

## Open questions — answered

- ~~Premium: subscription or manual?~~ → Both: $19.99/mo Stripe subscription, plus manual admin grant (2026-07-14).
- ~~Booking model: pick a specific staff barber?~~ → Yes, barber-centric direction confirmed 2026-07-14; shop+time remains until the staff↔barber-profile merge lands (roadmap 6.7).
- ~~Staff logins?~~ → Staff link to accounts by signup email (2026-07-09); full barber profiles are self-owned (Phase 6).
- ~~Private barber discovery: map or zip-match?~~ → Directory list of all approved barbers with coverage cities shown (2026-07-14); zip-matching may come later.

## Open questions (ask the founder before building the affected feature)

- B2B: does the event's brand get reporting (headcount, services delivered)? (roadmap 5.4)
- Private barber payout/pricing model — revenue share vs. full pass-through (roadmap 3.5).
- Shop-enrolled barbers offering private services: does the shop owner get approval rights or a cut? (roadmap 6.6)
