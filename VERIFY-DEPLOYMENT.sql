-- Verify Business Systems Deployment
-- Run this in Supabase SQL Editor to check everything was created

-- Check all COO/CTO tables
SELECT 'COO/CTO Tables' as category, table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'operations_metrics', 
    'fleet_vehicles', 
    'compliance_records', 
    'partner_vendors',
    'it_infrastructure', 
    'it_incidents', 
    'it_assets',
    'security_audits'
  )
ORDER BY table_name;

-- Check Procurement tables
SELECT 'Procurement Tables' as category, table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'procurement_categories',
    'purchase_orders',
    'vendor_contracts',
    'procurement_requisitions'
  )
ORDER BY table_name;

-- Check Marketing tables
SELECT 'Marketing Tables' as category, table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'marketing_campaigns',
    'marketing_metrics',
    'customer_acquisition'
  )
ORDER BY table_name;

-- Check Legal/Compliance tables
SELECT 'Legal Tables' as category, table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'legal_documents',
    'legal_reviews',
    'compliance_tracking',
    'risk_assessments'
  )
ORDER BY table_name;

-- Check Views created
SELECT 'Views' as category, table_name as view_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN (
    'budget_approval_status',
    'payroll_summary',
    'campaign_performance'
  )
ORDER BY view_name;

-- Check Functions created
SELECT 'Functions' as category, routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'create_budget_approval',
    'generate_payroll_invoice',
    'calculate_marketing_roi',
    'alert_expiring_contracts'
  )
ORDER BY routine_name;

-- Check sample data
SELECT 'Sample Data - IT Infrastructure' as category, service_name, status 
FROM public.it_infrastructure 
ORDER BY service_name;

SELECT 'Sample Data - Procurement Categories' as category, category_name, budget_allocated
FROM public.procurement_categories
ORDER BY category_name;

