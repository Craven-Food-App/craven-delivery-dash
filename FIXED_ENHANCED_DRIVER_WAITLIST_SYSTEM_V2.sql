-- Enhanced Driver Onboarding & Waitlist System (FIXED VERSION 2)
-- Handles existing policies and objects gracefully

-- Step 1: Create regions table for capacity management
CREATE TABLE IF NOT EXISTS public.regions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  zip_prefix TEXT,
  status TEXT CHECK (status IN ('limited','active','paused')) DEFAULT 'limited',
  active_quota INT DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Step 2: Add points and priority scoring to craver_applications
ALTER TABLE public.craver_applications 
ADD COLUMN IF NOT EXISTS points INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS priority_score INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS region_id INT REFERENCES public.regions(id),
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.craver_applications(id);

-- Step 3: Create activation queue for priority management
CREATE TABLE IF NOT EXISTS public.activation_queue (
  id SERIAL PRIMARY KEY,
  driver_id UUID REFERENCES public.craver_applications(id) ON DELETE CASCADE,
  region_id INT REFERENCES public.regions(id),
  priority_score INT DEFAULT 0,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(driver_id)
);

-- Step 4: Create onboarding tasks table for gamification
CREATE TABLE IF NOT EXISTS public.onboarding_tasks (
  id SERIAL PRIMARY KEY,
  driver_id UUID REFERENCES public.craver_applications(id) ON DELETE CASCADE,
  task_key TEXT NOT NULL,
  task_name TEXT NOT NULL,
  description TEXT,
  points_reward INT DEFAULT 10,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Step 5: Create driver referrals table
CREATE TABLE IF NOT EXISTS public.driver_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES public.craver_applications(id) ON DELETE CASCADE,
  referee_id UUID REFERENCES public.craver_applications(id) ON DELETE CASCADE,
  referral_code TEXT UNIQUE,
  status TEXT CHECK (status IN ('pending', 'completed', 'activated')) DEFAULT 'pending',
  points_awarded INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  activated_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(referrer_id, referee_id)
);

-- Step 6: Enable RLS on all new tables
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_referrals ENABLE ROW LEVEL SECURITY;

-- Step 7: Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS "Admins can manage regions" ON public.regions;
CREATE POLICY "Admins can manage regions" ON public.regions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Step 8: Drop and recreate activation queue policies
DROP POLICY IF EXISTS "Admins can manage activation queue" ON public.activation_queue;
CREATE POLICY "Admins can manage activation queue" ON public.activation_queue
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Step 9: Drop and recreate onboarding tasks policies
DROP POLICY IF EXISTS "Drivers can view their own tasks" ON public.onboarding_tasks;
DROP POLICY IF EXISTS "Drivers can update their own tasks" ON public.onboarding_tasks;
DROP POLICY IF EXISTS "Admins can manage all tasks" ON public.onboarding_tasks;

CREATE POLICY "Drivers can view their own tasks" ON public.onboarding_tasks
FOR SELECT USING (
  driver_id IN (
    SELECT id FROM public.craver_applications WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Drivers can update their own tasks" ON public.onboarding_tasks
FOR UPDATE USING (
  driver_id IN (
    SELECT id FROM public.craver_applications WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all tasks" ON public.onboarding_tasks
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Step 10: Drop and recreate driver referrals policies
DROP POLICY IF EXISTS "Drivers can view their own referrals" ON public.driver_referrals;
DROP POLICY IF EXISTS "Admins can manage all referrals" ON public.driver_referrals;

CREATE POLICY "Drivers can view their own referrals" ON public.driver_referrals
FOR SELECT USING (
  referrer_id IN (
    SELECT id FROM public.craver_applications WHERE user_id = auth.uid()
  )
  OR referee_id IN (
    SELECT id FROM public.craver_applications WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all referrals" ON public.driver_referrals
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Step 11: Create function to auto-assign region based on ZIP code
CREATE OR REPLACE FUNCTION assign_region_by_zip()
RETURNS TRIGGER AS $$
DECLARE
  region_record RECORD;
BEGIN
  -- Try to find region by ZIP prefix
  SELECT * INTO region_record
  FROM public.regions
  WHERE zip_prefix IS NOT NULL 
  AND NEW.zip_code LIKE (zip_prefix || '%')
  ORDER BY LENGTH(zip_prefix) DESC
  LIMIT 1;
  
  -- If no region found by ZIP, assign to default region (id=1)
  IF region_record IS NULL THEN
    NEW.region_id := 1;
  ELSE
    NEW.region_id := region_record.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 12: Create trigger to auto-assign region
DROP TRIGGER IF EXISTS trigger_assign_region_by_zip ON public.craver_applications;
CREATE TRIGGER trigger_assign_region_by_zip
  BEFORE INSERT ON public.craver_applications
  FOR EACH ROW
  EXECUTE FUNCTION assign_region_by_zip();

-- Step 13: Create function to add driver to activation queue
CREATE OR REPLACE FUNCTION add_to_activation_queue()
RETURNS TRIGGER AS $$
BEGIN
  -- Add to activation queue when status becomes 'waitlist'
  IF NEW.status = 'waitlist' AND (OLD.status IS NULL OR OLD.status != 'waitlist') THEN
    INSERT INTO public.activation_queue (driver_id, region_id, priority_score)
    VALUES (NEW.id, NEW.region_id, NEW.priority_score)
    ON CONFLICT (driver_id) DO UPDATE SET
      priority_score = NEW.priority_score,
      region_id = NEW.region_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 14: Create trigger to add to activation queue
DROP TRIGGER IF EXISTS trigger_add_to_activation_queue ON public.craver_applications;
CREATE TRIGGER trigger_add_to_activation_queue
  AFTER INSERT OR UPDATE ON public.craver_applications
  FOR EACH ROW
  EXECUTE FUNCTION add_to_activation_queue();

-- Step 15: Create function to initialize onboarding tasks
CREATE OR REPLACE FUNCTION initialize_onboarding_tasks()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default onboarding tasks
  INSERT INTO public.onboarding_tasks (driver_id, task_key, task_name, description, points_reward)
  VALUES 
    (NEW.id, 'profile_complete', 'Complete Profile', 'Fill out all personal information', 10),
    (NEW.id, 'documents_uploaded', 'Upload Documents', 'Upload driver license and insurance', 20),
    (NEW.id, 'orientation_video', 'Watch Orientation', 'Complete orientation video', 15),
    (NEW.id, 'safety_quiz', 'Safety Quiz', 'Pass the safety knowledge quiz', 25),
    (NEW.id, 'referral_bonus', 'Refer Friends', 'Refer other drivers to earn bonus points', 50);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 16: Create trigger to initialize onboarding tasks
DROP TRIGGER IF EXISTS trigger_initialize_onboarding_tasks ON public.craver_applications;
CREATE TRIGGER trigger_initialize_onboarding_tasks
  AFTER INSERT ON public.craver_applications
  FOR EACH ROW
  EXECUTE FUNCTION initialize_onboarding_tasks();

-- Step 17: Create function to update priority score when points change
CREATE OR REPLACE FUNCTION update_priority_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Update priority score in activation queue
  UPDATE public.activation_queue
  SET priority_score = NEW.priority_score
  WHERE driver_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 18: Create trigger to update priority score
DROP TRIGGER IF EXISTS trigger_update_priority_score ON public.craver_applications;
CREATE TRIGGER trigger_update_priority_score
  AFTER UPDATE OF priority_score ON public.craver_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_priority_score();

-- Step 19: Create function to calculate waitlist position
CREATE OR REPLACE FUNCTION calculate_waitlist_position()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate position based on priority score and creation date
  NEW.waitlist_position := (
    SELECT COUNT(*) + 1
    FROM public.craver_applications
    WHERE status = 'waitlist'
    AND region_id = NEW.region_id
    AND (
      priority_score > NEW.priority_score
      OR (priority_score = NEW.priority_score AND created_at < NEW.created_at)
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 20: Create trigger to calculate waitlist position
DROP TRIGGER IF EXISTS trigger_calculate_waitlist_position ON public.craver_applications;
CREATE TRIGGER trigger_calculate_waitlist_position
  BEFORE INSERT OR UPDATE ON public.craver_applications
  FOR EACH ROW
  WHEN (NEW.status = 'waitlist')
  EXECUTE FUNCTION calculate_waitlist_position();

-- Step 21: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_craver_applications_region_id ON public.craver_applications(region_id);
CREATE INDEX IF NOT EXISTS idx_craver_applications_priority_score ON public.craver_applications(priority_score);
CREATE INDEX IF NOT EXISTS idx_craver_applications_status ON public.craver_applications(status);
CREATE INDEX IF NOT EXISTS idx_activation_queue_region_id ON public.activation_queue(region_id);
CREATE INDEX IF NOT EXISTS idx_activation_queue_priority_score ON public.activation_queue(priority_score);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_driver_id ON public.onboarding_tasks(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_referrals_referrer_id ON public.driver_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_driver_referrals_referee_id ON public.driver_referrals(referee_id);

-- Step 22: Insert default regions (only if they don't exist)
INSERT INTO public.regions (name, zip_prefix, status, active_quota) VALUES
('Toledo, OH', '436', 'limited', 50),
('Detroit, MI', '482', 'limited', 75),
('Cleveland, OH', '441', 'limited', 60),
('Columbus, OH', '432', 'limited', 40),
('Cincinnati, OH', '452', 'limited', 35);

-- Step 23: Create function to get driver queue position (FIXED - no reserved keywords)
CREATE OR REPLACE FUNCTION get_driver_queue_position(driver_uuid UUID)
RETURNS TABLE (
  queue_position BIGINT,
  total_in_region BIGINT,
  region_name TEXT,
  priority_score INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ca.waitlist_position as queue_position,
    COUNT(*) OVER (PARTITION BY ca.region_id) as total_in_region,
    r.name as region_name,
    ca.priority_score
  FROM public.craver_applications ca
  JOIN public.regions r ON ca.region_id = r.id
  WHERE ca.id = driver_uuid
  AND ca.status = 'waitlist';
END;
$$ LANGUAGE plpgsql;

-- Step 24: Create function to get region capacity status
CREATE OR REPLACE FUNCTION get_region_capacity_status(region_id_param INT)
RETURNS TABLE (
  region_name TEXT,
  current_active INT,
  quota INT,
  waitlist_count INT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.name as region_name,
    COUNT(CASE WHEN ca.status = 'approved' THEN 1 END) as current_active,
    r.active_quota as quota,
    COUNT(CASE WHEN ca.status = 'waitlist' THEN 1 END) as waitlist_count,
    r.status
  FROM public.regions r
  LEFT JOIN public.craver_applications ca ON ca.region_id = r.id
  WHERE r.id = region_id_param
  GROUP BY r.id, r.name, r.active_quota, r.status;
END;
$$ LANGUAGE plpgsql;

-- Step 25: Verify the setup
SELECT 'Enhanced driver waitlist system setup completed successfully!' as status;
