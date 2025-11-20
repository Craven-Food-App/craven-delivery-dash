-- ============================================================================
-- EXECUTIVE ACTIVATION WORKFLOW EXTENSION
-- Fortune-500-style post-signature executive activation system
-- ============================================================================

-- Extend executive_appointments with activation workflow fields
ALTER TABLE public.executive_appointments
ADD COLUMN IF NOT EXISTS activation_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS secretary_approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS secretary_approved_by UUID REFERENCES auth.users(id);

-- Add missing columns to executive_documents
ALTER TABLE public.executive_documents
ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS signed_by_user UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'UNVERIFIED' 
  CHECK (verification_status IN ('UNVERIFIED', 'VERIFIED')),
ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.executive_appointments(id) ON DELETE SET NULL;

-- Create officer_ledger table (separate from corporate_officers for tracking)
CREATE TABLE IF NOT EXISTS public.officer_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id UUID REFERENCES public.corporate_officers(id),
  appointment_id UUID REFERENCES public.executive_appointments(id),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  effective_date DATE NOT NULL,
  certificate_url TEXT,
  resolution_id UUID REFERENCES public.governance_board_resolutions(id),
  resolution_number TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'RESIGNED', 'REMOVED')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create executive_compensation table
CREATE TABLE IF NOT EXISTS public.executive_compensation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  appointment_id UUID REFERENCES public.executive_appointments(id),
  base_salary NUMERIC(12, 2),
  is_deferred BOOLEAN DEFAULT false,
  activation_trigger TEXT CHECK (activation_trigger IN ('RAISE_500K', 'MRR_100K', 'MANUAL', 'IMMEDIATE')),
  trigger_status TEXT DEFAULT 'PENDING' CHECK (trigger_status IN ('PENDING', 'MET', 'ACTIVE')),
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create executive_banking_authority table
CREATE TABLE IF NOT EXISTS public.executive_banking_authority (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id UUID REFERENCES public.corporate_officers(id),
  appointment_id UUID REFERENCES public.executive_appointments(id),
  role TEXT NOT NULL,
  can_sign_wires BOOLEAN DEFAULT false,
  can_sign_checks BOOLEAN DEFAULT false,
  can_access_treasury_portal BOOLEAN DEFAULT false,
  bank_authorization_packet_url TEXT,
  status TEXT DEFAULT 'PENDING_BANK_UPLOAD' CHECK (status IN ('PENDING_BANK_UPLOAD', 'UPLOADED', 'APPROVED')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create executive_compliance_records table
CREATE TABLE IF NOT EXISTS public.executive_compliance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  appointment_id UUID REFERENCES public.executive_appointments(id),
  nda_signed BOOLEAN DEFAULT false,
  conflict_form_signed BOOLEAN DEFAULT false,
  identity_verified BOOLEAN DEFAULT false,
  background_verified BOOLEAN DEFAULT false,
  added_to_do_insurance BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create cap_table_entries table (for equity tracking)
CREATE TABLE IF NOT EXISTS public.cap_table_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  holder_id UUID NOT NULL REFERENCES auth.users(id),
  appointment_id UUID REFERENCES public.executive_appointments(id),
  shares_granted NUMERIC(12, 2) NOT NULL,
  certificate_id UUID,
  vesting_start_date DATE,
  vesting_months INTEGER,
  is_deferred BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create officer_activation_timeline table
CREATE TABLE IF NOT EXISTS public.officer_activation_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.executive_appointments(id),
  event_type TEXT NOT NULL,
  event_description TEXT NOT NULL,
  performed_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_executive_documents_executive_id ON public.executive_documents(executive_id);
CREATE INDEX IF NOT EXISTS idx_executive_documents_signed_at ON public.executive_documents(signed_at);

-- Create appointment_id index only if column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'executive_documents' 
    AND column_name = 'appointment_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_executive_documents_appointment_id ON public.executive_documents(appointment_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_officer_ledger_appointment_id ON public.officer_ledger(appointment_id);
CREATE INDEX IF NOT EXISTS idx_executive_compensation_user_id ON public.executive_compensation(user_id);
CREATE INDEX IF NOT EXISTS idx_executive_compensation_appointment_id ON public.executive_compensation(appointment_id);
CREATE INDEX IF NOT EXISTS idx_executive_banking_appointment_id ON public.executive_banking_authority(appointment_id);
CREATE INDEX IF NOT EXISTS idx_executive_compliance_user_id ON public.executive_compliance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_cap_table_holder_id ON public.cap_table_entries(holder_id);
CREATE INDEX IF NOT EXISTS idx_officer_activation_timeline_appointment_id ON public.officer_activation_timeline(appointment_id);
CREATE INDEX IF NOT EXISTS idx_officer_activation_timeline_created_at ON public.officer_activation_timeline(created_at DESC);

-- Enable RLS on all new tables
ALTER TABLE public.officer_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executive_compensation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executive_banking_authority ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executive_compliance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cap_table_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.officer_activation_timeline ENABLE ROW LEVEL SECURITY;

-- RLS Policies for officer_ledger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'officer_ledger' 
    AND policyname = 'Authorized users can view officer ledger'
  ) THEN
    CREATE POLICY "Authorized users can view officer ledger"
    ON public.officer_ledger FOR SELECT
    TO authenticated
    USING (
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() 
        AND role IN ('CRAVEN_FOUNDER', 'CRAVEN_CORPORATE_SECRETARY', 'CRAVEN_EXECUTIVE', 'CRAVEN_BOARD_MEMBER'))
      OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid())
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'officer_ledger' 
    AND policyname = 'Secretary can manage officer ledger'
  ) THEN
    CREATE POLICY "Secretary can manage officer ledger"
    ON public.officer_ledger FOR ALL
    TO authenticated
    USING (
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() 
        AND role IN ('CRAVEN_FOUNDER', 'CRAVEN_CORPORATE_SECRETARY'))
      OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'ceo')
    );
  END IF;
END $$;

-- RLS Policies for executive_compensation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'executive_compensation' 
    AND policyname = 'Executives can view own compensation'
  ) THEN
    CREATE POLICY "Executives can view own compensation"
    ON public.executive_compensation FOR SELECT
    TO authenticated
    USING (
      user_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() 
        AND role IN ('CRAVEN_FOUNDER', 'CRAVEN_CFO', 'CRAVEN_CEO'))
      OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role IN ('ceo', 'cfo'))
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'executive_compensation' 
    AND policyname = 'CFO and CEO can manage compensation'
  ) THEN
    CREATE POLICY "CFO and CEO can manage compensation"
    ON public.executive_compensation FOR ALL
    TO authenticated
    USING (
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() 
        AND role IN ('CRAVEN_FOUNDER', 'CRAVEN_CFO', 'CRAVEN_CEO'))
      OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role IN ('ceo', 'cfo'))
    );
  END IF;
END $$;

-- RLS Policies for executive_banking_authority
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'executive_banking_authority' 
    AND policyname = 'Authorized users can view banking authority'
  ) THEN
    CREATE POLICY "Authorized users can view banking authority"
    ON public.executive_banking_authority FOR SELECT
    TO authenticated
    USING (
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() 
        AND role IN ('CRAVEN_FOUNDER', 'CRAVEN_CORPORATE_SECRETARY', 'CRAVEN_CFO', 'CRAVEN_CEO'))
      OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role IN ('ceo', 'cfo'))
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'executive_banking_authority' 
    AND policyname = 'Secretary and CFO can manage banking authority'
  ) THEN
    CREATE POLICY "Secretary and CFO can manage banking authority"
    ON public.executive_banking_authority FOR ALL
    TO authenticated
    USING (
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() 
        AND role IN ('CRAVEN_FOUNDER', 'CRAVEN_CORPORATE_SECRETARY', 'CRAVEN_CFO'))
      OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role IN ('ceo', 'cfo'))
    );
  END IF;
END $$;

-- RLS Policies for executive_compliance_records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'executive_compliance_records' 
    AND policyname = 'Executives can view own compliance'
  ) THEN
    CREATE POLICY "Executives can view own compliance"
    ON public.executive_compliance_records FOR SELECT
    TO authenticated
    USING (
      user_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() 
        AND role IN ('CRAVEN_FOUNDER', 'CRAVEN_CORPORATE_SECRETARY'))
      OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid())
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'executive_compliance_records' 
    AND policyname = 'Secretary can manage compliance'
  ) THEN
    CREATE POLICY "Secretary can manage compliance"
    ON public.executive_compliance_records FOR ALL
    TO authenticated
    USING (
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() 
        AND role IN ('CRAVEN_FOUNDER', 'CRAVEN_CORPORATE_SECRETARY'))
      OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'ceo')
    );
  END IF;
END $$;

-- RLS Policies for cap_table_entries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'cap_table_entries' 
    AND policyname = 'Authorized users can view cap table'
  ) THEN
    CREATE POLICY "Authorized users can view cap table"
    ON public.cap_table_entries FOR SELECT
    TO authenticated
    USING (
      holder_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() 
        AND role IN ('CRAVEN_FOUNDER', 'CRAVEN_CFO', 'CRAVEN_CEO'))
      OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role IN ('ceo', 'cfo'))
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'cap_table_entries' 
    AND policyname = 'CFO and CEO can manage cap table'
  ) THEN
    CREATE POLICY "CFO and CEO can manage cap table"
    ON public.cap_table_entries FOR ALL
    TO authenticated
    USING (
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() 
        AND role IN ('CRAVEN_FOUNDER', 'CRAVEN_CFO', 'CRAVEN_CEO'))
      OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role IN ('ceo', 'cfo'))
    );
  END IF;
END $$;

-- RLS Policies for officer_activation_timeline
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'officer_activation_timeline' 
    AND policyname = 'Authorized users can view timeline'
  ) THEN
    CREATE POLICY "Authorized users can view timeline"
    ON public.officer_activation_timeline FOR SELECT
    TO authenticated
    USING (
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() 
        AND role IN ('CRAVEN_FOUNDER', 'CRAVEN_CORPORATE_SECRETARY', 'CRAVEN_EXECUTIVE'))
      OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid())
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'officer_activation_timeline' 
    AND policyname = 'System can insert timeline events'
  ) THEN
    CREATE POLICY "System can insert timeline events"
    ON public.officer_activation_timeline FOR INSERT
    TO authenticated
    WITH CHECK (true);
  END IF;
END $$;

-- Add updated_at trigger for new tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_officer_ledger_updated_at'
  ) THEN
    CREATE TRIGGER update_officer_ledger_updated_at
      BEFORE UPDATE ON public.officer_ledger
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_executive_compensation_updated_at'
  ) THEN
    CREATE TRIGGER update_executive_compensation_updated_at
      BEFORE UPDATE ON public.executive_compensation
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_executive_banking_authority_updated_at'
  ) THEN
    CREATE TRIGGER update_executive_banking_authority_updated_at
      BEFORE UPDATE ON public.executive_banking_authority
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_executive_compliance_records_updated_at'
  ) THEN
    CREATE TRIGGER update_executive_compliance_records_updated_at
      BEFORE UPDATE ON public.executive_compliance_records
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

COMMENT ON TABLE public.officer_ledger IS 'Official ledger of corporate officers with appointment tracking';
COMMENT ON TABLE public.executive_compensation IS 'Executive compensation records with deferred activation triggers';
COMMENT ON TABLE public.executive_banking_authority IS 'Banking authority and signatory permissions for executives';
COMMENT ON TABLE public.executive_compliance_records IS 'Compliance tracking for executive appointments';
COMMENT ON TABLE public.cap_table_entries IS 'Equity grants and cap table entries for executives';
COMMENT ON TABLE public.officer_activation_timeline IS 'Timeline of events during executive activation workflow';

