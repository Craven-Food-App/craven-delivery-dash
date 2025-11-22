-- Fix exec_users RLS to allow edge functions (service role) to insert/update
-- Service role should bypass RLS, but we'll add explicit policies for safety

-- Drop ALL existing policies to prevent conflicts and recursion
-- This ensures we start with a clean slate
DROP POLICY IF EXISTS "ceo_can_view_all_exec_users" ON public.exec_users;
DROP POLICY IF EXISTS "ceo_can_manage_exec_users" ON public.exec_users;
DROP POLICY IF EXISTS "authenticated_can_view_exec_users" ON public.exec_users;
DROP POLICY IF EXISTS "ceo_full_access" ON public.exec_users;
DROP POLICY IF EXISTS "users_update_own_record" ON public.exec_users;
DROP POLICY IF EXISTS "allow_ceo_insert_executives" ON public.exec_users;
DROP POLICY IF EXISTS "Executives can view all exec users" ON public.exec_users;
DROP POLICY IF EXISTS "Users can view their own exec record" ON public.exec_users;
DROP POLICY IF EXISTS "Executives can update their own profile" ON public.exec_users;
DROP POLICY IF EXISTS "allow_users_view_own_exec_record" ON public.exec_users;
DROP POLICY IF EXISTS "allow_executives_view_all" ON public.exec_users;
DROP POLICY IF EXISTS "allow_executives_update_own" ON public.exec_users;
DROP POLICY IF EXISTS "allow_authenticated_view_exec_users" ON public.exec_users;
DROP POLICY IF EXISTS "ceo_has_full_access" ON public.exec_users;
DROP POLICY IF EXISTS "execs_update_own_record" ON public.exec_users;
DROP POLICY IF EXISTS "exec can see their record" ON public.exec_users;

-- Ensure user_id is NOT NULL (required for proper foreign key)
-- But allow it to be set later if needed
DO $$
BEGIN
  -- Check if user_id is nullable, if so make it NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'exec_users' 
    AND column_name = 'user_id'
    AND is_nullable = 'YES'
  ) THEN
    -- First, handle foreign key references from equity_grants
    -- Set executive_id to NULL in equity_grants for orphaned exec_users
    UPDATE public.equity_grants
    SET executive_id = NULL
    WHERE executive_id IN (
      SELECT id FROM public.exec_users WHERE user_id IS NULL
    );
    
    -- Also handle granted_by references
    UPDATE public.equity_grants
    SET granted_by = NULL
    WHERE granted_by IN (
      SELECT id FROM public.exec_users WHERE user_id IS NULL
    );
    
    -- Handle equity_grant_history.changed_by references
    UPDATE public.equity_grant_history
    SET changed_by = NULL
    WHERE changed_by IN (
      SELECT id FROM public.exec_users WHERE user_id IS NULL
    );
    
    -- Now safe to delete orphaned exec_users records
    DELETE FROM public.exec_users WHERE user_id IS NULL;
    
    -- Then make it NOT NULL
    ALTER TABLE public.exec_users 
    ALTER COLUMN user_id SET NOT NULL;
  END IF;
END $$;

-- New RLS Policies that work with edge functions:
-- NOTE: We avoid querying exec_users within policies to prevent infinite recursion

-- 1. Allow all authenticated users to view exec_users (for portal access checks)
-- This is safe and doesn't cause recursion since it doesn't query the table
CREATE POLICY "authenticated_can_view_exec_users"
ON public.exec_users FOR SELECT
TO authenticated
USING (true);

-- 2. Allow CEO (craven@usa.com) full access
CREATE POLICY "ceo_full_access_exec_users"
ON public.exec_users FOR ALL
TO authenticated
USING (auth.jwt()->>'email' = 'craven@usa.com')
WITH CHECK (auth.jwt()->>'email' = 'craven@usa.com');

-- 3. Allow users to update their own record
CREATE POLICY "users_update_own_exec"
ON public.exec_users FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 6. IMPORTANT: Allow service role (edge functions) to insert/update
-- Service role should bypass RLS, but this ensures it works
-- Note: Service role bypasses RLS by default, but explicit policy helps with debugging
CREATE POLICY "service_role_full_access"
ON public.exec_users FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE public.exec_users ENABLE ROW LEVEL SECURITY;

-- Create a helper function to create executive user (can be called from edge function)
CREATE OR REPLACE FUNCTION public.create_executive_user(
  p_user_id UUID,
  p_role TEXT,
  p_title TEXT DEFAULT NULL,
  p_department TEXT DEFAULT NULL,
  p_access_level INTEGER DEFAULT 2
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exec_user_id UUID;
BEGIN
  -- Validate role
  IF p_role NOT IN ('ceo', 'cfo', 'coo', 'cto', 'board_member', 'advisor') THEN
    RAISE EXCEPTION 'Invalid role: %. Must be one of: ceo, cfo, coo, cto, board_member, advisor', p_role;
  END IF;

  -- Insert or update exec_users record
  INSERT INTO public.exec_users (
    user_id,
    role,
    access_level,
    title,
    department,
    approved_by,
    approved_at
  ) VALUES (
    p_user_id,
    p_role,
    p_access_level,
    COALESCE(p_title, 'Executive'),
    COALESCE(p_department, 'Executive'),
    NULL, -- Admin-created, auto-approved
    NOW()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    role = EXCLUDED.role,
    access_level = EXCLUDED.access_level,
    title = EXCLUDED.title,
    department = EXCLUDED.department,
    approved_by = EXCLUDED.approved_by,
    approved_at = EXCLUDED.approved_at,
    updated_at = NOW()
  RETURNING id INTO v_exec_user_id;

  RETURN v_exec_user_id;
END;
$$;

-- Grant execute permission to authenticated users (edge function uses service role)
GRANT EXECUTE ON FUNCTION public.create_executive_user TO service_role;
GRANT EXECUTE ON FUNCTION public.create_executive_user TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.create_executive_user IS 'Creates or updates an executive user record. Can be called from edge functions.';

