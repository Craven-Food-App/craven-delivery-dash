-- Employee Portal PIN Access System
-- PINs are issued during the hiring process

-- Add portal_pin column to employees table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'portal_pin'
  ) THEN
    ALTER TABLE public.employees 
    ADD COLUMN portal_pin TEXT; -- 6-digit PIN, stored as plain text (can be hashed later)
  END IF;
END $$;

-- Add portal_access_granted column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'portal_access_granted'
  ) THEN
    ALTER TABLE public.employees 
    ADD COLUMN portal_access_granted BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add portal_pin_issued_at timestamp
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'portal_pin_issued_at'
  ) THEN
    ALTER TABLE public.employees 
    ADD COLUMN portal_pin_issued_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Function to verify employee PIN
CREATE OR REPLACE FUNCTION public.verify_employee_portal_pin(p_email TEXT, p_pin TEXT)
RETURNS TABLE(
  employee_id UUID,
  employee_number TEXT,
  full_name TEXT,
  email TEXT,
  "position" TEXT,
  department_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.employee_number,
    e.first_name || ' ' || e.last_name as full_name,
    e.email,
    e.position,
    e.department_id
  FROM public.employees e
  WHERE e.email = p_email 
    AND e.portal_pin = p_pin
    AND e.portal_access_granted = true
    AND e.employment_status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Master PIN for CEO (Torrance Stroman)
-- Master PIN: 999999 (should be changed in production)
-- CEO Email: Check user_profiles for Torrance Stroman

-- Create a view or function to check master PIN
CREATE OR REPLACE FUNCTION public.verify_ceo_master_pin(p_pin TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Master PIN for Torrance Stroman: 999999
  -- This should be stored securely in production
  RETURN p_pin = '999999';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if email belongs to CEO
CREATE OR REPLACE FUNCTION public.is_ceo_email(p_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if email belongs to Torrance Stroman
  -- You can update this with the actual CEO email
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN auth.users au ON up.user_id = au.id
    WHERE au.email = p_email
      AND (up.full_name ILIKE '%Torrance%Stroman%' OR up.full_name ILIKE '%Stroman%Torrance%')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

