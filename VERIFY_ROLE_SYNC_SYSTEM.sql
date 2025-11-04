-- ============================================================================
-- VERIFY AND FIX ROLE SYNCHRONIZATION SYSTEM
-- ============================================================================
-- This script checks the current state and ensures all C-level employees
-- are properly recognized and synced to exec_users and user_roles
-- Run this in Supabase Dashboard SQL Editor
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
-- STEP 1: CHECK IF FUNCTIONS EXIST
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '=== Checking Database Functions ===';
  
  -- Check is_c_level_position function
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'is_c_level_position'
  ) THEN
    RAISE NOTICE '✓ is_c_level_position function exists';
  ELSE
    RAISE NOTICE '✗ is_c_level_position function MISSING - run APPLY_ROLE_SYNC_SYSTEM.sql';
  END IF;
  
  -- Check position_to_exec_role function
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'position_to_exec_role'
  ) THEN
    RAISE NOTICE '✓ position_to_exec_role function exists';
  ELSE
    RAISE NOTICE '✗ position_to_exec_role function MISSING - run APPLY_ROLE_SYNC_SYSTEM.sql';
  END IF;
  
  -- Check get_department_name function
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'get_department_name'
  ) THEN
    RAISE NOTICE '✓ get_department_name function exists';
  ELSE
    RAISE NOTICE '✗ get_department_name function MISSING - run APPLY_ROLE_SYNC_SYSTEM.sql';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: CHECK IF TRIGGERS EXIST
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '=== Checking Database Triggers ===';
  
  -- Check sync_employee_to_exec_users trigger
  IF EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'trigger_sync_employee_to_exec_users'
  ) THEN
    RAISE NOTICE '✓ trigger_sync_employee_to_exec_users exists';
  ELSE
    RAISE NOTICE '✗ trigger_sync_employee_to_exec_users MISSING - run APPLY_ROLE_SYNC_SYSTEM.sql';
  END IF;
  
  -- Check sync_employee_to_user_roles trigger
  IF EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'trigger_sync_employee_to_user_roles'
  ) THEN
    RAISE NOTICE '✓ trigger_sync_employee_to_user_roles exists';
  ELSE
    RAISE NOTICE '✗ trigger_sync_employee_to_user_roles MISSING - run APPLY_ROLE_SYNC_SYSTEM.sql';
  END IF;
  
  -- Check handle_employee_position_change trigger
  IF EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'trigger_handle_position_change'
  ) THEN
    RAISE NOTICE '✓ trigger_handle_position_change exists';
  ELSE
    RAISE NOTICE '✗ trigger_handle_position_change MISSING - run APPLY_ROLE_SYNC_SYSTEM.sql';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: IDENTIFY C-LEVEL EMPLOYEES AND THEIR STATUS
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '=== C-Level Employee Status Report ===';
END $$;

-- Create a comprehensive report
SELECT 
  e.id as employee_id,
  e.first_name || ' ' || e.last_name as employee_name,
  e.position,
  e.email,
  e.user_id,
  CASE 
    WHEN e.user_id IS NULL THEN '❌ Missing user_id (no auth account)'
    WHEN eu.id IS NULL THEN '⚠️ Missing exec_users record'
    WHEN ur_exec.id IS NULL THEN '⚠️ Missing executive role in user_roles'
    WHEN ur_emp.id IS NULL THEN '⚠️ Missing employee role in user_roles'
    ELSE '✅ Fully synced'
  END as sync_status,
  eu.role as exec_role,
  eu.department as exec_department,
  eu.title as exec_title,
  CASE 
    WHEN e.user_id IS NULL THEN 'Create auth account, then update employees.user_id'
    WHEN eu.id IS NULL THEN 'Will be auto-created by trigger OR run backfill'
    WHEN ur_exec.id IS NULL THEN 'Will be auto-created by trigger OR run backfill'
    ELSE 'No action needed'
  END as action_needed
FROM public.employees e
LEFT JOIN public.exec_users eu ON eu.user_id = e.user_id
LEFT JOIN public.user_roles ur_exec ON ur_exec.user_id = e.user_id AND ur_exec.role = 'executive'
LEFT JOIN public.user_roles ur_emp ON ur_emp.user_id = e.user_id AND ur_emp.role = 'employee'
WHERE public.is_c_level_position(e.position)
ORDER BY 
  CASE 
    WHEN e.user_id IS NULL THEN 1
    WHEN eu.id IS NULL THEN 2
    WHEN ur_exec.id IS NULL THEN 3
    ELSE 4
  END,
  e.position,
  e.last_name;

-- ============================================================================
-- STEP 4: AUTO-FIX MISSING RECORDS
-- ============================================================================
-- Fix 1: Create exec_users records for C-level employees that have user_id but no exec_users record
INSERT INTO public.exec_users (user_id, role, department, title, access_level)
SELECT 
  e.user_id,
  public.position_to_exec_role(e.position) as role,
  public.get_department_name(e.department_id) as department,
  e.position as title,
  1 as access_level
FROM public.employees e
WHERE e.user_id IS NOT NULL
  AND public.is_c_level_position(e.position)
  AND public.position_to_exec_role(e.position) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.exec_users eu 
    WHERE eu.user_id = e.user_id
  )
ON CONFLICT (user_id) DO UPDATE SET
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  title = EXCLUDED.title,
  updated_at = now();

-- Fix 2: Ensure all employees have 'employee' role in user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT
  e.user_id,
  'employee' as role
FROM public.employees e
WHERE e.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = e.user_id AND ur.role = 'employee'
  )
ON CONFLICT (user_id, role) DO NOTHING;

-- Fix 3: Ensure all C-level employees have 'executive' role in user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT
  e.user_id,
  'executive' as role
FROM public.employees e
WHERE e.user_id IS NOT NULL
  AND public.is_c_level_position(e.position)
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = e.user_id AND ur.role = 'executive'
  )
ON CONFLICT (user_id, role) DO NOTHING;

-- Fix 4: Update existing exec_users records with correct roles and departments
UPDATE public.exec_users eu
SET 
  role = public.position_to_exec_role(e.position),
  department = public.get_department_name(e.department_id),
  title = e.position,
  updated_at = now()
FROM public.employees e
WHERE eu.user_id = e.user_id
  AND e.user_id IS NOT NULL
  AND public.is_c_level_position(e.position)
  AND (
    eu.role != public.position_to_exec_role(e.position) OR
    eu.title != e.position OR
    eu.department != public.get_department_name(e.department_id)
  );

-- ============================================================================
-- STEP 5: FINAL STATUS REPORT
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '=== Final Status After Fixes ===';
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
  'C-Level with employee role',
  COUNT(*)::text
FROM public.employees e
JOIN public.user_roles ur ON ur.user_id = e.user_id AND ur.role = 'employee'
WHERE public.is_c_level_position(e.position)

UNION ALL

SELECT 
  '⚠️ Missing user_id',
  COUNT(*)::text
FROM public.employees
WHERE public.is_c_level_position(position) AND user_id IS NULL

UNION ALL

SELECT 
  '⚠️ Missing exec_users record',
  COUNT(*)::text
FROM public.employees e
LEFT JOIN public.exec_users eu ON eu.user_id = e.user_id
WHERE public.is_c_level_position(e.position) AND e.user_id IS NOT NULL AND eu.id IS NULL;

-- ============================================================================
-- STEP 6: LIST ALL RECOGNIZED C-LEVEL EMPLOYEES
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '=== All Recognized C-Level Executives ===';
END $$;

SELECT 
  eu.role,
  COALESCE(eu.title, e.position) as position,
  eu.department,
  e.first_name || ' ' || e.last_name as name,
  e.email,
  CASE 
    WHEN ur_exec.id IS NOT NULL THEN 'Yes'
    ELSE 'No'
  END as has_executive_role,
  eu.created_at as synced_at
FROM public.exec_users eu
JOIN public.employees e ON e.user_id = eu.user_id
LEFT JOIN public.user_roles ur_exec ON ur_exec.user_id = eu.user_id AND ur_exec.role = 'executive'
WHERE public.is_c_level_position(e.position)
ORDER BY 
  CASE eu.role
    WHEN 'ceo' THEN 1
    WHEN 'cfo' THEN 2
    WHEN 'coo' THEN 3
    WHEN 'cto' THEN 4
    ELSE 5
  END,
  eu.title,
  e.last_name;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '=== Verification Complete ===';
  RAISE NOTICE 'Review the reports above to ensure all C-level employees are recognized.';
  RAISE NOTICE 'If any employees are missing user_id, create auth accounts for them first.';
  RAISE NOTICE 'The triggers will automatically sync new/modified employees going forward.';
END $$;

