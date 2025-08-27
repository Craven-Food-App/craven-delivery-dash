-- Fix the function search path security issue
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 NUMERIC, 
    lng1 NUMERIC, 
    lat2 NUMERIC, 
    lng2 NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
    radius_earth NUMERIC := 6371; -- Earth radius in kilometers
    lat1_rad NUMERIC;
    lat2_rad NUMERIC;
    delta_lat NUMERIC;
    delta_lng NUMERIC;
    a NUMERIC;
    c NUMERIC;
BEGIN
    -- Convert degrees to radians
    lat1_rad := radians(lat1);
    lat2_rad := radians(lat2);
    delta_lat := radians(lat2 - lat1);
    delta_lng := radians(lng2 - lng1);
    
    -- Haversine formula
    a := sin(delta_lat/2) * sin(delta_lat/2) + 
         cos(lat1_rad) * cos(lat2_rad) * 
         sin(delta_lng/2) * sin(delta_lng/2);
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    
    -- Return distance in kilometers
    RETURN radius_earth * c;
END;
$$ LANGUAGE plpgsql
SET search_path = public;