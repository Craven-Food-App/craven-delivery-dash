-- Legal & Compliance Management System
-- Tracks contracts, compliance requirements, and risk

CREATE TABLE IF NOT EXISTS public.legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  document_url TEXT NOT NULL,
  effective_date DATE,
  expiry_date DATE,
  renewal_required BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  reviewed_by UUID REFERENCES auth.users(id),
  review_frequency_days INTEGER DEFAULT 365,
  last_review_date DATE,
  next_review_date DATE,
  key_terms JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.legal_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.legal_documents(id),
  reviewer_id UUID REFERENCES auth.users(id),
  review_date DATE NOT NULL DEFAULT CURRENT_DATE,
  review_type TEXT NOT NULL,
  findings TEXT,
  recommendations TEXT,
  action_required BOOLEAN DEFAULT false,
  action_items JSONB DEFAULT '[]'::jsonb,
  next_review_date DATE,
  status TEXT DEFAULT 'submitted',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.compliance_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regulation_type TEXT NOT NULL,
  regulation_name TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  applicability TEXT NOT NULL,
  compliance_status TEXT DEFAULT 'compliant',
  last_audit_date DATE,
  next_audit_date DATE,
  audit_frequency_days INTEGER DEFAULT 180,
  responsible_department_id UUID REFERENCES public.departments(id),
  responsible_person_id UUID REFERENCES auth.users(id),
  compliance_notes TEXT,
  risk_level TEXT DEFAULT 'low',
  mitigation_plan TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_category TEXT NOT NULL,
  risk_title TEXT NOT NULL,
  description TEXT NOT NULL,
  likelihood TEXT DEFAULT 'medium',
  impact TEXT DEFAULT 'medium',
  risk_score INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN likelihood = 'low' AND impact = 'low' THEN 1
      WHEN likelihood = 'medium' AND impact = 'medium' THEN 5
      WHEN likelihood = 'high' AND impact = 'high' THEN 9
      ELSE 3
    END
  ) STORED,
  mitigation_plan TEXT,
  responsible_person_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'open',
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Legal and execs can manage documents"
  ON public.legal_documents FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Legal and execs can manage reviews"
  ON public.legal_reviews FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Legal and execs can manage compliance"
  ON public.compliance_tracking FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Execs can manage risks"
  ON public.risk_assessments FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Indexes
CREATE INDEX idx_legal_docs_expiry ON public.legal_documents(expiry_date);
CREATE INDEX idx_legal_docs_status ON public.legal_documents(status);
CREATE INDEX idx_compliance_status ON public.compliance_tracking(compliance_status);
CREATE INDEX idx_compliance_risk ON public.compliance_tracking(risk_level);
CREATE INDEX idx_risk_status ON public.risk_assessments(status);
CREATE INDEX idx_risk_score ON public.risk_assessments(risk_score);

-- Function to alert on expiring contracts
CREATE OR REPLACE FUNCTION public.alert_expiring_contracts()
RETURNS TABLE(
  document_id UUID,
  title TEXT,
  days_until_expiry INTEGER
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.title,
    (d.expiry_date - CURRENT_DATE)::INTEGER as days_until_expiry
  FROM public.legal_documents d
  WHERE d.renewal_required = true
    AND d.status = 'active'
    AND d.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '60 days'
  ORDER BY d.expiry_date ASC;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.alert_expiring_contracts() TO authenticated;

