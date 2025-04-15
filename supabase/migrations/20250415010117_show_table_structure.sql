-- Show the current table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'upcoming_events'
ORDER BY ordinal_position; 