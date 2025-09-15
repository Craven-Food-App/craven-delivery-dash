-- Add delivery radius to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN delivery_radius_miles DECIMAL(4,2) DEFAULT 5.0;

-- Add latitude and longitude for delivery calculations
ALTER TABLE public.restaurants 
ADD COLUMN latitude DECIMAL(10,8),
ADD COLUMN longitude DECIMAL(11,8);

-- Create index for geospatial queries
CREATE INDEX idx_restaurants_location ON public.restaurants USING GIST (
  POINT(longitude, latitude)
) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;