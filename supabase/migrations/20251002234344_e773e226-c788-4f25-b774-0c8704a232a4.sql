-- Add RLS policy to allow admins to view all driver profiles
CREATE POLICY "Admins can view all driver profiles"
ON public.driver_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add RLS policy to allow viewing online/available drivers (for matching, testing, etc.)
CREATE POLICY "Anyone can view available drivers"
ON public.driver_profiles
FOR SELECT
TO authenticated
USING (is_available = true);