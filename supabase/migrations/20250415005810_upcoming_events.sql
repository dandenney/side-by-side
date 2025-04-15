-- Create upcoming_events table
create table if not exists public.upcoming_events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  url text,
  image_url text,
  location text,
  start_date date not null,
  end_date date not null,
  status text not null check (status in ('tickets', 'definitely', 'maybe')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.upcoming_events enable row level security;

-- Create policies
create policy "Enable read access for all users" on public.upcoming_events
  for select
  to authenticated
  using (true);

create policy "Enable insert for authenticated users" on public.upcoming_events
  for insert
  to authenticated
  with check (true);

create policy "Enable update for authenticated users" on public.upcoming_events
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Enable delete for authenticated users" on public.upcoming_events
  for delete
  to authenticated
  using (true);

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on public.upcoming_events
  for each row
  execute function public.handle_updated_at();
