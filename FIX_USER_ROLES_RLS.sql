-- ============================================================================
-- FIX USER_ROLES RLS POLICIES - RUN THIS IN SUPABASE DASHBOARD
-- ============================================================================
-- This fixes the RLS error when clicking "Sync Now"
-- ============================================================================

-- Step 0: Ensure is_admin function exists
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = user_uuid AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Step 1: Drop existing policies
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Executives can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "C-level can manage roles" ON public.user_roles;

-- Step 2: Recreate admin policy
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.is_admin(auth.uid()));

-- Step 3: Create executive policy (allows C-level to manage roles)
CREATE POLICY "Executives can manage roles"
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.exec_users eu
    WHERE eu.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.user_id = auth.uid()
    AND public.is_c_level_position(e.position)
  )
);

-- Step 4: Create SECURITY DEFINER function (bypasses RLS completely)
CREATE OR REPLACE FUNCTION public.sync_user_roles_for_employee(
  p_employee_id UUID,
  p_user_id UUID,
  p_employee_role TEXT DEFAULT 'employee',
  p_executive_role TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB := '{"success": false, "errors": []}'::jsonb;
  v_error TEXT;
BEGIN
  IF p_employee_role IS NOT NULL THEN
    BEGIN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (p_user_id, p_employee_role)
      ON CONFLICT (user_id, role) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      v_error := SQLERRM;
      v_result := jsonb_set(v_result, '{errors}', 
        COALESCE(v_result->'errors', '[]'::jsonb) || jsonb_build_array(v_error));
    END;
  END IF;

  IF p_executive_role IS NOT NULL THEN
    BEGIN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (p_user_id, p_executive_role)
      ON CONFLICT (user_id, role) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      v_error := SQLERRM;
      v_result := jsonb_set(v_result, '{errors}', 
        COALESCE(v_result->'errors', '[]'::jsonb) || jsonb_build_array(v_error));
    END;
  END IF;

  IF jsonb_array_length(COALESCE(v_result->'errors', '[]'::jsonb)) = 0 THEN
    v_result := jsonb_set(v_result, '{success}', 'true'::jsonb);
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Grant execute permission
GRANT EXECUTE ON FUNCTION public.sync_user_roles_for_employee TO authenticated;

-- Step 6: Update exec_users constraint to allow 'executive' role
ALTER TABLE public.exec_users DROP CONSTRAINT IF EXISTS exec_users_role_check;
ALTER TABLE public.exec_users ADD CONSTRAINT exec_users_role_check 
CHECK (role IN ('ceo', 'cfo', 'coo', 'cto', 'cxo', 'cmo', 'cro', 'cpo', 'cdo', 'chro', 'clo', 'cso', 'board_member', 'advisor', 'executive'));

-- Step 7: Update position_to_exec_role function to map CXO to executive
CREATE OR REPLACE FUNCTION public.position_to_exec_role(position_text TEXT)
RETURNS TEXT AS $$
DECLARE
  pos_lower TEXT;
BEGIN
  IF position_text IS NULL OR position_text = '' THEN
    RETURN NULL;
  END IF;
  
  pos_lower := LOWER(position_text);
  
  CASE
    WHEN pos_lower LIKE '%ceo%' OR pos_lower LIKE '%chief executive%' THEN 
      RETURN 'ceo';
    WHEN pos_lower LIKE '%cfo%' OR pos_lower LIKE '%chief financial%' THEN 
      RETURN 'cfo';
    WHEN pos_lower LIKE '%coo%' OR pos_lower LIKE '%chief operating%' THEN 
      RETURN 'coo';
    WHEN pos_lower LIKE '%cto%' OR pos_lower LIKE '%chief technology%' THEN 
      RETURN 'cto';
    WHEN pos_lower LIKE '%cxo%' THEN 
      RETURN 'executive';
    WHEN pos_lower LIKE '%cmo%' OR pos_lower LIKE '%chief marketing%' THEN 
      RETURN 'board_member';
    WHEN pos_lower LIKE '%cro%' OR pos_lower LIKE '%chief revenue%' THEN 
      RETURN 'board_member';
    WHEN pos_lower LIKE '%cpo%' OR pos_lower LIKE '%chief product%' THEN 
      RETURN 'board_member';
    WHEN pos_lower LIKE '%cdo%' OR pos_lower LIKE '%chief data%' THEN 
      RETURN 'board_member';
    WHEN pos_lower LIKE '%chro%' OR pos_lower LIKE '%chief human%' THEN 
      RETURN 'board_member';
    WHEN pos_lower LIKE '%clo%' OR pos_lower LIKE '%chief legal%' THEN 
      RETURN 'board_member';
    WHEN pos_lower LIKE '%cso%' OR pos_lower LIKE '%chief security%' THEN 
      RETURN 'board_member';
    WHEN pos_lower LIKE '%president%' THEN 
      RETURN 'board_member';
    WHEN pos_lower LIKE '%board member%' OR pos_lower LIKE '%advisor%' THEN 
      RETURN 'board_member';
    ELSE 
      RETURN NULL;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 8: Update existing CXO records to executive role
UPDATE public.exec_users eu
SET role = 'executive'
FROM public.employees e
WHERE eu.user_id = e.user_id
  AND LOWER(e.position) LIKE '%cxo%'
  AND eu.role = 'board_member';

-- Also update any exec_users with CXO in title
UPDATE public.exec_users
SET role = 'executive'
WHERE LOWER(title) LIKE '%cxo%'
  AND role = 'board_member';

-- Verify
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies and function created successfully!';
  RAISE NOTICE '   - is_admin function created';
  RAISE NOTICE '   - Executives can now manage user_roles';
  RAISE NOTICE '   - SECURITY DEFINER function bypasses RLS';
  RAISE NOTICE '   - exec_users now allows executive role';
  RAISE NOTICE '   - CXO now maps to executive role (not board_member)';
  RAISE NOTICE '   - Existing CXO records updated to executive role';
  RAISE NOTICE '   - "Sync Now" button should now work!';
END $$;

