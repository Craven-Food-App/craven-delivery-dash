-- Add RLS policy to allow admins to view all driver sessions
-- This is needed for admin dashboards to see which drivers are online

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all driver sessions" ON public.driver_sessions;
DROP POLICY IF EXISTS "Admins can manage driver sessions" ON public.driver_sessions;

-- Create policy to allow admins to view all driver sessions
-- Use is_admin function which is SECURITY DEFINER and bypasses RLS
CREATE POLICY "Admins can view all driver sessions"
ON public.driver_sessions
FOR SELECT
TO authenticated
USING (
  public.is_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid() AND email = 'craven@usa.com'
  )
);

-- Also allow admins to manage sessions for testing/monitoring purposes
CREATE POLICY "Admins can manage driver sessions"
ON public.driver_sessions
FOR ALL
TO authenticated
USING (
  public.is_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid() AND email = 'craven@usa.com'
  )
);

