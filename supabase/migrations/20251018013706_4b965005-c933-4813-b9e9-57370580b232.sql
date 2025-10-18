-- Fix the RLS policy that's causing "more than one row returned" error on restaurant image uploads

-- Drop the problematic policy
DROP POLICY IF EXISTS "Restaurant owners can manage their restaurants" ON restaurants;

-- Recreate with corrected WITH CHECK expression
CREATE POLICY "Restaurant owners can manage their restaurants"
ON restaurants
FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (
  auth.uid() = owner_id 
  AND is_active = (SELECT is_active FROM restaurants WHERE id = restaurants.id)
);