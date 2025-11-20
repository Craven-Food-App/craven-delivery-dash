-- Get the full function definition to verify it's correct
-- This will show the complete function body

SELECT 
  proname as function_name,
  prosrc as function_source_code
FROM pg_proc 
WHERE proname = 'check_all_documents_signed';

-- Alternative: Get formatted definition (might be truncated)
-- SELECT pg_get_functiondef(oid) 
-- FROM pg_proc 
-- WHERE proname = 'check_all_documents_signed';

-- Check what type the variable is declared as
-- Look for "is_formation_mode BOOLEAN" (correct) or "doc_type TEXT" (wrong)

