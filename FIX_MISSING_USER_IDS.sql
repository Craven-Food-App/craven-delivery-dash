-- ============================================================================
-- FIX MISSING USER_IDS FOR C-LEVEL EMPLOYEES
-- ============================================================================
-- This script helps identify C-level employees without user_id and provides
-- guidance on how to fix them
-- ============================================================================

-- ============================================================================
-- STEP 0: ENSURE USER_ROLES CONSTRAINT ALLOWS EMPLOYEE AND EXECUTIVE
-- ============================================================================
-- Fix constraint first to prevent errors during sync
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_role_check;

ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_role_check 
CHECK (role IN ('admin', 'moderator', 'user', 'employee', 'executive', 'customer', 'driver'));

-- ============================================================================
-- STEP 1: IDENTIFY C-LEVEL EMPLOYEES WITHOUT USER_ID
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '=== C-Level Employees Missing user_id ===';
  RAISE NOTICE 'These employees need auth accounts created and linked.';
END $$;

SELECT 
  e.id as employee_id,
  e.first_name || ' ' || e.last_name as employee_name,
  e.position,
  e.email,
  e.phone,
  e.employee_number,
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = e.email) THEN 
      '✅ Auth account exists - needs linking'
    ELSE 
      '❌ No auth account - needs creation'
  END as auth_status,
  (SELECT id FROM auth.users WHERE email = e.email LIMIT 1) as existing_user_id
FROM public.employees e
WHERE public.is_c_level_position(e.position)
  AND e.user_id IS NULL
ORDER BY e.position, e.last_name;

-- ============================================================================
-- STEP 2: CHECK IF AUTH ACCOUNTS EXIST FOR THESE EMAILS
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Checking for Existing Auth Accounts ===';
END $$;

SELECT 
  e.id as employee_id,
  e.first_name || ' ' || e.last_name as employee_name,
  e.email,
  u.id as auth_user_id,
  u.email as auth_email,
  u.created_at as auth_account_created,
  CASE 
    WHEN u.id IS NOT NULL THEN '✅ Account exists - can link now'
    ELSE '❌ Need to create account'
  END as action
FROM public.employees e
LEFT JOIN auth.users u ON LOWER(u.email) = LOWER(e.email)
WHERE public.is_c_level_position(e.position)
  AND e.user_id IS NULL
ORDER BY e.position, e.last_name;

-- ============================================================================
-- STEP 3: AUTO-LINK EXISTING AUTH ACCOUNTS
-- ============================================================================
-- This will automatically link employees to existing auth accounts by email
DO $$
DECLARE
  linked_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Auto-Linking Employees to Existing Auth Accounts ===';
  
  -- Update employees with matching email addresses
  UPDATE public.employees e
  SET user_id = u.id
  FROM auth.users u
  WHERE LOWER(e.email) = LOWER(u.email)
    AND e.user_id IS NULL
    AND public.is_c_level_position(e.position);
  
  GET DIAGNOSTICS linked_count = ROW_COUNT;
  
  RAISE NOTICE 'Linked % employee(s) to existing auth accounts', linked_count;
  
  IF linked_count > 0 THEN
    RAISE NOTICE '✅ Employees have been linked! Triggers will now sync them automatically.';
  ELSE
    RAISE NOTICE '⚠️ No matching auth accounts found. You need to create auth accounts first.';
    RAISE NOTICE '';
    RAISE NOTICE 'To create auth accounts:';
    RAISE NOTICE '1. Go to Supabase Dashboard → Authentication → Users';
    RAISE NOTICE '2. Click "Add User" → "Create new user"';
    RAISE NOTICE '3. For each employee listed above, enter their email';
    RAISE NOTICE '4. Generate a secure password or send invite';
    RAISE NOTICE '5. Set "Email Confirmed" to true (for C-level executives)';
    RAISE NOTICE '6. Click "Create user"';
    RAISE NOTICE '7. Run this script again to auto-link them';
  END IF;
END $$;

-- ============================================================================
-- STEP 4: MANUAL LINKING INSTRUCTIONS
-- ============================================================================
-- If you need to manually link an employee to a user_id, use:
-- UPDATE public.employees 
-- SET user_id = 'USER_ID_HERE' 
-- WHERE id = 'EMPLOYEE_ID_HERE';

-- ============================================================================
-- STEP 5: VERIFY LINKED EMPLOYEES
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Verification: C-Level Employees Status ===';
END $$;

SELECT 
  'Total C-Level Employees' as metric,
  COUNT(*)::text as value
FROM public.employees
WHERE public.is_c_level_position(position)

UNION ALL

SELECT 
  'C-Level with user_id (after linking)',
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
-- COMPLETION MESSAGE
-- ============================================================================
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM public.employees
  WHERE public.is_c_level_position(position) AND user_id IS NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== Summary ===';
  
  IF missing_count = 0 THEN
    RAISE NOTICE '✅ All C-level employees have user_id values!';
    RAISE NOTICE 'Triggers will automatically sync them to exec_users and user_roles.';
    RAISE NOTICE 'Run VERIFY_ROLE_SYNC_SYSTEM.sql to verify everything is synced.';
  ELSE
    RAISE NOTICE '⚠️ % employee(s) still need auth accounts created', missing_count;
    RAISE NOTICE '';
    RAISE NOTICE '=== Next Steps ===';
    RAISE NOTICE '1. Review the employees listed above that need auth accounts';
    RAISE NOTICE '2. Create auth accounts via Supabase Dashboard:';
    RAISE NOTICE '   - Go to: Authentication → Users → Add User';
    RAISE NOTICE '   - Enter employee email from the query above';
    RAISE NOTICE '   - Generate password or send invite';
    RAISE NOTICE '   - Set "Email Confirmed" = true';
    RAISE NOTICE '   - Click "Create user"';
    RAISE NOTICE '3. Run this script again - it will auto-link the accounts';
    RAISE NOTICE '4. Once linked, triggers will automatically:';
    RAISE NOTICE '   - Create exec_users records';
    RAISE NOTICE '   - Add executive role to user_roles';
    RAISE NOTICE '   - Add employee role to user_roles';
    RAISE NOTICE '5. Run VERIFY_ROLE_SYNC_SYSTEM.sql to confirm all are synced';
  END IF;
END $$;

