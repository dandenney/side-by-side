-- Golf
-- Standalone tables (see docs/adr/0002-golf-uses-google-places-only.md).
--
-- A Course is ONE PLAYABLE EIGHTEEN, not a Google place: Bandon Dunes Resort is
-- a single Google place containing six Courses, so place_id is nullable and
-- several Courses may share one. Courses may also be created entirely by hand.
--
-- There is NO status column. Unlike recipes' to_try -> tried enum:
--   * Played       is DERIVED  -- a Course with at least one Round
--   * Want to Play is a FLAG   -- independent, user-controlled
-- Both are valid at once (the course you loved and want to return to).
--
-- Access Type and Cost Band are hand-entered from fixed app vocabularies; no
-- golf API supplies them practically. See the ADR for the rejected options.

create table if not exists public.courses (
  id uuid default gen_random_uuid() primary key,
  name text not null,                             -- hand-editable even when from Google

  -- Google Places enrichment. All nullable: a hand-made Course has none, and
  -- sibling courses at one resort intentionally share a place_id.
  place_id text,
  address text,
  lat double precision,
  lng double precision,
  website text,
  phone_number text,
  image_url text,

  -- Hand-entered golf fields (fixed vocabularies live in src/types/golf.ts)
  access_type text not null check (
    access_type in ('public', 'municipal', 'semi_private', 'private', 'resort')
  ),
  cost_band text check (cost_band in ('$', '$$', '$$$', '$$$$')),

  -- Stable, universally known, and what makes a Score legible as a differential.
  holes integer not null default 18 check (holes > 0),
  par integer check (par > 0),

  wants_play boolean not null default true,       -- independent of Played
  notes text,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- One visit to a Course. Household-scoped: no user_id, matching every other
-- table in the app. A solo round and a joint round are recorded identically.
create table if not exists public.rounds (
  id uuid default gen_random_uuid() primary key,
  course_id uuid not null references public.courses(id) on delete cascade,
  played_on date not null,
  holes_played integer not null default 18 check (holes_played > 0),
  score integer check (score > 0),                -- optional; read against courses.par
  rating text check (rating in ('up', 'down')),   -- on the ROUND, never the Course
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- The wishlist view: where wants_play, newest first.
create index if not exists idx_courses_wants_play on public.courses (wants_play);
-- Played is derived from this join, so it carries the read weight.
create index if not exists idx_rounds_course_id on public.rounds (course_id, played_on desc);
-- Filtering the wishlist by how you get on.
create index if not exists idx_courses_access_type on public.courses (access_type);

-- Row Level Security — mirrors the app's other tables (single-household model)
alter table public.courses enable row level security;
alter table public.rounds enable row level security;

create policy "Enable read access for authenticated users" on public.courses
  for select to authenticated using (true);
create policy "Enable insert for authenticated users" on public.courses
  for insert to authenticated with check (true);
create policy "Enable update for authenticated users" on public.courses
  for update to authenticated using (true) with check (true);
create policy "Enable delete for authenticated users" on public.courses
  for delete to authenticated using (true);

create policy "Enable read access for authenticated users" on public.rounds
  for select to authenticated using (true);
create policy "Enable insert for authenticated users" on public.rounds
  for insert to authenticated with check (true);
create policy "Enable update for authenticated users" on public.rounds
  for update to authenticated using (true) with check (true);
create policy "Enable delete for authenticated users" on public.rounds
  for delete to authenticated using (true);

-- Reuse the shared updated_at trigger function (defined in earlier migrations);
-- redefined here idempotently so this migration is self-contained.
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on public.courses
  for each row
  execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.rounds
  for each row
  execute function public.handle_updated_at();
