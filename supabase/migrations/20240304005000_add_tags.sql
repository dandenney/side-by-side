-- Create tags table
create table public.tags (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  list_id uuid not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(name, list_id)  -- Ensure tag names are unique within a list
);

-- Create junction table for item-tag relationships
create table public.item_tags (
  item_id uuid references public.url_items(id) on delete cascade not null,
  tag_id uuid references public.tags(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (item_id, tag_id)
);

-- Create indexes for faster lookups
create index idx_tags_list_id on public.tags(list_id);
create index idx_item_tags_item_id on public.item_tags(item_id);
create index idx_item_tags_tag_id on public.item_tags(tag_id);

-- Set up Row Level Security (RLS)
alter table public.tags enable row level security;
alter table public.item_tags enable row level security;

-- Tags policies (all users can see and modify all tags)
create policy "Users can view all tags"
  on public.tags for select
  using (true);

create policy "Users can create tags"
  on public.tags for insert
  with check (true);

create policy "Users can update tags"
  on public.tags for update
  using (true);

create policy "Users can delete tags"
  on public.tags for delete
  using (true);

-- Item tags policies (all users can see and modify all item-tag relationships)
create policy "Users can view all item tags"
  on public.item_tags for select
  using (true);

create policy "Users can create item tags"
  on public.item_tags for insert
  with check (true);

create policy "Users can delete item tags"
  on public.item_tags for delete
  using (true); 