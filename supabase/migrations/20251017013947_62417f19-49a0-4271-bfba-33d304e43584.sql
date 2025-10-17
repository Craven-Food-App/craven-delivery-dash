-- Ensure approving an application creates a user_profile before inserting driver_profile
CREATE OR REPLACE FUNCTION public.handle_application_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_profile RECORD;
BEGIN
  -- Only proceed if status changed to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Set onboarding started timestamp
    NEW.onboarding_started_at = now();

    -- Ensure a user profile exists for this user (required by FK on driver_profiles.user_id)
    INSERT INTO public.user_profiles (user_id, full_name, phone, role)
    VALUES (
      NEW.user_id,
      CONCAT(COALESCE(NEW.first_name, ''), CASE WHEN NEW.first_name IS NOT NULL AND NEW.last_name IS NOT NULL THEN ' ' ELSE '' END, COALESCE(NEW.last_name, '')),
      NEW.phone,
      'driver'
    )
    ON CONFLICT (user_id) DO NOTHING;

    -- Create or update driver profile
    INSERT INTO public.driver_profiles (
      user_id,
      vehicle_type,
      vehicle_make,
      vehicle_model,
      vehicle_year,
      license_plate,
      is_available,
      status,
      rating,
      total_deliveries
    ) VALUES (
      NEW.user_id,
      NEW.vehicle_type,
      NEW.vehicle_make,
      NEW.vehicle_model,
      NEW.vehicle_year,
      NEW.license_plate,
      false,
      'offline',
      5.0,
      0
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
      vehicle_type = EXCLUDED.vehicle_type,
      vehicle_make = EXCLUDED.vehicle_make,
      vehicle_model = EXCLUDED.vehicle_model,
      vehicle_year = EXCLUDED.vehicle_year,
      license_plate = EXCLUDED.license_plate,
      updated_at = now();

    -- Assign driver role if not exists
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'driver')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Update user profile role (safe if exists)
    UPDATE public.user_profiles
    SET role = 'driver'
    WHERE user_id = NEW.user_id;

    -- Create or update onboarding progress record
    INSERT INTO public.driver_onboarding_progress (
      user_id,
      application_id,
      current_step
    ) VALUES (
      NEW.user_id,
      NEW.id,
      'profile_created'
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
      application_id = EXCLUDED.application_id,
      current_step = 'profile_created',
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$function$;