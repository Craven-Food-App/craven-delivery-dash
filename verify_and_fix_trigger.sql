-- Verify and fix the trigger function
-- Run this in Supabase Dashboard SQL Editor

-- 1. First, verify the function is correct
SELECT 
  proname,
  CASE 
    WHEN prosrc LIKE '%is_formation_mode BOOLEAN%' THEN 'CORRECT - Has BOOLEAN type'
    WHEN prosrc LIKE '%doc_type TEXT%' THEN 'WRONG - Still has TEXT type'
    ELSE 'UNKNOWN - Check manually'
  END as function_status
FROM pg_proc 
WHERE proname = 'check_all_documents_signed';

-- 2. Drop and recreate the trigger to ensure it's using the latest function
DROP TRIGGER IF EXISTS trigger_document_signed ON public.executive_documents;

CREATE TRIGGER trigger_document_signed
  AFTER UPDATE OF signature_status ON public.executive_documents
  FOR EACH ROW
  WHEN (NEW.signature_status = 'signed' AND (OLD.signature_status IS NULL OR OLD.signature_status != 'signed'))
  EXECUTE FUNCTION public.handle_document_signed();

-- 3. Verify the trigger was created
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as enabled
FROM pg_trigger
WHERE tgname = 'trigger_document_signed';

-- 4. Test the function with a sample (optional - replace with actual appointment ID)
-- SELECT public.check_all_documents_signed('YOUR_APPOINTMENT_ID_HERE');

