-- Add place_id column to url_items table
ALTER TABLE url_items ADD COLUMN place_id TEXT;
ALTER TABLE url_items ADD COLUMN place_name TEXT;
ALTER TABLE url_items ADD COLUMN place_address TEXT;
ALTER TABLE url_items ADD COLUMN place_lat DOUBLE PRECISION;
ALTER TABLE url_items ADD COLUMN place_lng DOUBLE PRECISION;
ALTER TABLE url_items ADD COLUMN place_types TEXT[];
ALTER TABLE url_items ADD COLUMN place_rating DOUBLE PRECISION;
ALTER TABLE url_items ADD COLUMN place_user_ratings_total INTEGER;
ALTER TABLE url_items ADD COLUMN place_price_level INTEGER;
ALTER TABLE url_items ADD COLUMN place_website TEXT;
ALTER TABLE url_items ADD COLUMN place_phone_number TEXT;
ALTER TABLE url_items ADD COLUMN place_opening_hours JSONB;

-- Add constraint to ensure either url or place_id is present
ALTER TABLE url_items ADD CONSTRAINT url_or_place CHECK (
  (url IS NOT NULL AND place_id IS NULL) OR
  (url IS NULL AND place_id IS NOT NULL)
); 