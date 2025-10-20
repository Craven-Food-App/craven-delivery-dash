-- Enhanced Commission & Fee Management System
-- Creates tables for: tiers, overrides, peak hours, history, fee rules, geographic zones

-- 1. Commission Tiers (Performance-based automatic pricing)
CREATE TABLE IF NOT EXISTS commission_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT NOT NULL,
  tier_level INT NOT NULL, -- 1=Bronze, 2=Silver, 3=Gold, 4=Platinum, 5=Elite
  min_monthly_volume DECIMAL(12,2) DEFAULT 0,
  max_monthly_volume DECIMAL(12,2),
  commission_percent DECIMAL(5,2) NOT NULL,
  benefits JSONB, -- JSON object with tier benefits
  icon TEXT, -- emoji or icon name
  color TEXT, -- hex color for UI
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Restaurant Commission Overrides (Custom rates per restaurant)
CREATE TABLE IF NOT EXISTS restaurant_commission_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  commission_percent DECIMAL(5,2) NOT NULL,
  service_fee_percent DECIMAL(5,2),
  delivery_fee_override_cents INT,
  reason TEXT NOT NULL,
  notes TEXT,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ, -- NULL = permanent
  created_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Peak Hour Rules (Dynamic pricing configuration)
CREATE TABLE IF NOT EXISTS peak_hour_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  day_of_week INT[], -- 0=Sunday, 6=Saturday, NULL=all days
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.0,
  additional_fee_cents INT DEFAULT 0,
  applies_to TEXT CHECK (applies_to IN ('delivery', 'service', 'both')) DEFAULT 'delivery',
  is_active BOOLEAN DEFAULT true,
  priority INT DEFAULT 0, -- Higher priority rules override lower ones
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Commission Settings History (Version control & rollback)
CREATE TABLE IF NOT EXISTS commission_settings_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settings_snapshot JSONB NOT NULL, -- Complete settings at that point
  change_type TEXT CHECK (change_type IN ('global_update', 'tier_change', 'override_added', 'peak_rule_change', 'rollback')),
  changed_by UUID REFERENCES profiles(id),
  change_reason TEXT,
  affected_restaurants_count INT DEFAULT 0,
  estimated_revenue_impact DECIMAL(12,2), -- Positive or negative
  previous_version_id UUID REFERENCES commission_settings_history(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Fee Rules (Advanced fee calculator)
CREATE TABLE IF NOT EXISTS fee_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  rule_type TEXT CHECK (rule_type IN ('minimum_order', 'small_order_surcharge', 'distance_bracket', 'rush_delivery', 'late_night', 'weather')) NOT NULL,
  condition_json JSONB NOT NULL, -- Rule conditions (e.g., {"min_order": 10, "surcharge": 2})
  fee_amount_cents INT NOT NULL,
  applies_to_restaurant_ids UUID[], -- NULL = all restaurants
  is_active BOOLEAN DEFAULT true,
  priority INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Geographic Pricing Zones (Location-based rates)
CREATE TABLE IF NOT EXISTS geographic_pricing_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_name TEXT NOT NULL,
  postal_codes TEXT[], -- Array of zip codes
  city_names TEXT[], -- Array of city names
  state_codes TEXT[], -- Array of state codes
  commission_percent DECIMAL(5,2),
  service_fee_percent DECIMAL(5,2),
  base_delivery_fee_cents INT,
  per_mile_fee_cents INT,
  minimum_order_cents INT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Restaurant Performance Metrics (For tier auto-upgrade)
CREATE TABLE IF NOT EXISTS restaurant_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- Format: "2025-01"
  total_orders INT DEFAULT 0,
  total_revenue_cents BIGINT DEFAULT 0,
  average_order_value_cents INT DEFAULT 0,
  commission_paid_cents BIGINT DEFAULT 0,
  service_fees_paid_cents BIGINT DEFAULT 0,
  current_tier_id UUID REFERENCES commission_tiers(id),
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, month_year)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_commission_overrides_restaurant ON restaurant_commission_overrides(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_commission_overrides_active ON restaurant_commission_overrides(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_peak_hour_rules_active ON peak_hour_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_commission_history_created ON commission_settings_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fee_rules_type ON fee_rules(rule_type, is_active);
CREATE INDEX IF NOT EXISTS idx_geographic_zones_active ON geographic_pricing_zones(is_active);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_restaurant ON restaurant_performance_metrics(restaurant_id, month_year);

-- Enable RLS
ALTER TABLE commission_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_commission_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE peak_hour_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_settings_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE geographic_pricing_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Admins only for most tables)
CREATE POLICY "Admins can manage commission tiers"
  ON commission_tiers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage overrides"
  ON restaurant_commission_overrides FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage peak hour rules"
  ON peak_hour_rules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view history"
  ON commission_settings_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage fee rules"
  ON fee_rules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage geographic zones"
  ON geographic_pricing_zones FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view performance metrics"
  ON restaurant_performance_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Restaurants can view their own performance
CREATE POLICY "Restaurants can view their performance"
  ON restaurant_performance_metrics FOR SELECT
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_users
      WHERE user_id = auth.uid()
    )
  );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_commission_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER commission_tiers_updated_at
  BEFORE UPDATE ON commission_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_commission_updated_at();

CREATE TRIGGER restaurant_overrides_updated_at
  BEFORE UPDATE ON restaurant_commission_overrides
  FOR EACH ROW
  EXECUTE FUNCTION update_commission_updated_at();

CREATE TRIGGER peak_hour_rules_updated_at
  BEFORE UPDATE ON peak_hour_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_commission_updated_at();

CREATE TRIGGER fee_rules_updated_at
  BEFORE UPDATE ON fee_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_commission_updated_at();

CREATE TRIGGER geographic_zones_updated_at
  BEFORE UPDATE ON geographic_pricing_zones
  FOR EACH ROW
  EXECUTE FUNCTION update_commission_updated_at();

-- Function to log commission changes
CREATE OR REPLACE FUNCTION log_commission_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO commission_settings_history (
    settings_snapshot,
    change_type,
    changed_by,
    change_reason
  )
  VALUES (
    row_to_json(NEW),
    TG_ARGV[0],
    auth.uid(),
    'Automated log from ' || TG_TABLE_NAME
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for auto-logging major changes
CREATE TRIGGER log_tier_changes
  AFTER INSERT OR UPDATE ON commission_tiers
  FOR EACH ROW
  EXECUTE FUNCTION log_commission_change('tier_change');

CREATE TRIGGER log_override_changes
  AFTER INSERT OR UPDATE ON restaurant_commission_overrides
  FOR EACH ROW
  EXECUTE FUNCTION log_commission_change('override_added');

-- Insert default tiers
INSERT INTO commission_tiers (tier_name, tier_level, min_monthly_volume, max_monthly_volume, commission_percent, icon, color, benefits)
VALUES
  ('Bronze', 1, 0, 10000, 18.0, '🥉', '#CD7F32', '{"support": "Email support", "analytics": "Basic analytics"}'),
  ('Silver', 2, 10000, 50000, 15.0, '🥈', '#C0C0C0', '{"support": "Priority support", "analytics": "Advanced analytics", "marketing": "Featured placement"}'),
  ('Gold', 3, 50000, 100000, 12.0, '🥇', '#FFD700', '{"support": "24/7 support", "analytics": "Premium analytics", "marketing": "Homepage featured", "promotions": "Free monthly promo"}'),
  ('Platinum', 4, 100000, 250000, 10.0, '💎', '#E5E4E2', '{"support": "Dedicated account manager", "analytics": "Custom reports", "marketing": "Priority placement", "promotions": "2 free monthly promos"}'),
  ('Elite', 5, 250000, NULL, 8.0, '👑', '#6366F1', '{"support": "Executive support team", "analytics": "Real-time dashboard", "marketing": "Exclusive partnerships", "promotions": "Unlimited promos", "custom": "Negotiable terms"}')
ON CONFLICT DO NOTHING;

-- Insert default peak hour rules
INSERT INTO peak_hour_rules (rule_name, day_of_week, start_time, end_time, multiplier, applies_to)
VALUES
  ('Lunch Rush', ARRAY[1,2,3,4,5], '11:00', '13:00', 1.3, 'delivery'),
  ('Dinner Rush', ARRAY[1,2,3,4,5], '17:00', '20:00', 1.5, 'delivery'),
  ('Weekend Peak', ARRAY[0,6], '11:00', '21:00', 1.4, 'delivery'),
  ('Late Night', ARRAY[5,6], '22:00', '02:00', 1.6, 'delivery')
ON CONFLICT DO NOTHING;

