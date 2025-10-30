-- Board Resolution System
-- Tracks board decisions and position-based document assignments

-- Board resolutions table
CREATE TABLE IF NOT EXISTS public.board_resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resolution_number TEXT UNIQUE NOT NULL,
  resolution_type TEXT NOT NULL CHECK (resolution_type IN ('appointment', 'removal', 'equity_grant', 'policy_change', 'other')),
  subject_position TEXT NOT NULL,
  subject_person_name TEXT NOT NULL,
  subject_person_email TEXT NOT NULL,
  
  -- Resolution details
  resolution_title TEXT NOT NULL,
  resolution_text TEXT NOT NULL,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Board members who voted
  board_members JSONB NOT NULL DEFAULT '[]'::jsonb,
  votes_for INTEGER NOT NULL DEFAULT 0,
  votes_against INTEGER NOT NULL DEFAULT 0,
  votes_abstain INTEGER NOT NULL DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'executed')),
  
  -- Documents to be sent
  required_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  executed_by UUID REFERENCES auth.users(id),
  executed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Position-based document mapping
CREATE TABLE IF NOT EXISTS public.position_document_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_title TEXT NOT NULL,
  position_level TEXT NOT NULL CHECK (position_level IN ('board', 'c_suite', 'executive', 'management', 'employee')),
  
  -- Required documents for this position
  required_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Document templates
  offer_letter_template TEXT,
  equity_agreement_template TEXT,
  founders_agreement_template TEXT,
  board_resolution_template TEXT,
  
  -- Special requirements
  requires_board_approval BOOLEAN DEFAULT false,
  requires_equity_grant BOOLEAN DEFAULT false,
  requires_founders_agreement BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(position_title)
);

-- Enable RLS
ALTER TABLE public.board_resolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.position_document_mapping ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "CEO can manage board resolutions"
ON public.board_resolutions FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.ceo_access_credentials WHERE user_email = auth.jwt()->>'email')
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "CEO can manage position mappings"
ON public.position_document_mapping FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.ceo_access_credentials WHERE user_email = auth.jwt()->>'email')
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Indexes
CREATE INDEX idx_board_resolutions_type ON public.board_resolutions(resolution_type);
CREATE INDEX idx_board_resolutions_status ON public.board_resolutions(status);
CREATE INDEX idx_board_resolutions_position ON public.board_resolutions(subject_position);
CREATE INDEX idx_position_mapping_level ON public.position_document_mapping(position_level);

-- Insert default position mappings
INSERT INTO public.position_document_mapping (position_title, position_level, required_documents, requires_board_approval, requires_equity_grant, requires_founders_agreement) VALUES
  ('Chief Executive Officer', 'c_suite', '["board_resolution", "founders_equity_insurance_agreement", "equity_offer_agreement"]', true, true, true),
  ('Chief Financial Officer', 'c_suite', '["board_resolution", "equity_offer_agreement"]', true, true, false),
  ('Chief Technology Officer', 'c_suite', '["board_resolution", "equity_offer_agreement"]', true, true, false),
  ('Chief Operating Officer', 'c_suite', '["board_resolution", "equity_offer_agreement"]', true, true, false),
  ('President', 'c_suite', '["board_resolution", "equity_offer_agreement"]', true, true, false),
  ('Board Member', 'board', '["board_resolution", "equity_offer_agreement"]', true, true, false),
  ('Vice President', 'executive', '["offer_letter", "equity_offer_agreement"]', false, true, false),
  ('Director', 'management', '["offer_letter"]', false, false, false),
  ('Manager', 'management', '["offer_letter"]', false, false, false),
  ('Employee', 'employee', '["offer_letter"]', false, false, false)
ON CONFLICT (position_title) DO NOTHING;

-- Function to generate resolution number
CREATE OR REPLACE FUNCTION generate_resolution_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  year_part TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(resolution_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.board_resolutions
  WHERE resolution_number ~ ('^BR' || year_part || '[0-9]+$');
  
  RETURN 'BR' || year_part || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to get required documents for position
CREATE OR REPLACE FUNCTION get_required_documents_for_position(position_title TEXT)
RETURNS JSONB AS $$
DECLARE
  mapping RECORD;
BEGIN
  SELECT required_documents, requires_board_approval, requires_equity_grant, requires_founders_agreement
  INTO mapping
  FROM public.position_document_mapping
  WHERE position_title = $1;
  
  IF NOT FOUND THEN
    RETURN '["offer_letter"]'::jsonb;
  END IF;
  
  RETURN mapping.required_documents;
END;
$$ LANGUAGE plpgsql;
