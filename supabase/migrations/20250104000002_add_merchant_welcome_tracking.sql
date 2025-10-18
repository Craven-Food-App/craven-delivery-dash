-- Add merchant welcome tracking fields to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS merchant_welcome_shown BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS merchant_welcome_shown_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add comments for clarity
COMMENT ON COLUMN public.restaurants.merchant_welcome_shown IS 'Whether the merchant has seen the welcome screen';
COMMENT ON COLUMN public.restaurants.merchant_welcome_shown_at IS 'When the merchant welcome screen was shown';

-- Update existing restaurants to show they haven't seen the welcome screen yet
-- This ensures CMIH KITCHEN and other existing restaurants get the welcome screen
UPDATE public.restaurants 
SET merchant_welcome_shown = FALSE, 
    merchant_welcome_shown_at = NULL 
WHERE merchant_welcome_shown IS NULL;
