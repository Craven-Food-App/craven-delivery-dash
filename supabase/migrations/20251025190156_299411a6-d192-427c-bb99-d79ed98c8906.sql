-- Fix security warnings: Add search_path to all database functions
-- This prevents search path hijacking attacks

CREATE OR REPLACE FUNCTION public.update_batched_deliveries_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.ensure_single_primary_location()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    IF NEW.is_primary = true THEN
        UPDATE public.store_locations 
        SET is_primary = false 
        WHERE restaurant_id = NEW.restaurant_id 
        AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.assign_order_to_primary_location()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    primary_location_id UUID;
BEGIN
    SELECT id INTO primary_location_id
    FROM public.store_locations
    WHERE restaurant_id = NEW.restaurant_id
    AND is_primary = true
    AND is_active = true
    LIMIT 1;
    
    IF primary_location_id IS NULL THEN
        SELECT id INTO primary_location_id
        FROM public.store_locations
        WHERE restaurant_id = NEW.restaurant_id
        AND is_active = true
        LIMIT 1;
    END IF;
    
    IF primary_location_id IS NOT NULL THEN
        INSERT INTO public.store_orders (order_id, store_location_id)
        VALUES (NEW.id, primary_location_id);
    END IF;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.initialize_store_inventory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    INSERT INTO public.store_inventory (store_location_id, menu_item_id, quantity_available, is_available)
    SELECT 
        NEW.id,
        mi.id,
        CASE 
            WHEN mi.is_available = true THEN 100
            ELSE 0
        END,
        mi.is_available
    FROM public.menu_items mi
    WHERE mi.restaurant_id = NEW.restaurant_id;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.assign_region_by_zip()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  region_record RECORD;
BEGIN
  SELECT * INTO region_record
  FROM public.regions
  WHERE zip_prefix IS NOT NULL 
  AND NEW.zip_code LIKE (zip_prefix || '%')
  ORDER BY LENGTH(zip_prefix) DESC
  LIMIT 1;
  
  IF region_record IS NULL THEN
    NEW.region_id := 1;
  ELSE
    NEW.region_id := region_record.id;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.add_to_activation_queue()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.status = 'waitlist' AND (OLD.status IS NULL OR OLD.status != 'waitlist') THEN
    INSERT INTO public.activation_queue (driver_id, region_id, priority_score)
    VALUES (NEW.id, NEW.region_id, NEW.priority_score)
    ON CONFLICT (driver_id) DO UPDATE SET
      priority_score = NEW.priority_score,
      region_id = NEW.region_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.initialize_onboarding_tasks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.onboarding_tasks (driver_id, task_key, task_name, description, points_reward)
  VALUES 
    (NEW.id, 'profile_complete', 'Complete Profile', 'Fill out all personal information', 10),
    (NEW.id, 'documents_uploaded', 'Upload Documents', 'Upload driver license and insurance', 20),
    (NEW.id, 'orientation_video', 'Watch Orientation', 'Complete orientation video', 15),
    (NEW.id, 'safety_quiz', 'Safety Quiz', 'Pass the safety knowledge quiz', 25),
    (NEW.id, 'referral_bonus', 'Refer Friends', 'Refer other drivers to earn bonus points', 50);
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_priority_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.activation_queue
  SET priority_score = NEW.priority_score
  WHERE driver_id = NEW.id;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_waitlist_position()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.waitlist_position := (
    SELECT COUNT(*) + 1
    FROM public.craver_applications
    WHERE status = 'waitlist'
    AND region_id = NEW.region_id
    AND (
      priority_score > NEW.priority_score
      OR (priority_score = NEW.priority_score AND created_at < NEW.created_at)
    )
  );
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_driver_priority_on_task_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.completed = TRUE AND OLD.completed = FALSE THEN
    UPDATE public.craver_applications 
    SET points = points + NEW.points_reward
    WHERE id = NEW.driver_id;
    
    UPDATE public.craver_applications 
    SET priority_score = points
    WHERE id = NEW.driver_id;
    
    UPDATE public.activation_queue 
    SET priority_score = (
      SELECT priority_score FROM public.craver_applications WHERE id = NEW.driver_id
    )
    WHERE driver_id = NEW.driver_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_referral_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.craver_applications 
  SET points = points + 50
  WHERE id = NEW.referrer_id;
  
  UPDATE public.craver_applications 
  SET priority_score = points
  WHERE id = NEW.referrer_id;
  
  UPDATE public.craver_applications 
  SET points = points + 25
  WHERE id = NEW.referred_id;
  
  UPDATE public.craver_applications 
  SET priority_score = points
  WHERE id = NEW.referred_id;
  
  UPDATE public.activation_queue 
  SET priority_score = (
    SELECT priority_score FROM public.craver_applications WHERE id = NEW.referrer_id
  )
  WHERE driver_id = NEW.referrer_id;
  
  UPDATE public.activation_queue 
  SET priority_score = (
    SELECT priority_score FROM public.craver_applications WHERE id = NEW.referred_id
  )
  WHERE driver_id = NEW.referred_id;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_default_onboarding_tasks(driver_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.onboarding_tasks (driver_id, task_key, task_name, description, points_reward) VALUES
  (driver_uuid, 'complete_profile', 'Complete Profile Setup', 'Fill out all required profile information and verify your details', 25),
  (driver_uuid, 'upload_vehicle_photos', 'Upload Vehicle Photos', 'Take and upload clear photos of your vehicle from multiple angles', 30),
  (driver_uuid, 'pass_safety_quiz', 'Pass Safety Quiz', 'Complete the driver safety quiz with a passing score of 80% or higher', 50),
  (driver_uuid, 'setup_cashapp_payouts', 'Setup CashApp Payouts', 'Connect your CashApp account for instant payout processing', 35),
  (driver_uuid, 'download_mobile_app', 'Download Mobile App', 'Download and log in to the Craven delivery mobile app', 20),
  (driver_uuid, 'complete_practice_route', 'Complete First Practice Route', 'Complete a practice delivery route to familiarize yourself with the app', 25),
  (driver_uuid, 'join_facebook_group', 'Join Driver Facebook Group', 'Join our exclusive driver community on Facebook for tips and support', 15),
  (driver_uuid, 'complete_service_training', 'Complete Customer Service Training', 'Watch customer service training videos and pass the assessment', 30),
  (driver_uuid, 'social_media_share', 'Social Media Share', 'Share about joining Craven on your social media accounts', 10);
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_waitlist_position()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.status = 'pending' AND (OLD.status IS NULL OR OLD.status != 'pending') THEN
    INSERT INTO public.activation_queue (driver_id, region_id, priority_score)
    VALUES (NEW.id, NEW.region_id, NEW.priority_score);
    
    PERFORM create_default_onboarding_tasks(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_update_heat_map()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  PERFORM public.update_order_heat_map();
  RETURN NEW;
END;
$function$;