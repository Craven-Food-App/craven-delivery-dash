-- Fix the user_id in the craver_applications table
-- This will ensure the application is properly linked to the authenticated user

-- First, let's see what we're working with
SELECT 
  'Before Fix' as status,
  ca.id as application_id,
  ca.user_id as current_user_id,
  ca.email as application_email,
  au.id as auth_user_id,
  au.email as auth_email
FROM public.craver_applications ca
LEFT JOIN auth.users au ON au.email = ca.email
WHERE ca.id = '66533fc5-d8b7-4a38-9c3a-f3ac7804205a';

-- Update the application with the correct user_id
UPDATE public.craver_applications 
SET user_id = (
  SELECT id FROM auth.users WHERE email = 'craven@usa.com'
)
WHERE id = '66533fc5-d8b7-4a38-9c3a-f3ac7804205a';

-- Verify the fix
SELECT 
  'After Fix' as status,
  ca.id as application_id,
  ca.user_id as current_user_id,
  ca.email as application_email,
  au.id as auth_user_id,
  au.email as auth_email,
  CASE 
    WHEN ca.user_id = au.id THEN 'FIXED - MATCH' 
    ELSE 'STILL MISMATCHED' 
  END as fix_status
FROM public.craver_applications ca
LEFT JOIN auth.users au ON au.id = ca.user_id
WHERE ca.id = '66533fc5-d8b7-4a38-9c3a-f3ac7804205a';

-- Also ensure onboarding tasks exist for this application
-- (This will be handled by the trigger, but let's make sure)
SELECT create_default_onboarding_tasks('66533fc5-d8b7-4a38-9c3a-f3ac7804205a'::UUID);

-- Check that tasks were created
SELECT 
  'Onboarding Tasks Created' as status,
  COUNT(*) as task_count,
  driver_id
FROM public.onboarding_tasks 
WHERE driver_id = '66533fc5-d8b7-4a38-9c3a-f3ac7804205a'
GROUP BY driver_id;
