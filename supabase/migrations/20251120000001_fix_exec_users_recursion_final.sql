-- Final fix for exec_users RLS infinite recursion
-- This migration runs after all others to ensure clean, non-recursive policies
-- Date: 2025-11-20 (after November 19, 2025 migration)

-- Dynamically drop ALL existing policies on exec_users to prevent conflicts and recursion
-- This ensures we catch all policies, even ones we don't know about
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'exec_users'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.exec_users', r.policyname);
  END LOOP;
END $$;

-- Also explicitly drop known policies (in case pg_policies doesn't catch them all)
DROP POLICY IF EXISTS "authenticated_can_view_exec_users" ON public.exec_users;
DROP POLICY IF EXISTS "ceo_full_access_exec_users" ON public.exec_users;
DROP POLICY IF EXISTS "users_update_own_exec" ON public.exec_users;
DROP POLICY IF EXISTS "service_role_full_access" ON public.exec_users;
DROP POLICY IF EXISTS "ceo_can_view_all_exec_users" ON public.exec_users;
DROP POLICY IF EXISTS "ceo_can_manage_exec_users" ON public.exec_users;
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

-- Create clean, non-recursive RLS policies
-- NOTE: We NEVER query exec_users within policies to prevent infinite recursion
-- Drop policies one more time right before creating to ensure they don't exist
DROP POLICY IF EXISTS "authenticated_can_view_exec_users" ON public.exec_users;
DROP POLICY IF EXISTS "ceo_full_access_exec_users" ON public.exec_users;
DROP POLICY IF EXISTS "users_update_own_exec" ON public.exec_users;
DROP POLICY IF EXISTS "service_role_full_access" ON public.exec_users;

-- 1. Allow all authenticated users to view exec_users (safe, read-only, no recursion)
CREATE POLICY "authenticated_can_view_exec_users"
ON public.exec_users FOR SELECT
TO authenticated
USING (true);

-- 2. Allow CEO (craven@usa.com) full access (simple email check, no recursion)
CREATE POLICY "ceo_full_access_exec_users"
ON public.exec_users FOR ALL
TO authenticated
USING (auth.jwt()->>'email' = 'craven@usa.com')
WITH CHECK (auth.jwt()->>'email' = 'craven@usa.com');

-- 3. Allow users to update their own record (simple user_id check, no recursion)
CREATE POLICY "users_update_own_exec"
ON public.exec_users FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 4. IMPORTANT: Allow service role (edge functions) to insert/update
-- Service role bypasses RLS by default, but explicit policy helps with debugging
CREATE POLICY "service_role_full_access"
ON public.exec_users FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE public.exec_users ENABLE ROW LEVEL SECURITY;

