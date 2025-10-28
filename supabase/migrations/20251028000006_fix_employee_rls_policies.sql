-- Fix RLS policies for employee management - remove profiles table reference

-- Drop old policies
DROP POLICY IF EXISTS "CEO can manage all departments" ON public.departments;
DROP POLICY IF EXISTS "CEO can manage all employees" ON public.employees;
DROP POLICY IF EXISTS "CEO can view all employee history" ON public.employee_history;
DROP POLICY IF EXISTS "CEO can manage payroll" ON public.payroll;
DROP POLICY IF EXISTS "CEO can manage reviews" ON public.performance_reviews;

-- Recreate policies without profiles table reference
CREATE POLICY "CEO can manage all departments"
ON public.departments FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.ceo_access_credentials WHERE user_email = auth.jwt()->>'email')
);

CREATE POLICY "CEO can manage all employees"
ON public.employees FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.ceo_access_credentials WHERE user_email = auth.jwt()->>'email')
  OR user_id = auth.uid()
);

CREATE POLICY "CEO can view all employee history"
ON public.employee_history FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.ceo_access_credentials WHERE user_email = auth.jwt()->>'email')
);

CREATE POLICY "CEO can insert employee history"
ON public.employee_history FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.ceo_access_credentials WHERE user_email = auth.jwt()->>'email')
);

CREATE POLICY "CEO can manage payroll"
ON public.payroll FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.ceo_access_credentials WHERE user_email = auth.jwt()->>'email')
);

CREATE POLICY "CEO can manage reviews"
ON public.performance_reviews FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.ceo_access_credentials WHERE user_email = auth.jwt()->>'email')
);

