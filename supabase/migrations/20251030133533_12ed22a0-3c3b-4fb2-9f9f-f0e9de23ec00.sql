-- Create function to check if a point is within any delivery zones
CREATE OR REPLACE FUNCTION public.check_point_in_zones(lat double precision, lng double precision)
RETURNS TABLE (
  zone_id uuid,
  zone_name text,
  restaurant_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dz.id as zone_id,
    dz.name as zone_name,
    dz.restaurant_id
  FROM delivery_zones dz
  WHERE dz.is_active = true
    AND ST_Contains(
      dz.geometry,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)
    );
END;
$$;