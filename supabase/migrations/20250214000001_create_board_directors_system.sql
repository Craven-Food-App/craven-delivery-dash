-- Board of Directors System Migration
-- Adds board_members, board_documents tables and extends company_settings

-- Drop existing tables first (CASCADE will remove all dependent objects)
DROP TABLE IF EXISTS public.board_documents CASCADE;
DROP TABLE IF EXISTS public.board_members CASCADE;

-- 1. Create board_members table
CREATE TABLE public.board_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role_title TEXT NOT NULL, -- Director, Chairperson, Secretary, etc.
  appointment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Removed', 'Pending', 'Conditional')),
  signing_required BOOLEAN DEFAULT true,
  signing_completed BOOLEAN DEFAULT false,
  signature_tags JSONB DEFAULT '[]'::jsonb,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create board_documents table
CREATE TABLE public.board_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'initial_director_consent',
    'board_minutes',
    'board_resolution',
    'director_appointment',
    'officer_appointment_resolution',
    'stock_issuance_resolution',
    'capitalization_table_exhibit',
    'ceo_appointment_resolution',
    'multi_role_officer_acceptance',
    'corporate_banking_resolution'
  )),
  html_template TEXT,
  pdf_url TEXT,
  signing_status TEXT DEFAULT 'pending' CHECK (signing_status IN ('pending', 'partially_signed', 'completed')),
  signers JSONB DEFAULT '[]'::jsonb,
  template_id UUID REFERENCES public.document_templates(id) ON DELETE SET NULL,
  resolution_number TEXT,
  related_appointment_id UUID REFERENCES public.executive_appointments(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Add board_initialized to company_settings
INSERT INTO public.company_settings (setting_key, setting_value)
VALUES ('board_initialized', 'false')
ON CONFLICT (setting_key) DO NOTHING;

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_board_members_status ON public.board_members(status);
CREATE INDEX IF NOT EXISTS idx_board_members_user_id ON public.board_members(user_id);
CREATE INDEX IF NOT EXISTS idx_board_documents_type ON public.board_documents(type);
CREATE INDEX IF NOT EXISTS idx_board_documents_signing_status ON public.board_documents(signing_status);
CREATE INDEX IF NOT EXISTS idx_board_documents_resolution_number ON public.board_documents(resolution_number);

-- 5. Enable RLS
ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_documents ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for board_members
CREATE POLICY "Executives can view board members"
ON public.board_members FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.exec_users
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Executives can manage board members"
ON public.board_members FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.exec_users
    WHERE user_id = auth.uid()
  )
);

-- 7. RLS Policies for board_documents
CREATE POLICY "Executives can view board documents"
ON public.board_documents FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.exec_users
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Executives can manage board documents"
ON public.board_documents FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.exec_users
    WHERE user_id = auth.uid()
  )
);

-- 8. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_board_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_board_members_updated_at
  BEFORE UPDATE ON public.board_members
  FOR EACH ROW
  EXECUTE FUNCTION update_board_tables_updated_at();

CREATE TRIGGER update_board_documents_updated_at
  BEFORE UPDATE ON public.board_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_board_tables_updated_at();

-- 9. Add comments
COMMENT ON TABLE public.board_members IS 'Stores Board of Directors members and their roles';
COMMENT ON COLUMN public.board_members.status IS 'Status: Active (post-incorporation), Pending (awaiting incorporation), Conditional (pre-incorporation, effective upon filing), Removed';
COMMENT ON TABLE public.board_documents IS 'Stores Board of Directors documents including consents, minutes, and resolutions';
COMMENT ON COLUMN public.board_documents.type IS 'Document type: initial_director_consent, board_minutes, board_resolution, director_appointment, officer_appointment_resolution';

