-- Drop existing tables if they exist
drop table if exists public.grocery_items;
drop table if exists public.archived_items;

-- Create store type enum if it doesn't exist
do $$
begin
  if not exists (select 1 from pg_type where typname = 'store_type') then
    create type public.store_type as enum ('Publix', 'Costco', 'Aldi');
  end if;
end $$;

-- Create grocery_items table
create table public.grocery_items (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  checked boolean default false not null,
  store store_type not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

comment on table public.grocery_items is 'Stores individual grocery items for users';

-- Create archived_items table
create table public.archived_items (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  store store_type not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  archived_at timestamp with time zone default timezone('utc'::text, now()) not null
);

comment on table public.archived_items is 'Stores archived grocery items for users';

-- Enable RLS
alter table public.grocery_items enable row level security;
alter table public.archived_items enable row level security;

-- Create indexes for performance
create index idx_grocery_items_user_id on public.grocery_items(user_id);
create index idx_archived_items_user_id on public.archived_items(user_id);

-- Create RLS policies for grocery_items
create policy "Authenticated users can view grocery items"
  on public.grocery_items for select
  to authenticated
  using (true);

create policy "Authenticated users can create grocery items"
  on public.grocery_items for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update grocery items"
  on public.grocery_items for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete grocery items"
  on public.grocery_items for delete
  to authenticated
  using (true);

-- Create RLS policies for archived_items
create policy "Authenticated users can view archived items"
  on public.archived_items for select
  to authenticated
  using (true);

create policy "Authenticated users can create archived items"
  on public.archived_items for insert
  to authenticated
  with check (true);

create policy "Authenticated users can delete archived items"
  on public.archived_items for delete
  to authenticated
  using (true); 