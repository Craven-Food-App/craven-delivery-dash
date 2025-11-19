-- Company Governance System Migration
-- Comprehensive governance, board, and executive management system

-- 1. User Roles Table (if not exists)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policy for user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('CRAVEN_FOUNDER', 'CRAVEN_CORPORATE_SECRETARY'))
  OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'ceo')
);

-- 2. Board Members Table
CREATE TABLE IF NOT EXISTS public.board_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL, -- "Board Chair", "Director"
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for board_members
DROP POLICY IF EXISTS "Founder and Secretary can manage board members" ON public.board_members;
CREATE POLICY "Founder and Secretary can manage board members"
ON public.board_members FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('CRAVEN_FOUNDER', 'CRAVEN_CORPORATE_SECRETARY'))
  OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'ceo')
);

DROP POLICY IF EXISTS "Board members can view their own record" ON public.board_members;
CREATE POLICY "Board members can view their own record"
ON public.board_members FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'CRAVEN_BOARD_MEMBER')
);

-- 3. Board Resolutions Table (enhanced version)
CREATE TABLE IF NOT EXISTS public.governance_board_resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resolution_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- "EXECUTIVE_APPOINTMENT", "POLICY", etc.
  status TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT, PENDING_VOTE, ADOPTED, REJECTED
  created_by UUID REFERENCES auth.users(id),
  meeting_date DATE,
  effective_date DATE,
  related_officer_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.governance_board_resolutions ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_governance_board_resolutions_status ON public.governance_board_resolutions(status);
CREATE INDEX IF NOT EXISTS idx_governance_board_resolutions_type ON public.governance_board_resolutions(type);

-- RLS Policies for board_resolutions
DROP POLICY IF EXISTS "Founder and Secretary can manage resolutions" ON public.governance_board_resolutions;
CREATE POLICY "Founder and Secretary can manage resolutions"
ON public.governance_board_resolutions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('CRAVEN_FOUNDER', 'CRAVEN_CORPORATE_SECRETARY'))
  OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'ceo')
);

DROP POLICY IF EXISTS "Authorized users can view resolutions" ON public.governance_board_resolutions;
CREATE POLICY "Authorized users can view resolutions"
ON public.governance_board_resolutions FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('CRAVEN_FOUNDER', 'CRAVEN_CORPORATE_SECRETARY', 'CRAVEN_BOARD_MEMBER'))
  OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role IN ('ceo', 'board_member'))
);

DROP POLICY IF EXISTS "Founder and Secretary can update resolutions" ON public.governance_board_resolutions;
CREATE POLICY "Founder and Secretary can update resolutions"
ON public.governance_board_resolutions FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('CRAVEN_FOUNDER', 'CRAVEN_CORPORATE_SECRETARY'))
  OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'ceo')
);

-- 4. Board Resolution Votes Table
CREATE TABLE IF NOT EXISTS public.board_resolution_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resolution_id UUID NOT NULL REFERENCES public.governance_board_resolutions(id) ON DELETE CASCADE,
  board_member_id UUID NOT NULL REFERENCES public.board_members(id) ON DELETE CASCADE,
  vote TEXT NOT NULL, -- "YES", "NO", "ABSTAIN"
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (resolution_id, board_member_id)
);

-- Enable RLS
ALTER TABLE public.board_resolution_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for votes
DROP POLICY IF EXISTS "Board members can vote" ON public.board_resolution_votes;
CREATE POLICY "Board members can vote"
ON public.board_resolution_votes FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.board_members 
    WHERE id = board_member_id AND user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Board members can update their votes" ON public.board_resolution_votes;
CREATE POLICY "Board members can update their votes"
ON public.board_resolution_votes FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.board_members 
    WHERE id = board_member_id AND user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Authorized users can view votes" ON public.board_resolution_votes;
CREATE POLICY "Authorized users can view votes"
ON public.board_resolution_votes FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('CRAVEN_FOUNDER', 'CRAVEN_CORPORATE_SECRETARY', 'CRAVEN_BOARD_MEMBER'))
  OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role IN ('ceo', 'board_member'))
);

-- 5. Corporate Officers Table
CREATE TABLE IF NOT EXISTS public.corporate_officers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  title TEXT NOT NULL, -- CEO, CFO, CTO, CXO, COO, ...
  appointed_by UUID REFERENCES public.governance_board_resolutions(id),
  certificate_url TEXT,
  effective_date DATE NOT NULL,
  term_end DATE,
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, RESIGNED, REMOVED, EXPIRED
  resignation_date DATE,
  removal_notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.corporate_officers ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_corporate_officers_status ON public.corporate_officers(status);
CREATE INDEX IF NOT EXISTS idx_corporate_officers_title ON public.corporate_officers(title);

-- RLS Policies for corporate_officers
DROP POLICY IF EXISTS "Authorized users can view officers" ON public.corporate_officers;
CREATE POLICY "Authorized users can view officers"
ON public.corporate_officers FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('CRAVEN_FOUNDER', 'CRAVEN_CORPORATE_SECRETARY', 'CRAVEN_BOARD_MEMBER', 'CRAVEN_EXECUTIVE'))
  OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role IN ('ceo', 'cfo', 'cto', 'coo', 'cxo', 'board_member'))
);

DROP POLICY IF EXISTS "Founder and Secretary can manage officers" ON public.corporate_officers;
CREATE POLICY "Founder and Secretary can manage officers"
ON public.corporate_officers FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('CRAVEN_FOUNDER', 'CRAVEN_CORPORATE_SECRETARY'))
  OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'ceo')
);

-- 6. Executive Appointments Table
CREATE TABLE IF NOT EXISTS public.executive_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposed_officer_name TEXT NOT NULL,
  proposed_officer_email TEXT,
  proposed_title TEXT NOT NULL,
  appointment_type TEXT NOT NULL, -- NEW, REPLACEMENT, INTERIM
  board_meeting_date DATE,
  effective_date DATE NOT NULL,
  term_length_months INT,
  authority_granted TEXT,
  compensation_structure TEXT,
  equity_included BOOLEAN DEFAULT false,
  equity_details TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  board_resolution_id UUID REFERENCES public.governance_board_resolutions(id),
  status TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT, SENT_TO_BOARD, APPROVED, REJECTED
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.executive_appointments ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_executive_appointments_status ON public.executive_appointments(status);

-- RLS Policies for executive_appointments
DROP POLICY IF EXISTS "Founder and Secretary can manage appointments" ON public.executive_appointments;
CREATE POLICY "Founder and Secretary can manage appointments"
ON public.executive_appointments FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('CRAVEN_FOUNDER', 'CRAVEN_CORPORATE_SECRETARY'))
  OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'ceo')
);

DROP POLICY IF EXISTS "Board members can view appointments" ON public.executive_appointments;
CREATE POLICY "Board members can view appointments"
ON public.executive_appointments FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('CRAVEN_FOUNDER', 'CRAVEN_CORPORATE_SECRETARY', 'CRAVEN_BOARD_MEMBER'))
  OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role IN ('ceo', 'board_member'))
);

-- 7. Governance Logs Table
CREATE TABLE IF NOT EXISTS public.governance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  actor_id UUID REFERENCES auth.users(id),
  entity_type TEXT NOT NULL, -- "OFFICER", "RESOLUTION", "APPOINTMENT"
  entity_id UUID NOT NULL,
  description TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.governance_logs ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_governance_logs_entity ON public.governance_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_governance_logs_timestamp ON public.governance_logs(timestamp DESC);

-- RLS Policies for governance_logs
DROP POLICY IF EXISTS "Authorized users can view logs" ON public.governance_logs;
CREATE POLICY "Authorized users can view logs"
ON public.governance_logs FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('CRAVEN_FOUNDER', 'CRAVEN_CORPORATE_SECRETARY', 'CRAVEN_EXECUTIVE'))
  OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role IN ('ceo', 'cfo', 'cto', 'coo', 'cxo'))
);

DROP POLICY IF EXISTS "System can insert logs" ON public.governance_logs;
CREATE POLICY "System can insert logs"
ON public.governance_logs FOR INSERT
TO authenticated
WITH CHECK (true); -- Logs are inserted by backend functions

-- Function to generate resolution number
CREATE OR REPLACE FUNCTION generate_governance_resolution_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  year_part TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(resolution_number FROM 5 FOR 4) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.governance_board_resolutions
  WHERE resolution_number LIKE 'CR-BR-' || year_part || '-%';
  
  RETURN 'CR-BR-' || year_part || '-' || LPAD(next_num::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_governance_board_resolutions_updated_at ON public.governance_board_resolutions;
CREATE TRIGGER update_governance_board_resolutions_updated_at
  BEFORE UPDATE ON public.governance_board_resolutions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_corporate_officers_updated_at ON public.corporate_officers;
CREATE TRIGGER update_corporate_officers_updated_at
  BEFORE UPDATE ON public.corporate_officers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_executive_appointments_updated_at ON public.executive_appointments;
CREATE TRIGGER update_executive_appointments_updated_at
  BEFORE UPDATE ON public.executive_appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

