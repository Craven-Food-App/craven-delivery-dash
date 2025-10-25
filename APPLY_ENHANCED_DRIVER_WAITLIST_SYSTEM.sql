-- Enhanced Driver Onboarding & Waitlist System
-- Complete implementation with regions, points, and priority queue management
-- Run this in the Supabase SQL Editor to enable the enhanced system

-- Step 1: Apply the enhanced waitlist system migration
\i supabase/migrations/20250120000008_enhanced_driver_waitlist_system.sql

-- Step 2: Apply demo data (optional - for testing)
\i supabase/migrations/20250120000009_demo_data_setup.sql

-- Step 3: Verify the system is working
SELECT 'Enhanced Driver Waitlist System setup completed!' as status;

-- Show system overview
SELECT 
  'System Overview' as section,
  COUNT(DISTINCT r.id) as total_regions,
  COUNT(DISTINCT ca.id) as total_drivers,
  COUNT(CASE WHEN ca.status = 'approved' THEN 1 END) as active_drivers,
  COUNT(CASE WHEN ca.status = 'waitlist' THEN 1 END) as waitlist_drivers,
  AVG(ca.points) as avg_points,
  AVG(ca.priority_score) as avg_priority_score
FROM public.regions r
LEFT JOIN public.craver_applications ca ON ca.region_id = r.id;

-- Show region breakdown
SELECT 
  'Region Breakdown' as section,
  r.name as region,
  r.status,
  r.active_quota,
  COUNT(ca.id) as total_drivers,
  COUNT(CASE WHEN ca.status = 'approved' THEN 1 END) as active_drivers,
  COUNT(CASE WHEN ca.status = 'waitlist' THEN 1 END) as waitlist_drivers,
  ROUND(
    (COUNT(CASE WHEN ca.status = 'approved' THEN 1 END)::float / r.active_quota * 100), 
    2
  ) as capacity_percentage
FROM public.regions r
LEFT JOIN public.craver_applications ca ON ca.region_id = r.id
GROUP BY r.id, r.name, r.status, r.active_quota
ORDER BY r.name;

-- Show top drivers by priority score
SELECT 
  'Top Drivers by Priority' as section,
  ca.first_name,
  ca.last_name,
  ca.city,
  ca.state,
  ca.points,
  ca.priority_score,
  ca.waitlist_position,
  r.name as region
FROM public.craver_applications ca
JOIN public.regions r ON ca.region_id = r.id
WHERE ca.status = 'waitlist'
ORDER BY ca.priority_score DESC, ca.created_at ASC
LIMIT 10;

-- Show onboarding task completion rates
SELECT 
  'Onboarding Progress' as section,
  ot.task_name,
  COUNT(*) as total_tasks,
  COUNT(CASE WHEN ot.completed THEN 1 END) as completed_tasks,
  ROUND(
    (COUNT(CASE WHEN ot.completed THEN 1 END)::float / COUNT(*) * 100), 
    2
  ) as completion_rate
FROM public.onboarding_tasks ot
GROUP BY ot.task_name
ORDER BY completion_rate DESC;

-- Show referral activity
SELECT 
  'Referral Activity' as section,
  COUNT(DISTINCT referrer.id) as drivers_with_referrals,
  COUNT(DISTINCT referee.id) as referred_drivers,
  COUNT(DISTINCT dr.id) as total_referral_relationships
FROM public.craver_applications referrer
LEFT JOIN public.driver_referrals dr ON dr.referrer_id = referrer.id
LEFT JOIN public.craver_applications referee ON referee.referred_by = referrer.id;

-- Final verification
SELECT 'Enhanced Driver Waitlist System is ready for testing!' as final_status;

