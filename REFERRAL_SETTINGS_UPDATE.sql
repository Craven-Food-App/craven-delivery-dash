-- Align referral_settings schema with UI expectations
ALTER TABLE public.referral_settings 
  ADD COLUMN IF NOT EXISTS referral_type TEXT NOT NULL DEFAULT 'customer',
  ADD COLUMN IF NOT EXISTS referrer_bonus_amount INTEGER NOT NULL DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS referred_bonus_amount INTEGER NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS requirements JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Ensure unique row per referral_type for easy .single() queries
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'referral_settings_referral_type_key') THEN
    ALTER TABLE public.referral_settings ADD CONSTRAINT referral_settings_referral_type_key UNIQUE (referral_type);
  END IF;
END $$;

-- Seed or upsert default settings for all user types
INSERT INTO public.referral_settings (referral_type, referrer_bonus_amount, referred_bonus_amount, min_orders_required, is_active, requirements)
VALUES 
  ('customer', 1000, 500, 1, true, '{"min_orders":1,"min_amount":2000}'::jsonb),
  ('driver', 2000, 0, 0, true, '{"min_deliveries":10}'::jsonb),
  ('restaurant', 5000, 0, 0, true, '{"min_revenue":50000}'::jsonb)
ON CONFLICT (referral_type) DO UPDATE SET
  referrer_bonus_amount = EXCLUDED.referrer_bonus_amount,
  referred_bonus_amount = EXCLUDED.referred_bonus_amount,
  min_orders_required = EXCLUDED.min_orders_required,
  is_active = EXCLUDED.is_active,
  requirements = EXCLUDED.requirements,
  updated_at = now();

