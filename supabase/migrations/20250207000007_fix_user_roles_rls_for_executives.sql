-- ============================================================================
-- FIX USER_ROLES RLS POLICIES FOR EXECUTIVE ROLE SYNC
-- ============================================================================
-- This allows executives/CEO to manage user_roles for role synchronization
-- ============================================================================

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Executives can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "C-level can manage roles" ON public.user_roles;

-- Policy 1: Admins can manage all roles (keep existing functionality)
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.is_admin(auth.uid()));

-- Policy 2: Executives can manage roles (for role sync)
-- This allows C-level employees to manage roles for themselves and others
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

-- Policy 3: Users can view their own roles (keep existing)
-- (Already exists, but ensure it's there)
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

-- Policy 4: Admins can view all roles (keep existing)
-- (Already exists, but ensure it's there)
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Verify the policies
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies updated for user_roles';
  RAISE NOTICE '   - Admins can manage all roles';
  RAISE NOTICE '   - Executives/C-level can manage roles';
  RAISE NOTICE '   - Users can view their own roles';
END $$;

