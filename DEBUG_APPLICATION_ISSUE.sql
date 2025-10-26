-- Debug script to check application data and user relationships
-- This will help us understand why the onboarding dashboard can't find the application

-- 1. Check if the user exists in auth.users
SELECT 
  'Auth User Check' as check_type,
  id,
  email,
  created_at
FROM auth.users 
WHERE email = 'craven@usa.com';

-- 2. Check if there are any applications for this user
SELECT 
  'Application Check' as check_type,
  id,
  user_id,
  first_name,
  last_name,
  email,
  status,
  created_at
FROM public.craver_applications 
WHERE email = 'craven@usa.com';

-- 3. Check if there are any applications with the specific application ID we know
SELECT 
  'Application by ID' as check_type,
  id,
  user_id,
  first_name,
  last_name,
  email,
  status,
  created_at
FROM public.craver_applications 
WHERE id = '66533fc5-d8b7-4a38-9c3a-f3ac7804205a';

-- 4. Check if there are any onboarding tasks for this application
SELECT 
  'Onboarding Tasks Check' as check_type,
  COUNT(*) as task_count,
  driver_id
FROM public.onboarding_tasks 
WHERE driver_id = '66533fc5-d8b7-4a38-9c3a-f3ac7804205a'
GROUP BY driver_id;

-- 5. Check if the user_id in the application matches the auth user
SELECT 
  'User ID Mismatch Check' as check_type,
  ca.id as application_id,
  ca.user_id as app_user_id,
  au.id as auth_user_id,
  ca.email as app_email,
  au.email as auth_email,
  CASE 
    WHEN ca.user_id = au.id THEN 'MATCH' 
    ELSE 'MISMATCH' 
  END as user_id_status
FROM public.craver_applications ca
LEFT JOIN auth.users au ON au.email = ca.email
WHERE ca.id = '66533fc5-d8b7-4a38-9c3a-f3ac7804205a';

-- 6. If there's a mismatch, show what the correct user_id should be
SELECT 
  'Correct User ID' as check_type,
  au.id as correct_user_id,
  au.email,
  ca.id as application_id
FROM auth.users au
CROSS JOIN public.craver_applications ca
WHERE au.email = 'craven@usa.com' 
  AND ca.id = '66533fc5-d8b7-4a38-9c3a-f3ac7804205a';
