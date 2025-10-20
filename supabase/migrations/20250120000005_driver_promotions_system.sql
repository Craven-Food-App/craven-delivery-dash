-- Driver Promotions & Challenges System
-- Gamified incentive system better than DoorDash

-- 1. Driver Promotions (Challenge definitions)
CREATE TABLE IF NOT EXISTS driver_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic info
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,
  icon TEXT, -- emoji or icon name
  
  -- Challenge type
  challenge_type TEXT CHECK (challenge_type IN (
    'delivery_count', 
    'time_based', 
    'peak_hours', 
    'geographic', 
    'rating_based', 
    'streak_based',
    'referral'
  )) NOT NULL,
  
  -- Requirements
  requirement_value INT NOT NULL, -- e.g., 20 deliveries, 8 hours, etc.
  requirement_details JSONB, -- Additional parameters
  
  -- Rewards
  reward_type TEXT CHECK (reward_type IN (
    'cash_bonus',
    'per_delivery_bonus',
    'guaranteed_earnings',
    'multiplier',
    'achievement'
  )) NOT NULL,
  reward_amount_cents INT, -- Cash amount
  reward_multiplier DECIMAL(3,2), -- e.g., 1.5x
  reward_details JSONB,
  
  -- Targeting
  target_audience TEXT CHECK (target_audience IN ('all', 'new_drivers', 'elite_only', 'specific_city')) DEFAULT 'all',
  target_cities TEXT[], -- Specific cities
  target_tiers TEXT[], -- ['Elite', 'Pro']
  
  -- Availability
  max_participants INT, -- Cap enrollment (creates scarcity)
  current_participants INT DEFAULT 0,
  
  -- Validity
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  priority INT DEFAULT 0, -- Display order
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Driver Promotion Participation (Who enrolled)
CREATE TABLE IF NOT EXISTS driver_promotion_participation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  promotion_id UUID NOT NULL REFERENCES driver_promotions(id) ON DELETE CASCADE,
  
  -- Progress tracking
  current_progress INT DEFAULT 0,
  requirement_value INT NOT NULL, -- Snapshot at enrollment
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  
  -- Reward status
  reward_claimed BOOLEAN DEFAULT false,
  reward_claimed_at TIMESTAMPTZ,
  reward_amount_cents INT,
  
  -- Timestamps
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(driver_id, promotion_id)
);

-- 3. Driver Surge Zones (Dynamic pricing areas)
CREATE TABLE IF NOT EXISTS driver_surge_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  zone_name TEXT NOT NULL,
  city TEXT NOT NULL,
  
  -- Geographic bounds
  center_lat DECIMAL(10,8) NOT NULL,
  center_lng DECIMAL(11,8) NOT NULL,
  radius_miles DECIMAL(5,2) NOT NULL,
  
  -- Surge multiplier
  current_multiplier DECIMAL(3,2) DEFAULT 1.0,
  demand_level TEXT CHECK (demand_level IN ('low', 'medium', 'high', 'very_high')) DEFAULT 'medium',
  
  -- Active times
  is_active BOOLEAN DEFAULT true,
  active_until TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Driver Referrals
CREATE TABLE IF NOT EXISTS driver_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  referrer_driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_driver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL UNIQUE,
  
  -- Status
  status TEXT CHECK (status IN ('pending', 'qualified', 'paid', 'expired')) DEFAULT 'pending',
  
  -- Requirements
  required_deliveries INT DEFAULT 20,
  referee_completed_deliveries INT DEFAULT 0,
  
  -- Rewards
  referrer_reward_cents INT DEFAULT 50000, -- $500
  referee_reward_cents INT DEFAULT 30000, -- $300
  referrer_paid BOOLEAN DEFAULT false,
  referee_paid BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  qualified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- 5. Driver Streak Tracking
CREATE TABLE IF NOT EXISTS driver_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- 5-star streak
  current_5star_streak INT DEFAULT 0,
  longest_5star_streak INT DEFAULT 0,
  
  -- Daily activity streak
  daily_streak INT DEFAULT 0,
  longest_daily_streak INT DEFAULT 0,
  last_active_date DATE,
  
  -- Weekly streak
  weekly_streak INT DEFAULT 0,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_driver_promotions_active ON driver_promotions(is_active, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_driver_promotions_featured ON driver_promotions(is_featured, priority);
CREATE INDEX IF NOT EXISTS idx_promotion_participation_driver ON driver_promotion_participation(driver_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_promotion_participation_promo ON driver_promotion_participation(promotion_id);
CREATE INDEX IF NOT EXISTS idx_surge_zones_city ON driver_surge_zones(city, is_active);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON driver_referrals(referrer_driver_id, status);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON driver_referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_streaks_driver ON driver_streaks(driver_id);

-- Enable RLS
ALTER TABLE driver_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_promotion_participation ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_surge_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Drivers can view active promotions"
  ON driver_promotions FOR SELECT
  TO authenticated
  USING (
    is_active = true AND
    starts_at <= NOW() AND
    ends_at >= NOW()
  );

CREATE POLICY "Admins can manage promotions"
  ON driver_promotions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Drivers can view their own participation"
  ON driver_promotion_participation FOR SELECT
  TO authenticated
  USING (driver_id = auth.uid());

CREATE POLICY "Drivers can enroll in promotions"
  ON driver_promotion_participation FOR INSERT
  TO authenticated
  WITH CHECK (driver_id = auth.uid());

CREATE POLICY "System can update participation"
  ON driver_promotion_participation FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Drivers can view active surge zones"
  ON driver_surge_zones FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Drivers can view their referrals"
  ON driver_referrals FOR SELECT
  TO authenticated
  USING (referrer_driver_id = auth.uid() OR referred_driver_id = auth.uid());

CREATE POLICY "Drivers can create referrals"
  ON driver_referrals FOR INSERT
  TO authenticated
  WITH CHECK (referrer_driver_id = auth.uid());

CREATE POLICY "Drivers can view their streaks"
  ON driver_streaks FOR SELECT
  TO authenticated
  USING (driver_id = auth.uid());

-- Triggers
CREATE TRIGGER driver_promotions_updated_at
  BEFORE UPDATE ON driver_promotions
  FOR EACH ROW
  EXECUTE FUNCTION update_commission_updated_at();

CREATE TRIGGER promotion_participation_updated_at
  BEFORE UPDATE ON driver_promotion_participation
  FOR EACH ROW
  EXECUTE FUNCTION update_commission_updated_at();

-- Function to auto-enroll drivers in promotions
CREATE OR REPLACE FUNCTION auto_enroll_driver_promos()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-enroll in "all drivers" promos when driver profile is created
  INSERT INTO driver_promotion_participation (driver_id, promotion_id, requirement_value)
  SELECT NEW.user_id, dp.id, dp.requirement_value
  FROM driver_promotions dp
  WHERE dp.is_active = true
    AND dp.target_audience = 'all'
    AND dp.starts_at <= NOW()
    AND dp.ends_at >= NOW()
    AND (dp.max_participants IS NULL OR dp.current_participants < dp.max_participants)
  ON CONFLICT (driver_id, promotion_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-enrollment
CREATE TRIGGER auto_enroll_on_driver_create
  AFTER INSERT ON driver_profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_enroll_driver_promos();

-- Insert sample promotions
INSERT INTO driver_promotions (
  title, description, short_description, icon, challenge_type,
  requirement_value, reward_type, reward_amount_cents,
  starts_at, ends_at, is_featured, priority
) VALUES
  (
    'Weekend Warrior',
    'Complete 20 deliveries this weekend and earn a $50 bonus!',
    '20 deliveries → $50',
    '💰',
    'delivery_count',
    20,
    'cash_bonus',
    5000,
    DATE_TRUNC('week', NOW()) + INTERVAL '5 days', -- Friday
    DATE_TRUNC('week', NOW()) + INTERVAL '7 days', -- Sunday
    true,
    1
  ),
  (
    'Peak Hour Pro',
    'Complete 10 deliveries during lunch or dinner rush hours',
    '10 peak deliveries → $25',
    '⚡',
    'peak_hours',
    10,
    'cash_bonus',
    2500,
    NOW(),
    NOW() + INTERVAL '7 days',
    true,
    2
  ),
  (
    'Daily Grind',
    'Work at least 1 delivery every day for 7 days straight',
    '7-day streak → $100',
    '📅',
    'streak_based',
    7,
    'cash_bonus',
    10000,
    NOW(),
    NOW() + INTERVAL '30 days',
    false,
    3
  )
ON CONFLICT DO NOTHING;

