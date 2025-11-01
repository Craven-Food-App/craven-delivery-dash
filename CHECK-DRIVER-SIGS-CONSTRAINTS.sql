-- Check if driver_signatures table exists
SELECT 
  'table_exists' as check_name,
  CASE WHEN COUNT(*) > 0 THEN 'YES' ELSE 'NO' END as result
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'driver_signatures';

-- Check all constraints on driver_signatures
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
AND tc.table_name = 'driver_signatures'
GROUP BY tc.constraint_name, tc.constraint_type;

-- Check for UNIQUE constraint specifically
SELECT 
  'unique_constraint_exists' as check_name,
  CASE WHEN COUNT(*) > 0 THEN 'YES' ELSE 'NO' END as result
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
AND table_name = 'driver_signatures' 
AND constraint_type = 'UNIQUE';

