-- Add signature fields and executive linking to executive_documents table
-- This enables secure document portal access and signature tracking

-- Add signature and executive linking fields
ALTER TABLE public.executive_documents
ADD COLUMN IF NOT EXISTS signature_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS signature_token_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS executive_id UUID REFERENCES public.exec_users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS signature_status TEXT DEFAULT 'pending' 
  CHECK (signature_status IN ('pending', 'signed', 'expired', 'declined'));

-- Link signatures table to documents
ALTER TABLE public.executive_signatures
ADD COLUMN IF NOT EXISTS document_id UUID REFERENCES public.executive_documents(id) ON DELETE CASCADE;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_exec_docs_signature_token ON public.executive_documents(signature_token) WHERE signature_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_exec_docs_executive_id ON public.executive_documents(executive_id) WHERE executive_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_exec_docs_signature_status ON public.executive_documents(signature_status);
CREATE INDEX IF NOT EXISTS idx_exec_sigs_document_id ON public.executive_signatures(document_id) WHERE document_id IS NOT NULL;

-- Update RLS policies to allow executives to view their own documents
DROP POLICY IF EXISTS "Executives can view their own documents" ON public.executive_documents;
CREATE POLICY "Executives can view their own documents"
  ON public.executive_documents
  FOR SELECT
  USING (
    -- Executives can view documents assigned to them
    executive_id IN (SELECT id FROM public.exec_users WHERE user_id = auth.uid())
    OR
    -- Admins and other executives can view all (existing policy)
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'ceo', 'cfo', 'coo', 'cto')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.exec_users
      WHERE user_id = auth.uid()
    )
  );

-- Allow executives to update their own documents (for signature status)
DROP POLICY IF EXISTS "Executives can update their own documents" ON public.executive_documents;
CREATE POLICY "Executives can update their own documents"
  ON public.executive_documents
  FOR UPDATE
  USING (
    -- Executives can update documents assigned to them (for signing)
    executive_id IN (SELECT id FROM public.exec_users WHERE user_id = auth.uid())
    OR
    -- Admins and other executives can update all (existing policy)
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'ceo', 'cfo', 'coo', 'cto')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.exec_users
      WHERE user_id = auth.uid()
    )
  );

-- Update signatures RLS to allow executives to view/create their own signatures
DROP POLICY IF EXISTS "Executives can view their own signatures" ON public.signatures;
CREATE POLICY "Executives can view their own signatures"
  ON public.signatures
  FOR SELECT
  USING (
    -- Executives can view signatures on their documents
    document_id IN (
      SELECT id FROM public.executive_documents 
      WHERE executive_id IN (SELECT id FROM public.exec_users WHERE user_id = auth.uid())
    )
    OR
    -- Existing policy for admins/executives
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'ceo', 'cfo', 'coo', 'cto')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.exec_users
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Executives can create their own signatures" ON public.signatures;
CREATE POLICY "Executives can create their own signatures"
  ON public.signatures
  FOR INSERT
  WITH CHECK (
    -- Executives can create signatures on their documents
    document_id IN (
      SELECT id FROM public.executive_documents 
      WHERE executive_id IN (SELECT id FROM public.exec_users WHERE user_id = auth.uid())
    )
    OR
    -- Existing policy for admins/executives
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'ceo', 'cfo', 'coo', 'cto')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.exec_users
      WHERE user_id = auth.uid()
    )
  );

COMMENT ON COLUMN public.executive_documents.signature_token IS 'Unique token for secure document portal access';
COMMENT ON COLUMN public.executive_documents.signature_token_expires_at IS 'Token expiration timestamp (default 30 days)';
COMMENT ON COLUMN public.executive_documents.executive_id IS 'Link to exec_users.id for the executive who needs to sign';
COMMENT ON COLUMN public.executive_documents.signature_status IS 'Status: pending, signed, expired, or declined';
COMMENT ON COLUMN public.executive_signatures.document_id IS 'Link to executive_documents.id for tracking which document was signed';

