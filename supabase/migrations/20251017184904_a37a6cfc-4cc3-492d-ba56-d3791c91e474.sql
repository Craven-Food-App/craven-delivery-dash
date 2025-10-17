-- Update RLS policy to prevent restaurants from updating their is_active status
-- Only admins should be able to control whether a restaurant is active or inactive

-- Drop existing policy
DROP POLICY IF EXISTS "Restaurant owners can manage their restaurants" ON public.restaurants;

-- Create new policy that excludes is_active from restaurant owner updates
CREATE POLICY "Restaurant owners can manage their restaurants" ON public.restaurants
FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (
  auth.uid() = owner_id AND
  -- Prevent restaurant owners from changing is_active
  is_active = (SELECT is_active FROM public.restaurants WHERE id = restaurants.id)
);

-- Create separate policy for admins to manage all restaurant fields
CREATE POLICY "Admins can manage all restaurant fields" ON public.restaurants
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);