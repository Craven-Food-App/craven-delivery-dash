-- Add display_quota column to regions table
ALTER TABLE regions 
ADD COLUMN IF NOT EXISTS display_quota INTEGER DEFAULT 0;

-- Add helpful comment
COMMENT ON COLUMN regions.display_quota IS 'The number shown to applicants in queue (for psychological motivation). Admins see real waitlist_count.';

-- Set initial display_quota values to match active_quota
UPDATE regions SET display_quota = 436 WHERE id = 1; -- Toledo
UPDATE regions SET display_quota = 200 WHERE id = 2; -- Detroit
UPDATE regions SET display_quota = 150 WHERE id = 3; -- Cleveland
UPDATE regions SET display_quota = 120 WHERE id = 4; -- Columbus
UPDATE regions SET display_quota = 100 WHERE id = 5; -- Cincinnati

-- Update get_driver_queue_position() function to return display_quota instead of real count
CREATE OR REPLACE FUNCTION public.get_driver_queue_position(driver_uuid uuid)
RETURNS TABLE(queue_position bigint, total_in_region bigint, region_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    calculate_waitlist_position(driver_uuid)::BIGINT as queue_position,
    r.display_quota::BIGINT as total_in_region,  -- Changed from COUNT(*) to display_quota
    r.name as region_name
  FROM public.regions r
  WHERE r.id = (
    SELECT region_id FROM public.craver_applications WHERE id = driver_uuid
  );
END;
$function$;