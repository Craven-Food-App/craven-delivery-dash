-- ================================================================
-- FIX DRIVER SIGNATURES RLS - Add UPDATE Policy for Upsert
-- ================================================================

-- Drop and recreate INSERT policy with better logic
DROP POLICY IF EXISTS "drivers_own_signatures_insert" ON public.driver_signatures;
CREATE POLICY "drivers_own_signatures_insert"
ON public.driver_signatures FOR INSERT
TO authenticated
WITH CHECK (
  driver_id IN (SELECT id FROM public.drivers WHERE auth_user_id = auth.uid())
  OR auth.jwt()->>'email' = 'craven@usa.com'
);

-- ADD UPDATE POLICY (critical for upsert to work!)
DROP POLICY IF EXISTS "drivers_own_signatures_update" ON public.driver_signatures;
CREATE POLICY "drivers_own_signatures_update"
ON public.driver_signatures FOR UPDATE
TO authenticated
USING (
  driver_id IN (SELECT id FROM public.drivers WHERE auth_user_id = auth.uid())
  OR auth.jwt()->>'email' = 'craven@usa.com'
)
WITH CHECK (
  driver_id IN (SELECT id FROM public.drivers WHERE auth_user_id = auth.uid())
  OR auth.jwt()->>'email' = 'craven@usa.com'
);

-- Ensure proper grants
GRANT SELECT, INSERT, UPDATE ON public.driver_signatures TO authenticated;

COMMENT ON POLICY "drivers_own_signatures_update" ON public.driver_signatures IS 
'Allows drivers to update their own signatures - critical for upsert operations';

