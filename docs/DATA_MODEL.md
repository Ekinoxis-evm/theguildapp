# Data Model

> Target schema. Implemented incrementally via `supabase/migrations/` (see ROADMAP phases). Keep this file in sync with applied migrations. Every table: RLS enabled at creation.

## Identity & roles

```
auth.users (Supabase managed)
  └─ profiles (1:1, id = auth.users.id)
       role        client | barbershop_owner | private_barber | event_manager | admin
       tier        standard | premium            -- clients only
       first_name, last_name, phone, avatar_path
       haircut_method   scissors | machine | mixed   -- clients only
       country, state, city, zip_code
       onboarding_completed_at
       stripe_customer_id UNIQUE, stripe_subscription_id UNIQUE, subscription_status
         -- written only by the Stripe webhook (service role); triggers strip
         -- them on authenticated inserts and reject authenticated updates

client_addresses          -- premium only; exact street address, separate table so RLS
  profile_id → profiles   -- can lock it down harder than general profile fields
  street_address, unit, lat/lng, is_default

legal_acceptances
  profile_id, document (terms | privacy), version, accepted_at
```

## Style photos

```
style_photos
  profile_id → profiles
  position   front | left | right | back
  storage_path            -- private bucket 'style-photos'
  updated_at
-- Booking gate: bookings reference style_photos.updated_at to enforce the
-- "is your style current?" check at booking time.
```

## Barbershops

```
barbershops
  owner_id → profiles (unique: one shop per owner), name, phone, description
  status  pending | approved | suspended   -- founder-approved; approve_barbershop()
  services_fulfilled_count   -- denormalized counter, bumped on booking completion

barbershop_locations
  barbershop_id, google_place_id, formatted_address, lat, lng,
  country, state, city, zip_code

services
  barbershop_id NULLABLE | private_barber_id NULLABLE   -- one of the two
  name, price_cents, currency, duration_minutes, active

barbershop_staff
  barbershop_id, full_name, email, phone
  skills text[]              -- 'barber', 'stylist', ... extensible
  profile_id NULLABLE        -- linked if/when they claim a login
```

## Barbers (barber-centric since 2026-07-14)

```
private_barbers               -- the professional barber profile, self-managed
  profile_id → profiles (1:1)
  bio, self_photo_path, setup_photo_path   -- private bucket 'barber-photos'
  base_price_cents
  headline, years_experience, specialties text[]
  offers_home_service boolean  -- false = shop-only professional (no at-home booking)

barber_certifications         -- LinkedIn-style credentials
  barber_id → private_barbers
  title, issuer, issued_on
  file_path                    -- private bucket 'barber-certs'; owner + admin read only
  verified_at, verified_by     -- admin-only via verify_certification(); owner edits clear it

barber_affiliations           -- optional, self-declared shop enrollment with history
  barber_id → private_barbers, barbershop_id → barbershops (approved shops only)
  role_title, started_on, ended_on   -- one open enrollment per barber+shop
  confirmed_at, confirmed_by   -- shop-owner trust badge (trigger: owners touch only
                               -- these fields; barber substance edits clear it)

coverage_areas
  private_barber_id, country, state, city, zip_codes text[]  -- regions they reach

connect_accounts             -- Stripe Connect payouts (3.5): one per user,
  profile_id → profiles (1:1)  -- covers their barber profile and/or owned shop
  stripe_account_id UNIQUE, payouts_ready_at
  -- service-role writes only; RLS select = owner + admin. Ready accounts get
  -- destination charges minus the 15% platform fee at checkout
```

## Bookings

```
bookings                     -- shop+service+time model (2026-07-09); staff pick deferred
  client_id → profiles
  barbershop_id              -- private_barber_id joins in Phase 3
  location_id NULLABLE → barbershop_locations
  service_id
  scheduled_at, duration_minutes
  status      pending | confirmed | completed | cancelled | no_show
              -- transitions guarded: client cancels; shop confirms/completes/no-shows
  style_confirmed_at NOT NULL -- style gate: set when client confirms photos current
  staff_id NULLABLE → barbershop_staff  -- pick-a-barber (6.7); trigger-validated to
                               -- the booked shop, immutable after creation
  -- Phase 3: address_snapshot jsonb for premium at-home bookings
  amount_cents, currency, paid_at,
  stripe_checkout_session_id UNIQUE, stripe_payment_intent_id
    -- full payment upfront (2026-07-14); stamped only by the Stripe webhook.
    -- Checkout expires in 30 min → webhook cancels still-unpaid pending bookings
```

## B2B events

```
b2b_leads
  company, contact_name, email, phone, message, status (new|contacted|closed)

events
  manager_id → profiles (role event_manager | admin; provisioned via set_event_manager)
  brand_name, title, venue, starts_at, ends_at
  qr_slug UNIQUE             -- public registration URL /e/[slug] behind the QR
  status  draft | live | finished   -- live events are publicly readable
  -- manager reads attendee names via event_attendees() definer fn (no profile row access)

event_registrations
  event_id, profile_id       -- attendee must have an account
  registered_at, service_claimed_at NULLABLE
```

## Storage buckets (all private)

| Bucket | Contents | Access |
|---|---|---|
| `avatars` | profile pictures | owner RW; short-lived signed URLs elsewhere |
| `style-photos` | clients' 4 haircut photos | owner RW; barber of an active booking R via signed URL |
| `barber-photos` | private barber self + setup photos | owner RW; public read via signed URL on profile |

## RLS principles

- Owner-only by default (`profile_id = auth.uid()`).
- Barbershop data: owner writes; public reads limited to a safe view (name, locations, services, counters) — never staff emails/phones.
- `client_addresses`: owner + assigned barber of a `confirmed` booking only.
- Counters and cross-user reads go through `security definer` functions or views, not broad table grants.
