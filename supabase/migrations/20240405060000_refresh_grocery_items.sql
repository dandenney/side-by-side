-- First, backup the data
create table if not exists public.grocery_items_backup as
select * from public.grocery_items;

-- Drop the existing table
drop table if exists public.grocery_items;

-- Recreate the table with the correct schema
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

-- Enable RLS
alter table public.grocery_items enable row level security;

-- Create indexes for performance
create index idx_grocery_items_user_id on public.grocery_items(user_id);

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

-- Restore the data
insert into public.grocery_items (id, name, checked, store, user_id, created_at, updated_at)
select id, name, checked, store, user_id, created_at, updated_at
from public.grocery_items_backup;

-- Clean up
drop table if exists public.grocery_items_backup; 