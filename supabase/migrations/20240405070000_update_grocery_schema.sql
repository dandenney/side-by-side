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
  list_id uuid not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

comment on table public.grocery_items is 'Stores individual grocery items for shared lists';

-- Enable RLS
alter table public.grocery_items enable row level security;

-- Create indexes for performance
create index idx_grocery_items_list_id on public.grocery_items(list_id);

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

-- Backup archived items
create table if not exists public.archived_items_backup as
select * from public.archived_items;

-- Drop the existing archived_items table
drop table if exists public.archived_items;

-- Recreate archived_items table with the correct schema
create table public.archived_items (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  store store_type not null,
  list_id uuid not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  archived_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for archived_items
create index idx_archived_items_list_id on public.archived_items(list_id);

-- Update RLS policies for archived_items
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

-- Restore the data with the shared list ID
insert into public.grocery_items (id, name, checked, store, list_id, created_at, updated_at)
select id, name, checked, store, '00000000-0000-0000-0000-000000000000', created_at, updated_at
from public.grocery_items_backup;

-- Restore archived items with the shared list ID
insert into public.archived_items (id, name, store, list_id, created_at, archived_at)
select id, name, store, '00000000-0000-0000-0000-000000000000', created_at, archived_at
from public.archived_items_backup;

-- Clean up
drop table if exists public.grocery_items_backup;
drop table if exists public.archived_items_backup; 