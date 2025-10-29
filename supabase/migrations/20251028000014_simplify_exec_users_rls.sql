-- SIMPLIFY exec_users RLS to fix 500 errors
-- The complex policies with is_ceo() function are causing circular dependencies

-- Drop ALL existing policies
DROP POLICY IF EXISTS "ceo_can_view_all_exec_users" ON public.exec_users;
DROP POLICY IF EXISTS "ceo_can_manage_exec_users" ON public.exec_users;
DROP POLICY IF EXISTS "Executives can view all exec users" ON public.exec_users;
DROP POLICY IF EXISTS "Users can view their own exec record" ON public.exec_users;
DROP POLICY IF EXISTS "Executives can update their own profile" ON public.exec_users;
DROP POLICY IF EXISTS "allow_users_view_own_exec_record" ON public.exec_users;
DROP POLICY IF EXISTS "allow_executives_view_all" ON public.exec_users;
DROP POLICY IF EXISTS "allow_executives_update_own" ON public.exec_users;
DROP POLICY IF EXISTS "allow_ceo_insert_executives" ON public.exec_users;

-- SIMPLE POLICIES THAT WORK:

-- 1. Allow authenticated users to view all exec_users (read-only for most)
CREATE POLICY "authenticated_can_view_exec_users"
ON public.exec_users FOR SELECT
TO authenticated
USING (true);

-- 2. Allow CEO (Torrance) to do everything
CREATE POLICY "ceo_full_access"
ON public.exec_users FOR ALL
TO authenticated
USING (auth.jwt()->>'email' = 'craven@usa.com')
WITH CHECK (auth.jwt()->>'email' = 'craven@usa.com');

-- 3. Allow users to update their own record
CREATE POLICY "users_update_own_record"
ON public.exec_users FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE public.exec_users ENABLE ROW LEVEL SECURITY;

