-- =====================================================
-- DOCUMENT CENTER & DIGITAL SIGNING SYSTEM
-- Comprehensive document management with e-signatures,
-- version control, and audit trails
-- =====================================================

-- Main business documents table
CREATE TABLE IF NOT EXISTS public.business_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'appointment', 'merchant_agreement', 'nda', 'employment_agreement',
    'offer_letter', 'consulting_agreement', 'partnership_agreement',
    'service_agreement', 'vendor_agreement', 'board_resolution',
    'equity_grant', 'other'
  )),
  category TEXT NOT NULL CHECK (category IN (
    'executive', 'merchant', 'partner', 'employee', 'vendor', 'compliance', 'governance'
  )),
  file_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'pending_signature', 'partially_signed', 'signed', 'declined', 'expired', 'archived'
  )),
  version INTEGER NOT NULL DEFAULT 1,
  is_latest_version BOOLEAN NOT NULL DEFAULT true,
  parent_document_id UUID REFERENCES public.business_documents(id) ON DELETE SET NULL,
  
  -- Signature requirements
  requires_signature BOOLEAN NOT NULL DEFAULT false,
  signature_deadline TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  signed_at TIMESTAMP WITH TIME ZONE,
  
  -- Additional data (JSON for flexibility)
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Document signers table (who needs to sign)
CREATE TABLE IF NOT EXISTS public.document_signers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.business_documents(id) ON DELETE CASCADE,
  signer_type TEXT NOT NULL CHECK (signer_type IN ('executive', 'merchant', 'partner', 'employee', 'external')),
  signer_name TEXT NOT NULL,
  signer_email TEXT NOT NULL,
  signer_role TEXT,
  
  -- Signature tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'declined', 'expired')),
  signature_token TEXT UNIQUE,
  signature_token_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Signature data
  typed_name TEXT,
  signature_data_url TEXT,
  signature_svg TEXT,
  signed_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit
  ip_address TEXT,
  user_agent TEXT,
  signing_order INTEGER DEFAULT 1,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Document version history
CREATE TABLE IF NOT EXISTS public.document_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.business_documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  changes_description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  
  UNIQUE(document_id, version_number)
);

-- Document templates table
CREATE TABLE IF NOT EXISTS public.document_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  category TEXT NOT NULL,
  template_html TEXT NOT NULL,
  required_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_docs_type ON public.business_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_business_docs_category ON public.business_documents(category);
CREATE INDEX IF NOT EXISTS idx_business_docs_status ON public.business_documents(status);
CREATE INDEX IF NOT EXISTS idx_business_docs_created_by ON public.business_documents(created_by);
CREATE INDEX IF NOT EXISTS idx_business_docs_parent ON public.business_documents(parent_document_id);
CREATE INDEX IF NOT EXISTS idx_business_docs_latest ON public.business_documents(is_latest_version) WHERE is_latest_version = true;

CREATE INDEX IF NOT EXISTS idx_doc_signers_document ON public.document_signers(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_signers_email ON public.document_signers(signer_email);
CREATE INDEX IF NOT EXISTS idx_doc_signers_status ON public.document_signers(status);
CREATE INDEX IF NOT EXISTS idx_doc_signers_token ON public.document_signers(signature_token) WHERE signature_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_doc_versions_document ON public.document_versions(document_id);

-- Enable RLS
ALTER TABLE public.business_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_signers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for business_documents
DROP POLICY IF EXISTS "Executives can view all documents" ON public.business_documents;
CREATE POLICY "Executives can view all documents"
  ON public.business_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'ceo', 'cfo', 'coo', 'cto')
    )
    OR EXISTS (
      SELECT 1 FROM public.exec_users
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Executives can create documents" ON public.business_documents;
CREATE POLICY "Executives can create documents"
  ON public.business_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'ceo', 'cfo', 'coo', 'cto')
    )
    OR EXISTS (
      SELECT 1 FROM public.exec_users
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Executives can update documents" ON public.business_documents;
CREATE POLICY "Executives can update documents"
  ON public.business_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'ceo', 'cfo', 'coo', 'cto')
    )
    OR EXISTS (
      SELECT 1 FROM public.exec_users
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for document_signers
DROP POLICY IF EXISTS "Executives can view all signers" ON public.document_signers;
CREATE POLICY "Executives can view all signers"
  ON public.document_signers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'ceo', 'cfo', 'coo', 'cto')
    )
    OR EXISTS (
      SELECT 1 FROM public.exec_users
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Executives can manage signers" ON public.document_signers;
CREATE POLICY "Executives can manage signers"
  ON public.document_signers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'ceo', 'cfo', 'coo', 'cto')
    )
  );

-- RLS Policies for document_versions
DROP POLICY IF EXISTS "Executives can view version history" ON public.document_versions;
CREATE POLICY "Executives can view version history"
  ON public.document_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'ceo', 'cfo', 'coo', 'cto')
    )
    OR EXISTS (
      SELECT 1 FROM public.exec_users
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Executives can create versions" ON public.document_versions;
CREATE POLICY "Executives can create versions"
  ON public.document_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'ceo', 'cfo', 'coo', 'cto')
    )
  );

-- RLS Policies for document_templates
DROP POLICY IF EXISTS "Everyone can view active templates" ON public.document_templates;
CREATE POLICY "Everyone can view active templates"
  ON public.document_templates FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage templates" ON public.document_templates;
CREATE POLICY "Admins can manage templates"
  ON public.document_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'ceo')
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_document_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_business_documents_updated_at ON public.business_documents;
CREATE TRIGGER update_business_documents_updated_at
  BEFORE UPDATE ON public.business_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_document_updated_at();

DROP TRIGGER IF EXISTS update_document_signers_updated_at ON public.document_signers;
CREATE TRIGGER update_document_signers_updated_at
  BEFORE UPDATE ON public.document_signers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_document_updated_at();

-- Function to check if document is fully signed
CREATE OR REPLACE FUNCTION public.check_document_fully_signed()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if all required signers have signed
  IF NOT EXISTS (
    SELECT 1 FROM public.document_signers
    WHERE document_id = NEW.document_id
    AND status = 'pending'
  ) THEN
    -- All signed, update document status
    UPDATE public.business_documents
    SET status = 'signed', signed_at = now()
    WHERE id = NEW.document_id;
  ELSIF NEW.status = 'signed' AND OLD.status = 'pending' THEN
    -- At least one signature, mark as partially signed
    UPDATE public.business_documents
    SET status = 'partially_signed'
    WHERE id = NEW.document_id
    AND status = 'pending_signature';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_document_fully_signed ON public.document_signers;
CREATE TRIGGER trigger_check_document_fully_signed
  AFTER UPDATE OF status ON public.document_signers
  FOR EACH ROW
  WHEN (NEW.status = 'signed')
  EXECUTE FUNCTION public.check_document_fully_signed();

COMMENT ON TABLE public.business_documents IS 'Central document repository for all business documents with version control';
COMMENT ON TABLE public.document_signers IS 'Tracks who needs to sign each document and their signature status';
COMMENT ON TABLE public.document_versions IS 'Version history for documents';
COMMENT ON TABLE public.document_templates IS 'Reusable document templates for auto-generation';