-- Fix RLS policies for background checks to allow auto-approval for testing

-- Allow authenticated users to insert background checks
CREATE POLICY "drivers_can_insert_bg_check"
ON public.driver_background_checks FOR INSERT
TO authenticated
WITH CHECK (driver_id IN (SELECT id FROM public.drivers WHERE auth_user_id = auth.uid()));

-- Allow service role to update background checks (for auto-approval in testing)
CREATE POLICY "service_role_can_update_bg_check"
ON public.driver_background_checks FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Allow authenticated users to update their own background check (for demo auto-clear)
CREATE POLICY "drivers_can_update_own_bg_check"
ON public.driver_background_checks FOR UPDATE
TO authenticated
USING (driver_id IN (SELECT id FROM public.drivers WHERE auth_user_id = auth.uid()))
WITH CHECK (driver_id IN (SELECT id FROM public.drivers WHERE auth_user_id = auth.uid()));

