-- Fix waitlist position logic: only first driver in region gets random offset
-- All subsequent drivers continue sequentially from that starting number

CREATE OR REPLACE FUNCTION calculate_waitlist_position()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_position INTEGER;
  first_driver_position INTEGER;
  region_display_quota INTEGER;
  total_in_region INTEGER;
BEGIN
  -- Get the region's display quota
  SELECT display_quota INTO region_display_quota
  FROM regions WHERE id = NEW.region_id;
  
  -- If no display_quota set, use actual count
  IF region_display_quota IS NULL THEN
    region_display_quota := 500; -- default
  END IF;
  
  -- Count total waitlisted drivers in this region
  SELECT COUNT(*) INTO total_in_region
  FROM craver_applications
  WHERE status = 'waitlist'
  AND region_id = NEW.region_id;
  
  -- Calculate actual position based on priority
  SELECT COUNT(*) + 1 INTO base_position
  FROM craver_applications
  WHERE status = 'waitlist'
  AND region_id = NEW.region_id
  AND (
    priority_score > NEW.priority_score
    OR (priority_score = NEW.priority_score AND created_at < NEW.created_at)
  );
  
  -- If this is the first driver in the region (base_position = 1 and total = 0 before insert)
  IF base_position = 1 AND total_in_region = 0 THEN
    -- First driver gets a random starting position (127-200)
    first_driver_position := 127 + floor(random() * 74)::INTEGER;
    NEW.waitlist_position := first_driver_position;
  ELSE
    -- Subsequent drivers get the maximum existing position + 1
    SELECT COALESCE(MAX(waitlist_position), 0) + 1 INTO NEW.waitlist_position
    FROM craver_applications
    WHERE status = 'waitlist'
    AND region_id = NEW.region_id;
  END IF;
  
  -- Ensure position doesn't exceed display quota
  NEW.waitlist_position := LEAST(NEW.waitlist_position, region_display_quota);
  
  RETURN NEW;
END;
$$;

