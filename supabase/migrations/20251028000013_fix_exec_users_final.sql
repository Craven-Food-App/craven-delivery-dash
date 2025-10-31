-- FINAL comprehensive fix for exec_users access
-- This makes the table readable for CEO and board members

-- First, make user_id nullable
ALTER TABLE public.exec_users 
ALTER COLUMN user_id DROP NOT NULL;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Executives can view all exec users" ON public.exec_users;
DROP POLICY IF EXISTS "Users can view their own exec record" ON public.exec_users;
DROP POLICY IF EXISTS "Executives can update their own profile" ON public.exec_users;
DROP POLICY IF EXISTS "allow_users_view_own_exec_record" ON public.exec_users;
DROP POLICY IF EXISTS "allow_executives_view_all" ON public.exec_users;
DROP POLICY IF EXISTS "allow_executives_update_own" ON public.exec_users;
DROP POLICY IF EXISTS "allow_ceo_insert_executives" ON public.exec_users;

-- SIMPLE POLICY: CEO can view all
CREATE POLICY "ceo_can_view_all_exec_users"
ON public.exec_users FOR SELECT
TO authenticated
USING (
  auth.jwt()->>'email' = 'craven@usa.com'
  OR user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid())
);

-- CEO can manage all
CREATE POLICY "ceo_can_manage_exec_users"
ON public.exec_users FOR ALL
TO authenticated
USING (auth.jwt()->>'email' = 'craven@usa.com');

-- Note: No sample placeholder executives are inserted here
-- Only real executives with actual auth.users accounts should be added
-- Real executives must be created via Supabase Auth UI
