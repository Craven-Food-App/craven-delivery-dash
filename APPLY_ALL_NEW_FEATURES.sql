-- ============================================
-- CRAVEN DELIVERY - ALL NEW FEATURES
-- Run this entire file in Supabase SQL Editor
-- ============================================

-- This file combines all new migrations:
-- 1. Enhanced Driver Rating System
-- 2. Driver Promotions & Challenges
-- 3. Driver Preferences
-- 4. Driver Support Chat

-- ============================================
-- 1. ENHANCED DRIVER RATING SYSTEM
-- ============================================

-- Driver Rating Breakdown (Category-specific ratings)
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

-- Driver Performance Metrics (Calculated metrics)
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
  rating_trend_7d DECIMAL(3,2) DEFAULT 0.0,
  rating_trend_30d DECIMAL(3,2) DEFAULT 0.0,
  
  -- City ranking
  city TEXT,
  city_percentile INT,
  
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

-- Driver Achievements
CREATE TABLE IF NOT EXISTS driver_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  achievement_code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  tier TEXT CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  requirement_type TEXT,
  requirement_value INT,
  points INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Driver Achievement Unlocks
CREATE TABLE IF NOT EXISTS driver_achievement_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES driver_achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  is_displayed BOOLEAN DEFAULT true,
  UNIQUE(driver_id, achievement_id)
);

-- Driver Rating Tiers
CREATE TABLE IF NOT EXISTS driver_rating_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT NOT NULL UNIQUE,
  min_rating DECIMAL(3,2) NOT NULL,
  min_deliveries INT DEFAULT 0,
  color TEXT NOT NULL,
  icon TEXT,
  benefits JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rating Alerts
CREATE TABLE IF NOT EXISTS driver_rating_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT CHECK (alert_type IN ('low_rating', 'declining_trend', 'low_acceptance', 'customer_complaints')),
  severity TEXT CHECK (severity IN ('info', 'warning', 'critical')),
  message TEXT NOT NULL,
  data JSONB,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default tiers with custom colors
INSERT INTO driver_rating_tiers (tier_name, min_rating, min_deliveries, color, icon, benefits)
VALUES
  ('Elite', 4.8, 100, '#E5E4E2', '💎', '{"priority_orders": true, "higher_base_pay": true, "exclusive_bonuses": true, "vip_support": true}'),
  ('Pro', 4.5, 50, '#D4AF37', '🥇', '{"priority_orders": true, "bonus_eligible": true, "premium_support": true}'),
  ('Rising Star', 4.0, 20, '#C0C0C0', '🥈', '{"standard_orders": true, "growth_program": true}'),
  ('New Driver', 0, 0, '#CD7F32', '🥉', '{"learning_mode": true, "training_access": true, "protected_rating": true}')
ON CONFLICT (tier_name) DO NOTHING;

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

-- ============================================
-- 2. DRIVER PROMOTIONS & CHALLENGES
-- ============================================

-- Driver Promotions
CREATE TABLE IF NOT EXISTS driver_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,
  icon TEXT,
  challenge_type TEXT CHECK (challenge_type IN (
    'delivery_count', 'time_based', 'peak_hours', 'geographic', 'rating_based', 'streak_based', 'referral'
  )) NOT NULL,
  requirement_value INT NOT NULL,
  requirement_details JSONB,
  reward_type TEXT CHECK (reward_type IN (
    'cash_bonus', 'per_delivery_bonus', 'guaranteed_earnings', 'multiplier', 'achievement'
  )) NOT NULL,
  reward_amount_cents INT,
  reward_multiplier DECIMAL(3,2),
  reward_details JSONB,
  target_audience TEXT CHECK (target_audience IN ('all', 'new_drivers', 'elite_only', 'specific_city')) DEFAULT 'all',
  target_cities TEXT[],
  target_tiers TEXT[],
  max_participants INT,
  current_participants INT DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  priority INT DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Driver Promotion Participation
CREATE TABLE IF NOT EXISTS driver_promotion_participation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  promotion_id UUID NOT NULL REFERENCES driver_promotions(id) ON DELETE CASCADE,
  current_progress INT DEFAULT 0,
  requirement_value INT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  reward_claimed BOOLEAN DEFAULT false,
  reward_claimed_at TIMESTAMPTZ,
  reward_amount_cents INT,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(driver_id, promotion_id)
);

-- Driver Surge Zones
CREATE TABLE IF NOT EXISTS driver_surge_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_name TEXT NOT NULL,
  city TEXT NOT NULL,
  center_lat DECIMAL(10,8) NOT NULL,
  center_lng DECIMAL(11,8) NOT NULL,
  radius_miles DECIMAL(5,2) NOT NULL,
  current_multiplier DECIMAL(3,2) DEFAULT 1.0,
  demand_level TEXT CHECK (demand_level IN ('low', 'medium', 'high', 'very_high')) DEFAULT 'medium',
  is_active BOOLEAN DEFAULT true,
  active_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Driver Referrals
CREATE TABLE IF NOT EXISTS driver_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_driver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL UNIQUE,
  status TEXT CHECK (status IN ('pending', 'qualified', 'paid', 'expired')) DEFAULT 'pending',
  required_deliveries INT DEFAULT 20,
  referee_completed_deliveries INT DEFAULT 0,
  referrer_reward_cents INT DEFAULT 50000,
  referee_reward_cents INT DEFAULT 30000,
  referrer_paid BOOLEAN DEFAULT false,
  referee_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  qualified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- Driver Streak Tracking
CREATE TABLE IF NOT EXISTS driver_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_5star_streak INT DEFAULT 0,
  longest_5star_streak INT DEFAULT 0,
  daily_streak INT DEFAULT 0,
  longest_daily_streak INT DEFAULT 0,
  last_active_date DATE,
  weekly_streak INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert sample promotions
INSERT INTO driver_promotions (
  title, description, short_description, icon, challenge_type,
  requirement_value, reward_type, reward_amount_cents,
  starts_at, ends_at, is_featured, priority
) VALUES
  ('Weekend Warrior', 'Complete 20 deliveries this weekend and earn a $50 bonus!', '20 deliveries → $50', '💰',
   'delivery_count', 20, 'cash_bonus', 5000,
   NOW(), NOW() + INTERVAL '30 days', true, 1),
  ('Peak Hour Pro', 'Complete 10 deliveries during lunch or dinner rush hours', '10 peak deliveries → $25', '⚡',
   'peak_hours', 10, 'cash_bonus', 2500,
   NOW(), NOW() + INTERVAL '7 days', true, 2),
  ('Daily Grind', 'Work at least 1 delivery every day for 7 days straight', '7-day streak → $100', '📅',
   'streak_based', 7, 'cash_bonus', 10000,
   NOW(), NOW() + INTERVAL '30 days', false, 3)
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. DRIVER PREFERENCES
-- ============================================

CREATE TABLE IF NOT EXISTS driver_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Delivery Preferences
  preferred_vehicle_type TEXT DEFAULT 'car',
  max_delivery_distance_miles DECIMAL(5,2) DEFAULT 15.0,
  min_order_payout_cents INT DEFAULT 600,
  auto_accept_enabled BOOLEAN DEFAULT false,
  auto_accept_min_payout_cents INT DEFAULT 800,
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
  theme TEXT DEFAULT 'auto',
  text_size TEXT DEFAULT 'medium',
  map_style TEXT DEFAULT 'standard',
  show_earnings_card BOOLEAN DEFAULT true,
  show_rating_card BOOLEAN DEFAULT true,
  show_streak_counter BOOLEAN DEFAULT true,
  compact_mode BOOLEAN DEFAULT false,
  
  -- Privacy & Safety
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  share_location_with TEXT DEFAULT 'nobody',
  auto_911_on_crash BOOLEAN DEFAULT true,
  
  -- Performance Settings
  battery_saver_enabled BOOLEAN DEFAULT true,
  battery_saver_threshold INT DEFAULT 20,
  high_quality_maps BOOLEAN DEFAULT false,
  offline_map_cache_enabled BOOLEAN DEFAULT true,
  auto_update_cache TEXT DEFAULT 'wifi_only',
  location_accuracy TEXT DEFAULT 'high',
  location_update_interval_seconds INT DEFAULT 5,
  background_tracking BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. DRIVER SUPPORT CHAT
-- ============================================

-- Driver Support Chats
CREATE TABLE IF NOT EXISTS driver_support_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category TEXT CHECK (category IN ('order', 'earnings', 'app', 'navigation', 'ratings', 'general')) DEFAULT 'general',
  subject TEXT,
  status TEXT CHECK (status IN ('open', 'in_progress', 'resolved', 'escalated')) DEFAULT 'open',
  priority TEXT CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
  first_response_time_seconds INT,
  resolution_time_seconds INT,
  agent_response_count INT DEFAULT 0,
  driver_response_count INT DEFAULT 0,
  satisfaction_rating INT CHECK (satisfaction_rating BETWEEN 1 AND 5),
  satisfaction_feedback TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Driver Support Messages
CREATE TABLE IF NOT EXISTS driver_support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES driver_support_chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_type TEXT CHECK (sender_type IN ('driver', 'agent', 'system')) NOT NULL,
  message_text TEXT,
  message_type TEXT CHECK (message_type IN ('text', 'image', 'voice', 'location', 'order_card', 'quick_action')) DEFAULT 'text',
  attachment_url TEXT,
  attachment_type TEXT,
  metadata JSONB,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Quick Responses
CREATE TABLE IF NOT EXISTS chat_quick_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  button_icon TEXT,
  button_text TEXT NOT NULL,
  auto_message TEXT NOT NULL,
  follow_up_options JSONB,
  priority INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support Agents
CREATE TABLE IF NOT EXISTS support_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  total_chats_handled INT DEFAULT 0,
  avg_satisfaction_rating DECIMAL(3,2) DEFAULT 5.0,
  avg_response_time_seconds INT DEFAULT 120,
  total_chats_resolved INT DEFAULT 0,
  is_online BOOLEAN DEFAULT false,
  current_active_chats INT DEFAULT 0,
  max_concurrent_chats INT DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert quick response templates
INSERT INTO chat_quick_responses (category, button_icon, button_text, auto_message, follow_up_options, priority)
VALUES
  ('order', '📦', 'Order Issue', 'I need help with an order', 
   '["Current delivery", "Recent order", "Specific order number"]'::jsonb, 1),
  ('earnings', '💰', 'Earnings', 'I have a question about my earnings', 
   '["Missing payment", "Tip amount wrong", "Weekly summary incorrect", "Instant Pay issue"]'::jsonb, 2),
  ('app', '🚗', 'App Issue', 'I''m having an app problem', 
   '["App crashing", "Map not loading", "Can''t go online", "GPS issue", "Notifications not working"]'::jsonb, 3),
  ('navigation', '🗺️', 'Navigation', 'I need navigation help', 
   '["Wrong directions", "Can''t find building", "Address doesn''t exist", "Need gate code", "GPS wrong location"]'::jsonb, 4),
  ('ratings', '⭐', 'Ratings', 'I have a rating question', 
   '["Unfair rating", "Contest review", "Rating dropped", "How to improve"]'::jsonb, 5),
  ('general', '📞', 'Call Support', 'I need to speak with someone', 
   '["Emergency", "Urgent issue", "General support"]'::jsonb, 6)
ON CONFLICT DO NOTHING;

-- ============================================
-- ENABLE RLS ON ALL NEW TABLES
-- ============================================

ALTER TABLE driver_rating_breakdown ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_achievement_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_rating_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_rating_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_promotion_participation ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_surge_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_support_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_quick_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_agents ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - DRIVERS ACCESS THEIR OWN DATA
-- ============================================

-- Drivers view their own data
CREATE POLICY "Drivers view own ratings" ON driver_rating_breakdown FOR SELECT TO authenticated USING (driver_id = auth.uid());
CREATE POLICY "Drivers view own metrics" ON driver_performance_metrics FOR SELECT TO authenticated USING (driver_id = auth.uid());
CREATE POLICY "Drivers view own unlocks" ON driver_achievement_unlocks FOR SELECT TO authenticated USING (driver_id = auth.uid());
CREATE POLICY "Drivers view own participation" ON driver_promotion_participation FOR SELECT TO authenticated USING (driver_id = auth.uid());
CREATE POLICY "Drivers enroll in promos" ON driver_promotion_participation FOR INSERT TO authenticated WITH CHECK (driver_id = auth.uid());
CREATE POLICY "Drivers view own preferences" ON driver_preferences FOR SELECT TO authenticated USING (driver_id = auth.uid());
CREATE POLICY "Drivers update own preferences" ON driver_preferences FOR UPDATE TO authenticated USING (driver_id = auth.uid());
CREATE POLICY "Drivers insert own preferences" ON driver_preferences FOR INSERT TO authenticated WITH CHECK (driver_id = auth.uid());
CREATE POLICY "Drivers view own chats" ON driver_support_chats FOR SELECT TO authenticated USING (driver_id = auth.uid());
CREATE POLICY "Drivers create chats" ON driver_support_chats FOR INSERT TO authenticated WITH CHECK (driver_id = auth.uid());
CREATE POLICY "Drivers view own chat messages" ON driver_support_messages FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM driver_support_chats WHERE driver_support_chats.id = chat_id AND driver_support_chats.driver_id = auth.uid()));
CREATE POLICY "Drivers send messages" ON driver_support_messages FOR INSERT TO authenticated 
  WITH CHECK (sender_id = auth.uid() AND EXISTS (SELECT 1 FROM driver_support_chats WHERE driver_support_chats.id = chat_id AND driver_support_chats.driver_id = auth.uid()));

-- Public access to read-only tables
CREATE POLICY "Everyone view achievements" ON driver_achievements FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Everyone view tiers" ON driver_rating_tiers FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Drivers view active promos" ON driver_promotions FOR SELECT TO authenticated 
  USING (is_active = true AND starts_at <= NOW() AND ends_at >= NOW());
CREATE POLICY "Drivers view surge zones" ON driver_surge_zones FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Everyone view quick responses" ON chat_quick_responses FOR SELECT TO authenticated USING (is_active = true);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ ALL NEW FEATURES INSTALLED SUCCESSFULLY!';
  RAISE NOTICE '📊 Tables created: 16';
  RAISE NOTICE '🔒 RLS policies enabled';
  RAISE NOTICE '🎯 Sample data inserted';
  RAISE NOTICE '🚀 Your app is ready to use!';
END $$;

