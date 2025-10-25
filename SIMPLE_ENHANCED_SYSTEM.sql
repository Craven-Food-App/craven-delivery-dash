-- SIMPLE ENHANCED DRIVER WAITLIST SYSTEM - MINIMAL VERSION
-- This creates the essential components without complex RLS policies

-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS calculate_waitlist_position(UUID);
DROP FUNCTION IF EXISTS update_driver_priority_on_task_complete();
DROP FUNCTION IF EXISTS get_driver_queue_position(UUID);
DROP FUNCTION IF EXISTS get_region_capacity_status(INTEGER);
DROP FUNCTION IF EXISTS handle_referral_points();
DROP FUNCTION IF EXISTS set_waitlist_position();

-- Drop existing triggers
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

-- Step 7: Insert default regions
INSERT INTO public.regions (name, zip_prefix, status, active_quota) VALUES
('Toledo, OH', '436', 'limited', 50),
('Detroit, MI', '482', 'limited', 75),
('Cleveland, OH', '441', 'limited', 60),
('Columbus, OH', '432', 'limited', 40),
('Cincinnati, OH', '452', 'limited', 35);

-- Step 8: Create basic functions
CREATE OR REPLACE FUNCTION calculate_waitlist_position(driver_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  position INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO position
  FROM public.activation_queue aq
  WHERE aq.region_id = (
    SELECT region_id FROM public.craver_applications WHERE id = driver_uuid
  )
  AND aq.priority_score > (
    SELECT priority_score FROM public.craver_applications WHERE id = driver_uuid
  );
  
  RETURN COALESCE(position, 1);
END;
$$ LANGUAGE plpgsql;

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

-- Step 9: Enable RLS (basic)
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_referrals ENABLE ROW LEVEL SECURITY;

-- Basic policies - allow all for now
CREATE POLICY "Allow all on regions" ON public.regions FOR ALL USING (true);
CREATE POLICY "Allow all on activation_queue" ON public.activation_queue FOR ALL USING (true);
CREATE POLICY "Allow all on onboarding_tasks" ON public.onboarding_tasks FOR ALL USING (true);
CREATE POLICY "Allow all on driver_referrals" ON public.driver_referrals FOR ALL USING (true);

SELECT 'Enhanced Driver Waitlist System created successfully!' as status;

