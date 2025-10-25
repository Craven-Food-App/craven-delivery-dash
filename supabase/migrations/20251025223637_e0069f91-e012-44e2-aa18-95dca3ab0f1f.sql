-- Add vehicle photo columns to craver_applications
ALTER TABLE public.craver_applications 
ADD COLUMN IF NOT EXISTS vehicle_photo_front TEXT,
ADD COLUMN IF NOT EXISTS vehicle_photo_back TEXT,
ADD COLUMN IF NOT EXISTS vehicle_photo_left TEXT,
ADD COLUMN IF NOT EXISTS vehicle_photo_right TEXT;