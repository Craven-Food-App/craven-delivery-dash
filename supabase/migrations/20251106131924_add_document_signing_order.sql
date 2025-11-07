-- =====================================================
-- ADD SIGNING ORDER AND STAGE TRACKING TO EXECUTIVE DOCUMENTS
-- Enables ordered document signing flow with dependencies
-- =====================================================

-- Add signing order and stage tracking to executive_documents
ALTER TABLE public.executive_documents
ADD COLUMN IF NOT EXISTS signing_stage INTEGER, -- 1=Pre-Inc, 2=Appointment, 3=Employment, 4=Archival
ADD COLUMN IF NOT EXISTS signing_order INTEGER, -- Order within stage
ADD COLUMN IF NOT EXISTS required_signers TEXT[], -- ['incorporator', 'board', 'officer', 'ceo']
ADD COLUMN IF NOT EXISTS signer_roles JSONB DEFAULT '{}'::jsonb, -- Track who has signed: {"incorporator": true, "board": false}
ADD COLUMN IF NOT EXISTS depends_on_document_id UUID REFERENCES public.executive_documents(id) ON DELETE SET NULL, -- Previous doc must be signed
ADD COLUMN IF NOT EXISTS stage_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS packet_id TEXT, -- e.g., 'P1_PREINC', 'P2_BOARD'
ADD COLUMN IF NOT EXISTS template_key TEXT; -- Maps to document_templates.template_key

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_exec_docs_signing_stage_order ON public.executive_documents(signing_stage, signing_order) WHERE signing_stage IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_exec_docs_depends_on ON public.executive_documents(depends_on_document_id) WHERE depends_on_document_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_exec_docs_packet_id ON public.executive_documents(packet_id) WHERE packet_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_exec_docs_template_key ON public.executive_documents(template_key) WHERE template_key IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.executive_documents.signing_stage IS 'Document signing stage: 1=Pre-Incorporation, 2=Appointment & Authority, 3=Employment & Compensation, 4=Post-Execution';
COMMENT ON COLUMN public.executive_documents.signing_order IS 'Order within the signing stage (1, 2, 3, etc.)';
COMMENT ON COLUMN public.executive_documents.required_signers IS 'Array of signer types required: incorporator, board, officer, ceo';
COMMENT ON COLUMN public.executive_documents.signer_roles IS 'JSON object tracking which roles have signed: {"incorporator": true, "board": false}';
COMMENT ON COLUMN public.executive_documents.depends_on_document_id IS 'ID of document that must be signed before this one';
COMMENT ON COLUMN public.executive_documents.packet_id IS 'Packet identifier: P1_PREINC, P2_BOARD, P3_OFFICER_CORE, P4_EQUITY';
COMMENT ON COLUMN public.executive_documents.template_key IS 'Template key from document_templates table';

