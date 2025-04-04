-- Drop incorrect tables
drop table if exists public.link_categories;
drop table if exists public.links;
drop table if exists public.categories;
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

create table public.grocery_items (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  quantity integer default 1,
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.grocery_items enable row level security;

-- Create policies
create policy "Users can view all profiles"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Grocery items policies (all users can see and modify all items)
create policy "Users can view all grocery items"
  on public.grocery_items for select
  using (true);

create policy "Users can create grocery items"
  on public.grocery_items for insert
  with check (true);

create policy "Users can update grocery items"
  on public.grocery_items for update
  using (true);

create policy "Users can delete grocery items"
  on public.grocery_items for delete
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