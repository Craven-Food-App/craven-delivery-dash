-- Driver Preferences System
-- Professional settings management for driver app

CREATE TABLE IF NOT EXISTS driver_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Delivery Preferences
  preferred_vehicle_type TEXT DEFAULT 'car',
  max_delivery_distance_miles DECIMAL(5,2) DEFAULT 15.0,
  min_order_payout_cents INT DEFAULT 600, -- $6.00
  auto_accept_enabled BOOLEAN DEFAULT false,
  auto_accept_min_payout_cents INT DEFAULT 800, -- $8.00
  accept_stacked_orders BOOLEAN DEFAULT true,
  max_stacked_orders INT DEFAULT 2,
  
  -- Notification Settings
  push_notifications_enabled BOOLEAN DEFAULT true,
  notification_new_orders BOOLEAN DEFAULT true,
  notification_high_value BOOLEAN DEFAULT true,
  notification_surge_alerts BOOLEAN DEFAULT true,
  notification_rating_updates BOOLEAN DEFAULT true,
  notification_promo_alerts BOOLEAN DEFAULT true,
  notification_payment_received BOOLEAN DEFAULT true,
  
  sound_enabled BOOLEAN DEFAULT true,
  sound_order_alert TEXT DEFAULT 'chime',
  sound_high_value_alert TEXT DEFAULT 'fanfare',
  vibration_enabled BOOLEAN DEFAULT true,
  do_not_disturb BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  
  -- Navigation Settings
  preferred_nav_app TEXT DEFAULT 'google_maps',
  avoid_highways BOOLEAN DEFAULT false,
  avoid_tolls BOOLEAN DEFAULT true,
  prefer_bike_lanes BOOLEAN DEFAULT false,
  smart_routing_enabled BOOLEAN DEFAULT true,
  
  -- Display Settings
  theme TEXT DEFAULT 'auto', -- 'auto', 'light', 'dark'
  text_size TEXT DEFAULT 'medium', -- 'small', 'medium', 'large'
  map_style TEXT DEFAULT 'standard', -- 'standard', 'satellite', 'dark'
  show_earnings_card BOOLEAN DEFAULT true,
  show_rating_card BOOLEAN DEFAULT true,
  show_streak_counter BOOLEAN DEFAULT true,
  compact_mode BOOLEAN DEFAULT false,
  
  -- Privacy & Safety
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  share_location_with TEXT DEFAULT 'nobody', -- 'nobody', 'family', 'emergency_contact'
  auto_911_on_crash BOOLEAN DEFAULT true,
  
  -- Performance Settings
  battery_saver_enabled BOOLEAN DEFAULT true,
  battery_saver_threshold INT DEFAULT 20, -- Percent
  high_quality_maps BOOLEAN DEFAULT false,
  offline_map_cache_enabled BOOLEAN DEFAULT true,
  auto_update_cache TEXT DEFAULT 'wifi_only', -- 'always', 'wifi_only', 'never'
  location_accuracy TEXT DEFAULT 'high', -- 'high', 'medium', 'low'
  location_update_interval_seconds INT DEFAULT 5,
  background_tracking BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE driver_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Drivers can view their own preferences"
  ON driver_preferences FOR SELECT
  TO authenticated
  USING (driver_id = auth.uid());

CREATE POLICY "Drivers can update their own preferences"
  ON driver_preferences FOR UPDATE
  TO authenticated
  USING (driver_id = auth.uid());

CREATE POLICY "Drivers can insert their own preferences"
  ON driver_preferences FOR INSERT
  TO authenticated
  WITH CHECK (driver_id = auth.uid());

CREATE POLICY "Admins can view all preferences"
  ON driver_preferences FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Index
CREATE INDEX IF NOT EXISTS idx_driver_preferences_driver ON driver_preferences(driver_id);

-- Trigger for updated_at
CREATE TRIGGER driver_preferences_updated_at
  BEFORE UPDATE ON driver_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_commission_updated_at();

-- Function to create default preferences for new drivers
CREATE OR REPLACE FUNCTION create_default_driver_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO driver_preferences (driver_id)
  VALUES (NEW.user_id)
  ON CONFLICT (driver_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create preferences
CREATE TRIGGER create_preferences_on_driver_profile
  AFTER INSERT ON driver_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_driver_preferences();

