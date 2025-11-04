-- Comprehensive Audit Trail System for Admin and C-Level Activities
-- This migration creates a unified audit trail that automatically tracks
-- all administrative and executive activities across the system

-- =====================================================
-- 1. UNIFIED AUDIT TRAIL TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.unified_audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User Information
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  user_role TEXT, -- 'admin', 'executive', 'ceo', 'cfo', 'coo', 'cto', 'board_member'
  user_email TEXT,
  user_name TEXT,
  
  -- Action Details
  action_type TEXT NOT NULL, -- 'create', 'update', 'delete', 'approve', 'reject', 'view', 'export', 'import', 'sign', 'access'
  action_category TEXT NOT NULL, -- 'personnel', 'financial', 'document', 'system', 'security', 'compliance', 'portal', 'communication'
  action_description TEXT NOT NULL,
  
  -- Target Resource
  target_resource_type TEXT, -- 'employee', 'application', 'order', 'refund', 'document', 'user', 'department', 'permission', etc.
  target_resource_id UUID,
  target_resource_name TEXT,
  
  -- Context
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,
  
  -- Change Tracking
  old_values JSONB DEFAULT '{}'::jsonb,
  new_values JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Severity and Compliance
  severity TEXT DEFAULT 'normal' CHECK (severity IN ('low', 'normal', 'high', 'critical')),
  requires_review BOOLEAN DEFAULT false,
  compliance_tag TEXT, -- 'gdpr', 'sox', 'hipaa', 'pci', etc.
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- 2. INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_unified_audit_user_id ON public.unified_audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_unified_audit_user_role ON public.unified_audit_trail(user_role);
CREATE INDEX IF NOT EXISTS idx_unified_audit_action_type ON public.unified_audit_trail(action_type);
CREATE INDEX IF NOT EXISTS idx_unified_audit_action_category ON public.unified_audit_trail(action_category);
CREATE INDEX IF NOT EXISTS idx_unified_audit_target_resource ON public.unified_audit_trail(target_resource_type, target_resource_id);
CREATE INDEX IF NOT EXISTS idx_unified_audit_created_at ON public.unified_audit_trail(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_unified_audit_severity ON public.unified_audit_trail(severity);
CREATE INDEX IF NOT EXISTS idx_unified_audit_compliance ON public.unified_audit_trail(compliance_tag);
CREATE INDEX IF NOT EXISTS idx_unified_audit_requires_review ON public.unified_audit_trail(requires_review) WHERE requires_review = true;

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_unified_audit_user_date ON public.unified_audit_trail(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_unified_audit_category_date ON public.unified_audit_trail(action_category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_unified_audit_role_date ON public.unified_audit_trail(user_role, created_at DESC);

-- =====================================================
-- 3. HELPER FUNCTIONS
-- =====================================================

-- Drop existing functions if they exist (will be replaced)
-- Function to get user role and details
CREATE OR REPLACE FUNCTION public.get_user_audit_info(p_user_id UUID)
RETURNS TABLE (
  user_role TEXT,
  user_email TEXT,
  user_name TEXT,
  is_admin BOOLEAN,
  is_executive BOOLEAN,
  is_c_level BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(
      (SELECT role FROM public.exec_users WHERE user_id = p_user_id LIMIT 1),
      (SELECT role FROM public.user_roles WHERE user_id = p_user_id AND role IN ('admin', 'executive') LIMIT 1),
      'user'
    )::TEXT as user_role,
    (SELECT email FROM auth.users WHERE id = p_user_id)::TEXT as user_email,
    COALESCE(
      (SELECT full_name FROM public.user_profiles WHERE user_id = p_user_id),
      (SELECT first_name || ' ' || last_name FROM public.employees WHERE user_id = p_user_id),
      (SELECT email FROM auth.users WHERE id = p_user_id)
    )::TEXT as user_name,
    EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = p_user_id AND role = 'admin') as is_admin,
    EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = p_user_id AND role = 'executive') as is_executive,
    EXISTS(SELECT 1 FROM public.employees e WHERE e.user_id = p_user_id AND public.is_c_level_position(e.position)) as is_c_level;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Main function to log audit trail entries (CREATE OR REPLACE handles existing functions)
CREATE OR REPLACE FUNCTION public.log_audit_trail(
  p_action_type TEXT,
  p_action_category TEXT,
  p_action_description TEXT,
  p_target_resource_type TEXT DEFAULT NULL,
  p_target_resource_id UUID DEFAULT NULL,
  p_target_resource_name TEXT DEFAULT NULL,
  p_old_values JSONB DEFAULT '{}'::jsonb,
  p_new_values JSONB DEFAULT '{}'::jsonb,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_severity TEXT DEFAULT 'normal',
  p_requires_review BOOLEAN DEFAULT false,
  p_compliance_tag TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_user_email TEXT;
  v_user_name TEXT;
  v_log_id UUID;
BEGIN
  -- Get current user if not provided
  v_user_id := COALESCE(p_user_id, auth.uid());
  
  -- If no user, skip logging (system actions)
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get user info
  SELECT user_role, user_email, user_name INTO v_user_role, v_user_email, v_user_name
  FROM public.get_user_audit_info(v_user_id);
  
  -- Only log admin and C-level activities
  IF v_user_role NOT IN ('admin', 'executive', 'ceo', 'cfo', 'coo', 'cto', 'board_member', 'advisor') 
     AND NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = v_user_id AND role = 'admin')
     AND NOT EXISTS(SELECT 1 FROM public.employees e WHERE e.user_id = v_user_id AND public.is_c_level_position(e.position)) THEN
    RETURN NULL;
  END IF;
  
  -- Insert audit log
  INSERT INTO public.unified_audit_trail (
    user_id,
    user_role,
    user_email,
    user_name,
    action_type,
    action_category,
    action_description,
    target_resource_type,
    target_resource_id,
    target_resource_name,
    old_values,
    new_values,
    metadata,
    severity,
    requires_review,
    compliance_tag,
    ip_address,
    user_agent
  ) VALUES (
    v_user_id,
    v_user_role,
    v_user_email,
    v_user_name,
    p_action_type,
    p_action_category,
    p_action_description,
    p_target_resource_type,
    p_target_resource_id,
    p_target_resource_name,
    p_old_values,
    p_new_values,
    p_metadata,
    p_severity,
    p_requires_review,
    p_compliance_tag,
    COALESCE(p_ip_address, (SELECT current_setting('request.headers', true)::jsonb->>'x-forwarded-for')),
    COALESCE(p_user_agent, (SELECT current_setting('request.headers', true)::jsonb->>'user-agent'))
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. TRIGGER FUNCTIONS FOR AUTO-LOGGING
-- =====================================================

-- Trigger function for employee operations
CREATE OR REPLACE FUNCTION public.audit_employee_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_action_type TEXT;
  v_action_description TEXT;
  v_old_values JSONB;
  v_new_values JSONB;
  v_target_name TEXT;
BEGIN
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    v_action_type := 'create';
    v_action_description := 'New employee hired: ' || COALESCE(NEW.first_name || ' ' || NEW.last_name, NEW.position);
    v_new_values := to_jsonb(NEW);
    v_old_values := '{}'::jsonb;
    v_target_name := COALESCE(NEW.first_name || ' ' || NEW.last_name, NEW.position);
  ELSIF TG_OP = 'UPDATE' THEN
    v_action_type := 'update';
    v_action_description := 'Employee updated: ' || COALESCE(NEW.first_name || ' ' || NEW.last_name, NEW.position);
    v_old_values := to_jsonb(OLD);
    v_new_values := to_jsonb(NEW);
    v_target_name := COALESCE(NEW.first_name || ' ' || NEW.last_name, NEW.position);
    
    -- Detect specific changes
    IF OLD.position IS DISTINCT FROM NEW.position THEN
      v_action_description := v_action_description || ' | Position changed: ' || COALESCE(OLD.position, 'N/A') || ' → ' || COALESCE(NEW.position, 'N/A');
    END IF;
    IF OLD.salary IS DISTINCT FROM NEW.salary THEN
      v_action_description := v_action_description || ' | Salary changed: $' || COALESCE(OLD.salary::TEXT, 'N/A') || ' → $' || COALESCE(NEW.salary::TEXT, 'N/A');
    END IF;
    IF OLD.employment_status IS DISTINCT FROM NEW.employment_status THEN
      v_action_description := v_action_description || ' | Status: ' || COALESCE(OLD.employment_status, 'N/A') || ' → ' || COALESCE(NEW.employment_status, 'N/A');
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    v_action_type := 'delete';
    v_action_description := 'Employee terminated/removed: ' || COALESCE(OLD.first_name || ' ' || OLD.last_name, OLD.position);
    v_old_values := to_jsonb(OLD);
    v_new_values := '{}'::jsonb;
    v_target_name := COALESCE(OLD.first_name || ' ' || OLD.last_name, OLD.position);
  END IF;
  
  -- Log the audit trail
  PERFORM public.log_audit_trail(
    v_action_type,
    'personnel',
    v_action_description,
    'employee',
    COALESCE(NEW.id, OLD.id),
    v_target_name,
    v_old_values,
    v_new_values,
    jsonb_build_object(
      'employee_number', COALESCE(NEW.employee_number, OLD.employee_number),
      'department_id', COALESCE(NEW.department_id, OLD.department_id)
    ),
    CASE 
      WHEN TG_OP = 'DELETE' THEN 'high'
      WHEN OLD.position IS DISTINCT FROM NEW.position THEN 'high'
      WHEN OLD.salary IS DISTINCT FROM NEW.salary THEN 'normal'
      ELSE 'normal'
    END,
    CASE WHEN TG_OP = 'DELETE' THEN true ELSE false END,
    'gdpr'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for exec_users operations
CREATE OR REPLACE FUNCTION public.audit_exec_user_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_action_type TEXT;
  v_action_description TEXT;
  v_target_name TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action_type := 'create';
    v_action_description := 'Executive user created: ' || COALESCE(NEW.role, 'executive');
    v_target_name := COALESCE(NEW.title, NEW.role);
  ELSIF TG_OP = 'UPDATE' THEN
    v_action_type := 'update';
    v_action_description := 'Executive user updated: ' || COALESCE(NEW.role, 'executive');
    v_target_name := COALESCE(NEW.title, NEW.role);
    
    IF OLD.role IS DISTINCT FROM NEW.role THEN
      v_action_description := v_action_description || ' | Role changed: ' || OLD.role || ' → ' || NEW.role;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    v_action_type := 'delete';
    v_action_description := 'Executive user removed: ' || COALESCE(OLD.role, 'executive');
    v_target_name := COALESCE(OLD.title, OLD.role);
  END IF;
  
  PERFORM public.log_audit_trail(
    v_action_type,
    'system',
    v_action_description,
    'exec_user',
    COALESCE(NEW.id, OLD.id),
    v_target_name,
    to_jsonb(OLD),
    to_jsonb(NEW),
    '{}'::jsonb,
    'high',
    true,
    'sox'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for financial approvals
CREATE OR REPLACE FUNCTION public.audit_financial_approvals()
RETURNS TRIGGER AS $$
DECLARE
  v_action_description TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    v_action_description := 'Financial approval ' || NEW.status || ': ' || COALESCE(NEW.title, NEW.id::TEXT) || 
                            ' | Amount: $' || (NEW.amount_cents / 100.0)::TEXT;
    
    PERFORM public.log_audit_trail(
      NEW.status,
      'financial',
      v_action_description,
      'financial_approval',
      NEW.id,
      NEW.title,
      jsonb_build_object('old_status', OLD.status, 'amount_cents', OLD.amount_cents),
      jsonb_build_object('new_status', NEW.status, 'amount_cents', NEW.amount_cents),
      jsonb_build_object('request_type', NEW.request_type, 'priority', NEW.priority),
      CASE WHEN NEW.amount_cents > 1000000 THEN 'high' ELSE 'normal' END,
      CASE WHEN NEW.amount_cents > 100000 THEN true ELSE false END,
      'sox'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. CREATE TRIGGERS
-- =====================================================

-- Employee management triggers
DROP TRIGGER IF EXISTS trigger_audit_employee_changes ON public.employees;
CREATE TRIGGER trigger_audit_employee_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_employee_changes();

-- Executive users triggers
DROP TRIGGER IF EXISTS trigger_audit_exec_user_changes ON public.exec_users;
CREATE TRIGGER trigger_audit_exec_user_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.exec_users
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_exec_user_changes();

-- Financial approvals triggers
DROP TRIGGER IF EXISTS trigger_audit_financial_approvals ON public.ceo_financial_approvals;
CREATE TRIGGER trigger_audit_financial_approvals
  AFTER UPDATE ON public.ceo_financial_approvals
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.audit_financial_approvals();

-- Trigger function for user_roles changes (permission changes)
CREATE OR REPLACE FUNCTION public.audit_user_role_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_action_description TEXT;
  v_user_email TEXT;
  v_user_name TEXT;
BEGIN
  SELECT email INTO v_user_email FROM auth.users WHERE id = NEW.user_id;
  SELECT full_name INTO v_user_name FROM public.user_profiles WHERE user_id = NEW.user_id;
  
  IF TG_OP = 'INSERT' THEN
    v_action_description := 'Role assigned: ' || NEW.role || ' to ' || COALESCE(v_user_name, v_user_email, NEW.user_id::TEXT);
  ELSIF TG_OP = 'DELETE' THEN
    v_action_description := 'Role removed: ' || OLD.role || ' from ' || COALESCE(v_user_name, v_user_email, OLD.user_id::TEXT);
  END IF;
  
  PERFORM public.log_audit_trail(
    CASE WHEN TG_OP = 'INSERT' THEN 'create' ELSE 'delete' END,
    'system',
    v_action_description,
    'user_role',
    NEW.user_id,
    COALESCE(v_user_name, v_user_email, NEW.user_id::TEXT),
    to_jsonb(OLD),
    to_jsonb(NEW),
    jsonb_build_object('role', COALESCE(NEW.role, OLD.role)),
    'high',
    true,
    'sox'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for application operations
CREATE OR REPLACE FUNCTION public.audit_application_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_action_description TEXT;
  v_applicant_name TEXT;
BEGIN
  v_applicant_name := COALESCE(NEW.first_name || ' ' || NEW.last_name, OLD.first_name || ' ' || OLD.last_name, 'Unknown');
  
  IF TG_OP = 'INSERT' THEN
    v_action_description := 'Application created: ' || v_applicant_name;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action_description := 'Application updated: ' || v_applicant_name;
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      v_action_description := v_action_description || ' | Status: ' || OLD.status || ' → ' || NEW.status;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    v_action_description := 'Application deleted: ' || v_applicant_name;
  END IF;
  
  PERFORM public.log_audit_trail(
    CASE WHEN TG_OP = 'INSERT' THEN 'create' WHEN TG_OP = 'DELETE' THEN 'delete' ELSE 'update' END,
    'application',
    v_action_description,
    'application',
    COALESCE(NEW.id, OLD.id),
    v_applicant_name,
    to_jsonb(OLD),
    to_jsonb(NEW),
    jsonb_build_object(
      'status', COALESCE(NEW.status, OLD.status),
      'email', COALESCE(NEW.email, OLD.email)
    ),
    CASE WHEN TG_OP = 'DELETE' THEN 'high' ELSE 'normal' END,
    CASE WHEN TG_OP = 'DELETE' THEN true ELSE false END,
    'gdpr'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- User roles triggers (note: user_roles table typically only has INSERT/DELETE, but handle both)
DROP TRIGGER IF EXISTS trigger_audit_user_role_changes ON public.user_roles;
CREATE TRIGGER trigger_audit_user_role_changes
  AFTER INSERT OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_user_role_changes();

-- Application triggers (only for C-level/admin actions)
DROP TRIGGER IF EXISTS trigger_audit_application_changes ON public.craver_applications;
CREATE TRIGGER trigger_audit_application_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.craver_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_application_changes();

-- =====================================================
-- 6. ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.unified_audit_trail ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "admins_and_executives_can_view_audit_trail" ON public.unified_audit_trail;
DROP POLICY IF EXISTS "system_can_insert_audit_trail" ON public.unified_audit_trail;
DROP POLICY IF EXISTS "users_can_view_own_audit_logs" ON public.unified_audit_trail;

-- Policy: Admins and C-level can view all audit logs
CREATE POLICY "admins_and_executives_can_view_audit_trail"
ON public.unified_audit_trail FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
  OR EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.user_id = auth.uid() AND public.is_c_level_position(e.position)
  )
  OR EXISTS (
    SELECT 1 FROM public.exec_users eu
    WHERE eu.user_id = auth.uid()
  )
);

-- Policy: System can insert audit logs (via SECURITY DEFINER functions)
CREATE POLICY "system_can_insert_audit_trail"
ON public.unified_audit_trail FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Users can view their own audit logs
CREATE POLICY "users_can_view_own_audit_logs"
ON public.unified_audit_trail FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- =====================================================
-- 7. COMMENTS
-- =====================================================
COMMENT ON TABLE public.unified_audit_trail IS 'Comprehensive audit trail for all administrative and C-level activities';
COMMENT ON COLUMN public.unified_audit_trail.user_role IS 'Role of the user performing the action (admin, executive, ceo, cfo, etc.)';
COMMENT ON COLUMN public.unified_audit_trail.action_type IS 'Type of action: create, update, delete, approve, reject, view, export, etc.';
COMMENT ON COLUMN public.unified_audit_trail.action_category IS 'Category: personnel, financial, document, system, security, compliance, portal, communication';
COMMENT ON COLUMN public.unified_audit_trail.severity IS 'Severity level: low, normal, high, critical';
COMMENT ON COLUMN public.unified_audit_trail.requires_review IS 'Whether this action requires manual review';
COMMENT ON COLUMN public.unified_audit_trail.compliance_tag IS 'Compliance tags: gdpr, sox, hipaa, pci, etc.';

