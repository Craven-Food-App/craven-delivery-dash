-- Add random offset to waitlist positions to show drivers as part of larger queue

-- Drop existing function first to allow signature change
DROP FUNCTION IF EXISTS get_driver_queue_position(uuid);

-- Update calculate_waitlist_position to add random offset (100-200)
CREATE OR REPLACE FUNCTION calculate_waitlist_position()
RETURNS trigger AS $$
DECLARE
  base_position INTEGER;
  random_offset INTEGER;
  region_display_quota INTEGER;
BEGIN
  -- Get the region's display quota
  SELECT display_quota INTO region_display_quota
  FROM regions WHERE id = NEW.region_id;
  
  -- If no display_quota set, use actual count
  IF region_display_quota IS NULL THEN
    region_display_quota := 500; -- default
  END IF;
  
  -- Calculate actual position based on priority
  SELECT COUNT(*) + 1 INTO base_position
  FROM craver_applications
  WHERE status = 'waitlist'
  AND region_id = NEW.region_id
  AND (
    priority_score > NEW.priority_score
    OR (priority_score = NEW.priority_score AND created_at < NEW.created_at)
  );
  
  -- Add random offset (100-200) to the base position
  random_offset := 100 + floor(random() * 101)::INTEGER;
  
  -- Set display position (ensure it doesn't exceed display_quota)
  NEW.waitlist_position := LEAST(base_position + random_offset, region_display_quota);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate get_driver_queue_position with display values
CREATE OR REPLACE FUNCTION get_driver_queue_position(driver_uuid uuid)
RETURNS TABLE(queue_position bigint, total_in_region bigint, region_name text, priority_score integer)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(ca.waitlist_position, 1)::BIGINT as queue_position,
    COALESCE(r.display_quota, 500)::BIGINT as total_in_region,
    r.name as region_name,
    COALESCE(ca.priority_score, 0) as priority_score
  FROM craver_applications ca
  LEFT JOIN regions r ON ca.region_id = r.id
  WHERE ca.id = driver_uuid;
END;
$$ LANGUAGE plpgsql;

-- Add small random priority boost for new drivers entering waitlist
CREATE OR REPLACE FUNCTION add_to_activation_queue()
RETURNS trigger AS $$
DECLARE
  initial_priority_boost INTEGER;
BEGIN
  -- Only proceed if status changed to 'waitlist'
  IF NEW.status = 'waitlist' AND (OLD.status IS NULL OR OLD.status != 'waitlist') THEN
    
    -- Add small random priority boost (5-15 points) for new drivers
    initial_priority_boost := 5 + floor(random() * 11)::INTEGER;
    NEW.priority_score := COALESCE(NEW.priority_score, 0) + initial_priority_boost;
    
    -- Insert into activation queue if not already there
    IF NOT EXISTS (
      SELECT 1 FROM activation_queue WHERE driver_id = NEW.id
    ) THEN
      INSERT INTO activation_queue (driver_id, region_id, priority_score)
      VALUES (NEW.id, NEW.region_id, NEW.priority_score);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;