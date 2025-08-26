-- Add restaurant_id column to orders table to link orders to restaurants
ALTER TABLE public.orders ADD COLUMN restaurant_id uuid;

-- Add foreign key constraint to ensure data integrity
ALTER TABLE public.orders 
ADD CONSTRAINT orders_restaurant_id_fkey 
FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id);

-- Create an index for better query performance
CREATE INDEX idx_orders_restaurant_id ON public.orders(restaurant_id);

-- Update RLS policies to allow restaurants to see their own orders
CREATE POLICY "Restaurants can view their own orders" ON public.orders
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM restaurants 
    WHERE restaurants.id = orders.restaurant_id 
    AND restaurants.owner_id = auth.uid()
  )
);

CREATE POLICY "Restaurants can update their own orders" ON public.orders
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM restaurants 
    WHERE restaurants.id = orders.restaurant_id 
    AND restaurants.owner_id = auth.uid()
  )
);

-- Insert some sample orders for the existing restaurant to test
INSERT INTO public.orders (
  restaurant_id,
  pickup_name,
  pickup_address,
  pickup_lat,
  pickup_lng,
  dropoff_name,
  dropoff_address,
  dropoff_lat,
  dropoff_lng,
  payout_cents,
  distance_km,
  status
) VALUES 
(
  'b17c0e90-3410-4914-9316-ce30f2726287', -- The CMIH Kitchen restaurant ID
  'CMIH Kitchen',
  '6759 Nebraska Ave, Toledo, OH 43615',
  41.6528,
  -83.6982,
  'Customer Home',
  '123 Main St, Toledo, OH 43604',
  41.6639,
  -83.5552,
  1250,
  8.5,
  'pending'
),
(
  'b17c0e90-3410-4914-9316-ce30f2726287',
  'CMIH Kitchen', 
  '6759 Nebraska Ave, Toledo, OH 43615',
  41.6528,
  -83.6982,
  'Office Building',
  '456 Oak Street, Toledo, OH 43602',
  41.6481,
  -83.5378,
  950,
  5.2,
  'assigned'
),
(
  'b17c0e90-3410-4914-9316-ce30f2726287',
  'CMIH Kitchen',
  '6759 Nebraska Ave, Toledo, OH 43615', 
  41.6528,
  -83.6982,
  'University Campus',
  '789 University Dr, Toledo, OH 43606',
  41.6565,
  -83.6147,
  750,
  3.1,
  'delivered'
);