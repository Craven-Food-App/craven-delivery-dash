-- COMPREHENSIVE ONBOARDING SYSTEM DIAGNOSTIC SCAN
-- This checks the current state without making any changes

-- ==============================================
-- SECTION 1: VERIFY CORRECT USER & APPLICATION
-- ==============================================
SELECT '=== USER & APPLICATION VERIFICATION ===' as section;

-- Check the logged-in user
SELECT 
  'Current User' as check_type,
  auth.uid() as user_id,
  CASE 
    WHEN auth.uid() IS NULL THEN '❌ NOT LOGGED IN'
    WHEN auth.uid() = '93a342c6-9dc2-4bf6-ab1c-0dc1d17148cd'::UUID THEN '✅ CORRECT USER (craven@usa.com)'
    ELSE '⚠️ DIFFERENT USER'
  END as status;

-- Check the driver application for this user
SELECT 
  'Driver Application' as check_type,
  ca.id as application_id,
  ca.user_id,
  ca.first_name || ' ' || ca.last_name as full_name,
  ca.email,
  ca.status,
  ca.points,
  ca.priority_score,
  ca.region_id,
  CASE 
    WHEN ca.id = '66533fc5-d8b7-4a38-9c3a-f3ac7804205a'::UUID THEN '✅ CORRECT APPLICATION'
    ELSE '⚠️ DIFFERENT APPLICATION'
  END as verification
FROM public.craver_applications ca
WHERE ca.user_id = '93a342c6-9dc2-4bf6-ab1c-0dc1d17148cd'::UUID;

-- ==============================================
-- SECTION 2: ONBOARDING TASKS STATUS
-- ==============================================
SELECT '=== ONBOARDING TASKS STATUS ===' as section;

-- Count tasks for the correct application
SELECT 
  'Task Count' as check_type,
  COUNT(*) as total_tasks,
  COUNT(CASE WHEN completed = true THEN 1 END) as completed_tasks,
  COUNT(CASE WHEN completed = false THEN 1 END) as pending_tasks,
  SUM(points_reward) as total_possible_points,
  SUM(CASE WHEN completed = true THEN points_reward ELSE 0 END) as earned_points
FROM public.onboarding_tasks
WHERE driver_id = '66533fc5-d8b7-4a38-9c3a-f3ac7804205a'::UUID;

-- List all tasks for this driver
SELECT 
  'Individual Tasks' as check_type,
  task_key,
  task_name,
  points_reward,
  completed,
  completed_at,
  created_at
FROM public.onboarding_tasks
WHERE driver_id = '66533fc5-d8b7-4a38-9c3a-f3ac7804205a'::UUID
ORDER BY points_reward DESC, task_name;

-- ==============================================
-- SECTION 3: ACTIVATION QUEUE STATUS
-- ==============================================
SELECT '=== ACTIVATION QUEUE STATUS ===' as section;

-- Check if driver is in activation queue
SELECT 
  'Queue Status' as check_type,
  aq.id as queue_entry_id,
  aq.driver_id,
  aq.region_id,
  aq.priority_score as queue_priority_score,
  CASE 
    WHEN aq.driver_id IS NOT NULL THEN '✅ IN QUEUE'
    ELSE '❌ NOT IN QUEUE'
  END as status
FROM public.activation_queue aq
WHERE aq.driver_id = '66533fc5-d8b7-4a38-9c3a-f3ac7804205a'::UUID;

-- ==============================================
-- SECTION 4: REGION & QUEUE POSITION
-- ==============================================
SELECT '=== REGION & QUEUE POSITION ===' as section;

-- Test the queue position function
SELECT 
  'Queue Position Function' as check_type,
  queue_position,
  total_in_region,
  region_name,
  CASE 
    WHEN queue_position IS NOT NULL THEN '✅ FUNCTION WORKING'
    ELSE '❌ FUNCTION FAILED'
  END as status
FROM get_driver_queue_position('66533fc5-d8b7-4a38-9c3a-f3ac7804205a'::UUID);

-- Check region details
SELECT 
  'Region Details' as check_type,
  r.id,
  r.name,
  r.zip_prefix,
  r.status as region_status,
  r.active_quota,
  (SELECT COUNT(*) FROM public.activation_queue WHERE region_id = r.id) as drivers_in_queue
FROM public.regions r
WHERE r.id = (
  SELECT region_id FROM public.craver_applications 
  WHERE id = '66533fc5-d8b7-4a38-9c3a-f3ac7804205a'::UUID
);

-- ==============================================
-- SECTION 5: TABLE STRUCTURE VERIFICATION
-- ==============================================
SELECT '=== TABLE STRUCTURE VERIFICATION ===' as section;

-- Check activation_queue table structure
SELECT 
  'Activation Queue Columns' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'activation_queue' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check onboarding_tasks table structure
SELECT 
  'Onboarding Tasks Columns' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'onboarding_tasks' AND table_schema = 'public'
ORDER BY ordinal_position;

-- ==============================================
-- SECTION 6: SYSTEM INTEGRITY CHECKS
-- ==============================================
SELECT '=== SYSTEM INTEGRITY CHECKS ===' as section;

-- Check if functions exist
SELECT 
  'Functions Check' as check_type,
  routine_name,
  '✅ EXISTS' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('create_default_onboarding_tasks', 'get_driver_queue_position', 'calculate_waitlist_position')
ORDER BY routine_name;

-- Check if triggers exist
SELECT 
  'Triggers Check' as check_type,
  trigger_name,
  event_manipulation,
  event_object_table,
  '✅ EXISTS' as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND trigger_name IN ('update_priority_on_task_complete', 'update_priority_on_referral', 'set_waitlist_position_trigger')
ORDER BY trigger_name;

-- Check RLS policies
SELECT 
  'RLS Policies Check' as check_type,
  tablename,
  policyname,
  '✅ EXISTS' as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('onboarding_tasks', 'activation_queue', 'regions', 'driver_referrals')
ORDER BY tablename, policyname;

-- ==============================================
-- SECTION 7: FINAL SUMMARY
-- ==============================================
SELECT '=== DIAGNOSTIC SUMMARY ===' as section;

SELECT 
  'System Status' as check_type,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.onboarding_tasks WHERE driver_id = '66533fc5-d8b7-4a38-9c3a-f3ac7804205a'::UUID) >= 9 
    THEN '✅ TASKS CREATED'
    ELSE '❌ TASKS MISSING'
  END as task_status,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.activation_queue WHERE driver_id = '66533fc5-d8b7-4a38-9c3a-f3ac7804205a'::UUID) > 0
    THEN '✅ IN QUEUE' 
    ELSE '❌ NOT IN QUEUE'
  END as queue_status,
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name = 'get_driver_queue_position') > 0
    THEN '✅ FUNCTIONS OK'
    ELSE '❌ FUNCTIONS MISSING'
  END as functions_status;
