# Design

Visual system for Side by Side. Tokens live in `src/app/globals.css`; Tailwind mappings in `tailwind.config.js`.

## Theme

Light and dark, following the system (`prefers-color-scheme`, `darkMode: "media"`). Both themes share one identity: warm tinted neutrals plus one vivid section hue per feature. Never `#000` or `#fff`; all color is OKLCH.

## Color

### Neutrals (warm, hue 55–85)

| Token | Role |
|---|---|
| `--paper` / `bg-paper` | App background |
| `--surface` / `bg-surface` | Cards, modals, tab bar |
| `--surface-2` / `bg-surface-2` | Pressed/hover fills, skeletons, segmented-control tracks |
| `--ink`, `--ink-soft`, `--ink-faint` | Text hierarchy: primary, secondary, tertiary |
| `--line`, `--line-soft` | Borders and dividers |

### Section hues (wayfinding)

Each section binds the `--hue-*` slot via `data-section` on its `<main>` (and per-item in the tab bar). Components style with slot tokens and inherit the right hue automatically — never hardcode a section color in a component.

| Section | Hue | OKLCH hue angle |
|---|---|---|
| Upcoming | Marigold | ~72 |
| Groceries | Green | ~150 |
| Local | Teal | ~222 |
| Golf | Indigo | ~260 |
| Shares | Violet | ~300 |
| Recipes | Tomato | ~30 |

Golf takes indigo rather than the thematically obvious green — Groceries already owns ~150, and indigo sits in the widest untaken gap (~38° from both Local and Shares). Golf is the section most likely to be confused with Local at a glance, since both are map-backed places; keep the icon and label distinct, per the "hue is never the only signal" rule.

Slot tokens: `--hue` (text-grade accent), `--hue-strong` (fills: FAB, primary buttons, active filter chips), `--on-hue` (text on strong), `--hue-deep` (page titles), `--wash` (page background tint), `--tint` (chip/selection fill), `--tint-ink` (text on tint).

Semantic colors stay cross-section: emerald for thumbs-up/confirmed, rose for thumbs-down/destructive.

## Typography

- **Display**: Bricolage Grotesque (`font-display`) — page titles, modal headings, empty-state leads. Never in buttons, labels, or data.
- **UI/body**: Inter (`font-sans`).
- Page title: `font-display text-[2.5rem] font-bold tracking-tight text-hue-deep` with a `text-hue-strong` period (see `PageHeader`).
- Body floor is 14px; list items run 15px. Inputs stay ≥16px to prevent iOS zoom.

## Components

Shared vocabulary (classes in `globals.css`):

- `.field` + `.field-label` — every text input/textarea/select.
- `.btn-primary` — pill, `bg-hue-strong text-on-hue shadow-pop`, scales to 0.97 on press.
- `.btn-quiet` — pill, `bg-surface-2` secondary action.
- `.card` — `rounded-2xl border-line-soft bg-surface shadow-soft`.
- Filter chips: active `bg-hue-strong text-on-hue font-semibold`, inactive `border-line bg-surface text-ink-soft`.
- Segmented controls: `bg-surface-2` track, `bg-tint text-tint-ink` active segment (see `AnimatedStoreSelector`, recipes stage toggle).
- FAB: fixed `bottom-24 right-4` (above tab bar), `size-14 rounded-full bg-hue-strong shadow-pop`; `md:bottom-8 md:right-8`.
- Modals: `rounded-3xl bg-surface shadow-pop` over `bg-black/50`.
- Empty states: `size-16` tint circle + icon, display-font lead, one warm sentence.
- Loading: skeletons (`animate-pulse` + `bg-surface-2` shapes), not spinners.

## Navigation

`TabBar`: fixed bottom bar on mobile (56px targets, safe-area inset), floating top pill on `md+`. Active tab gets a `bg-tint` bubble (framer-motion `layoutId` spring) in its own section hue. `PageHeader` carries the title, a personality note, optional actions, and sign-out.

## Layout

Content columns: `max-w-md` mobile, `md:max-w-2xl` (lists) or `lg:max-w-4xl` (media grids). Pages: `bg-wash px-4`, bottom padding ≥8rem to clear tab bar + FAB.

## Motion

150–250ms, `ease-out-quart`/`ease-out-expo`, springs only for layout transitions (tab bubble, card-to-modal). Motion conveys state: check-off pulse, chip color change, modal enter. No page-load choreography. All animation respects `prefers-reduced-motion` (global CSS clamp + `useReducedMotion`).

## Shadows & radius

`shadow-soft` (cards) and `shadow-pop` (raised/active elements; tinted by the section hue via `color-mix`). Radius: `rounded-xl` fields, `rounded-2xl` cards, `rounded-3xl` modals, `rounded-full` pills/FAB.

## Accessibility

- Touch targets ≥44px (global floor on mobile).
- Focus: 2px `--hue-strong` outline via `:focus-visible`.
- AA contrast in both themes; section hue is never the only signal (labels + icons everywhere).
