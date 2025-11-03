-- COMPLETE TIME TRACKING SETUP
-- Run this ENTIRE file in Supabase SQL Editor to create everything at once

-- ============================================
-- STEP 1: Create time_entries table
-- ============================================
CREATE TABLE IF NOT EXISTS public.time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Support both employees and executives - use user_id as primary identifier
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  exec_user_id UUID REFERENCES public.exec_users(id) ON DELETE SET NULL,
  clock_in_at TIMESTAMP WITH TIME ZONE NOT NULL,
  clock_out_at TIMESTAMP WITH TIME ZONE,
  break_duration_minutes INTEGER DEFAULT 0,
  total_hours NUMERIC(5, 2) GENERATED ALWAYS AS (
    CASE 
      WHEN clock_out_at IS NOT NULL THEN 
        EXTRACT(EPOCH FROM (clock_out_at - clock_in_at)) / 3600.0 - (break_duration_minutes::NUMERIC / 60.0)
      ELSE NULL
    END
  ) STORED,
  status TEXT NOT NULL DEFAULT 'clocked_in' CHECK (status IN ('clocked_in', 'on_break', 'clocked_out')),
  work_location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  -- Ensure at least one of employee_id or exec_user_id is set
  CONSTRAINT time_entries_user_type_check CHECK (
    (employee_id IS NOT NULL) OR (exec_user_id IS NOT NULL)
  )
);

-- ============================================
-- STEP 2: Create indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON public.time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_employee_id ON public.time_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_exec_user_id ON public.time_entries(exec_user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_clock_in_at ON public.time_entries(clock_in_at);
CREATE INDEX IF NOT EXISTS idx_time_entries_status ON public.time_entries(status) WHERE status = 'clocked_in';
-- Note: Date queries can use the clock_in_at timestamp index with WHERE DATE(clock_in_at) = ...
-- No separate date index needed

-- ============================================
-- STEP 3: Create clock_in functions
-- ============================================
DROP FUNCTION IF EXISTS public.clock_in(UUID, TEXT);
DROP FUNCTION IF EXISTS public.clock_in(UUID);

-- Function with 1 parameter (user_id UUID) - works for both employees and executives
CREATE OR REPLACE FUNCTION public.clock_in(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry_id UUID;
  v_employee_id UUID;
  v_exec_user_id UUID;
BEGIN
  -- Check if user is already clocked in
  IF EXISTS (
    SELECT 1 FROM public.time_entries 
    WHERE user_id = p_user_id 
    AND status = 'clocked_in'
    AND clock_out_at IS NULL
  ) THEN
    RAISE EXCEPTION 'User is already clocked in';
  END IF;

  -- Try to find employee record
  SELECT id INTO v_employee_id
  FROM public.employees
  WHERE user_id = p_user_id
  LIMIT 1;

  -- Try to find exec_user record if not an employee
  IF v_employee_id IS NULL THEN
    SELECT id INTO v_exec_user_id
    FROM public.exec_users
    WHERE user_id = p_user_id
    LIMIT 1;
  END IF;

  -- Ensure user exists in either employees or exec_users
  IF v_employee_id IS NULL AND v_exec_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found in employees or executives table';
  END IF;

  -- Create new clock-in entry
  INSERT INTO public.time_entries (user_id, employee_id, exec_user_id, clock_in_at, status, work_location)
  VALUES (p_user_id, v_employee_id, v_exec_user_id, now(), 'clocked_in', NULL)
  RETURNING id INTO v_entry_id;

  RETURN v_entry_id;
END;
$$;

-- Function with 2 parameters (for future use if needed)
CREATE OR REPLACE FUNCTION public.clock_in(p_user_id UUID, p_work_location TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry_id UUID;
  v_employee_id UUID;
  v_exec_user_id UUID;
BEGIN
  -- Check if user is already clocked in
  IF EXISTS (
    SELECT 1 FROM public.time_entries 
    WHERE user_id = p_user_id 
    AND status = 'clocked_in'
    AND clock_out_at IS NULL
  ) THEN
    RAISE EXCEPTION 'User is already clocked in';
  END IF;

  -- Try to find employee record
  SELECT id INTO v_employee_id
  FROM public.employees
  WHERE user_id = p_user_id
  LIMIT 1;

  -- Try to find exec_user record if not an employee
  IF v_employee_id IS NULL THEN
    SELECT id INTO v_exec_user_id
    FROM public.exec_users
    WHERE user_id = p_user_id
    LIMIT 1;
  END IF;

  -- Ensure user exists in either employees or exec_users
  IF v_employee_id IS NULL AND v_exec_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found in employees or executives table';
  END IF;

  -- Create new clock-in entry
  INSERT INTO public.time_entries (user_id, employee_id, exec_user_id, clock_in_at, status, work_location)
  VALUES (p_user_id, v_employee_id, v_exec_user_id, now(), 'clocked_in', p_work_location)
  RETURNING id INTO v_entry_id;

  RETURN v_entry_id;
END;
$$;

-- ============================================
-- STEP 4: Create clock_out functions
-- ============================================
DROP FUNCTION IF EXISTS public.clock_out(UUID, INTEGER);
DROP FUNCTION IF EXISTS public.clock_out(UUID);

-- Function with 1 parameter (user_id UUID) - works for both employees and executives
CREATE OR REPLACE FUNCTION public.clock_out(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry_id UUID;
BEGIN
  -- Find active clock-in entry
  SELECT id INTO v_entry_id
  FROM public.time_entries
  WHERE user_id = p_user_id
  AND status IN ('clocked_in', 'on_break')
  AND clock_out_at IS NULL
  ORDER BY clock_in_at DESC
  LIMIT 1;

  IF v_entry_id IS NULL THEN
    RAISE EXCEPTION 'No active clock-in found';
  END IF;

  -- Update entry with clock-out time
  UPDATE public.time_entries
  SET 
    clock_out_at = now(),
    status = 'clocked_out',
    break_duration_minutes = 0,
    updated_at = now()
  WHERE id = v_entry_id;

  RETURN v_entry_id;
END;
$$;

-- Function with 2 parameters (for future use)
CREATE OR REPLACE FUNCTION public.clock_out(p_user_id UUID, p_break_duration_minutes INTEGER)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry_id UUID;
BEGIN
  -- Find active clock-in entry
  SELECT id INTO v_entry_id
  FROM public.time_entries
  WHERE user_id = p_user_id
  AND status IN ('clocked_in', 'on_break')
  AND clock_out_at IS NULL
  ORDER BY clock_in_at DESC
  LIMIT 1;

  IF v_entry_id IS NULL THEN
    RAISE EXCEPTION 'No active clock-in found';
  END IF;

  -- Update entry with clock-out time
  UPDATE public.time_entries
  SET 
    clock_out_at = now(),
    status = 'clocked_out',
    break_duration_minutes = p_break_duration_minutes,
    updated_at = now()
  WHERE id = v_entry_id;

  RETURN v_entry_id;
END;
$$;

-- ============================================
-- STEP 5: Create get_employee_clock_status function
-- ============================================
DROP FUNCTION IF EXISTS public.get_employee_clock_status(UUID);

CREATE OR REPLACE FUNCTION public.get_employee_clock_status(p_user_id UUID)
RETURNS TABLE (
  is_clocked_in BOOLEAN,
  current_entry_id UUID,
  clock_in_at TIMESTAMP WITH TIME ZONE,
  total_hours_today NUMERIC(5, 2),
  weekly_hours NUMERIC(5, 2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS(
      SELECT 1 FROM public.time_entries 
      WHERE user_id = p_user_id 
      AND status = 'clocked_in' 
      AND clock_out_at IS NULL
    ) AS is_clocked_in,
    (SELECT id FROM public.time_entries 
     WHERE user_id = p_user_id 
     AND status = 'clocked_in' 
     AND clock_out_at IS NULL 
     ORDER BY clock_in_at DESC LIMIT 1) AS current_entry_id,
    (SELECT clock_in_at FROM public.time_entries 
     WHERE user_id = p_user_id 
     AND status = 'clocked_in' 
     AND clock_out_at IS NULL 
     ORDER BY clock_in_at DESC LIMIT 1) AS clock_in_at,
    COALESCE((
      SELECT SUM(total_hours) 
      FROM public.time_entries 
      WHERE user_id = p_user_id 
      AND DATE(clock_in_at) = CURRENT_DATE
      AND clock_out_at IS NOT NULL
    ), 0) AS total_hours_today,
    COALESCE((
      SELECT SUM(total_hours) 
      FROM public.time_entries 
      WHERE user_id = p_user_id 
      AND clock_in_at >= date_trunc('week', CURRENT_DATE)
      AND clock_out_at IS NOT NULL
    ), 0) AS weekly_hours;
END;
$$;

-- ============================================
-- STEP 6: Grant permissions
-- ============================================
GRANT EXECUTE ON FUNCTION public.clock_in(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clock_in(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clock_out(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clock_out(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_employee_clock_status(UUID) TO authenticated;

-- ============================================
-- STEP 7: Enable RLS and create policies
-- ============================================
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Employees can view their own time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Employees can create their own time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Employees can update their own active time entries" ON public.time_entries;
DROP POLICY IF EXISTS "HR and admins can view all time entries" ON public.time_entries;

-- Create RLS policies
CREATE POLICY "Users can view their own time entries"
ON public.time_entries
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own time entries"
ON public.time_entries
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own active time entries"
ON public.time_entries
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND status IN ('clocked_in', 'on_break')
);

CREATE POLICY "HR and admins can view all time entries"
ON public.time_entries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() 
    AND up.role IN ('admin', 'hr')
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'hr')
  )
);

-- ============================================
-- VERIFICATION
-- ============================================
-- Check if table exists
SELECT 'time_entries table created' as status 
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'time_entries'
);

-- Check if functions exist
SELECT 
    'Function: ' || p.proname || '(' || pg_get_function_arguments(p.oid) || ')' as function_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('clock_in', 'clock_out', 'get_employee_clock_status')
ORDER BY p.proname, pg_get_function_arguments(p.oid);

-- Note: The time tracking system now works for BOTH employees and C-suite executives
-- It uses user_id as the primary identifier and automatically links to employees or exec_users

