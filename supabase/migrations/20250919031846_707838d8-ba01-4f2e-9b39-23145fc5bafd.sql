-- Add RLS policies for restaurant owners to access orders
CREATE POLICY "Restaurant owners can view their restaurant orders"
ON public.orders
FOR SELECT
USING (
  restaurant_id IN (
    SELECT r.id FROM public.restaurants r WHERE r.owner_id = auth.uid()
  )
);

CREATE POLICY "Restaurant owners can update their restaurant orders"
ON public.orders
FOR UPDATE
USING (
  restaurant_id IN (
    SELECT r.id FROM public.restaurants r WHERE r.owner_id = auth.uid()
  )
);

-- Enable realtime for orders table
ALTER TABLE public.orders REPLICA IDENTITY FULL;