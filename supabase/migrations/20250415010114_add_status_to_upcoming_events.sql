-- Add status column to upcoming_events table
alter table public.upcoming_events
add column if not exists status text not null default 'definitely' check (status in ('tickets', 'definitely', 'maybe'));
