-- Create driver_locations table for real-time driver tracking
CREATE TABLE public.driver_locations (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    lat NUMERIC NOT NULL,
    lng NUMERIC NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

-- Allow drivers to update their own location
CREATE POLICY "Drivers can update their own location" 
ON public.driver_locations 
FOR ALL 
USING (auth.uid() = user_id);

-- Allow customers to view driver locations for their orders
CREATE POLICY "Customers can view driver locations for their orders" 
ON public.driver_locations 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.driver_id = driver_locations.user_id 
        AND orders.customer_id = auth.uid()
    )
);

-- Create index for better performance
CREATE INDEX idx_driver_locations_updated_at ON public.driver_locations(updated_at);

-- Add function to update driver location
CREATE OR REPLACE FUNCTION public.update_driver_location(
    driver_user_id UUID,
    latitude NUMERIC,
    longitude NUMERIC
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.driver_locations (user_id, lat, lng, updated_at)
    VALUES (driver_user_id, latitude, longitude, now())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        lat = EXCLUDED.lat,
        lng = EXCLUDED.lng,
        updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_driver_location TO authenticated;
