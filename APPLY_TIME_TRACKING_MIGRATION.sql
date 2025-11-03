-- Time tracking system for employee clock in/out
-- Run this in Supabase SQL Editor to create the time tracking system

-- Create time_entries table
CREATE TABLE IF NOT EXISTS public.time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_entries_employee_id ON public.time_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_clock_in_at ON public.time_entries(clock_in_at);
CREATE INDEX IF NOT EXISTS idx_time_entries_status ON public.time_entries(status) WHERE status = 'clocked_in';
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON public.time_entries((DATE(clock_in_at)));

-- Function to clock in
-- Drop all existing versions
DROP FUNCTION IF EXISTS public.clock_in(UUID, TEXT);
DROP FUNCTION IF EXISTS public.clock_in(UUID);

-- Create function with 1 parameter (UUID only) - this is what we're calling from the app
CREATE OR REPLACE FUNCTION public.clock_in(p_employee_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry_id UUID;
BEGIN
  -- Check if employee is already clocked in
  IF EXISTS (
    SELECT 1 FROM public.time_entries 
    WHERE employee_id = p_employee_id 
    AND status = 'clocked_in'
    AND clock_out_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Employee is already clocked in';
  END IF;

  -- Create new clock-in entry
  INSERT INTO public.time_entries (employee_id, clock_in_at, status, work_location)
  VALUES (p_employee_id, now(), 'clocked_in', NULL)
  RETURNING id INTO v_entry_id;

  RETURN v_entry_id;
END;
$$;

-- Also create function with 2 parameters (for future use if needed)
CREATE OR REPLACE FUNCTION public.clock_in(p_employee_id UUID, p_work_location TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry_id UUID;
BEGIN
  -- Check if employee is already clocked in
  IF EXISTS (
    SELECT 1 FROM public.time_entries 
    WHERE employee_id = p_employee_id 
    AND status = 'clocked_in'
    AND clock_out_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Employee is already clocked in';
  END IF;

  -- Create new clock-in entry
  INSERT INTO public.time_entries (employee_id, clock_in_at, status, work_location)
  VALUES (p_employee_id, now(), 'clocked_in', p_work_location)
  RETURNING id INTO v_entry_id;

  RETURN v_entry_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.clock_in(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clock_in(UUID, TEXT) TO authenticated;

-- Function to clock out
DROP FUNCTION IF EXISTS public.clock_out(UUID, INTEGER);
DROP FUNCTION IF EXISTS public.clock_out(UUID);

-- Create function with 1 parameter (UUID only)
CREATE OR REPLACE FUNCTION public.clock_out(p_employee_id UUID)
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
  WHERE employee_id = p_employee_id
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

-- Also create function with 2 parameters (for future use)
CREATE OR REPLACE FUNCTION public.clock_out(p_employee_id UUID, p_break_duration_minutes INTEGER)
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
  WHERE employee_id = p_employee_id
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

-- Grant execute permission for clock_out
GRANT EXECUTE ON FUNCTION public.clock_out(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clock_out(UUID, INTEGER) TO authenticated;

-- Function to get current clock status
DROP FUNCTION IF EXISTS public.get_employee_clock_status(UUID);
CREATE OR REPLACE FUNCTION public.get_employee_clock_status(p_employee_id UUID)
RETURNS TABLE (
  is_clocked_in BOOLEAN,
  current_entry_id UUID,
  clock_in_at TIMESTAMP WITH TIME ZONE,
  total_hours_today NUMERIC(5, 2),
  weekly_hours NUMERIC(5, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS(
      SELECT 1 FROM public.time_entries 
      WHERE employee_id = p_employee_id 
      AND status = 'clocked_in' 
      AND clock_out_at IS NULL
    ) AS is_clocked_in,
    (SELECT id FROM public.time_entries 
     WHERE employee_id = p_employee_id 
     AND status = 'clocked_in' 
     AND clock_out_at IS NULL 
     ORDER BY clock_in_at DESC LIMIT 1) AS current_entry_id,
    (SELECT clock_in_at FROM public.time_entries 
     WHERE employee_id = p_employee_id 
     AND status = 'clocked_in' 
     AND clock_out_at IS NULL 
     ORDER BY clock_in_at DESC LIMIT 1) AS clock_in_at,
    COALESCE((
      SELECT SUM(total_hours) 
      FROM public.time_entries 
      WHERE employee_id = p_employee_id 
      AND DATE(clock_in_at) = CURRENT_DATE
      AND clock_out_at IS NOT NULL
    ), 0) AS total_hours_today,
    COALESCE((
      SELECT SUM(total_hours) 
      FROM public.time_entries 
      WHERE employee_id = p_employee_id 
      AND clock_in_at >= date_trunc('week', CURRENT_DATE)
      AND clock_out_at IS NOT NULL
    ), 0) AS weekly_hours;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_employee_clock_status(UUID) TO authenticated;

-- Enable RLS
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Employees can view their own time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Employees can create their own time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Employees can update their own active time entries" ON public.time_entries;
DROP POLICY IF EXISTS "HR and admins can view all time entries" ON public.time_entries;

-- RLS Policies
CREATE POLICY "Employees can view their own time entries"
ON public.time_entries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = employee_id AND e.user_id = auth.uid()
  )
);

CREATE POLICY "Employees can create their own time entries"
ON public.time_entries
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = employee_id AND e.user_id = auth.uid()
  )
);

CREATE POLICY "Employees can update their own active time entries"
ON public.time_entries
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = employee_id AND e.user_id = auth.uid()
  )
  AND status IN ('clocked_in', 'on_break')
);

-- HR/Admin can view all time entries
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

