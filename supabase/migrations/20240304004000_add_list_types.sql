-- Create enum for list types
create type list_type as enum ('local', 'shared');

-- Add list_type and list_id to url_items
alter table public.url_items
  add column list_type list_type not null default 'local',
  add column list_id uuid default gen_random_uuid() not null;

-- Create index for faster lookups by list_id
create index idx_url_items_list_id on public.url_items(list_id);

-- Update RLS policies to include list_type and list_id
drop policy if exists "Users can view all URL items" on public.url_items;
drop policy if exists "Users can create URL items" on public.url_items;
drop policy if exists "Users can update URL items" on public.url_items;
drop policy if exists "Users can delete URL items" on public.url_items;

-- URL items policies (all users can see and modify all items)
create policy "Users can view all URL items"
  on public.url_items for select
  using (true);

create policy "Users can create URL items"
  on public.url_items for insert
  with check (true);

create policy "Users can update URL items"
  on public.url_items for update
  using (true);

create policy "Users can delete URL items"
  on public.url_items for delete
  using (true); 