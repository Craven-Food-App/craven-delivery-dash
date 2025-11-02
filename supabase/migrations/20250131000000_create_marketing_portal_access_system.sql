-- Marketing Portal Access System
-- Automatically grants marketing portal access based on position/department
-- CEO always has full executive access

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

-- Function to check if user is CEO
CREATE OR REPLACE FUNCTION is_ceo_user(user_email TEXT DEFAULT NULL, user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check by email (primary method)
  IF user_email IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.ceo_access_credentials 
    WHERE user_email = is_ceo_user.user_email
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check by user_id in exec_users
  IF user_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.exec_users
    WHERE exec_users.user_id = is_ceo_user.user_id
    AND role = 'ceo'
    AND access_level = 1
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check by current auth user
  IF EXISTS (
    SELECT 1 FROM public.ceo_access_credentials 
    WHERE user_email = (auth.jwt() ->> 'email')
  ) THEN
    RETURN TRUE;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM public.exec_users
    WHERE exec_users.user_id = auth.uid()
    AND role = 'ceo'
    AND access_level = 1
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check known CEO email patterns
  IF user_email IS NOT NULL AND (
    user_email = 'craven@usa.com' OR 
    user_email ILIKE '%torrance%stroman%'
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if position/department is marketing-related
CREATE OR REPLACE FUNCTION is_marketing_position(
  position_text TEXT,
  department_name TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check by position keywords
  IF position_text ~* '(marketing|brand|cmo|content|social|digital|growth|seo|ppc|email marketing)' THEN
    RETURN TRUE;
  END IF;
  
  -- Check by department
  IF department_name ~* 'marketing' THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to determine access level from position
CREATE OR REPLACE FUNCTION get_marketing_access_level(position_text TEXT)
RETURNS TEXT AS $$
BEGIN
  IF position_text ~* '(chief|cmо|director|vp.*marketing|vice president.*marketing)' THEN
    RETURN 'executive';
  ELSIF position_text ~* '(director|senior.*manager|head.*marketing)' THEN
    RETURN 'director';
  ELSIF position_text ~* 'manager' THEN
    RETURN 'manager';
  ELSE
    RETURN 'standard';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger function to auto-grant marketing portal access
CREATE OR REPLACE FUNCTION auto_grant_marketing_access()
RETURNS TRIGGER AS $$
DECLARE
  dept_name TEXT;
  is_marketing BOOLEAN;
  access_lvl TEXT;
  user_email TEXT;
  is_ceo BOOLEAN;
BEGIN
  -- Get user email for CEO check
  IF NEW.user_id IS NOT NULL THEN
    SELECT email INTO user_email FROM auth.users WHERE id = NEW.user_id;
  END IF;
  
  -- Check if this is the CEO
  is_ceo := is_ceo_user(user_email, NEW.user_id);
  
  -- If CEO, always grant executive access
  IF is_ceo AND NEW.user_id IS NOT NULL AND NEW.employment_status = 'active' THEN
    INSERT INTO public.marketing_portal_access (
      user_id,
      employee_id,
      access_level,
      granted_by,
      notes
    )
    VALUES (
      NEW.user_id,
      NEW.id,
      'executive',
      NEW.hired_by,
      'Auto-granted: CEO - Full Access'
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      employee_id = EXCLUDED.employee_id,
      access_level = 'executive',
      is_active = TRUE,
      revoked_at = NULL,
      revoked_by = NULL,
      updated_at = NOW(),
      notes = 'CEO - Full Access (Auto-maintained)';
    RETURN NEW;
  END IF;
  
  -- Get department name if department_id exists
  IF NEW.department_id IS NOT NULL THEN
    SELECT name INTO dept_name
    FROM public.departments
    WHERE id = NEW.department_id;
  END IF;
  
  -- Check if this is a marketing position
  is_marketing := is_marketing_position(NEW.position, dept_name);
  
  -- Only proceed if marketing-related AND user_id exists AND employment_status is active
  IF is_marketing AND NEW.user_id IS NOT NULL AND NEW.employment_status = 'active' THEN
    -- Determine access level
    access_lvl := get_marketing_access_level(NEW.position);
    
    -- Grant marketing portal access
    INSERT INTO public.marketing_portal_access (
      user_id,
      employee_id,
      access_level,
      granted_by,
      notes
    )
    VALUES (
      NEW.user_id,
      NEW.id,
      access_lvl,
      NEW.hired_by,
      'Auto-granted via hiring system - Marketing position: ' || NEW.position
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      employee_id = EXCLUDED.employee_id,
      access_level = EXCLUDED.access_level,
      is_active = TRUE,
      revoked_at = NULL,
      revoked_by = NULL,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on employee insert
CREATE TRIGGER trigger_auto_grant_marketing_access_insert
  AFTER INSERT ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION auto_grant_marketing_access();

-- Trigger on employee update (for promotions/transfers)
CREATE TRIGGER trigger_auto_grant_marketing_access_update
  AFTER UPDATE OF position, department_id, employment_status, user_id ON public.employees
  FOR EACH ROW
  WHEN (
    (OLD.position IS DISTINCT FROM NEW.position) OR
    (OLD.department_id IS DISTINCT FROM NEW.department_id) OR
    (OLD.employment_status IS DISTINCT FROM NEW.employment_status) OR
    (OLD.user_id IS DISTINCT FROM NEW.user_id)
  )
  EXECUTE FUNCTION auto_grant_marketing_access();

-- Function to ensure CEO always has access (call this on login/portal access)
CREATE OR REPLACE FUNCTION ensure_ceo_marketing_access()
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

-- Trigger to revoke access when employee is terminated or transferred out
CREATE OR REPLACE FUNCTION auto_revoke_marketing_access()
RETURNS TRIGGER AS $$
DECLARE
  dept_name TEXT;
  is_marketing BOOLEAN;
  user_email TEXT;
  is_ceo BOOLEAN;
BEGIN
  -- Get user email
  IF NEW.user_id IS NOT NULL THEN
    SELECT email INTO user_email FROM auth.users WHERE id = NEW.user_id;
  END IF;
  
  -- Check if this is the CEO - NEVER revoke CEO access
  is_ceo := is_ceo_user(user_email, NEW.user_id);
  IF is_ceo THEN
    -- Ensure CEO access remains active
    UPDATE public.marketing_portal_access
    SET is_active = TRUE,
        revoked_at = NULL,
        revoked_by = NULL,
        access_level = 'executive',
        updated_at = NOW(),
        notes = 'CEO - Automatic Full Access (Always Active)'
    WHERE user_id = NEW.user_id;
    RETURN NEW;
  END IF;
  
  -- If terminated, suspended, or transferred to non-marketing
  IF NEW.employment_status IN ('terminated', 'suspended') THEN
    UPDATE public.marketing_portal_access
    SET is_active = FALSE,
        revoked_at = NOW(),
        revoked_by = NEW.terminated_by,
        updated_at = NOW()
    WHERE user_id = NEW.user_id AND is_active = TRUE;
    RETURN NEW;
  END IF;
  
  -- If transferred out of marketing
  IF NEW.department_id IS NOT NULL THEN
    SELECT name INTO dept_name
    FROM public.departments
    WHERE id = NEW.department_id;
  END IF;
  
  is_marketing := is_marketing_position(NEW.position, dept_name);
  
  IF NOT is_marketing AND NEW.user_id IS NOT NULL THEN
    UPDATE public.marketing_portal_access
    SET is_active = FALSE,
        revoked_at = NOW(),
        revoked_by = COALESCE(auth.uid(), NEW.terminated_by),
        updated_at = NOW(),
        notes = COALESCE(notes || E'\n', '') || 'Revoked: Transferred to non-marketing position'
    WHERE user_id = NEW.user_id AND is_active = TRUE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Revocation trigger
CREATE TRIGGER trigger_auto_revoke_marketing_access
  AFTER UPDATE OF employment_status, position, department_id ON public.employees
  FOR EACH ROW
  WHEN (
    (OLD.employment_status IS DISTINCT FROM NEW.employment_status AND NEW.employment_status IN ('terminated', 'suspended')) OR
    (OLD.position IS DISTINCT FROM NEW.position) OR
    (OLD.department_id IS DISTINCT FROM NEW.department_id)
  )
  EXECUTE FUNCTION auto_revoke_marketing_access();

-- RLS Policies
CREATE POLICY "Marketing employees can view their own access"
  ON public.marketing_portal_access FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "CEO has full marketing portal access"
  ON public.marketing_portal_access FOR ALL
  USING (
    is_ceo_user(auth.jwt() ->> 'email', auth.uid())
  )
  WITH CHECK (
    is_ceo_user(auth.jwt() ->> 'email', auth.uid())
  );

CREATE POLICY "Admins and marketing managers can view all access"
  ON public.marketing_portal_access FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.departments d ON d.id = e.department_id
      WHERE e.user_id = auth.uid()
      AND (
        d.name ~* 'marketing' AND e.position ~* '(manager|director|chief|cmo)'
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX idx_marketing_portal_access_user_id ON public.marketing_portal_access(user_id);
CREATE INDEX idx_marketing_portal_access_employee_id ON public.marketing_portal_access(employee_id);
CREATE INDEX idx_marketing_portal_access_active ON public.marketing_portal_access(is_active) WHERE is_active = TRUE;

-- Ensure Marketing department exists
INSERT INTO public.departments (name, description, budget)
VALUES ('Marketing', 'Marketing and Communications Department', 250000)
ON CONFLICT (name) DO NOTHING;

-- Ensure CEO has marketing portal access from the start
DO $$
DECLARE
  ceo_user_id UUID;
  ceo_email TEXT := 'craven@usa.com';
BEGIN
  -- Get CEO user ID
  SELECT id INTO ceo_user_id
  FROM auth.users
  WHERE email = ceo_email
  OR email ILIKE '%torrance%stroman%'
  LIMIT 1;
  
  -- If not found by email, check via exec_users
  IF ceo_user_id IS NULL THEN
    SELECT eu.user_id INTO ceo_user_id
    FROM public.exec_users eu
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
      'CEO - Automatic Full Access (Initial Setup)'
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
END $$;

