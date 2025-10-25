-- Clean up duplicate regions (keep original IDs 1-5)
DELETE FROM regions WHERE id IN (42, 43, 52, 53, 54, 55, 76, 77, 78, 79, 80);

-- Update Toledo's active quota to 436
UPDATE regions 
SET active_quota = 436, status = 'active'
WHERE id = 1;

-- Add unique constraint on zip_prefix to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS unique_region_zip_prefix ON regions (zip_prefix);

-- Verify cleanup
SELECT 
  id, 
  name, 
  zip_prefix,
  status, 
  active_quota
FROM regions
ORDER BY id;