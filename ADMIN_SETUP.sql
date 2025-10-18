-- ADMIN SETUP INSTRUCTIONS
-- Run this SQL in your Supabase SQL Editor to grant admin access

-- Step 1: Find your user ID (replace 'your-email@example.com' with your actual email)
-- SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Step 2: Grant admin role (replace 'YOUR-USER-ID-HERE' with the ID from Step 1)
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('YOUR-USER-ID-HERE', 'admin')
-- ON CONFLICT (user_id, role) DO NOTHING;

-- Alternative: Grant admin role to ALL existing users (for testing only!)
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'admin' FROM auth.users
-- ON CONFLICT (user_id, role) DO NOTHING;

-- Step 3: Verify admin role was added
-- SELECT ur.*, u.email 
-- FROM public.user_roles ur
-- JOIN auth.users u ON ur.user_id = u.id
-- WHERE ur.role = 'admin';

-- TROUBLESHOOTING QUERIES:

-- Check if user_roles table exists
-- SELECT * FROM information_schema.tables WHERE table_name = 'user_roles';

-- Check current user's roles
-- SELECT * FROM public.user_roles WHERE user_id = auth.uid();

-- Check has_role function exists
-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_name = 'has_role' AND routine_schema = 'public';

-- Test the has_role function (should return true if you have admin role)
-- SELECT public.has_role(auth.uid(), 'admin');

