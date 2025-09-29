-- Fix the remaining functions with search_path issues

-- Update all remaining functions
CREATE OR REPLACE FUNCTION public.make_user_active_driver(target_user_id uuid, vehicle_info jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  application_exists boolean;
BEGIN
  -- Check if the calling user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can activate drivers';
  END IF;

  -- Check if user has an application
  SELECT EXISTS (
    SELECT 1 FROM public.craver_applications 
    WHERE user_id = target_user_id
  ) INTO application_exists;

  -- Update application status if it exists
  IF application_exists THEN
    UPDATE public.craver_applications 
    SET 
      status = 'approved',
      background_check = true,
      vehicle_inspection = true,
      updated_at = now()
    WHERE user_id = target_user_id;
  END IF;

  -- Create or update driver profile
  INSERT INTO public.driver_profiles (
    user_id,
    is_available,
    status,
    vehicle_type,
    vehicle_make,
    vehicle_model,
    vehicle_year,
    license_plate,
    rating,
    total_deliveries
  ) VALUES (
    target_user_id,
    true,  -- is_available
    'online',  -- status
    COALESCE(vehicle_info->>'vehicle_type', 'car'),
    COALESCE(vehicle_info->>'vehicle_make', 'Unknown'),
    COALESCE(vehicle_info->>'vehicle_model', 'Unknown'),
    COALESCE((vehicle_info->>'vehicle_year')::integer, 2020),
    COALESCE(vehicle_info->>'license_plate', 'TEMP123'),
    5.0,  -- initial rating
    0     -- total_deliveries
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    is_available = true,
    status = 'online',
    vehicle_type = COALESCE(vehicle_info->>'vehicle_type', driver_profiles.vehicle_type),
    vehicle_make = COALESCE(vehicle_info->>'vehicle_make', driver_profiles.vehicle_make),
    vehicle_model = COALESCE(vehicle_info->>'vehicle_model', driver_profiles.vehicle_model),
    vehicle_year = COALESCE((vehicle_info->>'vehicle_year')::integer, driver_profiles.vehicle_year),
    license_plate = COALESCE(vehicle_info->>'license_plate', driver_profiles.license_plate),
    updated_at = now();

  -- Update user profile role if needed
  UPDATE public.user_profiles 
  SET role = 'driver'
  WHERE user_id = target_user_id AND role IS NULL;

END;
$function$;

-- Update other functions that might need fixing
CREATE OR REPLACE FUNCTION public.ensure_driver_can_go_online(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- First ensure driver profile exists
  PERFORM public.create_driver_profile_from_application(target_user_id);
  
  -- Update driver status to online
  UPDATE public.driver_profiles 
  SET 
    status = 'online',
    is_available = true,
    updated_at = now()
  WHERE user_id = target_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Driver profile not found after creation attempt';
  END IF;
  
  RETURN true;
END;
$function$;

-- Update distance calculation function
CREATE OR REPLACE FUNCTION public.calculate_distance(lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  radius_miles constant numeric := 3959;
  dlat numeric;
  dlng numeric;
  a numeric;
  c numeric;
  distance numeric;
BEGIN
  -- Convert degrees to radians
  dlat := radians(lat2 - lat1);
  dlng := radians(lng2 - lng1);
  
  -- Haversine formula
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng/2) * sin(dlng/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  distance := radius_miles * c;
  
  RETURN distance;
END;
$function$;