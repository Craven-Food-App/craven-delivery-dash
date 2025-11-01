-- Cleanup all employees except Torrance Stroman, Justin Sweet, and Terri Crawford
-- This will remove all employee data including history, payroll, and performance reviews

BEGIN;

-- Step 1: Delete employee history records for non-C-Suite
DELETE FROM public.employee_history
WHERE employee_id IN (
  SELECT id FROM public.employees
  WHERE NOT (
    (LOWER(first_name) = 'torrance' AND LOWER(last_name) = 'stroman')
    OR (LOWER(first_name) = 'justin' AND LOWER(last_name) = 'sweet')
    OR (LOWER(first_name) = 'terri' AND LOWER(last_name) = 'crawford')
  )
);

-- Step 2: Delete payroll records for non-C-Suite
DELETE FROM public.payroll
WHERE employee_id IN (
  SELECT id FROM public.employees
  WHERE NOT (
    (LOWER(first_name) = 'torrance' AND LOWER(last_name) = 'stroman')
    OR (LOWER(first_name) = 'justin' AND LOWER(last_name) = 'sweet')
    OR (LOWER(first_name) = 'terri' AND LOWER(last_name) = 'crawford')
  )
);

-- Step 3: Delete performance reviews for non-C-Suite
DELETE FROM public.performance_reviews
WHERE employee_id IN (
  SELECT id FROM public.employees
  WHERE NOT (
    (LOWER(first_name) = 'torrance' AND LOWER(last_name) = 'stroman')
    OR (LOWER(first_name) = 'justin' AND LOWER(last_name) = 'sweet')
    OR (LOWER(first_name) = 'terri' AND LOWER(last_name) = 'crawford')
  )
);

-- Step 4: Delete equity records for non-C-Suite (unless they're the 3 we're keeping)
DELETE FROM public.employee_equity
WHERE employee_id IN (
  SELECT id FROM public.employees
  WHERE NOT (
    (LOWER(first_name) = 'torrance' AND LOWER(last_name) = 'stroman')
    OR (LOWER(first_name) = 'justin' AND LOWER(last_name) = 'sweet')
    OR (LOWER(first_name) = 'terri' AND LOWER(last_name) = 'crawford')
  )
);

-- Step 5: Delete MS365 email accounts for non-C-Suite
DELETE FROM public.ms365_email_accounts
WHERE employee_id IN (
  SELECT id FROM public.employees
  WHERE NOT (
    (LOWER(first_name) = 'torrance' AND LOWER(last_name) = 'stroman')
    OR (LOWER(first_name) = 'justin' AND LOWER(last_name) = 'sweet')
    OR (LOWER(first_name) = 'terri' AND LOWER(last_name) = 'crawford')
  )
);

-- Step 5b: Delete board_resolutions for non-C-Suite
DELETE FROM public.board_resolutions
WHERE employee_id IN (
  SELECT id FROM public.employees
  WHERE NOT (
    (LOWER(first_name) = 'torrance' AND LOWER(last_name) = 'stroman')
    OR (LOWER(first_name) = 'justin' AND LOWER(last_name) = 'sweet')
    OR (LOWER(first_name) = 'terri' AND LOWER(last_name) = 'crawford')
  )
);

-- Step 6: Delete exec_user records for non-C-Suite
-- This will only work if exec_users table exists and has a name column
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'exec_users'
  ) AND EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'exec_users' AND column_name = 'name'
  ) THEN
    DELETE FROM public.exec_users 
    WHERE NOT (
      (LOWER(name) LIKE '%torrance%stroman%')
      OR (LOWER(name) LIKE '%justin%sweet%')
      OR (LOWER(name) LIKE '%terri%crawford%')
    );
  END IF;
END $$;

-- Step 7: Delete any employee with employee_number CEO-001
DELETE FROM public.employees
WHERE employee_number = 'CEO-001';

-- Step 8: Finally, delete the employees themselves (non-C-Suite)
DELETE FROM public.employees
WHERE NOT (
  (LOWER(first_name) = 'torrance' AND LOWER(last_name) = 'stroman')
  OR (LOWER(first_name) = 'justin' AND LOWER(last_name) = 'sweet')
  OR (LOWER(first_name) = 'terri' AND LOWER(last_name) = 'crawford')
);

COMMIT;

-- Verification query - show remaining employees
SELECT 
  id,
  first_name,
  last_name,
  email,
  position,
  employment_status,
  salary,
  hire_date
FROM public.employees
ORDER BY first_name, last_name;

-- Show summary
SELECT 
  COUNT(*) as total_remaining_employees,
  COUNT(CASE WHEN employment_status = 'active' THEN 1 END) as active_employees,
  SUM(salary) as total_payroll
FROM public.employees;

