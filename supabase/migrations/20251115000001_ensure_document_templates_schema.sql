-- Ensure document_templates table has the correct columns
-- This migration ensures compatibility regardless of which migration ran first

-- Add template_key if it doesn't exist
ALTER TABLE public.document_templates
ADD COLUMN IF NOT EXISTS template_key TEXT UNIQUE;

-- Add html_content if it doesn't exist (in case table was created with template_html)
ALTER TABLE public.document_templates
ADD COLUMN IF NOT EXISTS html_content TEXT;

-- If html_content is null but template_html exists, copy the data
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'document_templates' 
    AND column_name = 'template_html'
  ) THEN
    UPDATE public.document_templates
    SET html_content = template_html
    WHERE html_content IS NULL AND template_html IS NOT NULL;
  END IF;
END $$;

-- Add placeholders column if it doesn't exist
ALTER TABLE public.document_templates
ADD COLUMN IF NOT EXISTS placeholders JSONB DEFAULT '[]'::jsonb;

-- Add description column if it doesn't exist
ALTER TABLE public.document_templates
ADD COLUMN IF NOT EXISTS description TEXT;

-- Create index on template_key if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_document_templates_template_key 
ON public.document_templates(template_key) 
WHERE template_key IS NOT NULL;

