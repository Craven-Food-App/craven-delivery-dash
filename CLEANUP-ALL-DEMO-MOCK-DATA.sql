-- Cleanup All Demo/Mock/Test Data from Production Database
-- WARNING: This will delete ALL demo, mock, test, and sample data
-- Only run this in production after confirming you want to remove all test data

BEGIN;

-- ================================================
-- 1. Delete ALL demo restaurants and their menu items
-- ================================================
-- First try with is_demo column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'restaurants' 
    AND column_name = 'is_demo'
  ) THEN
    DELETE FROM public.menu_items 
    WHERE restaurant_id IN (
      SELECT id FROM public.restaurants WHERE is_demo = true
    );
    
    DELETE FROM public.restaurant_onboarding_progress
    WHERE restaurant_id IN (
      SELECT id FROM public.restaurants WHERE is_demo = true
    );
    
    DELETE FROM public.restaurants WHERE is_demo = true;
  ELSE
    -- Fallback to email pattern if is_demo doesn't exist
    DELETE FROM public.menu_items 
    WHERE restaurant_id IN (
      SELECT id FROM public.restaurants 
      WHERE email = 'demo-restaurants@crave-n.shop' 
      OR email LIKE 'restaurant%@crave-n.shop'
    );
    
    DELETE FROM public.restaurant_onboarding_progress
    WHERE restaurant_id IN (
      SELECT id FROM public.restaurants 
      WHERE email = 'demo-restaurants@crave-n.shop' 
      OR email LIKE 'restaurant%@crave-n.shop'
    );
    
    DELETE FROM public.restaurants 
    WHERE email = 'demo-restaurants@crave-n.shop' 
    OR email LIKE 'restaurant%@crave-n.shop';
  END IF;
END $$;

-- Delete restaurant owners (demo-restaurants@crave-n.shop and restaurant*@crave-n.shop)
DELETE FROM public.user_profiles 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email = 'demo-restaurants@crave-n.shop' 
  OR email LIKE 'restaurant%@crave-n.shop'
);

DELETE FROM auth.users 
WHERE email = 'demo-restaurants@crave-n.shop' 
OR email LIKE 'restaurant%@crave-n.shop';

-- ================================================
-- 2. Delete ALL demo driver applications and related data
-- ================================================

-- Delete demo driver-related data
DELETE FROM public.activation_queue
WHERE driver_id IN (
  SELECT id FROM public.craver_applications 
  WHERE email LIKE '%@example.com' 
  OR email LIKE '%demo%'
);

DELETE FROM public.onboarding_tasks
WHERE driver_id IN (
  SELECT id FROM public.craver_applications 
  WHERE email LIKE '%@example.com' 
  OR email LIKE '%demo%'
);

-- Delete from driver_waitlist if table exists (deprecated table, not used in new system)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'driver_waitlist'
  ) THEN
    DELETE FROM public.driver_waitlist
    WHERE driver_id IN (
      SELECT id FROM public.drivers WHERE email LIKE '%@example.com' 
      OR email LIKE '%demo%'
    );
  END IF;
END $$;

DELETE FROM public.driver_onboarding_progress
WHERE application_id IN (
  SELECT id FROM public.craver_applications 
  WHERE email LIKE '%@example.com' 
  OR email LIKE '%demo%'
);

DELETE FROM public.background_check_reports
WHERE application_id IN (
  SELECT id FROM public.craver_applications 
  WHERE email LIKE '%@example.com' 
  OR email LIKE '%demo%'
);

-- Delete demo driver user profiles
DELETE FROM public.user_profiles
WHERE user_id IN (
  SELECT user_id FROM public.craver_applications 
  WHERE email LIKE '%@example.com' 
  OR email LIKE '%demo%'
);

DELETE FROM auth.users
WHERE email LIKE '%@example.com' 
OR email LIKE '%demo%';

DELETE FROM public.craver_applications 
WHERE email LIKE '%@example.com' 
OR email LIKE '%demo%';

-- ================================================
-- 3. Delete sample board portal data
-- ================================================
DELETE FROM public.exec_messages 
WHERE subject LIKE '%Q1%' 
OR subject LIKE '%Board Meeting Reminder%'
OR subject LIKE '%Strategic Planning%';

DELETE FROM public.board_meetings 
WHERE title LIKE '%Q1%' 
OR title LIKE '%Weekly Sync%'
OR title LIKE '%Budget Approval%';

DELETE FROM public.exec_documents 
WHERE title LIKE '%Q4 2024%' 
OR title LIKE '%Board Meeting Minutes%'
OR title LIKE '%Strategic Plan 2025%'
OR title LIKE '%Employment Contracts Template%'
OR title LIKE '%Legal Compliance Overview%';

DELETE FROM public.exec_metrics 
WHERE metric_name IN ('monthly_revenue', 'order_fulfillment', 'customer_acquisition', 'employee_count')
AND metric_value::text LIKE '%234%';

-- ================================================
-- 4. Delete sample regions (except the real ones you want to keep)
-- ================================================
-- Only delete if they match the demo pattern
DELETE FROM public.regions 
WHERE name IN (
  'Ann Arbor, MI', 'Grand Rapids, MI', 'Akron, OH', 'Dayton, OH'
);

-- ================================================
-- 5. Clean up any remaining test/placeholder data
-- ================================================

-- Delete test orders (if any exist)
DELETE FROM public.orders 
WHERE customer_email LIKE '%@example.com' 
OR customer_email LIKE '%test%';

DELETE FROM public.customer_orders 
WHERE customer_email LIKE '%@example.com' 
OR customer_email LIKE '%test%';

COMMIT;

-- Verification queries
SELECT 'Remaining Restaurants' as category, COUNT(*) as count FROM public.restaurants;
SELECT 'Remaining Drivers' as category, COUNT(*) as count FROM public.craver_applications;
SELECT 'Remaining Board Meetings' as category, COUNT(*) as count FROM public.board_meetings;
SELECT 'Remaining Exec Messages' as category, COUNT(*) as count FROM public.exec_messages;
SELECT 'Remaining Exec Documents' as category, COUNT(*) as count FROM public.exec_documents;
SELECT 'Remaining Exec Metrics' as category, COUNT(*) as count FROM public.exec_metrics;

