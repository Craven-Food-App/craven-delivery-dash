-- Complete CEO Portal Tables for Real-Time Management

-- Financial approvals table
CREATE TABLE IF NOT EXISTS public.ceo_financial_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type TEXT NOT NULL CHECK (request_type IN ('expense', 'budget', 'bonus', 'raise', 'investment', 'other')),
  requester_id UUID REFERENCES auth.users(id),
  requester_name TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id),
  amount NUMERIC(12, 2) NOT NULL,
  description TEXT NOT NULL,
  justification TEXT,
  
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'on-hold')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  
  requested_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Strategic objectives (OKRs)
CREATE TABLE IF NOT EXISTS public.ceo_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  objective_type TEXT NOT NULL CHECK (objective_type IN ('company', 'department', 'team', 'individual')),
  
  department_id UUID REFERENCES public.departments(id),
  owner_id UUID REFERENCES auth.users(id),
  owner_name TEXT,
  
  target_value NUMERIC(12, 2),
  current_value NUMERIC(12, 2) DEFAULT 0,
  progress_percentage INTEGER GENERATED ALWAYS AS (
    CASE WHEN target_value > 0 THEN 
      LEAST(100, ROUND((current_value / target_value * 100)::numeric, 0)::integer)
    ELSE 0 END
  ) STORED,
  
  status TEXT DEFAULT 'in-progress' CHECK (status IN ('not-started', 'in-progress', 'at-risk', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_date DATE,
  completed_date DATE,
  
  key_results JSONB DEFAULT '[]'::jsonb,
  milestones JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- System-wide settings/toggles
CREATE TABLE IF NOT EXISTS public.ceo_system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  category TEXT NOT NULL CHECK (category IN ('operations', 'security', 'features', 'maintenance', 'emergency')),
  description TEXT,
  
  is_critical BOOLEAN DEFAULT false,
  requires_confirmation BOOLEAN DEFAULT false,
  
  last_changed_by UUID REFERENCES auth.users(id),
  last_changed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- CEO action logs (audit trail)
CREATE TABLE IF NOT EXISTS public.ceo_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  action_category TEXT NOT NULL CHECK (action_category IN ('personnel', 'financial', 'system', 'strategic', 'emergency')),
  
  target_type TEXT,
  target_id UUID,
  target_name TEXT,
  
  action_description TEXT NOT NULL,
  previous_value JSONB,
  new_value JSONB,
  
  ip_address TEXT,
  user_agent TEXT,
  
  severity TEXT DEFAULT 'normal' CHECK (severity IN ('low', 'normal', 'high', 'critical')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Company-wide metrics cache
CREATE TABLE IF NOT EXISTS public.ceo_company_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_key TEXT NOT NULL UNIQUE,
  metric_value JSONB NOT NULL,
  metric_category TEXT NOT NULL,
  
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ceo_financial_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ceo_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ceo_system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ceo_action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ceo_company_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "CEO can manage financial approvals"
ON public.ceo_financial_approvals FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.ceo_access_credentials WHERE user_email = auth.jwt()->>'email'));

CREATE POLICY "CEO can manage objectives"
ON public.ceo_objectives FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.ceo_access_credentials WHERE user_email = auth.jwt()->>'email'));

CREATE POLICY "CEO can manage system settings"
ON public.ceo_system_settings FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.ceo_access_credentials WHERE user_email = auth.jwt()->>'email'));

CREATE POLICY "CEO can view action logs"
ON public.ceo_action_logs FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.ceo_access_credentials WHERE user_email = auth.jwt()->>'email'));

CREATE POLICY "Anyone can insert action logs"
ON public.ceo_action_logs FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "CEO can view metrics"
ON public.ceo_company_metrics FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.ceo_access_credentials WHERE user_email = auth.jwt()->>'email'));

-- Indexes
CREATE INDEX idx_financial_approvals_status ON public.ceo_financial_approvals(status);
CREATE INDEX idx_financial_approvals_date ON public.ceo_financial_approvals(requested_date DESC);
CREATE INDEX idx_objectives_status ON public.ceo_objectives(status);
CREATE INDEX idx_objectives_department ON public.ceo_objectives(department_id);
CREATE INDEX idx_action_logs_user ON public.ceo_action_logs(user_id);
CREATE INDEX idx_action_logs_created ON public.ceo_action_logs(created_at DESC);
CREATE INDEX idx_action_logs_category ON public.ceo_action_logs(action_category);

-- Function to log CEO actions automatically
CREATE OR REPLACE FUNCTION log_ceo_action(
  p_action_type TEXT,
  p_action_category TEXT,
  p_target_type TEXT,
  p_target_id UUID,
  p_target_name TEXT,
  p_description TEXT,
  p_severity TEXT DEFAULT 'normal'
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.ceo_action_logs (
    user_id,
    action_type,
    action_category,
    target_type,
    target_id,
    target_name,
    action_description,
    severity
  ) VALUES (
    auth.uid(),
    p_action_type,
    p_action_category,
    p_target_type,
    p_target_id,
    p_target_name,
    p_description,
    p_severity
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default system settings
INSERT INTO public.ceo_system_settings (setting_key, setting_value, category, description, is_critical, requires_confirmation) VALUES
  ('system_maintenance_mode', '{"enabled": false}'::jsonb, 'maintenance', 'Enable/disable maintenance mode', true, true),
  ('orders_paused', '{"enabled": false, "reason": ""}'::jsonb, 'operations', 'Pause all new orders', true, true),
  ('new_user_registration', '{"enabled": true}'::jsonb, 'operations', 'Allow new user registrations', false, false),
  ('payment_processing', '{"enabled": true}'::jsonb, 'operations', 'Enable payment processing', true, true),
  ('driver_acceptance', '{"enabled": true}'::jsonb, 'operations', 'Allow drivers to accept orders', false, false),
  ('emergency_alerts', '{"enabled": true}'::jsonb, 'emergency', 'Send emergency alerts to all users', true, true)
ON CONFLICT (setting_key) DO NOTHING;

-- Insert some sample financial approvals
INSERT INTO public.ceo_financial_approvals (request_type, requester_name, amount, description, status, priority) VALUES
  ('expense', 'Sarah Johnson', 15000, 'New marketing campaign budget', 'pending', 'high'),
  ('bonus', 'Mike Davis', 5000, 'Q4 Performance bonus for exceeding targets', 'pending', 'normal'),
  ('investment', 'Tech Team', 28500, 'Cloud infrastructure upgrade', 'pending', 'high')
ON CONFLICT DO NOTHING;

-- Insert sample objectives (OKRs)
INSERT INTO public.ceo_objectives (title, description, objective_type, target_value, current_value, priority, target_date) VALUES
  ('Increase Revenue by 25%', 'Grow monthly recurring revenue from $2M to $2.5M', 'company', 2500000, 2150000, 'critical', CURRENT_DATE + INTERVAL '90 days'),
  ('Expand to 5 New Cities', 'Launch operations in 5 new metropolitan areas', 'company', 5, 3, 'high', CURRENT_DATE + INTERVAL '120 days'),
  ('Reduce Customer Churn to 5%', 'Improve retention and reduce monthly churn rate', 'company', 5, 7.2, 'high', CURRENT_DATE + INTERVAL '60 days'),
  ('Hire 50 New Employees', 'Expand team across all departments', 'company', 50, 23, 'normal', CURRENT_DATE + INTERVAL '180 days')
ON CONFLICT DO NOTHING;

