ALTER TABLE public.executive_documents
ADD COLUMN IF NOT EXISTS signature_field_layout JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.executive_documents.signature_field_layout IS 'Snapshot of signature fields used for this document (page, coordinates, roles, types).';


