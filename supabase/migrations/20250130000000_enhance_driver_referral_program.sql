-- Enhance Driver Referral Program
-- Adds milestone tracking, video content, and automatic milestone processing

-- 1. Enhance referral_settings table for driver-specific settings
ALTER TABLE referral_settings 
ADD COLUMN IF NOT EXISTS milestone_1_amount_cents INT DEFAULT 10000, -- $100
ADD COLUMN IF NOT EXISTS milestone_2_amount_cents INT DEFAULT 30000, -- $300
ADD COLUMN IF NOT EXISTS milestone_1_delivery_count INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS milestone_2_delivery_count INT DEFAULT 20,
ADD COLUMN IF NOT EXISTS require_background_check BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS require_documents BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS required_min_rating DECIMAL(3,2) DEFAULT 4.5,
ADD COLUMN IF NOT EXISTS required_days_active INT DEFAULT 7;

-- 2. Enhance referrals table for milestone tracking
ALTER TABLE referrals
ADD COLUMN IF NOT EXISTS milestone_1_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS milestone_1_paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS milestone_2_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS milestone_2_paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS referee_completed_deliveries INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS background_check_passed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS documents_uploaded BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS current_rating DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS days_active INT DEFAULT 0;

-- 3. Create referral video content table
CREATE TABLE IF NOT EXISTS referral_video_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_type TEXT CHECK (referral_type IN ('customer', 'driver', 'restaurant')) NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  title TEXT DEFAULT 'Refer & Earn',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Update driver referral settings defaults
UPDATE referral_settings 
SET 
  milestone_1_amount_cents = 10000,
  milestone_2_amount_cents = 30000,
  milestone_1_delivery_count = 1,
  milestone_2_delivery_count = 20,
  require_background_check = true,
  require_documents = true,
  required_min_rating = 4.5,
  required_days_active = 7
WHERE referral_type = 'driver';

-- 5. Create function to process driver referral milestones
CREATE OR REPLACE FUNCTION process_driver_referral_milestone(
  p_referral_id UUID,
  p_milestone_number INT
) RETURNS BOOLEAN AS $$
DECLARE
  referral_record RECORD;
  settings_record RECORD;
  payment_amount INT;
BEGIN
  SELECT * INTO referral_record FROM referrals WHERE id = p_referral_id AND referral_type = 'driver';
  IF NOT FOUND THEN RETURN false; END IF;
  
  SELECT * INTO settings_record FROM referral_settings WHERE referral_type = 'driver' AND is_active = true LIMIT 1;
  IF NOT FOUND THEN RETURN false; END IF;
  
  IF p_milestone_number = 1 THEN
    IF referral_record.milestone_1_paid THEN RETURN false; END IF;
    IF referral_record.referee_completed_deliveries < settings_record.milestone_1_delivery_count THEN RETURN false; END IF;
    
    payment_amount := settings_record.milestone_1_amount_cents;
    
    UPDATE referrals
    SET milestone_1_paid = true, milestone_1_paid_at = NOW()
    WHERE id = p_referral_id;
    
  ELSIF p_milestone_number = 2 THEN
    IF referral_record.milestone_2_paid THEN RETURN false; END IF;
    IF referral_record.referee_completed_deliveries < settings_record.milestone_2_delivery_count THEN RETURN false; END IF;
    IF settings_record.require_background_check AND NOT referral_record.background_check_passed THEN RETURN false; END IF;
    IF settings_record.require_documents AND NOT referral_record.documents_uploaded THEN RETURN false; END IF;
    IF referral_record.current_rating IS NOT NULL AND referral_record.current_rating < settings_record.required_min_rating THEN RETURN false; END IF;
    IF referral_record.days_active < settings_record.required_days_active THEN RETURN false; END IF;
    
    payment_amount := settings_record.milestone_2_amount_cents;
    
    UPDATE referrals
    SET milestone_2_paid = true, milestone_2_paid_at = NOW(), status = 'paid', paid_at = NOW()
    WHERE id = p_referral_id;
  END IF;
  
  -- Create bonus record
  INSERT INTO referral_bonuses (referral_id, user_id, amount, bonus_type, status)
  VALUES (p_referral_id, referral_record.referrer_id, payment_amount, 'referrer', 'pending')
  ON CONFLICT DO NOTHING;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Create trigger to update referral progress on delivery completion
CREATE OR REPLACE FUNCTION update_driver_referral_on_delivery()
RETURNS TRIGGER AS $$
DECLARE
  driver_referral RECORD;
  delivery_count INT;
  settings_record RECORD;
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    SELECT * INTO driver_referral 
    FROM referrals 
    WHERE referred_id = NEW.assigned_craver_id 
      AND referral_type = 'driver'
      AND status IN ('pending', 'completed')
    LIMIT 1;
    
    IF driver_referral IS NOT NULL THEN
      SELECT COUNT(*) INTO delivery_count
      FROM orders
      WHERE assigned_craver_id = NEW.assigned_craver_id AND status = 'delivered';
      
      UPDATE referrals
      SET referee_completed_deliveries = delivery_count
      WHERE id = driver_referral.id;
      
      -- Get settings
      SELECT * INTO settings_record FROM referral_settings WHERE referral_type = 'driver' AND is_active = true LIMIT 1;
      
      IF settings_record IS NOT NULL THEN
        -- Check milestone 1
        IF delivery_count >= settings_record.milestone_1_delivery_count 
           AND NOT driver_referral.milestone_1_paid THEN
          PERFORM process_driver_referral_milestone(driver_referral.id, 1);
        END IF;
        
        -- Check milestone 2
        IF delivery_count >= settings_record.milestone_2_delivery_count 
           AND NOT driver_referral.milestone_2_paid THEN
          PERFORM process_driver_referral_milestone(driver_referral.id, 2);
        END IF;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_driver_referral_on_delivery ON orders;
CREATE TRIGGER trigger_update_driver_referral_on_delivery
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_driver_referral_on_delivery();

-- 7. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_referrals_driver_type ON referrals(referral_type, referred_id, status);
CREATE INDEX IF NOT EXISTS idx_referral_video_content_type ON referral_video_content(referral_type, is_active);

-- 8. RLS Policies for video content
ALTER TABLE referral_video_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active referral videos"
  ON referral_video_content FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage referral videos"
  ON referral_video_content FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

