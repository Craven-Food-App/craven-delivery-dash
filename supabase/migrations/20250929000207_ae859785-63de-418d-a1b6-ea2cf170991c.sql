-- Fix all remaining functions with search_path security issues

-- Update update_order_heat_map function
CREATE OR REPLACE FUNCTION public.update_order_heat_map()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Clear old heat map data (older than 24 hours)
  DELETE FROM public.order_heat_map 
  WHERE time_window < NOW() - INTERVAL '24 hours';
  
  -- Insert pickup location heat map points from recent orders (last 4 hours)
  INSERT INTO public.order_heat_map (lat, lng, intensity, location_type, time_window)
  SELECT 
    (pickup_address->>'lat')::numeric as lat,
    (pickup_address->>'lng')::numeric as lng,
    COUNT(*) as intensity,
    'pickup' as location_type,
    DATE_TRUNC('hour', created_at) as time_window
  FROM public.orders 
  WHERE created_at >= NOW() - INTERVAL '4 hours'
    AND pickup_address IS NOT NULL
    AND pickup_address->>'lat' IS NOT NULL 
    AND pickup_address->>'lng' IS NOT NULL
    AND pickup_address->>'lat' != ''
    AND pickup_address->>'lng' != ''
  GROUP BY 
    (pickup_address->>'lat')::numeric,
    (pickup_address->>'lng')::numeric,
    DATE_TRUNC('hour', created_at)
  ON CONFLICT DO NOTHING;
  
  -- Insert dropoff location heat map points from recent orders (last 4 hours)
  INSERT INTO public.order_heat_map (lat, lng, intensity, location_type, time_window)
  SELECT 
    (dropoff_address->>'lat')::numeric as lat,
    (dropoff_address->>'lng')::numeric as lng,
    COUNT(*) as intensity,
    'dropoff' as location_type,
    DATE_TRUNC('hour', created_at) as time_window
  FROM public.orders 
  WHERE created_at >= NOW() - INTERVAL '4 hours'
    AND dropoff_address IS NOT NULL
    AND dropoff_address->>'lat' IS NOT NULL 
    AND dropoff_address->>'lng' IS NOT NULL
    AND dropoff_address->>'lat' != ''
    AND dropoff_address->>'lng' != ''
  GROUP BY 
    (dropoff_address->>'lat')::numeric,
    (dropoff_address->>'lng')::numeric,
    DATE_TRUNC('hour', created_at)
  ON CONFLICT DO NOTHING;
END;
$function$;

-- Update trigger_update_heat_map function
CREATE OR REPLACE FUNCTION public.trigger_update_heat_map()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Call the heat map update function
  PERFORM public.update_order_heat_map();
  RETURN NEW;
END;
$function$;

-- Update assign_admin_role function  
CREATE OR REPLACE FUNCTION public.assign_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Check if the new user has the admin email
  IF NEW.email = 'crave-n@usa.com' THEN
    -- Insert admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
    
    -- Create user profile
    INSERT INTO public.user_profiles (user_id, full_name, role)
    VALUES (NEW.id, 'Super Admin', 'admin');
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;