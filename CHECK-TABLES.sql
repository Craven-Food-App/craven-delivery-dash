-- Check if customer_orders table exists
SELECT 
  'Table: customer_orders' as check_name,
  CASE WHEN COUNT(*) > 0 THEN 'EXISTS ✅' ELSE 'MISSING ❌' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'customer_orders';

-- List all order-related tables
SELECT 
  'Available Order Tables' as info,
  table_name as table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%order%'
ORDER BY table_name;

