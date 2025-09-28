-- Add missing columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payout_cents integer,
ADD COLUMN IF NOT EXISTS distance_km numeric(5,2),
ADD COLUMN IF NOT EXISTS pickup_address jsonb,
ADD COLUMN IF NOT EXISTS dropoff_address jsonb,
ADD COLUMN IF NOT EXISTS assigned_craver_id uuid REFERENCES auth.users(id);

-- Create order_assignments table for driver assignment workflow
CREATE TABLE IF NOT EXISTS public.order_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(order_id, driver_id)
);

-- Create craver_locations table for driver location tracking
CREATE TABLE IF NOT EXISTS public.craver_locations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  lat numeric(10,8) NOT NULL,
  lng numeric(11,8) NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.order_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.craver_locations ENABLE ROW LEVEL SECURITY;

-- RLS policies for order_assignments
CREATE POLICY "Drivers can view their assignments" 
ON public.order_assignments 
FOR SELECT 
USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can update their assignments" 
ON public.order_assignments 
FOR UPDATE 
USING (auth.uid() = driver_id);

-- RLS policies for craver_locations
CREATE POLICY "Drivers can manage their own location" 
ON public.craver_locations 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "System can read driver locations" 
ON public.craver_locations 
FOR SELECT 
USING (true);

-- Create calculate_distance function
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 numeric,
  lng1 numeric,
  lat2 numeric,
  lng2 numeric
)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
  radius_miles constant numeric := 3959;
  dlat numeric;
  dlng numeric;
  a numeric;
  c numeric;
  distance numeric;
BEGIN
  -- Convert degrees to radians
  dlat := radians(lat2 - lat1);
  dlng := radians(lng2 - lng1);
  
  -- Haversine formula
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng/2) * sin(dlng/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  distance := radius_miles * c;
  
  RETURN distance;
END;
$$;

-- Add update trigger to order_assignments
CREATE TRIGGER update_order_assignments_updated_at
BEFORE UPDATE ON public.order_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add update trigger to craver_locations
CREATE TRIGGER update_craver_locations_updated_at
BEFORE UPDATE ON public.craver_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update existing orders to have default values for new columns
UPDATE public.orders 
SET 
  payout_cents = COALESCE(total_cents - subtotal_cents - COALESCE(tax_cents, 0), 500),
  distance_km = 5.0,
  pickup_address = jsonb_build_object(
    'street', '123 Restaurant Street',
    'city', 'Test City', 
    'state', 'TX',
    'zip', '12345'
  ),
  dropoff_address = COALESCE(delivery_address, jsonb_build_object(
    'street', '456 Customer Street',
    'city', 'Test City',
    'state', 'TX', 
    'zip', '12345'
  ))
WHERE payout_cents IS NULL;