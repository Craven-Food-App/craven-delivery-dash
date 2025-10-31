-- HR Document Management System
-- Run this ENTIRE file in Supabase SQL Editor

-- Create storage bucket for HR documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hr-documents',
  'hr-documents',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for hr-documents bucket
DROP POLICY IF EXISTS "HR and execs can upload HR documents" ON storage.objects;
CREATE POLICY "HR and execs can upload HR documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'hr-documents' AND (
    EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  )
);

DROP POLICY IF EXISTS "HR and execs can view HR documents" ON storage.objects;
CREATE POLICY "HR and execs can view HR documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'hr-documents' AND (
    EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  )
);

-- Create board_resolutions table if missing
CREATE TABLE IF NOT EXISTS public.board_resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resolution_number TEXT UNIQUE NOT NULL,
  resolution_type TEXT NOT NULL CHECK (resolution_type IN ('appointment', 'removal', 'equity_grant', 'policy_change', 'other')),
  subject_position TEXT NOT NULL,
  subject_person_name TEXT NOT NULL,
  subject_person_email TEXT NOT NULL,
  resolution_title TEXT NOT NULL,
  resolution_text TEXT NOT NULL,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  board_members JSONB NOT NULL DEFAULT '[]'::jsonb,
  votes_for INTEGER NOT NULL DEFAULT 0,
  votes_against INTEGER NOT NULL DEFAULT 0,
  votes_abstain INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'executed')),
  required_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  executed_by UUID REFERENCES auth.users(id),
  executed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on board_resolutions
ALTER TABLE public.board_resolutions ENABLE ROW LEVEL SECURITY;

-- RLS policy for board_resolutions
DROP POLICY IF EXISTS "CEO and execs can view board resolutions" ON public.board_resolutions;
CREATE POLICY "CEO and execs can view board resolutions"
ON public.board_resolutions FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "CEO and admins can manage board resolutions" ON public.board_resolutions;
CREATE POLICY "CEO and admins can manage board resolutions"
ON public.board_resolutions FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'ceo') OR
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Employee documents tracking table
CREATE TABLE IF NOT EXISTS public.employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'offer_letter',
    'board_resolution',
    'equity_agreement',
    'founders_equity_insurance_agreement',
    'employment_contract',
    'signed_offer_letter',
    'signed_equity_agreement',
    'onboarding_packet',
    'w2',
    'w9',
    'other'
  )),
  document_title TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size_bytes BIGINT,
  mime_type TEXT DEFAULT 'application/pdf',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT unique_employee_doc UNIQUE (employee_id, document_type, created_at)
);

-- Link board resolutions to employees
ALTER TABLE public.board_resolutions 
ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES public.employees(id),
ADD COLUMN IF NOT EXISTS document_id UUID REFERENCES public.employee_documents(id);

-- Link exec_documents to employees  
ALTER TABLE public.exec_documents
ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES public.employees(id);

-- Enable RLS
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "CEO and execs can view all employee documents" ON public.employee_documents;
CREATE POLICY "CEO and execs can view all employee documents"
ON public.employee_documents FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role IN ('ceo', 'cfo', 'coo', 'cto')) OR
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "CEO and admins can manage employee documents" ON public.employee_documents;
CREATE POLICY "CEO and admins can manage employee documents"
ON public.employee_documents FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'ceo') OR
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_employee_documents_employee ON public.employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_type ON public.employee_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_board_resolutions_employee ON public.board_resolutions(employee_id);
CREATE INDEX IF NOT EXISTS idx_board_resolutions_type ON public.board_resolutions(resolution_type);
CREATE INDEX IF NOT EXISTS idx_board_resolutions_status ON public.board_resolutions(status);
CREATE INDEX IF NOT EXISTS idx_exec_documents_employee ON public.exec_documents(employee_id);

-- Function to get all documents for an employee
CREATE OR REPLACE FUNCTION public.get_employee_documents(emp_id UUID)
RETURNS TABLE (
  id UUID,
  document_type TEXT,
  document_title TEXT,
  storage_path TEXT,
  file_size_bytes BIGINT,
  created_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT ed.id, ed.document_type, ed.document_title, ed.storage_path, ed.file_size_bytes, ed.created_at, ed.metadata
  FROM public.employee_documents ed
  WHERE ed.employee_id = emp_id
  ORDER BY ed.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get all board resolutions for an employee
CREATE OR REPLACE FUNCTION public.get_employee_board_resolutions(emp_id UUID)
RETURNS TABLE (
  id UUID,
  resolution_number TEXT,
  resolution_type TEXT,
  resolution_title TEXT,
  status TEXT,
  effective_date DATE,
  created_at TIMESTAMP WITH TIME ZONE,
  document_id UUID
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT br.id, br.resolution_number, br.resolution_type, br.resolution_title, br.status, br.effective_date, br.created_at, br.document_id
  FROM public.board_resolutions br
  WHERE br.employee_id = emp_id
  ORDER BY br.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to link documents to board resolutions
CREATE OR REPLACE FUNCTION public.link_document_to_resolution(doc_id UUID, resolution_id UUID)
RETURNS VOID
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.board_resolutions SET document_id = doc_id WHERE id = resolution_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get document count by type
CREATE OR REPLACE FUNCTION public.get_document_statistics()
RETURNS TABLE (
  document_type TEXT,
  total_count BIGINT,
  recent_count BIGINT
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT ed.document_type, COUNT(*) as total_count, COUNT(*) FILTER (WHERE ed.created_at >= NOW() - INTERVAL '30 days') as recent_count
  FROM public.employee_documents ed
  GROUP BY ed.document_type
  ORDER BY ed.document_type;
END;
$$ LANGUAGE plpgsql;

