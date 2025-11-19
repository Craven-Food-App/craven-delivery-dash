-- Fix ambiguous column reference in get_employee_clock_status function
-- The function had a return column named 'clock_in_at' which conflicted with the table column
-- Solution: Add table aliases to all subqueries to disambiguate column references

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
      SELECT 1 FROM public.time_entries te1
      WHERE te1.employee_id = p_employee_id 
      AND te1.status = 'clocked_in' 
      AND te1.clock_out_at IS NULL
    ) AS is_clocked_in,
    (SELECT te2.id FROM public.time_entries te2
     WHERE te2.employee_id = p_employee_id 
     AND te2.status = 'clocked_in' 
     AND te2.clock_out_at IS NULL 
     ORDER BY te2.clock_in_at DESC LIMIT 1) AS current_entry_id,
    (SELECT te3.clock_in_at FROM public.time_entries te3
     WHERE te3.employee_id = p_employee_id 
     AND te3.status = 'clocked_in' 
     AND te3.clock_out_at IS NULL 
     ORDER BY te3.clock_in_at DESC LIMIT 1) AS clock_in_at,
    COALESCE((
      SELECT SUM(te4.total_hours) 
      FROM public.time_entries te4
      WHERE te4.employee_id = p_employee_id 
      AND DATE(te4.clock_in_at) = CURRENT_DATE
      AND te4.clock_out_at IS NOT NULL
    ), 0) AS total_hours_today,
    COALESCE((
      SELECT SUM(te5.total_hours) 
      FROM public.time_entries te5
      WHERE te5.employee_id = p_employee_id 
      AND te5.clock_in_at >= date_trunc('week', CURRENT_DATE)
      AND te5.clock_out_at IS NOT NULL
    ), 0) AS weekly_hours;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_employee_clock_status IS 'Get current clock status for an employee. Fixed ambiguous column reference by adding table aliases.';

