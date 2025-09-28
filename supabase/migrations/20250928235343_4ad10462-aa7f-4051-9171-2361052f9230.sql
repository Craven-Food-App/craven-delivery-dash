-- CRITICAL SECURITY FIX: Properly secure restaurant_employees table

-- First, drop the insecure policy that allows public access
DROP POLICY IF EXISTS "Employees can view their own record" ON public.restaurant_employees;

-- Create secure policies for restaurant_employees table

-- Policy 1: Restaurant owners can manage ALL operations on their employees
CREATE POLICY "Restaurant owners can manage all employee operations"
ON public.restaurant_employees
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.restaurants r 
    WHERE r.id = restaurant_employees.restaurant_id 
    AND r.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.restaurants r 
    WHERE r.id = restaurant_employees.restaurant_id 
    AND r.owner_id = auth.uid()
  )
);

-- Policy 2: Admin users can manage all employee records
CREATE POLICY "Admins can manage all employee operations"
ON public.restaurant_employees
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  )
);

-- Policy 3: Employees can ONLY view their own record (not others)
-- Note: This requires employees to be authenticated users with matching employee_id
CREATE POLICY "Employees can view only their own record"
ON public.restaurant_employees
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM auth.users u 
    WHERE u.id = auth.uid() 
    AND u.email = restaurant_employees.employee_id
  )
);

-- Create audit_logs table for security monitoring
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  )
);