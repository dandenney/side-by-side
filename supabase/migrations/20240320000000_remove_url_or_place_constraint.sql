-- Create a function to remove the url_or_place constraint
CREATE OR REPLACE FUNCTION remove_url_or_place_constraint()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  ALTER TABLE url_items DROP CONSTRAINT IF EXISTS url_or_place;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION remove_url_or_place_constraint() TO authenticated; 