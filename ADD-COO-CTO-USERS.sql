-- Add COO and CTO Users
-- Copy and run in Supabase SQL Editor

-- Step 1: See available users
SELECT id, email FROM auth.users LIMIT 10;

-- Step 2: Make yourself COO
-- Replace 'craven@usa.com' with your email
INSERT INTO public.exec_users (user_id, role, access_level, title, department) 
SELECT id, 'coo', 9, 'Chief Operating Officer', 'Operations'
FROM auth.users 
WHERE email = 'craven@usa.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'coo';

-- Step 3: Verify
SELECT eu.role, u.email, eu.title
FROM public.exec_users eu
JOIN auth.users u ON u.id = eu.user_id
WHERE eu.role = 'coo';

-- Step 4: To test CTO portal, change your role:
UPDATE public.exec_users 
SET role = 'cto', title = 'Chief Technology Officer', department = 'Technology'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'craven@usa.com');

-- Step 5: Verify CTO
SELECT eu.role, u.email, eu.title
FROM public.exec_users eu
JOIN auth.users u ON u.id = eu.user_id
WHERE eu.role = 'cto';

