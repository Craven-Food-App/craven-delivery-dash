-- ============================================================================
-- APPLY MISSING MIGRATIONS
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================================
-- This file combines the migrations needed to fix TypeScript type errors:
-- 1. Marketing Portal Access System
-- 2. Employee Portal PIN System
-- ============================================================================

-- ============================================================================
-- PART 1: Marketing Portal Access System
-- ============================================================================

-- Marketing portal access table
CREATE TABLE IF NOT EXISTS public.marketing_portal_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id),
  access_level TEXT DEFAULT 'standard' CHECK (access_level IN ('standard', 'manager', 'director', 'executive')),
  is_active BOOLEAN DEFAULT true,
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.marketing_portal_access ENABLE ROW LEVEL SECURITY;

-- Function to ensure CEO always has access
CREATE OR REPLACE FUNCTION public.ensure_ceo_marketing_access()
RETURNS VOID AS $$
DECLARE
  ceo_user_id UUID;
  ceo_email TEXT;
BEGIN
  -- Get CEO user ID by email pattern
  SELECT id, email INTO ceo_user_id, ceo_email
  FROM auth.users
  WHERE email = 'craven@usa.com' 
     OR email ILIKE '%torrance%stroman%'
  LIMIT 1;
  
  -- If not found, check via exec_users
  IF ceo_user_id IS NULL THEN
    SELECT eu.user_id, u.email INTO ceo_user_id, ceo_email
    FROM public.exec_users eu
    JOIN auth.users u ON u.id = eu.user_id
    WHERE eu.role = 'ceo' AND eu.access_level = 1
    LIMIT 1;
  END IF;
  
  -- Grant marketing access if CEO exists
  IF ceo_user_id IS NOT NULL THEN
    INSERT INTO public.marketing_portal_access (
      user_id,
      access_level,
      granted_by,
      notes
    )
    VALUES (
      ceo_user_id,
      'executive',
      ceo_user_id,
      'CEO - Automatic Full Access'
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      access_level = 'executive',
      is_active = TRUE,
      revoked_at = NULL,
      revoked_by = NULL,
      updated_at = NOW(),
      notes = 'CEO - Automatic Full Access (Always Active)';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
CREATE POLICY "Marketing employees can view their own access"
  ON public.marketing_portal_access FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "CEO has full marketing portal access"
  ON public.marketing_portal_access FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND (u.email = 'craven@usa.com' OR u.email ILIKE '%torrance%stroman%')
    )
    OR EXISTS (
      SELECT 1 FROM public.exec_users eu
      WHERE eu.user_id = auth.uid()
      AND eu.role = 'ceo' AND eu.access_level = 1
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND (u.email = 'craven@usa.com' OR u.email ILIKE '%torrance%stroman%')
    )
    OR EXISTS (
      SELECT 1 FROM public.exec_users eu
      WHERE eu.user_id = auth.uid()
      AND eu.role = 'ceo' AND eu.access_level = 1
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_marketing_portal_access_user_id ON public.marketing_portal_access(user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_portal_access_employee_id ON public.marketing_portal_access(employee_id);
CREATE INDEX IF NOT EXISTS idx_marketing_portal_access_active ON public.marketing_portal_access(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- PART 2: Employee Portal PIN System (if columns don't exist)
-- ============================================================================

-- Add portal_pin column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'portal_pin'
  ) THEN
    ALTER TABLE public.employees 
    ADD COLUMN portal_pin TEXT;
  END IF;
END $$;

-- Add portal_access_granted column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'portal_access_granted'
  ) THEN
    ALTER TABLE public.employees 
    ADD COLUMN portal_access_granted BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add portal_pin_issued_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'portal_pin_issued_at'
  ) THEN
    ALTER TABLE public.employees 
    ADD COLUMN portal_pin_issued_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Function to verify employee PIN (if it doesn't exist)
CREATE OR REPLACE FUNCTION public.verify_employee_portal_pin(p_email TEXT, p_pin TEXT)
RETURNS TABLE(
  employee_id UUID,
  employee_number TEXT,
  full_name TEXT,
  email TEXT,
  "position" TEXT,
  department_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.employee_number,
    e.first_name || ' ' || e.last_name as full_name,
    e.email,
    e.position,
    e.department_id
  FROM public.employees e
  WHERE e.email = p_email 
    AND e.portal_pin = p_pin
    AND e.portal_access_granted = true
    AND e.employment_status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify CEO master PIN (if it doesn't exist)
CREATE OR REPLACE FUNCTION public.verify_ceo_master_pin(p_pin TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Master PIN for Torrance Stroman: 999999
  RETURN p_pin = '999999';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if email belongs to CEO (if it doesn't exist)
CREATE OR REPLACE FUNCTION public.is_ceo_email(p_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN auth.users au ON up.user_id = au.id
    WHERE au.email = p_email
      AND (up.full_name ILIKE '%Torrance%Stroman%' OR up.full_name ILIKE '%Stroman%Torrance%')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Migrations applied successfully! Now regenerate types with: npx supabase gen types typescript --project-id xaxbucnjlrfkccsfiddq --schema public > src/integrations/supabase/types.ts';
END $$;

