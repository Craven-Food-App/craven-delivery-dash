-- Phase 1: Add I-9 document column to craver_applications
ALTER TABLE public.craver_applications 
ADD COLUMN IF NOT EXISTS i9_document TEXT;

-- Phase 2: Add onboarding timestamps to craver_applications
ALTER TABLE public.craver_applications
ADD COLUMN IF NOT EXISTS onboarding_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Create driver_onboarding_progress table
CREATE TABLE IF NOT EXISTS public.driver_onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  application_id UUID REFERENCES public.craver_applications(id) ON DELETE CASCADE,
  current_step TEXT NOT NULL DEFAULT 'profile_created',
  profile_creation_completed BOOLEAN DEFAULT false,
  orientation_video_watched BOOLEAN DEFAULT false,
  safety_quiz_passed BOOLEAN DEFAULT false,
  payment_method_added BOOLEAN DEFAULT false,
  first_delivery_bonus_eligible BOOLEAN DEFAULT true,
  onboarding_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on driver_onboarding_progress
ALTER TABLE public.driver_onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Drivers can view their own onboarding progress
CREATE POLICY "Drivers can view their own onboarding progress"
ON public.driver_onboarding_progress
FOR SELECT
USING (auth.uid() = user_id);

-- Drivers can update their own onboarding progress
CREATE POLICY "Drivers can update their own onboarding progress"
ON public.driver_onboarding_progress
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all onboarding progress
CREATE POLICY "Admins can view all onboarding progress"
ON public.driver_onboarding_progress
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create function to handle application approval
CREATE OR REPLACE FUNCTION public.handle_application_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_profile RECORD;
BEGIN
  -- Only proceed if status changed to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    
    -- Set onboarding started timestamp
    NEW.onboarding_started_at = now();
    
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
    
    -- Update user profile role
    UPDATE public.user_profiles
    SET role = 'driver'
    WHERE user_id = NEW.user_id;
    
    -- Create onboarding progress record
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
$$;

-- Create trigger for application approval
DROP TRIGGER IF EXISTS on_application_approval ON public.craver_applications;
CREATE TRIGGER on_application_approval
  BEFORE UPDATE ON public.craver_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_application_approval();

-- Add trigger to update updated_at on driver_onboarding_progress
CREATE TRIGGER update_driver_onboarding_progress_updated_at
  BEFORE UPDATE ON public.driver_onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();