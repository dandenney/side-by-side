-- Create migration tracking table for data migrations
-- This is separate from schema migrations which are handled by Supabase CLI

create table if not exists public._migrations (
  id text primary key,
  name text not null,
  version text not null,
  applied_at timestamp with time zone not null,
  checksum text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for performance
create index if not exists idx_migrations_applied_at on public._migrations(applied_at);
create index if not exists idx_migrations_version on public._migrations(version);

-- Enable RLS
alter table public._migrations enable row level security;

-- Create RLS policies - migration tracking should be readable by authenticated users
-- but only modifiable by the system (through service role)
create policy "Allow read access for authenticated users" on public._migrations
  for select
  to authenticated
  using (true);

-- No insert/update/delete policies for regular users - only service role should modify

-- Create function to initialize migration table (used by migration system)
create or replace function public.create_migration_table()
returns void
language plpgsql
security definer
as $$
begin
  -- This function is called to ensure the table exists
  -- The table creation is already handled above, but this function
  -- provides a consistent interface for the migration system
  return;
end;
$$;

-- Grant necessary permissions
grant select on public._migrations to authenticated;
grant all on public._migrations to service_role;