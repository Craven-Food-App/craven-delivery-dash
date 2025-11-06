-- Verify Pre-Incorporation Consent Template is in Template Manager
-- Run this query in Supabase Dashboard to verify the template exists and is editable

-- Check if template exists and is active
SELECT 
  template_key,
  name,
  category,
  is_active,
  CASE 
    WHEN html_content LIKE '%<!--%' AND length(html_content) < 200 THEN 'PLACEHOLDER'
    WHEN length(html_content) > 1000 THEN 'LOADED'
    ELSE 'UNKNOWN'
  END as template_status,
  length(html_content) as content_length,
  array_length(placeholders::text[], 1) as placeholder_count,
  description,
  created_at,
  updated_at
FROM document_templates
WHERE template_key = 'pre_incorporation_consent';

-- If template doesn't exist or is inactive, run UPDATE_PRE_INCORPORATION_TEMPLATE.sql
-- The template should be visible in Template Manager at: Board Portal > Templates > Document Templates

