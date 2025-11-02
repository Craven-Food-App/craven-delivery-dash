-- =====================================================
-- CFO DOCUMENTS TABLE MIGRATION
-- Creates table for storing word processor documents
-- for the CFO Portal
-- =====================================================

-- Create cfo_documents table
CREATE TABLE IF NOT EXISTS public.cfo_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_cfo_documents_created_by ON public.cfo_documents(created_by);
CREATE INDEX IF NOT EXISTS idx_cfo_documents_updated_at ON public.cfo_documents(updated_at DESC);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_cfo_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at on document updates
DROP TRIGGER IF EXISTS trigger_update_cfo_documents_updated_at ON public.cfo_documents;
CREATE TRIGGER trigger_update_cfo_documents_updated_at
  BEFORE UPDATE ON public.cfo_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_cfo_documents_updated_at();

-- Enable RLS
ALTER TABLE public.cfo_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow users to view their own documents
CREATE POLICY "Users can view their own documents"
  ON public.cfo_documents
  FOR SELECT
  USING (auth.uid() = created_by);

-- Allow users to create their own documents
CREATE POLICY "Users can create their own documents"
  ON public.cfo_documents
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Allow users to update their own documents
CREATE POLICY "Users can update their own documents"
  ON public.cfo_documents
  FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Allow users to delete their own documents
CREATE POLICY "Users can delete their own documents"
  ON public.cfo_documents
  FOR DELETE
  USING (auth.uid() = created_by);

-- Allow CFO and admins to view all documents (for collaboration if needed)
CREATE POLICY "CFO and admins can view all documents"
  ON public.cfo_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'cfo')
    )
  );

COMMENT ON TABLE public.cfo_documents IS 'Documents created in the CFO Portal word processor';
COMMENT ON COLUMN public.cfo_documents.title IS 'Document title';
COMMENT ON COLUMN public.cfo_documents.content IS 'Document content/body text';
COMMENT ON COLUMN public.cfo_documents.created_by IS 'User ID who created the document';

