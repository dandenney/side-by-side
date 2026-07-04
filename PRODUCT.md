# Product

## Register

product

## Users

Two people in one household: Dan and his partner. No other users, ever. Primary context is mobile, one-handed, mid-task: adding items in the grocery store aisle, checking the list while cooking, dropping a link from the couch, looking up a recipe with wet hands. Desktop is the secondary, lean-back context: browsing shares, planning upcoming events, importing recipes.

## Product Purpose

Side by Side is the shared operating system for a household of two: a running grocery list, things worth sharing with each other (movies, posts, links), local places to visit, upcoming events, and a recipe tracker. Success is frictionless capture and recall — either person can add or find something in seconds — inside an app that feels like *theirs*, not like software.

## Brand Personality

Playful, vivid, personal. It should feel fun to open even for a grocery run: saturated color, expressive but quick motion, personality in the microcopy and empty states. Three words: vibrant, warm, ours. Each of the five sections (Upcoming, Groceries, Local, Shares, Recipes) owns a hue from one family palette, so you always know where you are by color alone.

## Anti-references

- **Corporate SaaS**: no dashboard/admin energy, no stock shadcn gray-on-white, no identical card grids, no hero metrics.
- **Cutesy couple-app clichés**: no hearts, no pink romance theming, no "lovebirds" copy.
- **Template minimalism**: functional-but-forgettable utility-gray lists are exactly what this redesign replaces.

## Design Principles

1. **Capture beats browse.** Adding an item is the sacred flow; it must never be more than a tap or two away, and it must work one-handed in a store aisle.
2. **Color is wayfinding.** Section hues aren't decoration; they orient. Every screen answers "where am I" before a word is read.
3. **Playful, not noisy.** Delight lives in moments (check-off, empty states, transitions), never in the way of the task. Motion is 150–250ms and conveys state.
4. **Two themes, one identity.** Light and dark follow the system; the palette must stay vivid and legible in both (grocery-store fluorescents and couch-at-night).
5. **Built for thumbs and eyes.** Touch targets ≥44px, generous type sizes, high contrast. Legibility and reach beat density everywhere.

## Accessibility & Inclusion

- Larger-than-default touch targets (≥44px) and body text; one-thumb reachability on mobile.
- WCAG AA contrast in both themes, including color-on-hue section surfaces.
- Respect `prefers-reduced-motion` (already partially wired via framer-motion's `useReducedMotion`).
- Section hues must never be the only signal; pair with labels/icons.
