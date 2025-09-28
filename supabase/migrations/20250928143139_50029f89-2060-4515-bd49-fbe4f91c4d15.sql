-- Add 'total_free' as a valid promo code type
-- This requires updating the check constraint on the promo_codes table

-- First remove the existing check constraint
ALTER TABLE public.promo_codes DROP CONSTRAINT IF EXISTS promo_codes_type_check;

-- Add the new constraint with 'total_free' included
ALTER TABLE public.promo_codes ADD CONSTRAINT promo_codes_type_check 
CHECK (type IN ('percentage', 'fixed_amount', 'free_delivery', 'bogo', 'total_free'));