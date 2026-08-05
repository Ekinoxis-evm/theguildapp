# UX / UI backlog — the design-focused session starts here

> State: the app is functionally complete (booking, payments, matching) and
> navigationally app-like (bottom nav, tabs, per-role home, `.btn` system).
> This file lists the known gaps between "works well" and "feels designed".
> Ordered roughly by user impact. Check items off as they land.

## Blocked on Diana (chase these first — they finish the brand)

- [ ] **KUMO font files** (licensed .otf/.woff2) — everything is wired behind
      `--font-display`; activation is one `@font-face` in `globals.css`.
- [ ] **GU isotype** as PNG/SVG → favicon, app icons, **PWA manifest**
      (installable app with the GU icon on the home screen), themed status bar.

## High impact

- [ ] **Leftover light-theme fragments**: components that keep classes in
      `const` strings escaped the dark sweep — audit `inputClass` in
      `my-shop/locations.tsx`, `staff.tsx`, `services.tsx`, booking forms,
      onboarding wizard internals. Grep `border-neutral-300|bg-neutral-900`
      in template literals/consts.
- [ ] **Empty states**: every list (bookings, events, reviews, staff, links)
      should invite action in doctrine voice, not just say "none yet".
- [ ] **Loading states**: server pages render blank while fetching — add
      `loading.tsx` skeletons for shops, barbers, bookings, consoles.
- [ ] **Feedback → toasts**: inline "Saved." text works but reads DIY; a
      small toast/snackbar (brand-styled) would unify save/error feedback.
- [ ] **Photos everywhere**: barber cards in /barbers and "For you" show no
      photo on the list (photo exists on detail) — visual density is what
      makes a marketplace feel alive. Also avatar in the app bar.
- [ ] **Bottom nav icons**: text-only labels work but icons + label is the
      native pattern (inline SVG set, no icon library dependency).

## Medium

- [ ] Onboarding wizard visual pass: progress indicator (dots/bar), photo
      upload previews, celebratory finish step.
- [ ] Booking flow: selected-service summary card sticky on scroll; slot
      grid could show morning/afternoon grouping.
- [ ] Shop/barber detail pages: hero layout (photo + name + rating block),
      services as cards with inline Book buttons.
- [ ] `/premium` sell page: worth a doctrine-styled redesign (it's the
      revenue page).
- [ ] Landing: real photography (BRANDING/IMAGES has approved shots — pick
      web-safe ones, compress, and use them; sources stay out of the repo).
- [ ] ES localization sweep of inner surfaces (5.2) — copy is part of UX.

## Low / polish

- [ ] Reduced-motion + focus-visible audit on `.btn` and Tabs.
- [ ] `formatDate`/currency localization per locale cookie.
- [ ] 404/error pages on-brand.
- [ ] Email templates (booking confirmation, waitlist alert) styled to match
      the brand (currently plain text).

## Rules for whoever does this work

1. Load the `ui-system` skill (`.claude/skills/ui-system`) before touching UI.
2. Doctrine: black dominates, yellow intervenes, sharp corners, direct voice.
3. Verify on a phone-width viewport in the browser before deploying.
4. `pnpm build && pnpm lint && pnpm test` before commit; deploy with
   `vercel deploy --prod`; keep this checklist updated.
