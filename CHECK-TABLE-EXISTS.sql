-- Quick check: See what HR-related tables exist in production

-- Check if employee_documents table exists
SELECT 
  schemaname, 
  tablename, 
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'employee_documents',
  'board_resolutions',
  'exec_documents',
  'employees',
  'departments',
  'exec_users',
  'ceo_mindmaps',
  'ceo_action_logs',
  'executive_signatures'
)
ORDER BY tablename;

-- Count records in each table
SELECT 'employee_documents' as table_name, COUNT(*) as record_count FROM public.employee_documents
UNION ALL
SELECT 'board_resolutions', COUNT(*) FROM public.board_resolutions
UNION ALL
SELECT 'exec_documents', COUNT(*) FROM public.exec_documents
UNION ALL
SELECT 'employees', COUNT(*) FROM public.employees
UNION ALL
SELECT 'departments', COUNT(*) FROM public.departments
UNION ALL
SELECT 'exec_users', COUNT(*) FROM public.exec_users
UNION ALL
SELECT 'ceo_mindmaps', COUNT(*) FROM public.ceo_mindmaps
UNION ALL
SELECT 'ceo_action_logs', COUNT(*) FROM public.ceo_action_logs
UNION ALL
SELECT 'executive_signatures', COUNT(*) FROM public.executive_signatures;

