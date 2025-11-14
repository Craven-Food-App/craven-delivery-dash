-- Reset all executives and employees, keep only one board member
-- This ensures executives are NOT employees and clears all existing records

DO $$
DECLARE
  board_member_email TEXT := 'craven@usa.com';
  board_member_user_id UUID;
BEGIN
  -- Get the board member's user_id
  SELECT id INTO board_member_user_id
  FROM auth.users
  WHERE email = board_member_email;

  IF board_member_user_id IS NULL THEN
    RAISE EXCEPTION 'Board member with email % not found', board_member_email;
  END IF;

  -- Step 1: Delete all equity_grants (references exec_users and employees)
  DELETE FROM public.equity_grants;
  RAISE NOTICE 'Deleted all equity_grants';

  -- Step 2: Delete all employee_equity (references employees)
  DELETE FROM public.employee_equity;
  RAISE NOTICE 'Deleted all employee_equity';

  -- Step 3: Delete all board_resolutions that reference employees
  DELETE FROM public.board_resolutions WHERE employee_id IS NOT NULL;
  RAISE NOTICE 'Deleted all board_resolutions referencing employees';

  -- Step 4: Delete all employee_documents
  DELETE FROM public.employee_documents;
  RAISE NOTICE 'Deleted all employee_documents';

  -- Step 5: Delete all executive_documents
  DELETE FROM public.executive_documents;
  RAISE NOTICE 'Deleted all executive_documents';

  -- Step 6: Delete all executive_signatures
  DELETE FROM public.executive_signatures;
  RAISE NOTICE 'Deleted all executive_signatures';

  -- Step 7: Delete all executive_identity records
  DELETE FROM public.executive_identity;
  RAISE NOTICE 'Deleted all executive_identity';

  -- Step 8: Delete all payroll records
  DELETE FROM public.payroll;
  RAISE NOTICE 'Deleted all payroll';

  -- Step 9: Delete all performance_reviews
  DELETE FROM public.performance_reviews;
  RAISE NOTICE 'Deleted all performance_reviews';

  -- Step 10: Delete all employee_history
  DELETE FROM public.employee_history;
  RAISE NOTICE 'Deleted all employee_history';

  -- Step 11: Delete all equity_grant_history
  DELETE FROM public.equity_grant_history;
  RAISE NOTICE 'Deleted all equity_grant_history';

  -- Step 12: Delete all ms365_email_accounts
  DELETE FROM public.ms365_email_accounts;
  RAISE NOTICE 'Deleted all ms365_email_accounts';

  -- Step 13: Delete ALL employees (no exceptions)
  DELETE FROM public.employees;
  RAISE NOTICE 'Deleted ALL employees';

  -- Step 14: Delete ALL exec_users EXCEPT the board member
  DELETE FROM public.exec_users
  WHERE user_id != board_member_user_id;
  RAISE NOTICE 'Deleted all exec_users except board member';

  -- Step 15: Ensure the board member exists in exec_users with board_member role
  INSERT INTO public.exec_users (
    user_id,
    role,
    title,
    department,
    access_level,
    approved_by,
    approved_at
  )
  VALUES (
    board_member_user_id,
    'board_member',
    'Board Member',
    'Board of Directors',
    3, -- Highest access level
    board_member_user_id,
    NOW()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    role = 'board_member',
    title = 'Board Member',
    department = 'Board of Directors',
    access_level = 3,
    approved_at = NOW();

  RAISE NOTICE 'Ensured board member exists in exec_users';

  -- Step 16: Update user_profiles to use admin role (board_member not allowed in check constraint)
  UPDATE public.user_profiles
  SET 
    role = 'admin',
    full_name = 'Torrance Craven'
  WHERE user_id = board_member_user_id;

  RAISE NOTICE 'Updated user_profiles for board member';

  -- Step 17: Ensure no user_roles conflict (clean up old roles)
  DELETE FROM public.user_roles
  WHERE user_id = board_member_user_id AND role != 'admin';

  -- Step 18: Ensure board member has admin role in user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (board_member_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RAISE NOTICE 'Reset complete: All executives and employees deleted. Only board member remains.';
  RAISE NOTICE 'Board Member: % (%)', board_member_email, board_member_user_id;
  
END $$;