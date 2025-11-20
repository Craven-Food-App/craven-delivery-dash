-- Add Governance System Tables (Additive Migration)
-- This adds new tables for the Fortune 500-style governance system
-- while keeping existing board_documents and board_members tables

-- 1. Add trusts table (if doesn't exist)
CREATE TABLE IF NOT EXISTS public.trusts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID, -- Will reference company_settings or can be NULL for single-company setup
  name TEXT NOT NULL DEFAULT 'Invero Business Trust (Irrevocable Trust)',
  type TEXT NOT NULL DEFAULT 'Irrevocable',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Add cap_tables table
CREATE TABLE IF NOT EXISTS public.cap_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID, -- Will reference company_settings or can be NULL for single-company setup
  total_authorized BIGINT NOT NULL DEFAULT 10000000,
  par_value NUMERIC(10,6) NOT NULL DEFAULT 0.0001,
  total_issued BIGINT NOT NULL DEFAULT 8000000,
  total_unissued BIGINT NOT NULL DEFAULT 2000000,
  equity_pool BIGINT NOT NULL DEFAULT 2000000,
  trust_shares BIGINT NOT NULL DEFAULT 6000000,
  founder_shares BIGINT NOT NULL DEFAULT 2000000,
  trust_percentage NUMERIC(5,2) NOT NULL DEFAULT 60.00,
  founder_percentage NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  pool_percentage NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  as_of_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create appointments table (if doesn't exist)
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID, -- Optional, can be NULL for single-company setup
  appointee_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_titles TEXT[] NOT NULL,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Link appointments to board_documents (additive)
CREATE TABLE IF NOT EXISTS public.appointment_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  governance_document_id UUID NOT NULL REFERENCES public.board_documents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(appointment_id, governance_document_id)
);

-- 5. Add company_id to board_documents if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'board_documents' 
    AND column_name = 'company_id'
  ) THEN
    ALTER TABLE public.board_documents 
    ADD COLUMN company_id UUID;
  END IF;
END $$;

-- 6. Create indexes
CREATE INDEX IF NOT EXISTS idx_trusts_company_id ON public.trusts(company_id);
CREATE INDEX IF NOT EXISTS idx_cap_tables_company_id ON public.cap_tables(company_id);
CREATE INDEX IF NOT EXISTS idx_appointments_company_id ON public.appointments(company_id);
CREATE INDEX IF NOT EXISTS idx_appointments_appointee ON public.appointments(appointee_user_id);
CREATE INDEX IF NOT EXISTS idx_appointment_documents_appointment ON public.appointment_documents(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_documents_document ON public.appointment_documents(governance_document_id);
CREATE INDEX IF NOT EXISTS idx_board_documents_company_id ON public.board_documents(company_id);

-- 7. Enable RLS
ALTER TABLE public.trusts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cap_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_documents ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for trusts
CREATE POLICY "Executives can view trusts"
ON public.trusts FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.exec_users
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Executives can manage trusts"
ON public.trusts FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.exec_users
    WHERE user_id = auth.uid()
  )
);

-- 9. RLS Policies for cap_tables
CREATE POLICY "Executives can view cap tables"
ON public.cap_tables FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.exec_users
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Executives can manage cap tables"
ON public.cap_tables FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.exec_users
    WHERE user_id = auth.uid()
  )
);

-- 10. RLS Policies for appointments
CREATE POLICY "Executives can view appointments"
ON public.appointments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.exec_users
    WHERE user_id = auth.uid()
  ) OR appointee_user_id = auth.uid()
);

CREATE POLICY "Executives can manage appointments"
ON public.appointments FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.exec_users
    WHERE user_id = auth.uid()
  )
);

-- 11. RLS Policies for appointment_documents
CREATE POLICY "Executives can view appointment documents"
ON public.appointment_documents FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.exec_users
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Executives can manage appointment documents"
ON public.appointment_documents FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.exec_users
    WHERE user_id = auth.uid()
  )
);

-- 12. Create updated_at triggers
CREATE OR REPLACE FUNCTION update_governance_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trusts_updated_at
  BEFORE UPDATE ON public.trusts
  FOR EACH ROW
  EXECUTE FUNCTION update_governance_tables_updated_at();

CREATE TRIGGER update_cap_tables_updated_at
  BEFORE UPDATE ON public.cap_tables
  FOR EACH ROW
  EXECUTE FUNCTION update_governance_tables_updated_at();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_governance_tables_updated_at();

-- 13. Add comments
COMMENT ON TABLE public.trusts IS 'Trust entities that hold majority ownership';
COMMENT ON TABLE public.cap_tables IS 'Capitalization table snapshots for governance docs';
COMMENT ON TABLE public.appointments IS 'Executive and officer appointments';
COMMENT ON TABLE public.appointment_documents IS 'Links appointments to generated governance documents';

