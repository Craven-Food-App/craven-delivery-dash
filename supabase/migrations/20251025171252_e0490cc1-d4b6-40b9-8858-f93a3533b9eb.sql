-- Create remaining missing tables for mobile app features

-- Driver Preferences
CREATE TABLE IF NOT EXISTS public.driver_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  map_style TEXT DEFAULT 'default',
  auto_accept_orders BOOLEAN DEFAULT false,
  notification_sound BOOLEAN DEFAULT true,
  voice_navigation BOOLEAN DEFAULT true,
  show_earnings_summary BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Driver Promotions
CREATE TABLE IF NOT EXISTS public.driver_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  promo_type TEXT NOT NULL CHECK (promo_type IN ('bonus', 'quest', 'surge', 'referral')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  requirements JSONB NOT NULL,
  reward_amount INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Driver Promotion Participation
CREATE TABLE IF NOT EXISTS public.driver_promotion_participation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  promotion_id UUID NOT NULL REFERENCES public.driver_promotions(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  reward_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(driver_id, promotion_id)
);

-- Driver Surge Zones
CREATE TABLE IF NOT EXISTS public.driver_surge_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_name TEXT NOT NULL,
  coordinates JSONB NOT NULL,
  surge_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  is_active BOOLEAN DEFAULT true,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.driver_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_promotion_participation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_surge_zones ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Drivers can manage their preferences" ON public.driver_preferences
  FOR ALL USING (auth.uid() = driver_id);

CREATE POLICY "Everyone can view active promotions" ON public.driver_promotions
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage promotions" ON public.driver_promotions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Drivers can view their participation" ON public.driver_promotion_participation
  FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can insert their participation" ON public.driver_promotion_participation
  FOR INSERT WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "System can update participation" ON public.driver_promotion_participation
  FOR UPDATE USING (true);

CREATE POLICY "Everyone can view active surge zones" ON public.driver_surge_zones
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage surge zones" ON public.driver_surge_zones
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );