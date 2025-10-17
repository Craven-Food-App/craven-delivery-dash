-- Add RLS policies for Stripe Connect columns

-- Policy to allow restaurant owners to view their Stripe status
CREATE POLICY "Restaurant owners can view their Stripe status"
ON public.restaurants
FOR SELECT
USING (auth.uid() = owner_id);

-- Note: Stripe fields will be updated by edge functions using service role key
-- which bypasses RLS. Restaurant owners can update other fields but not Stripe fields
-- through the existing "Restaurant owners can manage their restaurants" policy