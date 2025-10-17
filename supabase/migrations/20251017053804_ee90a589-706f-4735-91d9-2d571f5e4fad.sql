-- Create background check reports table
CREATE TABLE IF NOT EXISTS public.background_check_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.craver_applications(id) NOT NULL,
  user_id UUID NOT NULL,
  
  -- Checkr Integration
  checkr_candidate_id TEXT,
  checkr_report_id TEXT,
  checkr_status TEXT, -- pending, clear, consider, suspended
  checkr_package TEXT DEFAULT 'mvr_driver',
  
  -- Report Status
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed, failed
  initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Results
  criminal_search_status TEXT, -- clear, records_found, pending
  criminal_records JSONB,
  mvr_status TEXT, -- clear, violations_found, pending
  mvr_records JSONB,
  ssn_trace_status TEXT, -- verified, mismatch, pending
  
  -- Admin Review
  admin_review_required BOOLEAN DEFAULT false,
  admin_reviewed_by UUID,
  admin_review_notes TEXT,
  admin_decision TEXT, -- approved, rejected, needs_info
  admin_reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_background_reports_application ON public.background_check_reports(application_id);
CREATE INDEX IF NOT EXISTS idx_background_reports_user ON public.background_check_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_background_reports_status ON public.background_check_reports(status);
CREATE INDEX IF NOT EXISTS idx_background_reports_checkr ON public.background_check_reports(checkr_report_id);

-- Enable RLS
ALTER TABLE public.background_check_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all background check reports"
ON public.background_check_reports
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage background check reports"
ON public.background_check_reports
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Update craver_applications table
ALTER TABLE public.craver_applications
ADD COLUMN IF NOT EXISTS background_check_consent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS background_check_consent_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS background_check_report_id UUID REFERENCES public.background_check_reports(id);

-- Add trigger for updated_at
CREATE TRIGGER update_background_check_reports_updated_at
BEFORE UPDATE ON public.background_check_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();