-- Fix security linter: set search_path on functions

-- 1) Ensure create_restaurant_onboarding_progress has fixed search_path
CREATE OR REPLACE FUNCTION public.create_restaurant_onboarding_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.restaurant_onboarding_progress (
    restaurant_id,
    menu_preparation_status,
    business_info_verified,
    go_live_ready
  ) VALUES (
    NEW.id,
    'not_started',
    false,
    false
  );
  RETURN NEW;
END;
$$;

-- 2) Harden update_onboarding_updated_at with fixed search_path
CREATE OR REPLACE FUNCTION public.update_onboarding_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;