-- Add promotion details fields to restaurants table
-- These fields will store specific deal information when restaurants are marked as promoted

ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS promotion_title TEXT;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS promotion_description TEXT;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS promotion_discount_percentage INTEGER;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS promotion_discount_amount_cents INTEGER;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS promotion_minimum_order_cents INTEGER;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS promotion_maximum_discount_cents INTEGER;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS promotion_valid_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS promotion_image_url TEXT;

-- Add comments to document the new fields
COMMENT ON COLUMN public.restaurants.promotion_title IS 'Title of the promotion (e.g., "15% off, up to $6")';
COMMENT ON COLUMN public.restaurants.promotion_description IS 'Description of the promotion (e.g., "Valid on orders over $12")';
COMMENT ON COLUMN public.restaurants.promotion_discount_percentage IS 'Percentage discount (0-100)';
COMMENT ON COLUMN public.restaurants.promotion_discount_amount_cents IS 'Fixed discount amount in cents';
COMMENT ON COLUMN public.restaurants.promotion_minimum_order_cents IS 'Minimum order amount to qualify for promotion';
COMMENT ON COLUMN public.restaurants.promotion_maximum_discount_cents IS 'Maximum discount amount in cents (cap for percentage discounts)';
COMMENT ON COLUMN public.restaurants.promotion_valid_until IS 'Promotion expiration date';
COMMENT ON COLUMN public.restaurants.promotion_image_url IS 'Custom image URL for the promotion card';

-- Add check constraints for data validation
ALTER TABLE public.restaurants ADD CONSTRAINT restaurants_promotion_discount_percentage_check 
  CHECK (promotion_discount_percentage IS NULL OR (promotion_discount_percentage >= 0 AND promotion_discount_percentage <= 100));

ALTER TABLE public.restaurants ADD CONSTRAINT restaurants_promotion_discount_amount_check 
  CHECK (promotion_discount_amount_cents IS NULL OR promotion_discount_amount_cents >= 0);

ALTER TABLE public.restaurants ADD CONSTRAINT restaurants_promotion_minimum_order_check 
  CHECK (promotion_minimum_order_cents IS NULL OR promotion_minimum_order_cents >= 0);

ALTER TABLE public.restaurants ADD CONSTRAINT restaurants_promotion_maximum_discount_check 
  CHECK (promotion_maximum_discount_cents IS NULL OR promotion_maximum_discount_cents >= 0);

-- Create index for efficient querying of active promotions
CREATE INDEX IF NOT EXISTS idx_restaurants_promoted_active 
  ON public.restaurants (is_promoted, is_active, promotion_valid_until) 
  WHERE is_promoted = true AND is_active = true;
