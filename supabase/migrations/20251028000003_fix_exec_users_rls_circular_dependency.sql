-- Fix circular dependency in exec_users RLS policies
-- The original policy prevented users from reading their own record because
-- is_executive() needed to read exec_users to determine if they're an executive

-- Drop the broken policy
DROP POLICY IF EXISTS "Executives can view all exec users" ON public.exec_users;

-- Create a new policy that allows users to view their own record first
CREATE POLICY "Users can view their own exec record"
ON public.exec_users FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Then allow executives to view all other exec users
CREATE POLICY "Executives can view all exec users"
ON public.exec_users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.exec_users
    WHERE user_id = auth.uid()
  )
);

-- This two-policy approach solves the circular dependency:
-- 1. First policy: Any authenticated user can read their OWN exec_users record
-- 2. Second policy: If they ARE an executive (EXISTS check), they can read ALL exec records

