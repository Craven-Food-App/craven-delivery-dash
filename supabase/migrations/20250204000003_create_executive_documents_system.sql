-- =====================================================
-- EXECUTIVE DOCUMENTS SYSTEM MIGRATION
-- Creates tables for document generation, signing, and tracking
-- =====================================================

-- Create executive_documents table
CREATE TABLE IF NOT EXISTS public.executive_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  officer_name TEXT NOT NULL,
  role TEXT NOT NULL,
  equity NUMERIC,
  status TEXT NOT NULL DEFAULT 'draft', -- draft | generated | sent | signed
  file_url TEXT,
  signed_file_url TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create signatures table
CREATE TABLE IF NOT EXISTS public.signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.executive_documents(id) ON DELETE CASCADE,
  signed_by TEXT,
  signature_data_url TEXT, -- base64 png
  signed_at TIMESTAMPTZ DEFAULT now(),
  ip TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_executive_documents_status ON public.executive_documents(status);
CREATE INDEX IF NOT EXISTS idx_executive_documents_type ON public.executive_documents(type);
CREATE INDEX IF NOT EXISTS idx_executive_documents_created_at ON public.executive_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signatures_document_id ON public.signatures(document_id);

-- Enable RLS
ALTER TABLE public.executive_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;

-- RLS Policies for executive_documents
-- Allow executives, admins, and HR to view all documents
CREATE POLICY "Executives can view all documents"
  ON public.executive_documents
  FOR SELECT
  USING (
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

-- Allow executives and admins to create documents
CREATE POLICY "Executives can create documents"
  ON public.executive_documents
  FOR INSERT
  WITH CHECK (
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

-- Allow executives and admins to update documents
CREATE POLICY "Executives can update documents"
  ON public.executive_documents
  FOR UPDATE
  USING (
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

-- RLS Policies for signatures
CREATE POLICY "Executives can view signatures"
  ON public.signatures
  FOR SELECT
  USING (
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

CREATE POLICY "Executives can create signatures"
  ON public.signatures
  FOR INSERT
  WITH CHECK (
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

COMMENT ON TABLE public.executive_documents IS 'Documents generated through the HR Portal document generator';
COMMENT ON TABLE public.signatures IS 'E-signatures captured for executive documents';

