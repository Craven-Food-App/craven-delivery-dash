-- Extend Governance System - Complete Implementation
-- Adds missing tables for Fortune 500-style governance system
-- DO NOT DROP existing tables - only add new ones

-- 1. Equity Ledger Table - Transaction log for all equity movements
CREATE TABLE IF NOT EXISTS public.equity_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('grant', 'vest', 'exercise', 'transfer', 'cancellation', 'issuance')),
  grant_id UUID, -- References equity_grants if exists
  recipient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shares_amount BIGINT NOT NULL,
  share_class TEXT DEFAULT 'Common',
  price_per_share NUMERIC(10,6) DEFAULT 0.0001,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  resolution_id UUID REFERENCES public.governance_board_resolutions(id),
  certificate_id UUID, -- Will reference share_certificates after creation
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Share Certificates Table
CREATE TABLE IF NOT EXISTS public.share_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_number TEXT NOT NULL UNIQUE,
  recipient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shares_amount BIGINT NOT NULL,
  share_class TEXT DEFAULT 'Common',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  resolution_id UUID REFERENCES public.governance_board_resolutions(id),
  appointment_id UUID REFERENCES public.appointments(id),
  document_url TEXT, -- PDF URL in storage
  html_template TEXT, -- Original template HTML
  status TEXT DEFAULT 'issued' CHECK (status IN ('issued', 'cancelled', 'replaced')),
  replaced_by_certificate_id UUID REFERENCES public.share_certificates(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Vesting Schedules Table - Detailed vesting tracking
CREATE TABLE IF NOT EXISTS public.vesting_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id UUID, -- References equity_grants if exists
  recipient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_shares BIGINT NOT NULL,
  vesting_type TEXT NOT NULL CHECK (vesting_type IN ('cliff', 'graded', 'immediate', 'custom')),
  cliff_months INTEGER DEFAULT 0,
  vesting_period_months INTEGER NOT NULL,
  vesting_schedule JSONB NOT NULL DEFAULT '[]'::jsonb, -- Detailed schedule with dates/amounts
  start_date DATE NOT NULL,
  end_date DATE,
  vested_shares BIGINT DEFAULT 0,
  unvested_shares BIGINT,
  acceleration_events JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Governance Log Table - Audit trail for all governance actions
CREATE TABLE IF NOT EXISTS public.governance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  action_type TEXT NOT NULL, -- 'appointment', 'removal', 'resolution_created', 'resolution_approved', 'equity_granted', 'certificate_issued'
  action_category TEXT NOT NULL, -- 'board', 'executive', 'equity', 'compliance'
  target_type TEXT, -- 'resolution', 'appointment', 'officer', 'certificate', 'equity_grant'
  target_id UUID,
  target_name TEXT,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Executive Onboarding Table - Track onboarding workflow state
CREATE TABLE IF NOT EXISTS public.executive_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'documents_sent', 'signing_in_progress', 'partially_signed', 'completed', 'cancelled')),
  documents_required JSONB NOT NULL DEFAULT '[]'::jsonb,
  documents_completed JSONB NOT NULL DEFAULT '[]'::jsonb,
  signing_deadline DATE,
  completed_at TIMESTAMPTZ,
  onboarding_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(appointment_id, user_id)
);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_equity_ledger_recipient ON public.equity_ledger(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_equity_ledger_type ON public.equity_ledger(transaction_type);
CREATE INDEX IF NOT EXISTS idx_equity_ledger_date ON public.equity_ledger(transaction_date);
CREATE INDEX IF NOT EXISTS idx_equity_ledger_resolution ON public.equity_ledger(resolution_id);

CREATE INDEX IF NOT EXISTS idx_share_certificates_recipient ON public.share_certificates(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_share_certificates_number ON public.share_certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_share_certificates_status ON public.share_certificates(status);

CREATE INDEX IF NOT EXISTS idx_vesting_schedules_recipient ON public.vesting_schedules(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_vesting_schedules_grant ON public.vesting_schedules(grant_id);
CREATE INDEX IF NOT EXISTS idx_vesting_schedules_start_date ON public.vesting_schedules(start_date);

CREATE INDEX IF NOT EXISTS idx_governance_log_action_type ON public.governance_log(action_type);
CREATE INDEX IF NOT EXISTS idx_governance_log_category ON public.governance_log(action_category);
CREATE INDEX IF NOT EXISTS idx_governance_log_target ON public.governance_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_governance_log_performed_at ON public.governance_log(performed_at DESC);

CREATE INDEX IF NOT EXISTS idx_executive_onboarding_appointment ON public.executive_onboarding(appointment_id);
CREATE INDEX IF NOT EXISTS idx_executive_onboarding_user ON public.executive_onboarding(user_id);
CREATE INDEX IF NOT EXISTS idx_executive_onboarding_status ON public.executive_onboarding(status);

-- 7. Enable RLS
ALTER TABLE public.equity_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vesting_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executive_onboarding ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for equity_ledger
CREATE POLICY "Executives can view equity ledger"
ON public.equity_ledger FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid())
  OR recipient_user_id = auth.uid()
);

CREATE POLICY "Executives can manage equity ledger"
ON public.equity_ledger FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid())
);

-- 9. RLS Policies for share_certificates
CREATE POLICY "Executives can view share certificates"
ON public.share_certificates FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid())
  OR recipient_user_id = auth.uid()
);

CREATE POLICY "Executives can manage share certificates"
ON public.share_certificates FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid())
);

-- 10. RLS Policies for vesting_schedules
CREATE POLICY "Executives can view vesting schedules"
ON public.vesting_schedules FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid())
  OR recipient_user_id = auth.uid()
);

CREATE POLICY "Executives can manage vesting schedules"
ON public.vesting_schedules FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid())
);

-- 11. RLS Policies for governance_log
CREATE POLICY "Executives can view governance log"
ON public.governance_log FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid())
);

CREATE POLICY "System can insert governance log"
ON public.governance_log FOR INSERT
TO authenticated
WITH CHECK (true); -- System-generated logs

-- 12. RLS Policies for executive_onboarding
CREATE POLICY "Users can view their own onboarding"
ON public.executive_onboarding FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid())
);

CREATE POLICY "Executives can manage onboarding"
ON public.executive_onboarding FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid())
);

-- 13. Create updated_at triggers
CREATE OR REPLACE FUNCTION update_governance_extended_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_equity_ledger_updated_at
  BEFORE UPDATE ON public.equity_ledger
  FOR EACH ROW
  EXECUTE FUNCTION update_governance_extended_tables_updated_at();

CREATE TRIGGER update_share_certificates_updated_at
  BEFORE UPDATE ON public.share_certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_governance_extended_tables_updated_at();

CREATE TRIGGER update_vesting_schedules_updated_at
  BEFORE UPDATE ON public.vesting_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_governance_extended_tables_updated_at();

CREATE TRIGGER update_executive_onboarding_updated_at
  BEFORE UPDATE ON public.executive_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION update_governance_extended_tables_updated_at();

-- 14. Add comments for documentation
COMMENT ON TABLE public.equity_ledger IS 'Transaction log for all equity movements (grants, vesting, issuance, transfers)';
COMMENT ON TABLE public.share_certificates IS 'Share certificates issued to executives and shareholders';
COMMENT ON TABLE public.vesting_schedules IS 'Detailed vesting schedules for equity grants';
COMMENT ON TABLE public.governance_log IS 'Audit trail for all governance actions (appointments, resolutions, equity grants)';
COMMENT ON TABLE public.executive_onboarding IS 'Tracks executive onboarding workflow state and document completion';

-- 15. Function to log governance actions
CREATE OR REPLACE FUNCTION log_governance_action(
  p_action_type TEXT,
  p_action_category TEXT,
  p_target_type TEXT,
  p_target_id UUID,
  p_target_name TEXT,
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_performed_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
  performer_id UUID;
BEGIN
  -- Use provided performed_by, or fall back to auth.uid(), or NULL
  performer_id := COALESCE(p_performed_by, auth.uid());
  
  INSERT INTO public.governance_log (
    action_type,
    action_category,
    target_type,
    target_id,
    target_name,
    description,
    metadata,
    performed_by
  ) VALUES (
    p_action_type,
    p_action_category,
    p_target_type,
    p_target_id,
    p_target_name,
    p_description,
    p_metadata,
    performer_id
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Function to generate certificate number
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  year_part TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(certificate_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.share_certificates
  WHERE certificate_number ~ ('^CERT-' || year_part || '[0-9]+$');
  
  RETURN 'CERT-' || year_part || '-' || LPAD(next_num::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

