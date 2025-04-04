-- Remove tag column from url_items
alter table public.url_items
  drop column if exists tag; 