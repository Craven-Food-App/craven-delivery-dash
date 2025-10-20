-- Quick test to see if the fix was applied
-- Run this in Supabase SQL Editor

-- 1. Check if policies exist
SELECT 
  'Policies Check' as test,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ Policies exist'
    ELSE '❌ Policies missing - run the migration!'
  END as status
FROM pg_policies 
WHERE tablename = 'driver_support_chats';

-- 2. Check current user role
SELECT 
  'Your Role' as test,
  COALESCE(role, 'NO PROFILE') as your_role,
  CASE 
    WHEN role = 'admin' THEN '✅ You are admin'
    ELSE '❌ You need admin role!'
  END as status
FROM user_profiles 
WHERE user_id = auth.uid();

-- 3. Test if you can select chats (will return error if RLS blocks you)
SELECT 
  'Can Access Chats' as test,
  COUNT(*) as chat_count,
  '✅ Access granted' as status
FROM driver_support_chats;

-- 4. Test the join with user_profiles
SELECT 
  'Can Join Profiles' as test,
  COUNT(*) as profile_count,
  '✅ Join works' as status
FROM driver_support_chats dsc
LEFT JOIN user_profiles up ON up.user_id = dsc.driver_id;

