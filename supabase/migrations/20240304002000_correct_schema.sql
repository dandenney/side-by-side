-- Drop previous tables
drop table if exists public.grocery_items;
drop table if exists public.profiles;
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Create tables
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(name)
);

create table public.links (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  url text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.link_categories (
  link_id uuid references public.links(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (link_id, category_id)
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.links enable row level security;
alter table public.link_categories enable row level security;

-- Create policies
create policy "Users can view all profiles"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Categories policies
create policy "Users can view all categories"
  on public.categories for select
  using (true);

create policy "Users can create categories"
  on public.categories for insert
  with check (true);

create policy "Users can update categories"
  on public.categories for update
  using (true);

create policy "Users can delete categories"
  on public.categories for delete
  using (true);

-- Links policies
create policy "Users can view all links"
  on public.links for select
  using (true);

create policy "Users can create links"
  on public.links for insert
  with check (true);

create policy "Users can update links"
  on public.links for update
  using (true);

create policy "Users can delete links"
  on public.links for delete
  using (true);

-- Link categories policies
create policy "Users can view all link categories"
  on public.link_categories for select
  using (true);

create policy "Users can create link categories"
  on public.link_categories for insert
  with check (true);

create policy "Users can delete link categories"
  on public.link_categories for delete
  using (true);

-- Create function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user(); 