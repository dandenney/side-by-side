-- Drop everything
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table if exists public.profiles;

-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Create RLS policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  to authenticated, anon
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Create function to handle new user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

-- Create trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user(); 