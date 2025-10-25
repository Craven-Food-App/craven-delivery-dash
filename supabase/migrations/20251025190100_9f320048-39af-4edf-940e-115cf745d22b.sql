-- Add promotion fields to restaurants table for weekly deals feature
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS promotion_title TEXT;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS promotion_description TEXT;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS promotion_discount_percentage INTEGER;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS promotion_discount_amount_cents INTEGER;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS promotion_minimum_order_cents INTEGER;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS promotion_maximum_discount_cents INTEGER;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS promotion_valid_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS promotion_image_url TEXT;

-- Add check constraints for data validation (drop if exists, then create)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'restaurants_promotion_discount_percentage_check') THEN
    ALTER TABLE public.restaurants DROP CONSTRAINT restaurants_promotion_discount_percentage_check;
  END IF;
END $$;

ALTER TABLE public.restaurants ADD CONSTRAINT restaurants_promotion_discount_percentage_check 
  CHECK (promotion_discount_percentage IS NULL OR (promotion_discount_percentage >= 0 AND promotion_discount_percentage <= 100));

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'restaurants_promotion_discount_amount_check') THEN
    ALTER TABLE public.restaurants DROP CONSTRAINT restaurants_promotion_discount_amount_check;
  END IF;
END $$;

ALTER TABLE public.restaurants ADD CONSTRAINT restaurants_promotion_discount_amount_check 
  CHECK (promotion_discount_amount_cents IS NULL OR promotion_discount_amount_cents >= 0);

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'restaurants_promotion_minimum_order_check') THEN
    ALTER TABLE public.restaurants DROP CONSTRAINT restaurants_promotion_minimum_order_check;
  END IF;
END $$;

ALTER TABLE public.restaurants ADD CONSTRAINT restaurants_promotion_minimum_order_check 
  CHECK (promotion_minimum_order_cents IS NULL OR promotion_minimum_order_cents >= 0);

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'restaurants_promotion_maximum_discount_check') THEN
    ALTER TABLE public.restaurants DROP CONSTRAINT restaurants_promotion_maximum_discount_check;
  END IF;
END $$;

ALTER TABLE public.restaurants ADD CONSTRAINT restaurants_promotion_maximum_discount_check 
  CHECK (promotion_maximum_discount_cents IS NULL OR promotion_maximum_discount_cents >= 0);

-- Create index for efficient querying of active promotions
CREATE INDEX IF NOT EXISTS idx_restaurants_promoted_active 
  ON public.restaurants (is_promoted, is_active, promotion_valid_until) 
  WHERE is_promoted = true AND is_active = true;