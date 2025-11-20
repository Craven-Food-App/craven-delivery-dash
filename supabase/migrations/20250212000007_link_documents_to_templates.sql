-- Link executive_documents to document_templates via type field
-- This allows us to fetch signature fields from templates

-- Add template_id to executive_documents (optional, can be derived from type)
ALTER TABLE public.executive_documents
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.document_templates(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_executive_documents_template_id 
ON public.executive_documents(template_id);

-- Function to get template_id from document type
CREATE OR REPLACE FUNCTION public.get_template_id_from_document_type(p_document_type TEXT)
RETURNS UUID AS $$
DECLARE
  v_template_id UUID;
BEGIN
  SELECT id INTO v_template_id
  FROM public.document_templates
  WHERE template_key = p_document_type
  LIMIT 1;
  
  RETURN v_template_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Backfill template_id for existing documents
UPDATE public.executive_documents
SET template_id = public.get_template_id_from_document_type(type)
WHERE template_id IS NULL;

COMMENT ON FUNCTION public.get_template_id_from_document_type IS 'Gets template_id from document type (template_key)';

