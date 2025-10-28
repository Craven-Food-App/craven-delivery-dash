-- CEO Portal Schema - Master Control System
-- This is the highest level of access in the entire Craven platform

-- Personnel management table
CREATE TABLE IF NOT EXISTS public.ceo_personnel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_type TEXT NOT NULL CHECK (employee_type IN ('admin', 'executive', 'support', 'operations', 'finance', 'marketing', 'legal')),
  position_title TEXT NOT NULL,
  department TEXT,
  salary_annual INTEGER, -- in cents
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
  hired_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'terminated', 'suspended')),
  termination_date DATE,
  termination_reason TEXT,
  performance_rating NUMERIC(3,2), -- 0.00 to 5.00
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Financial approval requests
CREATE TABLE IF NOT EXISTS public.ceo_financial_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type TEXT NOT NULL CHECK (request_type IN ('expense', 'salary', 'investment', 'refund', 'other')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  requested_by UUID REFERENCES auth.users(id),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  deadline DATE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Company goals and OKRs
CREATE TABLE IF NOT EXISTS public.ceo_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('revenue', 'growth', 'operations', 'people', 'product', 'strategic')),
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  unit TEXT, -- 'dollars', 'users', 'percent', etc.
  quarter TEXT, -- 'Q1 2025', 'Q2 2025', etc.
  fiscal_year INTEGER,
  owner_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'at_risk', 'cancelled')),
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  due_date DATE,
  key_results JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Emergency controls log
CREATE TABLE IF NOT EXISTS public.ceo_emergency_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL CHECK (action_type IN ('pause_orders', 'maintenance_mode', 'resume_operations', 'broadcast_message', 'emergency_shutdown')),
  action_title TEXT NOT NULL,
  reason TEXT NOT NULL,
  initiated_by UUID NOT NULL REFERENCES auth.users(id),
  initiated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  affected_systems TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb
);

-- System-wide announcements
CREATE TABLE IF NOT EXISTS public.ceo_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  audience TEXT NOT NULL CHECK (audience IN ('all', 'admins', 'feeders', 'merchants', 'customers', 'executives')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('info', 'important', 'urgent', 'critical')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- CEO audit log (tracks all CEO actions)
CREATE TABLE IF NOT EXISTS public.ceo_audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ceo_user_id UUID NOT NULL REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  action_description TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id),
  target_resource_type TEXT,
  target_resource_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Performance metrics cache (for fast dashboard loading)
CREATE TABLE IF NOT EXISTS public.ceo_metrics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_category TEXT NOT NULL,
  metric_key TEXT NOT NULL,
  metric_value JSONB NOT NULL,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  UNIQUE(metric_category, metric_key)
);

-- Enable RLS on all tables
ALTER TABLE public.ceo_personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ceo_financial_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ceo_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ceo_emergency_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ceo_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ceo_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ceo_metrics_cache ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is CEO/Founder
CREATE OR REPLACE FUNCTION public.is_ceo(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.exec_users
    WHERE user_id = user_uuid 
    AND role = 'ceo'
    AND access_level = 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- RLS Policies - Only CEO can access these tables
CREATE POLICY "Only CEO can view personnel"
ON public.ceo_personnel FOR SELECT
TO authenticated
USING (public.is_ceo(auth.uid()));

CREATE POLICY "Only CEO can manage personnel"
ON public.ceo_personnel FOR ALL
TO authenticated
USING (public.is_ceo(auth.uid()));

CREATE POLICY "Only CEO can view financial approvals"
ON public.ceo_financial_approvals FOR SELECT
TO authenticated
USING (public.is_ceo(auth.uid()) OR requested_by = auth.uid());

CREATE POLICY "Only CEO can review approvals"
ON public.ceo_financial_approvals FOR UPDATE
TO authenticated
USING (public.is_ceo(auth.uid()));

CREATE POLICY "Anyone can request approval"
ON public.ceo_financial_approvals FOR INSERT
TO authenticated
WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Only CEO can view objectives"
ON public.ceo_objectives FOR SELECT
TO authenticated
USING (public.is_ceo(auth.uid()) OR owner_id = auth.uid());

CREATE POLICY "Only CEO can manage objectives"
ON public.ceo_objectives FOR ALL
TO authenticated
USING (public.is_ceo(auth.uid()));

CREATE POLICY "Only CEO can use emergency controls"
ON public.ceo_emergency_actions FOR ALL
TO authenticated
USING (public.is_ceo(auth.uid()));

CREATE POLICY "Only CEO can create announcements"
ON public.ceo_announcements FOR INSERT
TO authenticated
WITH CHECK (public.is_ceo(auth.uid()));

CREATE POLICY "Everyone can view active announcements"
ON public.ceo_announcements FOR SELECT
TO authenticated
USING (is_active = true OR public.is_ceo(auth.uid()));

CREATE POLICY "Only CEO can view audit trail"
ON public.ceo_audit_trail FOR SELECT
TO authenticated
USING (public.is_ceo(auth.uid()));

CREATE POLICY "System can log CEO actions"
ON public.ceo_audit_trail FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Only CEO can view metrics cache"
ON public.ceo_metrics_cache FOR SELECT
TO authenticated
USING (public.is_ceo(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_ceo_personnel_user_id ON public.ceo_personnel(user_id);
CREATE INDEX idx_ceo_personnel_status ON public.ceo_personnel(status);
CREATE INDEX idx_ceo_personnel_employee_type ON public.ceo_personnel(employee_type);
CREATE INDEX idx_ceo_financial_approvals_status ON public.ceo_financial_approvals(status);
CREATE INDEX idx_ceo_financial_approvals_requested_by ON public.ceo_financial_approvals(requested_by);
CREATE INDEX idx_ceo_objectives_status ON public.ceo_objectives(status);
CREATE INDEX idx_ceo_objectives_fiscal_year ON public.ceo_objectives(fiscal_year);
CREATE INDEX idx_ceo_emergency_actions_initiated_at ON public.ceo_emergency_actions(initiated_at DESC);
CREATE INDEX idx_ceo_announcements_active ON public.ceo_announcements(is_active, created_at DESC);
CREATE INDEX idx_ceo_audit_trail_created_at ON public.ceo_audit_trail(created_at DESC);
CREATE INDEX idx_ceo_audit_trail_ceo_user_id ON public.ceo_audit_trail(ceo_user_id);

-- Add updated_at triggers
CREATE TRIGGER update_ceo_personnel_updated_at
  BEFORE UPDATE ON public.ceo_personnel
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ceo_objectives_updated_at
  BEFORE UPDATE ON public.ceo_objectives
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to log CEO actions automatically
CREATE OR REPLACE FUNCTION public.log_ceo_action()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.ceo_audit_trail (
    ceo_user_id,
    action_type,
    action_description,
    target_resource_type,
    target_resource_id,
    metadata
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME || ' ' || TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to critical tables
CREATE TRIGGER audit_ceo_personnel
  AFTER INSERT OR UPDATE OR DELETE ON public.ceo_personnel
  FOR EACH ROW
  EXECUTE FUNCTION public.log_ceo_action();

CREATE TRIGGER audit_ceo_financial_approvals_review
  AFTER UPDATE ON public.ceo_financial_approvals
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.log_ceo_action();

