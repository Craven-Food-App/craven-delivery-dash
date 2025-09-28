-- Clean up duplicate policy and fix security warnings

-- Remove the duplicate old policy
DROP POLICY IF EXISTS "Restaurant owners can manage employees" ON public.restaurant_employees;

-- Fix function search path security warnings for existing functions
-- Update function that calculates driver daily earnings
CREATE OR REPLACE FUNCTION public.calculate_driver_daily_earnings(target_driver_id uuid, target_date date)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  total_earnings DECIMAL(10,2) := 0;
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO total_earnings
  FROM public.driver_earnings
  WHERE driver_id = target_driver_id
    AND DATE(created_at) = target_date;
    
  RETURN total_earnings;
END;
$function$;

-- Update generate order number function
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  random_chars TEXT := '';
  i INTEGER;
BEGIN
  -- Generate 6 character alphanumeric code
  FOR i IN 1..6 LOOP
    random_chars := random_chars || chr(65 + floor(random() * 26)::int);
  END LOOP;
  
  RETURN 'CR' || random_chars;
END;
$function$;

-- Update all other functions to have proper search_path
CREATE OR REPLACE FUNCTION public.sync_driver_availability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.status = 'online' THEN
    NEW.is_available = true;
  ELSIF NEW.status = 'offline' THEN
    NEW.is_available = false;
  END IF;
  RETURN NEW;
END;
$function$;