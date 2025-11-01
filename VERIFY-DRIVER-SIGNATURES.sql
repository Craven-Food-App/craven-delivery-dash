-- ================================================================
-- VERIFY DRIVER SIGNATURES DEPLOYMENT
-- Run this to check if everything is set up correctly
-- ================================================================

-- Check 1: Table exists
SELECT 
  '✓ Table exists' as status,
  'driver_signatures' as table_name
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'driver_signatures'

UNION ALL

-- Check 2: Unique constraint exists (CRITICAL!)
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✓ Constraint exists'
    ELSE '✗ MISSING: unique_driver_agreement constraint'
  END as status,
  'unique_driver_agreement' as constraint_name
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
AND table_name = 'driver_signatures' 
AND constraint_name = 'unique_driver_agreement'

UNION ALL

-- Check 3: RLS enabled
SELECT 
  CASE 
    WHEN relrowsecurity = true THEN '✓ RLS enabled'
    ELSE '✗ RLS disabled'
  END as status,
  'RLS enabled' as check_name
FROM pg_class 
WHERE relname = 'driver_signatures'

UNION ALL

-- Check 4: Storage bucket exists
SELECT 
  CASE 
    WHEN id IS NOT NULL THEN '✓ Bucket exists'
    ELSE '✗ MISSING: driver-signatures bucket'
  END as status,
  'driver-signatures' as bucket_name
FROM storage.buckets 
WHERE id = 'driver-signatures'

UNION ALL

-- Check 5: Storage policies exist
SELECT 
  CASE 
    WHEN COUNT(*) >= 3 THEN '✓ Storage policies exist'
    ELSE '✗ Missing storage policies'
  END as status,
  CONCAT('Found ', COUNT(*), ' storage policies') as policy_count
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects' 
AND policyname LIKE '%driver%signature%'

UNION ALL

-- Check 6: Table RLS policies exist
SELECT 
  CASE 
    WHEN COUNT(*) >= 3 THEN '✓ Table policies exist'
    ELSE '✗ Missing table policies'
  END as status,
  CONCAT('Found ', COUNT(*), ' RLS policies') as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'driver_signatures';

-- Show detailed storage policies
SELECT 'Storage Policies:' as section;
SELECT 
  policyname,
  cmd as command
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects' 
AND policyname LIKE '%driver%signature%'
ORDER BY policyname;

-- Show detailed table policies
SELECT 'Table Policies:' as section;
SELECT 
  policyname,
  cmd as command
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'driver_signatures'
ORDER BY policyname;

