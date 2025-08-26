-- Fix function search path security issue
CREATE OR REPLACE FUNCTION create_driver_profile_for_approved_craver()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Only create driver profile for approved applications
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO public.driver_profiles (user_id, rating, total_deliveries, driver_level, status, is_available)
    VALUES (NEW.user_id, 0, 0, 1, 'offline', false)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;