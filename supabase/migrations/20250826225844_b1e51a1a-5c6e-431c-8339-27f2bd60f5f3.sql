-- Fix the security warning by setting search_path for the function
CREATE OR REPLACE FUNCTION calculate_distance(lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric)
RETURNS numeric AS $$
DECLARE
  radius numeric := 3959; -- Earth's radius in miles
  dlat numeric;
  dlng numeric;
  a numeric;
  c numeric;
BEGIN
  dlat := radians(lat2 - lat1);
  dlng := radians(lng2 - lng1);
  a := sin(dlat/2)^2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng/2)^2;
  c := 2 * asin(sqrt(a));
  RETURN radius * c;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;