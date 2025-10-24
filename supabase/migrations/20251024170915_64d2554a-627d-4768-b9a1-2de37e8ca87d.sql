-- Drop and recreate tables cleanly
DROP TABLE IF EXISTS public.referral_settings CASCADE;
DROP TABLE IF EXISTS public.subscription_plans CASCADE;

-- Create referral_settings table
CREATE TABLE public.referral_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_bonus_cents INTEGER NOT NULL DEFAULT 1000,
  referred_bonus_cents INTEGER NOT NULL DEFAULT 500,
  min_orders_required INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view referral settings"
  ON public.referral_settings FOR SELECT USING (true);

CREATE POLICY "Admins can manage referral settings"
  ON public.referral_settings FOR ALL USING (has_role(auth.uid(), 'admin'));

INSERT INTO public.referral_settings (referrer_bonus_cents, referred_bonus_cents, min_orders_required)
VALUES (1000, 500, 1);

-- Create subscription_plans table  
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price_monthly INTEGER NOT NULL,
  price_annual INTEGER NOT NULL,
  benefits JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active subscription plans"
  ON public.subscription_plans FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage subscription plans"
  ON public.subscription_plans FOR ALL USING (has_role(auth.uid(), 'admin'));

INSERT INTO public.subscription_plans (name, price_monthly, price_annual, benefits)
VALUES (
  'CravePass',
  999,
  9999,
  '{"free_delivery":true,"reduced_service_fee":50,"priority_support":true,"exclusive_deals":true,"min_order_amount":1200,"description":"Unlimited free delivery and exclusive benefits"}'::jsonb
);

-- Add missing columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee INTEGER DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS service_fee INTEGER DEFAULT 0;