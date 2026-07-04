-- Recipe Tracker
-- Standalone table (see docs/adr/0001-recipes-standalone-table-and-array-tags.md).
-- A Recipe defaults to the "to_try" stage and moves one-way to "tried" with a
-- binary thumbs up/down rating. Search (client-side) covers title + ingredients
-- + notes only; instructions are stored for display but never searched.

create table if not exists public.recipes (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  ingredients text[] not null default '{}',      -- raw lines as imported; searchable
  instructions text[] not null default '{}',     -- numbered steps; NOT searched
  image_url text,                                 -- re-hosted in the recipe-images bucket
  source_url text,                                -- optional, manually added; the rewatchable video
  servings text,                                  -- optional, display-only (e.g. "4-6")
  tags text[] not null default '{}',              -- fixed app-defined vocabulary
  status text not null default 'to_try' check (status in ('to_try', 'tried')),
  rating text check (rating in ('up', 'down')),   -- only present once tried
  tried_at timestamp with time zone,              -- stamped on the one-way transition
  notes text,                                     -- editable at any stage; searchable
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Stage invariants: a to_try recipe has no rating/tried_at; a tried recipe has both.
  constraint recipes_stage_consistency check (
    (status = 'to_try' and rating is null and tried_at is null)
    or
    (status = 'tried' and rating is not null and tried_at is not null)
  )
);

-- GIN index for multi-tag filtering: where tags && '{dinner}'
create index if not exists idx_recipes_tags on public.recipes using gin (tags);

-- Filtering the two stages (To Try / Tried)
create index if not exists idx_recipes_status on public.recipes (status);

-- Row Level Security — mirrors the app's other tables (single-household model)
alter table public.recipes enable row level security;

create policy "Enable read access for authenticated users" on public.recipes
  for select to authenticated using (true);

create policy "Enable insert for authenticated users" on public.recipes
  for insert to authenticated with check (true);

create policy "Enable update for authenticated users" on public.recipes
  for update to authenticated using (true) with check (true);

create policy "Enable delete for authenticated users" on public.recipes
  for delete to authenticated using (true);

-- Reuse the shared updated_at trigger function (defined in upcoming_events migration);
-- redefined here idempotently so this migration is self-contained.
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on public.recipes
  for each row
  execute function public.handle_updated_at();

-- Storage bucket for re-hosted recipe images (public read, parallel to url-images).
insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', true)
on conflict (id) do nothing;

create policy "Public read for recipe images" on storage.objects
  for select to public using (bucket_id = 'recipe-images');

create policy "Authenticated upload for recipe images" on storage.objects
  for insert to authenticated with check (bucket_id = 'recipe-images');

create policy "Authenticated update for recipe images" on storage.objects
  for update to authenticated using (bucket_id = 'recipe-images') with check (bucket_id = 'recipe-images');

create policy "Authenticated delete for recipe images" on storage.objects
  for delete to authenticated using (bucket_id = 'recipe-images');
