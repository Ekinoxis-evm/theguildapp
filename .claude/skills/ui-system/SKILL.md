---
name: ui-system
description: The Guild's UI system — brand tokens, button classes, components, and navigation rules. Load before ANY UI/UX work (new screens, styling changes, design passes) so the app stays one coherent product.
---

# The Guild UI system

## Brand doctrine (non-negotiable)
- Colors: `guild-black #0B0B0C` dominates · white structures · `guild-yellow
  #FFC300` intervenes (never dominates) · `guild-bone #E6E1D8` for light
  reading surfaces (terms/privacy, landing doors section).
- Sharp corners everywhere (`rounded` is banned except `rounded-full` on
  avatars). Diagonal section cuts via `.guild-cut`.
- Display type: `font-display` token (KUMO when Diana delivers; heavy grotesk
  stack until then) — uppercase, `tracking-wide` for headlines.
- Voice: direct, specific, declarative. No filler, no emoji in product copy.

## Components — reuse, never reinvent
| Need | Use |
|---|---|
| Any action | `.btn` + `.btn-primary` (yellow) / `.btn-outline` / `.btn-ghost` — defined in `globals.css`; works on `<button>` and `<a>` |
| Console sub-pages | `<Tabs items={[{id,label,content}]}>` from `src/components/tabs.tsx` (URL-synced `?tab=`) |
| Style vocabulary | `STYLE_TAGS` (`src/lib/style-tags.ts`) + `<StyleChips>` — clients and barbers share it; never invent new tag strings |
| Ratings | `<Stars>`, `<RatingBadge>`, `<ReviewList>` from `src/components/rating.tsx` |
| Social/external links | `<LinkHub>` (`src/components/link-hub.tsx`) |
| Share URLs | `<ShareLink>` (`src/components/share-link.tsx`) |
| Inputs | `border border-neutral-700 bg-transparent px-3 py-2 outline-none focus:border-guild-yellow` (no rounded) |
| Cards/panels | `border border-neutral-800 p-3..4` on the dark base |

## Navigation rules
- The **bottom nav owns navigation** (`(app)/layout.tsx` → `BottomNav`,
  role-aware, hidden on /welcome + /onboarding). Never add "← Dashboard"
  links. Contextual backs (detail → list) are `btn-ghost` with ←.
- The home (`/dashboard`) shows the role console + ONLY cards for surfaces
  the role's nav does not already cover. No site maps.
- Sign-out lives on /profile.
- Nav labels: single words, `whitespace-nowrap` (EN/ES both).

## Process
1. Muted text on black: `text-neutral-400` (body) / `text-neutral-500`
   (labels, eyebrows with `uppercase tracking-[0.2em]+`).
2. EN copy in `src/lib/dictionaries.ts` where the surface is translated —
   the `Dict` type forces ES parity; hardcoded EN is acceptable only on
   not-yet-translated inner surfaces.
3. Verify at phone width in the browser before deploying; the app is
   mobile-first.
4. The current gap list lives in `docs/UX_BACKLOG.md` — update it as you go.
