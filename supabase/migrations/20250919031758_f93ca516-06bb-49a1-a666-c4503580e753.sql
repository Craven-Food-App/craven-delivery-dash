-- Policies to allow restaurant owners to view and update their restaurant orders
-- Ensure RLS is enabled (already enabled by default when policies exist)

-- 1) Allow restaurant owners to SELECT orders for their restaurants
CREATE POLICY IF NOT EXISTS "Restaurant owners can view their restaurant orders"
ON public.orders
FOR SELECT
USING (
  restaurant_id IN (
    SELECT r.id FROM public.restaurants r WHERE r.owner_id = auth.uid()
  )
);

-- 2) Allow restaurant owners to UPDATE orders for their restaurants (for status workflow like confirm/preparing/ready)
CREATE POLICY IF NOT EXISTS "Restaurant owners can update their restaurant orders"
ON public.orders
FOR UPDATE
USING (
  restaurant_id IN (
    SELECT r.id FROM public.restaurants r WHERE r.owner_id = auth.uid()
  )
);

-- Optional: improve realtime payloads for orders (safe to run repeatedly)
ALTER TABLE public.orders REPLICA IDENTITY FULL;
DO $$ BEGIN
  -- Add to publication if not already present
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;