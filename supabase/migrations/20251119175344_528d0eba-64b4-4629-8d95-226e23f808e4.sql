-- Fix infinite recursion in exec_users RLS policies
-- The problem: Multiple overlapping policies with circular dependencies

-- Drop ALL existing exec_users policies
DROP POLICY IF EXISTS "authenticated_can_view_exec_users" ON public.exec_users;
DROP POLICY IF EXISTS "ceo_can_manage_exec_users" ON public.exec_users;
DROP POLICY IF EXISTS "ceo_can_view_all_exec_users" ON public.exec_users;
DROP POLICY IF EXISTS "ceo_full_access" ON public.exec_users;
DROP POLICY IF EXISTS "exec can see their record" ON public.exec_users;
DROP POLICY IF EXISTS "users_update_own_record" ON public.exec_users;

-- Create a security definer function to check if user is an executive
-- This breaks the circular dependency by using SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_user_in_exec_users(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.exec_users 
    WHERE user_id = check_user_id
  );
$$;

-- Now create clean, non-recursive policies

-- 1. Allow all authenticated users to view exec_users (safe, read-only)
CREATE POLICY "allow_authenticated_view_exec_users"
ON public.exec_users FOR SELECT
TO authenticated
USING (true);

-- 2. CEO has full access (simple email check, no recursion)
CREATE POLICY "ceo_has_full_access"
ON public.exec_users FOR ALL
TO authenticated
USING (auth.jwt()->>'email' = 'craven@usa.com')
WITH CHECK (auth.jwt()->>'email' = 'craven@usa.com');

-- 3. Execs can update their own record (simple user_id check)
CREATE POLICY "execs_update_own_record"
ON public.exec_users FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE public.exec_users ENABLE ROW LEVEL SECURITY;

-- Grant execute on the helper function
GRANT EXECUTE ON FUNCTION public.is_user_in_exec_users(uuid) TO authenticated;