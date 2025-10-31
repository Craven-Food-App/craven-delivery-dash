-- Create COO and CTO Executive Users
-- Run this in Supabase SQL Editor after deployment

-- STEP 1: First, check your existing users
SELECT id, email FROM auth.users;

-- STEP 2: Insert COO/CTO records
-- Replace the UUIDs with actual user IDs from Step 1
-- You can create new users in Supabase Auth first if needed

-- Example (using your CEO's ID as placeholder):
-- NOTE: Since exec_users has UNIQUE(user_id), each user can only have ONE role
-- If you want the same user to be COO AND CTO, you need to pick one or use different users

-- Option 1: Create separate users for COO and CTO
INSERT INTO public.exec_users (user_id, role, access_level, title, department) VALUES
  (
    (SELECT id FROM auth.users WHERE email = 'craven@usa.com' LIMIT 1),
    'coo', 
    9, 
    'Chief Operating Officer', 
    'Operations'
  )
ON CONFLICT (user_id) DO UPDATE SET
  role = EXCLUDED.role,
  access_level = EXCLUDED.access_level,
  title = EXCLUDED.title,
  department = EXCLUDED.department;

-- For CTO, use a different user or insert separately:
-- INSERT INTO public.exec_users (user_id, role, access_level, title, department) VALUES
--   ('<different-user-uuid>', 'cto', 9, 'Chief Technology Officer', 'Technology')
-- ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

-- STEP 3: Verify
SELECT 
  eu.id,
  u.email,
  eu.role,
  eu.title,
  eu.department,
  eu.access_level
FROM public.exec_users eu
JOIN auth.users u ON u.id = eu.user_id
WHERE eu.role IN ('coo', 'cto')
ORDER BY eu.role;

-- If you want to add yourself as COO/CTO with a different email:
-- First create the user in Supabase Auth Dashboard
-- Then use their UUID here:

/*
INSERT INTO public.exec_users (user_id, role, access_level, title, department) VALUES
  ('<UUID-FROM-AUTH-USERS>', 'coo', 9, 'Chief Operating Officer', 'Operations'),
  ('<UUID-FROM-AUTH-USERS>', 'cto', 9, 'Chief Technology Officer', 'Technology');
*/

