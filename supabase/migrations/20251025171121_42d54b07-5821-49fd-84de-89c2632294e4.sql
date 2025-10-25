-- Create missing tables for commission management system
CREATE TABLE IF NOT EXISTS public.commission_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT NOT NULL UNIQUE,
  min_monthly_volume INTEGER NOT NULL DEFAULT 0,
  max_monthly_volume INTEGER,
  commission_percent NUMERIC NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.restaurant_commission_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  commission_percent NUMERIC NOT NULL,
  reason TEXT,
  approved_by UUID REFERENCES auth.users(id),
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, start_date)
);

CREATE TABLE IF NOT EXISTS public.commission_settings_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  changed_by UUID REFERENCES auth.users(id),
  settings_snapshot JSONB NOT NULL,
  change_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.commission_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_commission_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_settings_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for commission_tiers
CREATE POLICY "Admins can manage commission tiers" ON public.commission_tiers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Everyone can view active commission tiers" ON public.commission_tiers
  FOR SELECT USING (is_active = true);

-- RLS Policies for restaurant_commission_overrides
CREATE POLICY "Admins can manage commission overrides" ON public.restaurant_commission_overrides
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Restaurant owners can view their overrides" ON public.restaurant_commission_overrides
  FOR SELECT USING (
    restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())
  );

-- RLS Policies for commission_settings_history
CREATE POLICY "Admins can view commission history" ON public.commission_settings_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert commission history" ON public.commission_settings_history
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Insert default commission tiers
INSERT INTO public.commission_tiers (tier_name, min_monthly_volume, max_monthly_volume, commission_percent, description) VALUES
  ('Basic', 0, 100, 15, 'Standard commission for new restaurants'),
  ('Bronze', 101, 250, 12, 'Reduced rate for growing restaurants'),
  ('Silver', 251, 500, 10, 'Better rate for established restaurants'),
  ('Gold', 501, NULL, 8, 'Premium rate for high-volume restaurants')
ON CONFLICT (tier_name) DO NOTHING;