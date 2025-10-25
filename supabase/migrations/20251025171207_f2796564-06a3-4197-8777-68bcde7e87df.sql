-- Add missing columns to existing tables

-- Add region_id to drivers if it doesn't exist (for DriverWaitlistDashboard)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'driver_profiles' AND column_name = 'region_id'
  ) THEN
    ALTER TABLE public.driver_profiles ADD COLUMN region_id INTEGER REFERENCES public.regions(id);
  END IF;
END $$;

-- Add missing columns to driver_profiles for mobile app
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'driver_profiles' AND column_name = 'acceptance_rate'
  ) THEN
    ALTER TABLE public.driver_profiles ADD COLUMN acceptance_rate NUMERIC DEFAULT 100;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'driver_profiles' AND column_name = 'completion_rate'
  ) THEN
    ALTER TABLE public.driver_profiles ADD COLUMN completion_rate NUMERIC DEFAULT 100;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'driver_profiles' AND column_name = 'on_time_rate'
  ) THEN
    ALTER TABLE public.driver_profiles ADD COLUMN on_time_rate NUMERIC DEFAULT 100;
  END IF;
END $$;

-- Add email to user_profiles if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN email TEXT;
  END IF;
END $$;