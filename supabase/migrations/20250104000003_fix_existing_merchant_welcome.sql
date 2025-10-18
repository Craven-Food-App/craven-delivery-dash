-- Fix existing restaurants to show merchant welcome screen
-- Set merchant_welcome_shown to FALSE for all existing restaurants
-- This ensures they get the welcome confetti experience

UPDATE public.restaurants
SET merchant_welcome_shown = FALSE
WHERE merchant_welcome_shown IS NULL;

-- Specifically ensure CMIH Kitchen gets the welcome screen
UPDATE public.restaurants
SET merchant_welcome_shown = FALSE
WHERE name = 'CMIH Kitchen';
