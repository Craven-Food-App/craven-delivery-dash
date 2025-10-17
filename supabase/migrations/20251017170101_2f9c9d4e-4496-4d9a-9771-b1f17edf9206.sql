-- Add Stripe Connect account tracking to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS stripe_connect_account_id text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_charges_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_payouts_enabled boolean DEFAULT false;

-- Add comments for clarity
COMMENT ON COLUMN public.restaurants.stripe_connect_account_id IS 'Stripe Connect account ID for payouts';
COMMENT ON COLUMN public.restaurants.stripe_onboarding_complete IS 'Whether Stripe Connect onboarding is complete';
COMMENT ON COLUMN public.restaurants.stripe_charges_enabled IS 'Whether the account can accept charges';
COMMENT ON COLUMN public.restaurants.stripe_payouts_enabled IS 'Whether the account can receive payouts';