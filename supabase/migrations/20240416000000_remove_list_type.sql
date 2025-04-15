-- Remove list_type column from upcoming_events table
ALTER TABLE public.upcoming_events DROP COLUMN IF EXISTS list_type; 