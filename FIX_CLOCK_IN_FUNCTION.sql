-- FIX: Ensure clock_in function exists and is callable
-- Run this in Supabase SQL Editor

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

-- Grant execute permission to authenticated users for both versions
GRANT EXECUTE ON FUNCTION public.clock_in(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clock_in(UUID, TEXT) TO authenticated;

-- Verify it exists
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'clock_in';

