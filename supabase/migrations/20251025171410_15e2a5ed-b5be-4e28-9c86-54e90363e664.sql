-- Add missing columns to existing referral_settings table
DO $$
BEGIN
  -- Add referral_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'referral_settings' AND column_name = 'referral_type'
  ) THEN
    ALTER TABLE public.referral_settings 
    ADD COLUMN referral_type TEXT CHECK (referral_type IN ('customer', 'driver', 'restaurant'));
    
    -- Add unique constraint on referral_type
    CREATE UNIQUE INDEX IF NOT EXISTS referral_settings_referral_type_key 
    ON public.referral_settings(referral_type) WHERE referral_type IS NOT NULL;
  END IF;
  
  -- Add referrer_bonus_amount if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'referral_settings' AND column_name = 'referrer_bonus_amount'
  ) THEN
    ALTER TABLE public.referral_settings 
    ADD COLUMN referrer_bonus_amount INTEGER DEFAULT 0;
  END IF;
  
  -- Add referred_bonus_amount if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'referral_settings' AND column_name = 'referred_bonus_amount'
  ) THEN
    ALTER TABLE public.referral_settings 
    ADD COLUMN referred_bonus_amount INTEGER DEFAULT 0;
  END IF;
  
  -- Add requirements jsonb column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'referral_settings' AND column_name = 'requirements'
  ) THEN
    ALTER TABLE public.referral_settings 
    ADD COLUMN requirements JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Update existing row to have default values for new columns if there's data
UPDATE public.referral_settings 
SET 
  referral_type = COALESCE(referral_type, 'customer'),
  referrer_bonus_amount = COALESCE(referrer_bonus_amount, referrer_bonus_cents),
  referred_bonus_amount = COALESCE(referred_bonus_amount, referred_bonus_cents),
  requirements = COALESCE(requirements, jsonb_build_object('min_orders_required', min_orders_required))
WHERE referral_type IS NULL;

-- Insert default referral settings if they don't exist
INSERT INTO public.referral_settings (referral_type, referrer_bonus_amount, referred_bonus_amount, referrer_bonus_cents, referred_bonus_cents, min_orders_required, requirements) VALUES
  ('customer', 1000, 1000, 1000, 1000, 1, '{"min_order_amount": 2000}'::jsonb),
  ('driver', 5000, 2500, 5000, 2500, 1, '{"min_deliveries": 10}'::jsonb),
  ('restaurant', 10000, 5000, 10000, 5000, 1, '{"min_monthly_orders": 50}'::jsonb)
ON CONFLICT DO NOTHING;

-- Now create the other missing table
CREATE TABLE IF NOT EXISTS public.driver_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(driver_id, endpoint)
);

ALTER TABLE IF EXISTS public.driver_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS for push subscriptions
DO $$
BEGIN
  DROP POLICY IF EXISTS "Drivers can manage their push subscriptions" ON public.driver_push_subscriptions;
  CREATE POLICY "Drivers can manage their push subscriptions" ON public.driver_push_subscriptions
    FOR ALL USING (auth.uid() = driver_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;