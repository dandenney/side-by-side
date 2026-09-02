# Side by Side

A shared web app for a household of two — upcoming events, groceries, local places, links worth sharing, a recipe tracker, and a golf course list. Built with Next.js, TypeScript, and Supabase.

Everything is household-shared by design: no table carries a `user_id`, and RLS grants any authenticated user full access. See [PRODUCT.md](PRODUCT.md) for who this is for and why.

## Documentation

Read these before adding or changing a feature:

| Doc | What it covers |
|---|---|
| [PRODUCT.md](PRODUCT.md) | Users, purpose, brand personality, design principles, anti-references |
| [DESIGN.md](DESIGN.md) | Visual system — section hues, typography, component vocabulary, motion |
| [CONTEXT.md](CONTEXT.md) | Domain language: canonical terms, relationships, resolved ambiguities |
| [docs/adr/](docs/adr/) | Architecture decisions — why the schema looks the way it does |
| [RATE_LIMITING.md](RATE_LIMITING.md) | Rate limiting setup and Redis configuration |

## Features

Each section owns a hue for wayfinding (see [DESIGN.md](DESIGN.md)).

### Upcoming Events
- Track upcoming events with dates, locations, and details
- Add event descriptions, URLs, and images
- Automatic metadata fetching from URLs
- Date range support for multi-day events
- Status tracking (Tickets, Definitely, Maybe)
- Visual timeline with relative date indicators
- Interactive calendar for date selection

### Groceries
- Create and manage shopping lists
- Store management and organization
- Real-time list updates

### Local Places
- Curate a list of nearby places and businesses
- Map view with Google Maps integration
- Store location coordinates and details
- Toggle between list and map views

### Shares
- Organize and share useful links
- Tag-based organization
- URL metadata extraction
- Movie lookup via OMDb
- Image storage via Supabase

### Recipes
- Two stages, one-way: **To Try** → **Tried**, stamped with a thumbs up/down rating
- Ingredients and instructions stored as raw lines; a fixed tag vocabulary
- Client-side search over title + ingredients + notes, with rules-based singularization
- Import from a ReciMe share URL via `yarn import-recipe <url>` (idempotent; skips duplicates)
- Design notes: [ADR 0001](docs/adr/0001-recipes-standalone-table-and-array-tags.md)

### Golf
- A **Course** is one playable eighteen — a resort's Google pin can back several
- **Played** is derived from round count; **Want to Play** is an independent flag, so a course can be both
- **Rounds** record date, holes, score, notes, and their own rating (the same course plays differently in February and June)
- Scores display as a differential against par, prorated for nine-hole rounds
- Access type and cost band are hand-entered; there is deliberately no golf API
- Design notes: [ADR 0002](docs/adr/0002-golf-uses-google-places-only.md)

## Tech Stack

- **Framework:** Next.js 15.4 with React 18
- **Language:** TypeScript
- **Styling:** Tailwind CSS with custom animations
- **Authentication:** Supabase Auth
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage
- **UI Components:** Radix UI primitives
- **Animations:** Framer Motion
- **Maps:** Google Maps + Places API
- **Movies:** OMDb API
- **Rate limiting:** Redis, with an in-memory fallback
- **Testing:** Jest with React Testing Library
- **Form Validation:** Zod

## Prerequisites

- Node.js 20+ and yarn
- A Supabase project
- A Google Maps API key (Local places and Golf)
- An OMDb API key (movie lookup in Shares) — optional
- A Redis instance — optional; rate limiting falls back to in-memory

## Installation

1. Clone the repository:
```bash
git clone https://github.com/dandenney/side-by-side.git
cd side-by-side
```

2. Install dependencies:
```bash
yarn install
```

3. Create `.env.local` in the project root:

```env
# Supabase — the browser client reads the PUBLISHABLE key, not "anon"
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key

# Google Maps — two distinct keys: one server-side for Places lookups,
# one public for rendering the map in the browser
GOOGLE_MAPS_API_SERVER_KEY=your_server_side_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_browser_key

# Optional — movie lookup in Shares
OMDB_API_KEY=your_omdb_key

# Optional — elevated access for scripts and server-side uploads.
# NOTE: SUPABASE_SERVICE_ROLE_KEY is a legacy name and does NOT hold a
# service-role key; SUPABASE_SECRET_KEY is the one with elevated access.
SUPABASE_SECRET_KEY=your_supabase_secret_key

# Optional — rate limiting. Without these, an in-memory limiter is used
# (fine for development, not for production). See RATE_LIMITING.md.
REDIS_URL=your_redis_url
```

## Database Setup

Migrations live in `supabase/migrations` and are ordered by their timestamp prefix.

### Using Supabase CLI

1. Install the Supabase CLI:
```bash
npm install -g supabase
```

2. Link your project:
```bash
supabase link --project-ref your-project-ref
```

3. Run migrations:
```bash
supabase db push
```

### Manual Setup

Alternatively, paste the migration files into the Supabase SQL editor in filename order.

Two caveats worth knowing:

- The history is **not reliably replayable from scratch** — parts of the schema were created by hand in the dashboard and never captured as migrations. Treat the existing remote database as the source of truth rather than expecting a clean local rebuild.
- Migrations are **not idempotent**. Tables and indexes use `if not exists`, but `create policy` and `create trigger` do not, so re-running a migration will error on the policies.

## Development

Start the development server:
```bash
yarn dev
```

The application will be available at `http://localhost:3000`. The dev server binds to `0.0.0.0`, so it is reachable from a phone on the same network — worth doing, since mobile is the primary context.

### Available Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn lint` - Run ESLint
- `yarn test` - Run tests
- `yarn test:watch` - Run tests in watch mode
- `yarn test:coverage` - Run tests with coverage report
- `yarn import-recipe <recime-url> [--dry-run]` - Import one recipe from a ReciMe share URL (needs `SUPABASE_SECRET_KEY`)

## Project Structure

```
side-by-side/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── api/          # API routes
│   │   ├── golf/         # Golf courses & rounds
│   │   ├── groceries/    # Groceries page
│   │   ├── local/        # Local places page
│   │   ├── recipes/      # Recipe tracker
│   │   ├── shares/       # Shares page
│   │   ├── upcoming/     # Upcoming events page
│   │   ├── globals.css   # Design tokens & section hues
│   │   └── layout.tsx    # Root layout
│   ├── components/       # React components
│   │   └── ui/           # UI component primitives
│   ├── contexts/         # React contexts
│   ├── lib/              # Utility functions
│   │   ├── supabase/     # Supabase client & helpers
│   │   └── google/       # Google Maps / Places integration
│   ├── services/         # Business logic services
│   ├── types/            # TypeScript type definitions
│   └── __tests__/        # Test files
├── docs/
│   └── adr/              # Architecture decision records
├── scripts/              # One-off and import scripts
└── supabase/
    └── migrations/       # Database migrations
```

## Adding a Feature

New sections are expected to update the docs alongside the code:

1. **Settle the domain language first.** Add the canonical terms to [CONTEXT.md](CONTEXT.md), including what to *avoid* calling things and any ambiguity you resolved.
2. **Claim a section hue** in `src/app/globals.css` (light and dark) and record it in [DESIGN.md](DESIGN.md). Style components with the slot tokens (`--hue`, `--tint`, …) and never hardcode a section color.
3. **Write an ADR** in `docs/adr/` when a decision is hard to reverse, surprising without context, *and* the result of a real trade-off. Skip it if any of the three is missing.
4. **Add the section here**, under Features.
5. **Add the tab** in `src/components/TabBar.tsx`.

## Features in Detail

### Authentication
- Email/password authentication via Supabase
- Protected routes with automatic redirects
- Session management

### Error Handling
- Feature-level error boundaries
- Component-level error boundaries
- Comprehensive error logging

### Database
- Row Level Security (RLS) policies on every table
- Single-household model: no per-user rows, shared read/write for authenticated users
- Optimized queries with proper indexing

### Testing
- Unit tests for utilities and services
- Component tests with React Testing Library
- Test coverage reporting

## Deployment

The application is deployed on Vercel at:
https://side-by-side-two.vercel.app/

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Dan Denney**

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database and Auth by [Supabase](https://supabase.com/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Icons from [Lucide](https://lucide.dev/)
