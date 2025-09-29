-- Allow both authenticated and anonymous users to view active promo codes
-- This is necessary for guest checkout functionality
DROP POLICY IF EXISTS "Users can view active promo codes" ON public.promo_codes;

CREATE POLICY "Public can view active promo codes"
ON public.promo_codes
FOR SELECT
TO anon, authenticated
USING (
  is_active = true 
  AND valid_from <= now() 
  AND (valid_until IS NULL OR valid_until > now())
);

-- Also ensure promo_code_usage allows inserts for both authenticated and anonymous users
-- but tracks the user_id when available
DROP POLICY IF EXISTS "System can insert promo usage" ON public.promo_code_usage;

CREATE POLICY "System can insert promo usage"
ON public.promo_code_usage
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Allow insert if user_id matches the authenticated user, or user_id is null for anonymous
  (auth.uid() IS NULL AND user_id IS NULL) OR 
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
);