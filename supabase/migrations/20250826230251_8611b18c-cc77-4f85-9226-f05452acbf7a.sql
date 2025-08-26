-- Add RLS policy to allow restaurants to create orders for their own restaurant
CREATE POLICY "Restaurants can create orders for their restaurant" ON public.orders
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM restaurants 
    WHERE restaurants.id = orders.restaurant_id 
    AND restaurants.owner_id = auth.uid()
  )
);