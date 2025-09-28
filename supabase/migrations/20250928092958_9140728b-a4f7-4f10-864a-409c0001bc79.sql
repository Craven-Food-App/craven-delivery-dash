-- Allow restaurant owners to view customer profiles for their orders
CREATE POLICY "Restaurant owners can view customer profiles for their orders" 
ON public.user_profiles 
FOR SELECT 
USING (
  user_id IN (
    SELECT DISTINCT o.customer_id 
    FROM orders o 
    JOIN restaurants r ON o.restaurant_id = r.id 
    WHERE r.owner_id = auth.uid()
  )
);