-- Fix restaurants RLS policy causing update errors during image save
BEGIN;

DROP POLICY IF EXISTS "Restaurant owners can manage their restaurants" ON public.restaurants;

CREATE POLICY "Restaurant owners can manage their restaurants"
ON public.restaurants
FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

COMMIT;