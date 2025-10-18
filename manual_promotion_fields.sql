-- Manual SQL script to add promotion fields to restaurants table
-- Run this in the Supabase SQL Editor

-- Add promotion details fields to restaurants table
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS promotion_title TEXT;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS promotion_description TEXT;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS promotion_discount_percentage INTEGER;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS promotion_discount_amount_cents INTEGER;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS promotion_minimum_order_cents INTEGER;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS promotion_maximum_discount_cents INTEGER;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS promotion_valid_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS promotion_image_url TEXT;

-- Add check constraints for data validation
ALTER TABLE public.restaurants ADD CONSTRAINT IF NOT EXISTS restaurants_promotion_discount_percentage_check 
  CHECK (promotion_discount_percentage IS NULL OR (promotion_discount_percentage >= 0 AND promotion_discount_percentage <= 100));

ALTER TABLE public.restaurants ADD CONSTRAINT IF NOT EXISTS restaurants_promotion_discount_amount_check 
  CHECK (promotion_discount_amount_cents IS NULL OR promotion_discount_amount_cents >= 0);

ALTER TABLE public.restaurants ADD CONSTRAINT IF NOT EXISTS restaurants_promotion_minimum_order_check 
  CHECK (promotion_minimum_order_cents IS NULL OR promotion_minimum_order_cents >= 0);

ALTER TABLE public.restaurants ADD CONSTRAINT IF NOT EXISTS restaurants_promotion_maximum_discount_check 
  CHECK (promotion_maximum_discount_cents IS NULL OR promotion_maximum_discount_cents >= 0);

-- Create index for efficient querying of active promotions
CREATE INDEX IF NOT EXISTS idx_restaurants_promoted_active 
  ON public.restaurants (is_promoted, is_active, promotion_valid_until) 
  WHERE is_promoted = true AND is_active = true;

-- Example: Update a restaurant with promotion details
-- UPDATE public.restaurants 
-- SET 
--   is_promoted = true,
--   promotion_title = '15% off, up to $6',
--   promotion_description = 'Valid on orders over $12',
--   promotion_discount_percentage = 15,
--   promotion_maximum_discount_cents = 600,
--   promotion_minimum_order_cents = 1200,
--   promotion_valid_until = '2024-02-01 23:59:59'
-- WHERE id = 'your-restaurant-id-here';
