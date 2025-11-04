-- ============================================================================
-- CREATE AUTH ACCOUNTS FOR C-LEVEL EMPLOYEES MISSING USER_ID
-- ============================================================================
-- This script identifies employees without auth accounts and provides
-- the exact SQL needed to create them via Supabase Admin API or Dashboard
-- ============================================================================

-- ============================================================================
-- STEP 1: IDENTIFY EMPLOYEES NEEDING AUTH ACCOUNTS
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '=== C-Level Employees Needing Auth Accounts ===';
  RAISE NOTICE 'These employees need auth accounts created in Supabase Auth.';
END $$;

SELECT 
  e.id as employee_id,
  e.first_name || ' ' || e.last_name as employee_name,
  e.position,
  e.email,
  e.phone,
  e.employee_number,
  'Needs auth account creation' as action_needed
FROM public.employees e
WHERE public.is_c_level_position(e.position)
  AND e.user_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM auth.users u 
    WHERE LOWER(u.email) = LOWER(e.email)
  )
ORDER BY e.position, e.last_name;

-- ============================================================================
-- STEP 2: GENERATE AUTH USER CREATION COMMANDS
-- ============================================================================
-- Note: These commands need to be run via Supabase Admin API or Dashboard
-- Supabase Dashboard: Authentication → Users → Add User
-- 
-- For each employee above, create an auth user with:
--   - Email: (use the email from the query above)
--   - Password: Generate a secure temporary password
--   - Email Confirmed: true (for C-level executives)
--
-- After creating each auth account, run the linking command below
-- ============================================================================

-- ============================================================================
-- STEP 3: MANUAL LINKING COMMANDS (RUN AFTER CREATING AUTH ACCOUNTS)
-- ============================================================================
-- Replace EMPLOYEE_EMAIL and USER_ID with actual values from auth.users
-- Run these AFTER creating the auth accounts via Dashboard

/*
-- Example linking commands (replace values):
UPDATE public.employees 
SET user_id = (SELECT id FROM auth.users WHERE email = 'employee@example.com' LIMIT 1)
WHERE email = 'employee@example.com' 
  AND user_id IS NULL
  AND public.is_c_level_position(position);

-- Or use the employee_id directly:
UPDATE public.employees 
SET user_id = 'USER_ID_FROM_AUTH_USERS_TABLE'
WHERE id = 'EMPLOYEE_ID_FROM_ABOVE_QUERY'
  AND user_id IS NULL;
*/

-- ============================================================================
-- STEP 4: AUTO-LINK AFTER AUTH ACCOUNTS ARE CREATED
-- ============================================================================
-- Once you've created auth accounts via Dashboard, run this to auto-link:
DO $$
DECLARE
  linked_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Auto-Linking Employees to Auth Accounts ===';
  
  -- Update employees with matching email addresses
  UPDATE public.employees e
  SET user_id = u.id
  FROM auth.users u
  WHERE LOWER(e.email) = LOWER(u.email)
    AND e.user_id IS NULL
    AND public.is_c_level_position(e.position);
  
  GET DIAGNOSTICS linked_count = ROW_COUNT;
  
  RAISE NOTICE 'Linked % employee(s) to auth accounts', linked_count;
  
  IF linked_count > 0 THEN
    RAISE NOTICE '✅ Employees have been linked!';
    RAISE NOTICE 'Triggers will now automatically:';
    RAISE NOTICE '  - Create exec_users records';
    RAISE NOTICE '  - Add executive role to user_roles';
    RAISE NOTICE '  - Add employee role to user_roles';
  ELSE
    RAISE NOTICE '⚠️ No employees were linked. Make sure auth accounts exist first.';
  END IF;
END $$;

-- ============================================================================
-- STEP 5: VERIFY FINAL STATUS
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Final Verification ===';
END $$;

SELECT 
  'Total C-Level Employees' as metric,
  COUNT(*)::text as value
FROM public.employees
WHERE public.is_c_level_position(position)

UNION ALL

SELECT 
  'C-Level with user_id',
  COUNT(*)::text
FROM public.employees
WHERE public.is_c_level_position(position) AND user_id IS NOT NULL

UNION ALL

SELECT 
  'C-Level in exec_users',
  COUNT(*)::text
FROM public.employees e
JOIN public.exec_users eu ON eu.user_id = e.user_id
WHERE public.is_c_level_position(e.position)

UNION ALL

SELECT 
  'C-Level with executive role',
  COUNT(*)::text
FROM public.employees e
JOIN public.user_roles ur ON ur.user_id = e.user_id AND ur.role = 'executive'
WHERE public.is_c_level_position(e.position)

UNION ALL

SELECT 
  '⚠️ Still missing user_id',
  COUNT(*)::text
FROM public.employees
WHERE public.is_c_level_position(position) AND user_id IS NULL;

-- ============================================================================
-- INSTRUCTIONS FOR CREATING AUTH ACCOUNTS
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== How to Create Auth Accounts ===';
  RAISE NOTICE '';
  RAISE NOTICE 'Option 1: Via Supabase Dashboard';
  RAISE NOTICE '1. Go to Supabase Dashboard → Authentication → Users';
  RAISE NOTICE '2. Click "Add User" → "Create new user"';
  RAISE NOTICE '3. Enter the employee email from the query above';
  RAISE NOTICE '4. Generate a secure password (or send invite)';
  RAISE NOTICE '5. Set "Email Confirmed" to true';
  RAISE NOTICE '6. Click "Create user"';
  RAISE NOTICE '7. Run this script again to auto-link';
  RAISE NOTICE '';
  RAISE NOTICE 'Option 2: Via Supabase Admin API';
  RAISE NOTICE 'Use the admin.users.create() method with the employee email';
  RAISE NOTICE '';
  RAISE NOTICE 'After creating auth accounts, the auto-link script above will';
  RAISE NOTICE 'automatically connect them to employees and sync all roles.';
END $$;

