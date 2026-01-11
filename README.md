# Side by Side

A modern web application for organizing your life's upcoming events, shared links, local places, and shopping lists. Built with Next.js, TypeScript, and Supabase.

## Features

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
- Curate a list of local places and businesses
- Map view with Google Maps integration
- Store location coordinates and details
- Toggle between list and map views

### Shares
- Organize and share useful links
- Tag-based organization
- URL metadata extraction
- Image storage via Supabase

## Tech Stack

- **Framework:** Next.js 15.4 with React 18
- **Language:** TypeScript
- **Styling:** Tailwind CSS with custom animations
- **Authentication:** Supabase Auth
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage
- **UI Components:** Radix UI primitives
- **Animations:** Framer Motion
- **Maps:** Google Maps API
- **Testing:** Jest with React Testing Library
- **Form Validation:** Zod

## Prerequisites

- Node.js 20+ and yarn
- A Supabase project
- Google Maps API key (for local places feature)

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

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Database Setup

This project uses Supabase for the database. The migrations are located in the `supabase/migrations` directory.

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

Alternatively, you can run the migration files directly in your Supabase SQL editor in the following order:
1. `20240405030000_minimal_setup.sql`
2. `20250415005810_upcoming_events.sql`
3. `20250415010114_add_status_to_upcoming_events.sql`
4. `20250415010115_add_rls_policies.sql`
5. Additional migrations as needed

## Development

Start the development server:
```bash
yarn dev
```

The application will be available at `http://localhost:3000`.

### Available Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn lint` - Run ESLint
- `yarn test` - Run tests
- `yarn test:watch` - Run tests in watch mode
- `yarn test:coverage` - Run tests with coverage report

## Project Structure

```
side-by-side/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── api/          # API routes
│   │   ├── groceries/    # Groceries page
│   │   ├── local/        # Local places page
│   │   ├── shares/       # Shares page
│   │   ├── upcoming/     # Upcoming events page
│   │   └── layout.tsx    # Root layout
│   ├── components/       # React components
│   │   └── ui/           # UI component primitives
│   ├── contexts/         # React contexts
│   ├── lib/              # Utility functions
│   │   ├── supabase/     # Supabase client & helpers
│   │   └── google/       # Google Maps integration
│   ├── services/         # Business logic services
│   └── types/            # TypeScript type definitions
├── supabase/
│   └── migrations/       # Database migrations
└── __tests__/            # Test files
```

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
- Row Level Security (RLS) policies for data protection
- Automatic migration system
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
