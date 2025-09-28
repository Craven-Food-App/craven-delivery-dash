-- Fix search path for the functions I just created
CREATE OR REPLACE FUNCTION public.calculate_driver_daily_earnings(
  target_driver_id UUID,
  target_date DATE
) RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_earnings DECIMAL(10,2) := 0;
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO total_earnings
  FROM public.driver_earnings
  WHERE driver_id = target_driver_id
    AND DATE(created_at) = target_date;
    
  RETURN total_earnings;
END;
$$;