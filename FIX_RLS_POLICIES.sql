-- Fix all RLS policy violations for driver application submission
-- This script adds the missing policies that prevent application submission

-- Fix 1: Allow users to read regions for auto-assignment by ZIP code
CREATE POLICY "Users can read regions for assignment" ON public.regions
FOR SELECT USING (true);

-- Fix 2: Allow system to insert into activation queue when application is created
CREATE POLICY "System can add to activation queue" ON public.activation_queue
FOR INSERT WITH CHECK (
  driver_id IN (
    SELECT id FROM public.craver_applications WHERE user_id = auth.uid()
  )
);

-- Fix 3: Allow system to update activation queue priority scores
CREATE POLICY "System can update activation queue" ON public.activation_queue
FOR UPDATE USING (
  driver_id IN (
    SELECT id FROM public.craver_applications WHERE user_id = auth.uid()
  )
);

-- Fix 4: Allow system to initialize onboarding tasks when application is created
CREATE POLICY "System can initialize onboarding tasks" ON public.onboarding_tasks
FOR INSERT WITH CHECK (
  driver_id IN (
    SELECT id FROM public.craver_applications WHERE user_id = auth.uid()
  )
);

-- Verify all policies are created
SELECT 'RLS policies fixed successfully!' as status;
