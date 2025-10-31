-- Create COO and CTO Executive Users (FIXED)
-- Run this in Supabase SQL Editor

-- STEP 1: First, check your existing users
SELECT id, email FROM auth.users LIMIT 10;

-- STEP 2: Insert COO record
-- Replace 'craven@usa.com' with your actual email, or use a UUID directly

-- Option A: Using email lookup
INSERT INTO public.exec_users (user_id, role, access_level, title, department) 
SELECT 
  id,
  'coo',
  9,
  'Chief Operating Officer',
  'Operations'
FROM auth.users 
WHERE email = 'craven@usa.com'
ON CONFLICT (user_id) DO UPDATE SET
  role = EXCLUDED.role,
  access_level = EXCLUDED.access_level,
  title = EXCLUDED.title,
  department = EXCLUDED.department;

-- STEP 3: Insert CTO record (using same user, will UPDATE if exists)
-- NOTE: exec_users has UNIQUE(user_id), so you can only have ONE role per user
-- If you want separate COO and CTO, create different users in Supabase Auth first

INSERT INTO public.exec_users (user_id, role, access_level, title, department) 
SELECT 
  id,
  'cto',
  9,
  'Chief Technology Officer',
  'Technology'
FROM auth.users 
WHERE email = 'craven@usa.com'  -- Change this or use different user
ON CONFLICT (user_id) DO UPDATE SET
  role = EXCLUDED.role,
  access_level = EXCLUDED.access_level,
  title = EXCLUDED.title,
  department = EXCLUDED.department;

-- STEP 4: Verify your executives
SELECT 
  eu.id,
  u.email,
  eu.role,
  eu.title,
  eu.department,
  eu.access_level
FROM public.exec_users eu
JOIN auth.users u ON u.id = eu.user_id
ORDER BY eu.role;

-- ALTERNATIVE: If you want to test COO and CTO separately without switching users:
-- 1. Create a second user in Supabase Auth Dashboard
-- 2. Run this with specific UUIDs:

/*
-- Get available user IDs
SELECT id, email FROM auth.users;

-- Then insert with specific UUIDs (replace these):
INSERT INTO public.exec_users (user_id, role, access_level, title, department) VALUES
  ('<YOUR-FIRST-UUID>', 'coo', 9, 'Chief Operating Officer', 'Operations')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.exec_users (user_id, role, access_level, title, department) VALUES
  ('<YOUR-SECOND-UUID>', 'cto', 9, 'Chief Technology Officer', 'Technology')
ON CONFLICT (user_id) DO NOTHING;
*/

