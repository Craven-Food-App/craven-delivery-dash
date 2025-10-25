-- WORKING ENHANCED DRIVER WAITLIST SYSTEM - CLEAN VERSION
-- Drop all existing functions and triggers first to avoid conflicts

-- Drop all existing functions
DROP FUNCTION IF EXISTS calculate_waitlist_position(UUID);
DROP FUNCTION IF EXISTS update_driver_priority_on_task_complete();
DROP FUNCTION IF EXISTS get_driver_queue_position(UUID);
DROP FUNCTION IF EXISTS get_region_capacity_status(INTEGER);
DROP FUNCTION IF EXISTS handle_referral_points();
DROP FUNCTION IF EXISTS set_waitlist_position();
DROP FUNCTION IF EXISTS get_region_capacity_status(integer);

-- Drop all existing triggers
DROP TRIGGER IF EXISTS update_priority_on_task_complete ON public.onboarding_tasks;
DROP TRIGGER IF EXISTS update_priority_on_referral ON public.driver_referrals;
DROP TRIGGER IF EXISTS set_waitlist_position_trigger ON public.craver_applications;

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
    UPDATE public.craver_applications 
    SET 
      points = points + NEW.points_reward,
      priority_score = points + NEW.points_reward
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
  SET 
    points = points + 50,
    priority_score = points + 50
  WHERE id = NEW.referrer_id;
  
  -- Award points to referred driver
  UPDATE public.craver_applications 
  SET 
    points = points + 25,
    priority_score = points + 25
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

-- Step 12: Create trigger to set waitlist position
CREATE OR REPLACE FUNCTION set_waitlist_position()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' AND (OLD.status IS NULL OR OLD.status != 'pending') THEN
    INSERT INTO public.activation_queue (driver_id, region_id, priority_score)
    VALUES (NEW.id, NEW.region_id, NEW.priority_score);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 13: Create triggers
CREATE TRIGGER update_priority_on_task_complete
  AFTER UPDATE ON public.onboarding_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_driver_priority_on_task_complete();

CREATE TRIGGER update_priority_on_referral
  AFTER INSERT ON public.driver_referrals
  FOR EACH ROW
  EXECUTE FUNCTION handle_referral_points();

CREATE TRIGGER set_waitlist_position_trigger
  AFTER INSERT OR UPDATE ON public.craver_applications
  FOR EACH ROW
  EXECUTE FUNCTION set_waitlist_position();

-- Step 14: Insert default regions
INSERT INTO public.regions (name, zip_prefix, status, active_quota) VALUES
('Toledo, OH', '436', 'limited', 50),
('Detroit, MI', '482', 'limited', 75),
('Cleveland, OH', '441', 'limited', 60),
('Columbus, OH', '432', 'limited', 40),
('Cincinnati, OH', '452', 'limited', 35);

-- Step 15: Enable RLS on all tables
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_referrals ENABLE ROW LEVEL SECURITY;

-- Policies for regions
DROP POLICY IF EXISTS "Anyone can view regions" ON public.regions;
CREATE POLICY "Anyone can view regions" ON public.regions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage regions" ON public.regions;
CREATE POLICY "Admins can manage regions" ON public.regions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.craver_applications 
    WHERE user_id = auth.uid() AND status = 'approved'
  )
);

-- Policies for activation_queue
DROP POLICY IF EXISTS "Drivers can view their queue position" ON public.activation_queue;
CREATE POLICY "Drivers can view their queue position" ON public.activation_queue FOR SELECT USING (
  driver_id IN (
    SELECT id FROM public.craver_applications WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can manage activation queue" ON public.activation_queue;
CREATE POLICY "Admins can manage activation queue" ON public.activation_queue FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.craver_applications 
    WHERE user_id = auth.uid() AND status = 'approved'
  )
);

-- Policies for onboarding_tasks
DROP POLICY IF EXISTS "Drivers can view their tasks" ON public.onboarding_tasks;
CREATE POLICY "Drivers can view their tasks" ON public.onboarding_tasks FOR SELECT USING (
  driver_id IN (
    SELECT id FROM public.craver_applications WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Drivers can update their tasks" ON public.onboarding_tasks;
CREATE POLICY "Drivers can update their tasks" ON public.onboarding_tasks FOR UPDATE USING (
  driver_id IN (
    SELECT id FROM public.craver_applications WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can manage all tasks" ON public.onboarding_tasks;
CREATE POLICY "Admins can manage all tasks" ON public.onboarding_tasks FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.craver_applications 
    WHERE user_id = auth.uid() AND status = 'approved'
  )
);

-- Policies for driver_referrals
DROP POLICY IF EXISTS "Drivers can view their referrals" ON public.driver_referrals;
CREATE POLICY "Drivers can view their referrals" ON public.driver_referrals FOR SELECT USING (
  referrer_id IN (
    SELECT id FROM public.craver_applications WHERE user_id = auth.uid()
  ) OR referred_id IN (
    SELECT id FROM public.craver_applications WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can manage referrals" ON public.driver_referrals;
CREATE POLICY "Admins can manage referrals" ON public.driver_referrals FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.craver_applications 
    WHERE user_id = auth.uid() AND status = 'approved'
  )
);

SELECT 'Enhanced Driver Waitlist System created successfully!' as status;
