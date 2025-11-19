-- Ensure Universal CEO Access for tstroman.ceo@cravenusa.com
-- This migration ensures Torrance Stroman has universal access to everything
-- both now and in the future by creating/updating universal access functions

-- 1. Create/Update universal CEO access function
-- This function checks BOTH the old email (for backward compatibility) and new email
CREATE OR REPLACE FUNCTION public.is_universal_ceo()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    auth.jwt()->>'email' = 'tstroman.ceo@cravenusa.com' 
    OR auth.jwt()->>'email' = 'craven@usa.com'
    OR EXISTS (
      SELECT 1 FROM public.ceo_access_credentials 
      WHERE user_email = auth.jwt()->>'email'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Update is_ceo function to also check for universal CEO email
CREATE OR REPLACE FUNCTION public.is_ceo(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get user email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_uuid;
  
  -- Check if it's the universal CEO email
  IF user_email = 'tstroman.ceo@cravenusa.com' OR user_email = 'craven@usa.com' THEN
    RETURN TRUE;
  END IF;
  
  -- Check exec_users table
  RETURN EXISTS (
    SELECT 1 FROM public.exec_users
    WHERE user_id = user_uuid 
    AND role = 'ceo'
    AND access_level = 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Create universal access check function for RLS policies
-- This can be used in ALL future RLS policies to grant universal access
CREATE OR REPLACE FUNCTION public.has_universal_access()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    auth.jwt()->>'email' = 'tstroman.ceo@cravenusa.com'
    OR EXISTS (
      SELECT 1 FROM public.ceo_access_credentials 
      WHERE user_email = auth.jwt()->>'email'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 4. Ensure exec_users record exists for tstroman.ceo@cravenusa.com
DO $$
DECLARE
  ceo_user_id UUID;
  exec_user_record_id UUID;
BEGIN
  -- Get user ID for tstroman.ceo@cravenusa.com
  SELECT id INTO ceo_user_id
  FROM auth.users
  WHERE email = 'tstroman.ceo@cravenusa.com';
  
  IF ceo_user_id IS NOT NULL THEN
    -- Check if exec_users record exists
    SELECT id INTO exec_user_record_id
    FROM public.exec_users
    WHERE user_id = ceo_user_id;
    
    -- Create exec_users record if it doesn't exist
    IF exec_user_record_id IS NULL THEN
      INSERT INTO public.exec_users (
        user_id,
        role,
        access_level,
        title,
        department,
        mfa_enabled
      ) VALUES (
        ceo_user_id,
        'ceo',
        1, -- Highest access level
        'Chief Executive Officer',
        'Executive',
        false
      )
      ON CONFLICT (user_id) DO UPDATE SET
        role = 'ceo',
        access_level = 1,
        title = 'Chief Executive Officer',
        department = 'Executive';
      
      RAISE NOTICE 'Created exec_users record for tstroman.ceo@cravenusa.com';
    ELSE
      -- Update existing record to ensure CEO role and highest access
      UPDATE public.exec_users
      SET 
        role = 'ceo',
        access_level = 1,
        title = 'Chief Executive Officer',
        department = 'Executive'
      WHERE id = exec_user_record_id;
      
      RAISE NOTICE 'Updated exec_users record for tstroman.ceo@cravenusa.com';
    END IF;
  ELSE
    RAISE WARNING 'User tstroman.ceo@cravenusa.com does not exist in auth.users. Please create the user account first.';
  END IF;
END $$;

-- 5. Grant ALL roles to tstroman.ceo@cravenusa.com in user_roles
DO $$
DECLARE
  ceo_user_id UUID;
BEGIN
  -- Get user ID for tstroman.ceo@cravenusa.com
  SELECT id INTO ceo_user_id
  FROM auth.users
  WHERE email = 'tstroman.ceo@cravenusa.com';
  
  IF ceo_user_id IS NOT NULL THEN
    -- Grant all executive roles (only roles that exist in the constraint)
    INSERT INTO public.user_roles (user_id, role)
    SELECT ceo_user_id, role_name
    FROM (VALUES 
      ('admin'),
      ('ceo'),
      ('cfo'),
      ('coo'),
      ('cto'),
      ('board_member'),
      ('CRAVEN_FOUNDER'),
      ('CRAVEN_CORPORATE_SECRETARY'),
      ('CRAVEN_BOARD_MEMBER'),
      ('CRAVEN_EXECUTIVE'),
      ('CRAVEN_CEO'),
      ('CRAVEN_CFO'),
      ('CRAVEN_CTO'),
      ('CRAVEN_COO')
    ) AS roles(role_name)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = ceo_user_id AND role = roles.role_name
    );
    
    RAISE NOTICE 'Granted all roles to tstroman.ceo@cravenusa.com';
  END IF;
END $$;

-- 6. Update existing RLS policies to use universal access function
-- This ensures backward compatibility while adding universal access

-- Update exec_users policies
DROP POLICY IF EXISTS "ceo_full_access" ON public.exec_users;
CREATE POLICY "ceo_full_access"
ON public.exec_users FOR ALL
TO authenticated
USING (public.has_universal_access())
WITH CHECK (public.has_universal_access());

DROP POLICY IF EXISTS "ceo_can_view_all_exec_users" ON public.exec_users;
CREATE POLICY "ceo_can_view_all_exec_users"
ON public.exec_users FOR SELECT
TO authenticated
USING (
  public.has_universal_access()
  OR user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "ceo_can_manage_exec_users" ON public.exec_users;
CREATE POLICY "ceo_can_manage_exec_users"
ON public.exec_users FOR ALL
TO authenticated
USING (public.has_universal_access())
WITH CHECK (public.has_universal_access());

-- Update employee management policies
DROP POLICY IF EXISTS "CEO can manage all departments" ON public.departments;
CREATE POLICY "CEO can manage all departments"
ON public.departments FOR ALL
TO authenticated
USING (public.has_universal_access());

DROP POLICY IF EXISTS "CEO can manage all employees" ON public.employees;
CREATE POLICY "CEO can manage all employees"
ON public.employees FOR ALL
TO authenticated
USING (
  public.has_universal_access()
  OR user_id = auth.uid()
);

DROP POLICY IF EXISTS "CEO can view all employee history" ON public.employee_history;
CREATE POLICY "CEO can view all employee history"
ON public.employee_history FOR SELECT
TO authenticated
USING (public.has_universal_access());

DROP POLICY IF EXISTS "CEO can insert employee history" ON public.employee_history;
CREATE POLICY "CEO can insert employee history"
ON public.employee_history FOR INSERT
TO authenticated
WITH CHECK (public.has_universal_access());

DROP POLICY IF EXISTS "CEO can manage payroll" ON public.payroll;
CREATE POLICY "CEO can manage payroll"
ON public.payroll FOR ALL
TO authenticated
USING (public.has_universal_access());

DROP POLICY IF EXISTS "CEO can manage reviews" ON public.performance_reviews;
CREATE POLICY "CEO can manage reviews"
ON public.performance_reviews FOR ALL
TO authenticated
USING (public.has_universal_access());

-- Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION public.is_universal_ceo() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_universal_access() TO authenticated;

-- Create a comment documenting universal access
COMMENT ON FUNCTION public.has_universal_access() IS 
'Universal access function for CEO. Returns TRUE if the authenticated user is tstroman.ceo@cravenusa.com or has a record in ceo_access_credentials. Use this in ALL future RLS policies to grant universal access.';

COMMENT ON FUNCTION public.is_universal_ceo() IS 
'Checks if the current authenticated user is the universal CEO (tstroman.ceo@cravenusa.com). Use this for CEO-specific access checks.';

