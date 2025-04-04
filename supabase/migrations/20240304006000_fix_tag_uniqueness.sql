-- Add list_type to tags table
alter table public.tags
  add column list_type list_type not null default 'local';

-- Drop existing unique constraint
alter table public.tags
  drop constraint if exists tags_name_list_id_key;

-- Add new unique constraint that includes list_type
alter table public.tags
  add constraint tags_name_list_id_list_type_key unique (name, list_id, list_type); 