-- FINAL ENHANCED DRIVER WAITLIST SYSTEM - NO CONFLICT CLAUSES
-- This migration creates the complete enhanced driver waitlist system

-- Step 1: Create regions table
CREATE TABLE IF NOT EXISTS public.regions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  zip_prefix TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'limited', 'closed')),
  active_quota INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Add new columns to craver_applications
ALTER TABLE public.craver_applications 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS region_id INTEGER REFERENCES public.regions(id),
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id);

-- Step 3: Create activation queue table
CREATE TABLE IF NOT EXISTS public.activation_queue (
  id SERIAL PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES public.craver_applications(id) ON DELETE CASCADE,
  region_id INTEGER NOT NULL REFERENCES public.regions(id),
  priority_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Create onboarding tasks table
CREATE TABLE IF NOT EXISTS public.onboarding_tasks (
  id SERIAL PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES public.craver_applications(id) ON DELETE CASCADE,
  task_key TEXT NOT NULL,
  task_name TEXT NOT NULL,
  description TEXT,
  points_reward INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 5: Create driver referrals table
CREATE TABLE IF NOT EXISTS public.driver_referrals (
  id SERIAL PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES public.craver_applications(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.craver_applications(id) ON DELETE CASCADE,
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 6: Create indexes
CREATE INDEX IF NOT EXISTS idx_activation_queue_priority ON public.activation_queue(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_activation_queue_region ON public.activation_queue(region_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_driver ON public.onboarding_tasks(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_referrals_referrer ON public.driver_referrals(referrer_id);

-- Step 7: Create function to calculate waitlist position
CREATE OR REPLACE FUNCTION calculate_waitlist_position(driver_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  position INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO position
  FROM public.activation_queue aq
  JOIN public.craver_applications ca ON aq.driver_id = ca.id
  WHERE aq.region_id = (
    SELECT region_id FROM public.craver_applications WHERE id = driver_uuid
  )
  AND aq.priority_score > (
    SELECT priority_score FROM public.craver_applications WHERE id = driver_uuid
  );
  
  RETURN COALESCE(position, 1);
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create function to update driver priority on task completion
CREATE OR REPLACE FUNCTION update_driver_priority_on_task_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed = TRUE AND OLD.completed = FALSE THEN
    -- First update points
    UPDATE public.craver_applications 
    SET points = points + NEW.points_reward
    WHERE id = NEW.driver_id;
    
    -- Then set priority_score to the new points value
    UPDATE public.craver_applications 
    SET priority_score = points
    WHERE id = NEW.driver_id;
    
    UPDATE public.activation_queue 
    SET priority_score = (
      SELECT priority_score FROM public.craver_applications WHERE id = NEW.driver_id
    )
    WHERE driver_id = NEW.driver_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create function to get driver queue position
DROP FUNCTION IF EXISTS get_driver_queue_position(UUID);
CREATE OR REPLACE FUNCTION get_driver_queue_position(driver_uuid UUID)
RETURNS TABLE (
  queue_position BIGINT,
  total_in_region BIGINT,
  region_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    calculate_waitlist_position(driver_uuid)::BIGINT as queue_position,
    COUNT(*)::BIGINT as total_in_region,
    r.name as region_name
  FROM public.activation_queue aq
  JOIN public.regions r ON aq.region_id = r.id
  WHERE aq.region_id = (
    SELECT region_id FROM public.craver_applications WHERE id = driver_uuid
  );
END;
$$ LANGUAGE plpgsql;

-- Step 10: Create function to get region capacity status
CREATE OR REPLACE FUNCTION get_region_capacity_status(region_id_param INTEGER)
RETURNS TABLE (
  region_name TEXT,
  current_drivers BIGINT,
  capacity INTEGER,
  status TEXT,
  waitlist_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.name,
    COUNT(aq.driver_id)::BIGINT,
    r.active_quota,
    r.status,
    (SELECT COUNT(*) FROM public.activation_queue WHERE region_id = region_id_param)::BIGINT
  FROM public.regions r
  LEFT JOIN public.activation_queue aq ON r.id = aq.region_id
  WHERE r.id = region_id_param
  GROUP BY r.id, r.name, r.active_quota, r.status;
END;
$$ LANGUAGE plpgsql;

-- Step 11: Create function to handle referral points
CREATE OR REPLACE FUNCTION handle_referral_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Award points to referrer
  UPDATE public.craver_applications 
  SET points = points + 50
  WHERE id = NEW.referrer_id;
  
  UPDATE public.craver_applications 
  SET priority_score = points
  WHERE id = NEW.referrer_id;
  
  -- Award points to referred driver
  UPDATE public.craver_applications 
  SET points = points + 25
  WHERE id = NEW.referred_id;
  
  UPDATE public.craver_applications 
  SET priority_score = points
  WHERE id = NEW.referred_id;
  
  -- Update activation queue for both
  UPDATE public.activation_queue 
  SET priority_score = (
    SELECT priority_score FROM public.craver_applications WHERE id = NEW.referrer_id
  )
  WHERE driver_id = NEW.referrer_id;
  
  UPDATE public.activation_queue 
  SET priority_score = (
    SELECT priority_score FROM public.craver_applications WHERE id = NEW.referred_id
  )
  WHERE driver_id = NEW.referred_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 12: Create function to generate default onboarding tasks
CREATE OR REPLACE FUNCTION create_default_onboarding_tasks(driver_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- High-Value Tasks (25-50 points)
  INSERT INTO public.onboarding_tasks (driver_id, task_key, task_name, description, points_reward) VALUES
  (driver_uuid, 'complete_profile', 'Complete Profile Setup', 'Fill out all required profile information and verify your details', 25),
  (driver_uuid, 'upload_vehicle_photos', 'Upload Vehicle Photos', 'Take and upload clear photos of your vehicle from multiple angles', 30),
  (driver_uuid, 'pass_safety_quiz', 'Pass Safety Quiz', 'Complete the driver safety quiz with a passing score of 80% or higher', 50),
  (driver_uuid, 'setup_cashapp_payouts', 'Setup CashApp Payouts', 'Connect your CashApp account for instant payout processing', 35),
  
  -- Engagement Tasks (15-25 points)
  (driver_uuid, 'download_mobile_app', 'Download Mobile App', 'Download and log in to the Craven delivery mobile app', 20),
  (driver_uuid, 'complete_practice_route', 'Complete First Practice Route', 'Complete a practice delivery route to familiarize yourself with the app', 25),
  (driver_uuid, 'join_facebook_group', 'Join Driver Facebook Group', 'Join our exclusive driver community on Facebook for tips and support', 15),
  (driver_uuid, 'complete_service_training', 'Complete Customer Service Training', 'Watch customer service training videos and pass the assessment', 30),
  
  -- Referral Bonus (50+ points)
  (driver_uuid, 'social_media_share', 'Social Media Share', 'Share about joining Craven on your social media accounts', 10);
  
  -- Note: "Refer Another Driver (50 pts each)" is handled separately by the referral system
END;
$$ LANGUAGE plpgsql;

-- Step 13: Create trigger to set waitlist position and create tasks
CREATE OR REPLACE FUNCTION set_waitlist_position()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' AND (OLD.status IS NULL OR OLD.status != 'pending') THEN
    INSERT INTO public.activation_queue (driver_id, region_id, priority_score)
    VALUES (NEW.id, NEW.region_id, NEW.priority_score);
    
    -- Create default onboarding tasks for new pending applications
    PERFORM create_default_onboarding_tasks(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 14: Create trigger for task completion
CREATE OR REPLACE TRIGGER update_priority_on_task_complete
  AFTER UPDATE ON public.onboarding_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_driver_priority_on_task_complete();

-- Step 15: Create trigger for referral points
CREATE OR REPLACE TRIGGER update_priority_on_referral
  AFTER INSERT ON public.driver_referrals
  FOR EACH ROW
  EXECUTE FUNCTION handle_referral_points();

-- Step 16: Create trigger for waitlist position
CREATE OR REPLACE TRIGGER set_waitlist_position_trigger
  AFTER INSERT OR UPDATE ON public.craver_applications
  FOR EACH ROW
  EXECUTE FUNCTION set_waitlist_position();

-- Step 17: Insert default regions
INSERT INTO public.regions (name, zip_prefix, status, active_quota) VALUES
('Toledo, OH', '436', 'limited', 50),
('Detroit, MI', '482', 'limited', 75),
('Cleveland, OH', '441', 'limited', 60),
('Columbus, OH', '432', 'limited', 40),
('Cincinnati, OH', '452', 'limited', 35);

-- Step 18: Create RLS policies
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_referrals ENABLE ROW LEVEL SECURITY;

-- Policies for regions
CREATE POLICY "Anyone can view regions" ON public.regions FOR SELECT USING (true);
CREATE POLICY "Admins can manage regions" ON public.regions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.craver_applications 
    WHERE user_id = auth.uid() AND status = 'approved'
  )
);

-- Policies for activation_queue
CREATE POLICY "Drivers can view their queue position" ON public.activation_queue FOR SELECT USING (
  driver_id IN (
    SELECT id FROM public.craver_applications WHERE user_id = auth.uid()
  )
);
CREATE POLICY "Admins can manage activation queue" ON public.activation_queue FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.craver_applications 
    WHERE user_id = auth.uid() AND status = 'approved'
  )
);

-- Policies for onboarding_tasks
CREATE POLICY "Drivers can view their tasks" ON public.onboarding_tasks FOR SELECT USING (
  driver_id IN (
    SELECT id FROM public.craver_applications WHERE user_id = auth.uid()
  )
);
CREATE POLICY "Drivers can update their tasks" ON public.onboarding_tasks FOR UPDATE USING (
  driver_id IN (
    SELECT id FROM public.craver_applications WHERE user_id = auth.uid()
  )
);
CREATE POLICY "Admins can manage all tasks" ON public.onboarding_tasks FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.craver_applications 
    WHERE user_id = auth.uid() AND status = 'approved'
  )
);

-- Policies for driver_referrals
CREATE POLICY "Drivers can view their referrals" ON public.driver_referrals FOR SELECT USING (
  referrer_id IN (
    SELECT id FROM public.craver_applications WHERE user_id = auth.uid()
  ) OR referred_id IN (
    SELECT id FROM public.craver_applications WHERE user_id = auth.uid()
  )
);
CREATE POLICY "Admins can manage referrals" ON public.driver_referrals FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.craver_applications 
    WHERE user_id = auth.uid() AND status = 'approved'
  )
);

-- Create tasks for existing drivers who don't have any tasks yet
INSERT INTO public.onboarding_tasks (driver_id, task_key, task_name, description, points_reward)
SELECT 
  ca.id,
  t.task_key,
  t.task_name,
  t.description,
  t.points_reward
FROM public.craver_applications ca
CROSS JOIN (VALUES
  -- High-Value Tasks (25-50 points)
  ('complete_profile', 'Complete Profile Setup', 'Fill out all required profile information and verify your details', 25),
  ('upload_vehicle_photos', 'Upload Vehicle Photos', 'Take and upload clear photos of your vehicle from multiple angles', 30),
  ('pass_safety_quiz', 'Pass Safety Quiz', 'Complete the driver safety quiz with a passing score of 80% or higher', 50),
  ('setup_cashapp_payouts', 'Setup CashApp Payouts', 'Connect your CashApp account for instant payout processing', 35),
  
  -- Engagement Tasks (15-25 points)
  ('download_mobile_app', 'Download Mobile App', 'Download and log in to the Craven delivery mobile app', 20),
  ('complete_practice_route', 'Complete First Practice Route', 'Complete a practice delivery route to familiarize yourself with the app', 25),
  ('join_facebook_group', 'Join Driver Facebook Group', 'Join our exclusive driver community on Facebook for tips and support', 15),
  ('complete_service_training', 'Complete Customer Service Training', 'Watch customer service training videos and pass the assessment', 30),
  
  -- Referral Bonus (50+ points)
  ('social_media_share', 'Social Media Share', 'Share about joining Craven on your social media accounts', 10)
) AS t(task_key, task_name, description, points_reward)
WHERE ca.status IN ('pending', 'approved', 'waitlist')
AND NOT EXISTS (
  SELECT 1 FROM public.onboarding_tasks ot 
  WHERE ot.driver_id = ca.id AND ot.task_key = t.task_key
);

SELECT 'Enhanced Driver Waitlist System with Onboarding Tasks created successfully!' as status;
