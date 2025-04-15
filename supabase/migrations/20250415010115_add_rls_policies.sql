-- Enable RLS on the upcoming_events table
ALTER TABLE upcoming_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON upcoming_events;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON upcoming_events;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON upcoming_events;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON upcoming_events;

-- Create policies
CREATE POLICY "Enable read access for all users" ON upcoming_events
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON upcoming_events
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON upcoming_events
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON upcoming_events
    FOR DELETE
    TO authenticated
    USING (true); 