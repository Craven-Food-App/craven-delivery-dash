-- Create referral program tables

-- Referral codes table
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  user_type TEXT CHECK (user_type IN ('customer', 'driver', 'restaurant')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES auth.users(id) NOT NULL,
  referred_id UUID REFERENCES auth.users(id) NOT NULL,
  referral_code TEXT NOT NULL,
  referral_type TEXT CHECK (referral_type IN ('customer', 'driver', 'restaurant')) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'completed', 'paid')) DEFAULT 'pending',
  referrer_bonus_amount INTEGER, -- in cents
  referred_bonus_amount INTEGER, -- in cents
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  requirements_met BOOLEAN DEFAULT false,
  UNIQUE(referrer_id, referred_id)
);

-- Referral bonuses table
CREATE TABLE IF NOT EXISTS referral_bonuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_id UUID REFERENCES referrals(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  amount INTEGER NOT NULL, -- in cents
  bonus_type TEXT CHECK (bonus_type IN ('referrer', 'referred')) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'paid')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Referral settings table (for admins to configure)
CREATE TABLE IF NOT EXISTS referral_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_type TEXT UNIQUE NOT NULL,
  referrer_bonus_amount INTEGER NOT NULL, -- in cents
  referred_bonus_amount INTEGER NOT NULL, -- in cents
  requirements JSONB, -- e.g., {"min_orders": 3, "min_amount": 5000}
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default referral settings
INSERT INTO referral_settings (referral_type, referrer_bonus_amount, referred_bonus_amount, requirements, is_active)
VALUES 
  ('customer', 1000, 1000, '{"min_orders": 1, "min_amount": 1500}'::jsonb, true),
  ('driver', 5000, 5000, '{"min_deliveries": 5}'::jsonb, true),
  ('restaurant', 10000, 5000, '{"min_orders": 10, "min_revenue": 50000}'::jsonb, true)
ON CONFLICT (referral_type) DO NOTHING;

-- Enable RLS
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referral_codes
CREATE POLICY "Users can view their own referral codes"
  ON referral_codes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own referral codes"
  ON referral_codes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for referrals
CREATE POLICY "Users can view their own referrals"
  ON referrals FOR SELECT
  TO authenticated
  USING (referrer_id = auth.uid() OR referred_id = auth.uid());

CREATE POLICY "System can create referrals"
  ON referrals FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all referrals"
  ON referrals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- RLS Policies for referral_bonuses
CREATE POLICY "Users can view their own bonuses"
  ON referral_bonuses FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage bonuses"
  ON referral_bonuses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- RLS Policies for referral_settings
CREATE POLICY "Anyone can view referral settings"
  ON referral_settings FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage referral settings"
  ON referral_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referral_bonuses_user_id ON referral_bonuses(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_bonuses_status ON referral_bonuses(status);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(p_user_id UUID, p_user_type TEXT)
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
  v_attempts INTEGER := 0;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    v_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = v_code) INTO v_exists;
    
    IF NOT v_exists THEN
      -- Insert new referral code
      INSERT INTO referral_codes (user_id, code, user_type)
      VALUES (p_user_id, v_code, p_user_type);
      
      RETURN v_code;
    END IF;
    
    v_attempts := v_attempts + 1;
    IF v_attempts > 10 THEN
      RAISE EXCEPTION 'Failed to generate unique referral code after 10 attempts';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and complete referral requirements
CREATE OR REPLACE FUNCTION check_referral_requirements(p_referred_id UUID, p_referral_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_referral_id UUID;
  v_requirements JSONB;
  v_requirements_met BOOLEAN := false;
BEGIN
  -- Get the referral and settings
  SELECT r.id, rs.requirements INTO v_referral_id, v_requirements
  FROM referrals r
  JOIN referral_settings rs ON rs.referral_type = r.referral_type
  WHERE r.referred_id = p_referred_id 
    AND r.referral_type = p_referral_type
    AND r.status = 'pending';
  
  IF v_referral_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check requirements based on type
  IF p_referral_type = 'customer' THEN
    -- Check customer requirements (min orders and amount)
    SELECT COUNT(*) >= COALESCE((v_requirements->>'min_orders')::int, 1)
      AND COALESCE(SUM(total_amount), 0) >= COALESCE((v_requirements->>'min_amount')::int, 0)
    INTO v_requirements_met
    FROM orders
    WHERE customer_id = p_referred_id AND order_status = 'delivered';
    
  ELSIF p_referral_type = 'driver' THEN
    -- Check driver requirements (min deliveries)
    SELECT COUNT(*) >= COALESCE((v_requirements->>'min_deliveries')::int, 1)
    INTO v_requirements_met
    FROM orders
    WHERE driver_id = p_referred_id AND order_status = 'delivered';
    
  ELSIF p_referral_type = 'restaurant' THEN
    -- Check restaurant requirements (min orders and revenue)
    SELECT COUNT(*) >= COALESCE((v_requirements->>'min_orders')::int, 1)
      AND COALESCE(SUM(total_amount), 0) >= COALESCE((v_requirements->>'min_revenue')::int, 0)
    INTO v_requirements_met
    FROM orders o
    JOIN restaurants r ON r.id = o.restaurant_id
    WHERE r.owner_id = p_referred_id AND o.order_status = 'delivered';
  END IF;
  
  -- Update referral status if requirements met
  IF v_requirements_met THEN
    UPDATE referrals 
    SET status = 'completed', 
        requirements_met = true, 
        completed_at = NOW()
    WHERE id = v_referral_id;
    
    -- Create bonus records
    INSERT INTO referral_bonuses (referral_id, user_id, amount, bonus_type)
    SELECT v_referral_id, referrer_id, referrer_bonus_amount, 'referrer'
    FROM referrals r
    JOIN referral_settings rs ON rs.referral_type = r.referral_type
    WHERE r.id = v_referral_id;
    
    INSERT INTO referral_bonuses (referral_id, user_id, amount, bonus_type)
    SELECT v_referral_id, referred_id, referred_bonus_amount, 'referred'
    FROM referrals r
    JOIN referral_settings rs ON rs.referral_type = r.referral_type
    WHERE r.id = v_referral_id;
  END IF;
  
  RETURN v_requirements_met;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION generate_referral_code TO authenticated;
GRANT EXECUTE ON FUNCTION check_referral_requirements TO authenticated;

COMMENT ON TABLE referral_codes IS 'User referral codes for sharing';
COMMENT ON TABLE referrals IS 'Tracks referral relationships and bonuses';
COMMENT ON TABLE referral_bonuses IS 'Individual bonus payments from referrals';
COMMENT ON TABLE referral_settings IS 'Admin-configurable referral program settings';

