-- Add location tracking columns to driver_profiles table
ALTER TABLE public.driver_profiles 
ADD COLUMN IF NOT EXISTS current_latitude DECIMAL(10,8),
ADD COLUMN IF NOT EXISTS current_longitude DECIMAL(11,8),
ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS heading DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS speed DECIMAL(5,2);

-- Create driver_location_history table for tracking movement
CREATE TABLE IF NOT EXISTS public.driver_location_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  heading DECIMAL(5,2),
  speed DECIMAL(5,2),
  accuracy DECIMAL(8,2),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.driver_location_history ENABLE ROW LEVEL SECURITY;

-- Create policies for driver_location_history
CREATE POLICY "Drivers can insert their own location history" 
ON public.driver_location_history 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.driver_profiles 
    WHERE user_id = auth.uid() AND user_id = driver_id
  )
);

CREATE POLICY "Drivers can view their own location history" 
ON public.driver_location_history 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.driver_profiles 
    WHERE user_id = auth.uid() AND user_id = driver_id
  )
);

-- Allow admins to view all location data
CREATE POLICY "Admins can view all location history" 
ON public.driver_location_history 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_driver_location_history_driver_timestamp 
ON public.driver_location_history (driver_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_driver_profiles_location 
ON public.driver_profiles (current_latitude, current_longitude) 
WHERE current_latitude IS NOT NULL AND current_longitude IS NOT NULL;