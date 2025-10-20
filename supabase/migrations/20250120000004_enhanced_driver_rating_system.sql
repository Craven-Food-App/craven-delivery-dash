-- Enhanced Driver Rating System
-- Better than DoorDash with category breakdowns, achievements, tiers, and analytics

-- 1. Driver Rating Breakdown (Category-specific ratings)
CREATE TABLE IF NOT EXISTS driver_rating_breakdown (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES customer_orders(id) ON DELETE CASCADE,
  
  -- Category ratings (1-5 each)
  communication_rating DECIMAL(2,1) CHECK (communication_rating BETWEEN 1 AND 5),
  professionalism_rating DECIMAL(2,1) CHECK (professionalism_rating BETWEEN 1 AND 5),
  speed_rating DECIMAL(2,1) CHECK (speed_rating BETWEEN 1 AND 5),
  food_care_rating DECIMAL(2,1) CHECK (food_care_rating BETWEEN 1 AND 5),
  
  -- Overall rating (calculated from categories)
  overall_rating DECIMAL(3,2) CHECK (overall_rating BETWEEN 1 AND 5),
  
  -- Compliments (positive tags)
  compliments TEXT[], -- e.g., ['Fast', 'Friendly', 'Professional', 'Careful with food']
  
  -- Feedback
  customer_comment TEXT,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Driver Performance Metrics (Calculated metrics)
CREATE TABLE IF NOT EXISTS driver_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Overall stats
  overall_rating DECIMAL(3,2) DEFAULT 5.0,
  total_ratings INT DEFAULT 0,
  total_deliveries INT DEFAULT 0,
  
  -- Category averages
  avg_communication DECIMAL(3,2) DEFAULT 5.0,
  avg_professionalism DECIMAL(3,2) DEFAULT 5.0,
  avg_speed DECIMAL(3,2) DEFAULT 5.0,
  avg_food_care DECIMAL(3,2) DEFAULT 5.0,
  
  -- Performance rates
  acceptance_rate DECIMAL(5,2) DEFAULT 100.0,
  completion_rate DECIMAL(5,2) DEFAULT 100.0,
  on_time_rate DECIMAL(5,2) DEFAULT 100.0,
  
  -- Trends
  rating_trend_7d DECIMAL(3,2) DEFAULT 0.0, -- Change in last 7 days
  rating_trend_30d DECIMAL(3,2) DEFAULT 0.0, -- Change in last 30 days
  
  -- City ranking
  city TEXT,
  city_percentile INT, -- Top X% in city (e.g., 5 = Top 5%)
  
  -- Tier
  current_tier TEXT CHECK (current_tier IN ('Elite', 'Pro', 'Rising Star', 'New Driver')),
  
  -- Achievements count
  total_achievements INT DEFAULT 0,
  
  -- Streaks
  current_5star_streak INT DEFAULT 0,
  longest_5star_streak INT DEFAULT 0,
  
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Driver Achievements (Gamification)
CREATE TABLE IF NOT EXISTS driver_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  achievement_code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- emoji or icon name
  tier TEXT CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  requirement_type TEXT, -- 'deliveries', 'rating', 'streak', 'speed', 'custom'
  requirement_value INT,
  points INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Driver Achievement Unlocks (What each driver has earned)
CREATE TABLE IF NOT EXISTS driver_achievement_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES driver_achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  is_displayed BOOLEAN DEFAULT true, -- Show in profile
  UNIQUE(driver_id, achievement_id)
);

-- 5. Driver Rating Tiers (Elite, Pro, Rising Star, New)
CREATE TABLE IF NOT EXISTS driver_rating_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT NOT NULL UNIQUE,
  min_rating DECIMAL(3,2) NOT NULL,
  min_deliveries INT DEFAULT 0,
  color TEXT NOT NULL, -- Hex color
  icon TEXT, -- emoji
  benefits JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Rating Alerts (Admin notifications for low performers)
CREATE TABLE IF NOT EXISTS driver_rating_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT CHECK (alert_type IN ('low_rating', 'declining_trend', 'low_acceptance', 'customer_complaints')),
  severity TEXT CHECK (severity IN ('info', 'warning', 'critical')),
  message TEXT NOT NULL,
  data JSONB, -- Additional context
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rating_breakdown_driver ON driver_rating_breakdown(driver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rating_breakdown_order ON driver_rating_breakdown(order_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_driver ON driver_performance_metrics(driver_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_tier ON driver_performance_metrics(current_tier);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_city ON driver_performance_metrics(city, city_percentile);
CREATE INDEX IF NOT EXISTS idx_achievement_unlocks_driver ON driver_achievement_unlocks(driver_id);
CREATE INDEX IF NOT EXISTS idx_rating_alerts_driver ON driver_rating_alerts(driver_id, is_resolved);

-- Enable RLS
ALTER TABLE driver_rating_breakdown ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_achievement_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_rating_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_rating_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Drivers can view their own ratings"
  ON driver_rating_breakdown FOR SELECT
  TO authenticated
  USING (driver_id = auth.uid());

CREATE POLICY "Customers can insert ratings for their orders"
  ON driver_rating_breakdown FOR INSERT
  TO authenticated
  WITH CHECK (
    customer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM customer_orders
      WHERE id = order_id AND customer_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can view their own metrics"
  ON driver_performance_metrics FOR SELECT
  TO authenticated
  USING (driver_id = auth.uid());

CREATE POLICY "Admins can view all metrics"
  ON driver_performance_metrics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Everyone can view achievements"
  ON driver_achievements FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Drivers can view their unlocked achievements"
  ON driver_achievement_unlocks FOR SELECT
  TO authenticated
  USING (driver_id = auth.uid());

CREATE POLICY "Admins can manage achievements"
  ON driver_achievements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Everyone can view tiers"
  ON driver_rating_tiers FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can view all alerts"
  ON driver_rating_alerts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Triggers
CREATE OR REPLACE FUNCTION update_driver_rating_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER driver_metrics_updated_at
  BEFORE UPDATE ON driver_performance_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_driver_rating_updated_at();

-- Function to recalculate driver metrics
CREATE OR REPLACE FUNCTION recalculate_driver_metrics(p_driver_id UUID)
RETURNS VOID AS $$
DECLARE
  v_metrics RECORD;
BEGIN
  -- Calculate metrics from ratings
  SELECT
    COALESCE(AVG(overall_rating), 5.0) as avg_rating,
    COUNT(*) as total_ratings,
    COALESCE(AVG(communication_rating), 5.0) as avg_comm,
    COALESCE(AVG(professionalism_rating), 5.0) as avg_prof,
    COALESCE(AVG(speed_rating), 5.0) as avg_speed,
    COALESCE(AVG(food_care_rating), 5.0) as avg_food
  INTO v_metrics
  FROM driver_rating_breakdown
  WHERE driver_id = p_driver_id;
  
  -- Update or insert metrics
  INSERT INTO driver_performance_metrics (
    driver_id,
    overall_rating,
    total_ratings,
    avg_communication,
    avg_professionalism,
    avg_speed,
    avg_food_care,
    calculated_at
  ) VALUES (
    p_driver_id,
    v_metrics.avg_rating,
    v_metrics.total_ratings,
    v_metrics.avg_comm,
    v_metrics.avg_prof,
    v_metrics.avg_speed,
    v_metrics.avg_food
    NOW()
  )
  ON CONFLICT (driver_id) DO UPDATE SET
    overall_rating = v_metrics.avg_rating,
    total_ratings = v_metrics.total_ratings,
    avg_communication = v_metrics.avg_comm,
    avg_professionalism = v_metrics.avg_prof,
    avg_speed = v_metrics.avg_speed,
    avg_food_care = v_metrics.avg_food,
    calculated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to recalculate metrics when new rating added
CREATE OR REPLACE FUNCTION trigger_recalculate_metrics()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM recalculate_driver_metrics(NEW.driver_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recalculate_metrics_on_rating
  AFTER INSERT ON driver_rating_breakdown
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalculate_metrics();

-- Insert default tiers with your custom colors
INSERT INTO driver_rating_tiers (tier_name, min_rating, min_deliveries, color, icon, benefits)
VALUES
  ('Elite', 4.8, 100, '#E5E4E2', '💎', '{"priority_orders": true, "higher_base_pay": true, "exclusive_bonuses": true, "vip_support": true}'),
  ('Pro', 4.5, 50, '#D4AF37', '🥇', '{"priority_orders": true, "bonus_eligible": true, "premium_support": true}'),
  ('Rising Star', 4.0, 20, '#C0C0C0', '🥈', '{"standard_orders": true, "growth_program": true}'),
  ('New Driver', 0, 0, '#CD7F32', '🥉', '{"learning_mode": true, "training_access": true, "protected_rating": true}')
ON CONFLICT DO NOTHING;

-- Insert default achievements
INSERT INTO driver_achievements (achievement_code, title, description, icon, tier, requirement_type, requirement_value, points)
VALUES
  ('FIRST_DELIVERY', 'First Delivery', 'Completed your first delivery', '🎉', 'bronze', 'deliveries', 1, 10),
  ('CENTURY_CLUB', '100 Deliveries', 'Joined the Century Club', '💯', 'silver', 'deliveries', 100, 50),
  ('VETERAN', '500 Deliveries', 'Veteran driver status', '🎖️', 'gold', 'deliveries', 500, 100),
  ('LEGEND', '1000 Deliveries', 'Legendary driver', '👑', 'platinum', 'deliveries', 1000, 200),
  ('PERFECTIONIST', 'Perfect 5.0', 'Achieved perfect 5.0 rating', '⭐', 'gold', 'rating', 500, 150),
  ('SPEED_DEMON', 'Speed Demon', 'Average 5 minutes early on deliveries', '⚡', 'gold', 'speed', 300, 100),
  ('STREAK_10', '10-Star Streak', '10 five-star ratings in a row', '🔥', 'silver', 'streak', 10, 50),
  ('STREAK_50', '50-Star Streak', '50 five-star ratings in a row', '🔥🔥', 'gold', 'streak', 50, 150),
  ('EARLY_BIRD', 'Early Bird', '100 morning deliveries (6am-10am)', '🌅', 'bronze', 'custom', 100, 30),
  ('NIGHT_OWL', 'Night Owl', '100 late night deliveries (8pm-2am)', '🦉', 'bronze', 'custom', 100, 30)
ON CONFLICT (achievement_code) DO NOTHING;

