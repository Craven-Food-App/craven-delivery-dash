-- Reset all executives except Torrance Stroman
-- Torrance will be set as board_member so he can appoint himself as CEO first
-- Then he can appoint other executives

DO $$
DECLARE
  torrance_user_id UUID;
  torrance_exec_id UUID;
BEGIN
  -- Get Torrance's user_id from auth.users
  SELECT id INTO torrance_user_id
  FROM auth.users
  WHERE email = 'craven@usa.com';
  
  IF torrance_user_id IS NULL THEN
    RAISE EXCEPTION 'Torrance Stroman (craven@usa.com) not found in auth.users. Please ensure this user exists.';
  END IF;
  
  RAISE NOTICE 'Found Torrance user_id: %', torrance_user_id;
  
  -- Get Torrance's current exec_users record ID (if exists)
  SELECT id INTO torrance_exec_id
  FROM public.exec_users
  WHERE user_id = torrance_user_id;
  
  -- Step 1: Delete all executive documents for non-Torrance executives
  DELETE FROM public.executive_documents
  WHERE executive_id IS NOT NULL
    AND executive_id != COALESCE(torrance_exec_id, '00000000-0000-0000-0000-000000000000'::UUID)
    AND executive_id IN (
      SELECT id FROM public.exec_users WHERE user_id != torrance_user_id
    );
  
  RAISE NOTICE 'Deleted executive documents for non-Torrance executives';
  
  -- Step 2: Delete executive messages (from/to non-Torrance executives) - only if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'exec_messages') THEN
    DELETE FROM public.exec_messages
    WHERE from_user_id != COALESCE(torrance_exec_id, '00000000-0000-0000-0000-000000000000'::UUID)
       OR NOT (torrance_exec_id = ANY(to_user_ids))
       OR from_user_id IN (SELECT id FROM public.exec_users WHERE user_id != torrance_user_id);
    RAISE NOTICE 'Deleted executive messages';
  ELSE
    RAISE NOTICE 'Table exec_messages does not exist, skipping';
  END IF;
  
  -- Step 3: Delete board meeting participants (non-Torrance) - only if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'exec_meeting_participants') THEN
    DELETE FROM public.exec_meeting_participants
    WHERE user_id != COALESCE(torrance_exec_id, '00000000-0000-0000-0000-000000000000'::UUID)
       OR user_id IN (SELECT id FROM public.exec_users WHERE user_id != torrance_user_id);
    RAISE NOTICE 'Deleted board meeting participants';
  ELSE
    RAISE NOTICE 'Table exec_meeting_participants does not exist, skipping';
  END IF;
  
  -- Step 4: Delete exec audit logs (non-Torrance) - only if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'exec_audit_logs') THEN
    DELETE FROM public.exec_audit_logs
    WHERE user_id != COALESCE(torrance_exec_id, '00000000-0000-0000-0000-000000000000'::UUID)
       OR user_id IN (SELECT id FROM public.exec_users WHERE user_id != torrance_user_id);
    RAISE NOTICE 'Deleted exec audit logs';
  ELSE
    RAISE NOTICE 'Table exec_audit_logs does not exist, skipping';
  END IF;
  
  -- Step 5: Delete exec documents uploaded by non-Torrance - only if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'exec_documents') THEN
    DELETE FROM public.exec_documents
    WHERE uploaded_by != COALESCE(torrance_exec_id, '00000000-0000-0000-0000-000000000000'::UUID)
       OR uploaded_by IN (SELECT id FROM public.exec_users WHERE user_id != torrance_user_id);
    RAISE NOTICE 'Deleted exec documents uploaded by non-Torrance';
  ELSE
    RAISE NOTICE 'Table exec_documents does not exist, skipping';
  END IF;
  
  -- Step 6: Delete equity_grants for non-Torrance executives (if table exists)
  -- This must be done before deleting exec_users due to foreign key constraint
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'equity_grants') THEN
    DELETE FROM public.equity_grants
    WHERE executive_id != COALESCE(torrance_exec_id, '00000000-0000-0000-0000-000000000000'::UUID)
       OR executive_id IN (SELECT id FROM public.exec_users WHERE user_id != torrance_user_id);
    RAISE NOTICE 'Deleted equity_grants for non-Torrance executives';
  ELSE
    RAISE NOTICE 'Table equity_grants does not exist, skipping';
  END IF;
  
  -- Step 7: Delete all exec_users except Torrance
  DELETE FROM public.exec_users
  WHERE user_id != torrance_user_id;
  
  RAISE NOTICE 'Deleted all exec_users except Torrance';
  
  -- Step 8: Ensure Torrance is NOT an employee
  -- Delete any employee record for Torrance
  DELETE FROM public.employees
  WHERE user_id = torrance_user_id;
  
  RAISE NOTICE 'Removed Torrance from employees table (he is not an employee)';
  
  -- Step 9: Insert or update Torrance as board_member & Secretary
  -- He will become an Executive once appointed by the board
  INSERT INTO public.exec_users (
    user_id,
    role,
    access_level,
    title,
    department,
    is_also_employee,
    linked_employee_id,
    approved_at,
    created_at,
    updated_at
  ) VALUES (
    torrance_user_id,
    'board_member', -- Set as board_member so he can appoint himself as CEO
    1,
    'Founder, Board Member & Secretary',
    'Board',
    false, -- NOT an employee
    NULL,  -- No linked employee record
    now(),
    now(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    role = 'board_member',
    access_level = 1,
    title = 'Founder, Board Member & Secretary',
    department = 'Board',
    is_also_employee = false,
    linked_employee_id = NULL,
    approved_at = now(),
    updated_at = now();
  
  RAISE NOTICE 'Set Torrance Stroman as board_member & Secretary (NOT an employee)';
  
  -- Step 10: Clean up any employee_equity records for employees who are no longer executives
  -- BUT keep Invero Business Trust and any non-employee shareholders
  UPDATE public.employee_equity
  SET employee_id = NULL
  WHERE employee_id IS NOT NULL
    AND employee_id IN (
      SELECT e.id 
      FROM public.employees e
      WHERE e.id NOT IN (
        SELECT eu.linked_employee_id 
        FROM public.exec_users eu 
        WHERE eu.user_id = torrance_user_id 
          AND eu.linked_employee_id IS NOT NULL
      )
      AND e.position NOT ILIKE '%founder%'
      AND e.position NOT ILIKE '%ceo%'
    );
  
  RAISE NOTICE 'Cleaned up employee_equity records for removed executives';
  
  -- Step 11: Reset any executive-related status fields in employees table
  -- Note: Torrance is already removed from employees table in Step 7
  UPDATE public.employees
  SET 
    position = position, -- Keep existing position
    salary_status = salary_status -- Keep existing salary status
  WHERE user_id IS NOT NULL
    AND user_id != torrance_user_id
    AND (position ILIKE '%ceo%' 
         OR position ILIKE '%cfo%' 
         OR position ILIKE '%coo%' 
         OR position ILIKE '%cto%'
         OR position ILIKE '%chief%');
  
  RAISE NOTICE 'Reset employee positions for removed executives';
  
  RAISE NOTICE '✓ Successfully reset executives. Torrance Stroman is now the only board_member & Secretary.';
  RAISE NOTICE '✓ Torrance is NOT an employee - he is a board member who will become an Executive once appointed.';
  RAISE NOTICE '✓ Torrance can now appoint himself as CEO, then appoint other executives.';
  
END $$;

-- Add comment explaining the reset
COMMENT ON TABLE public.exec_users IS 
  'Executive users table. After reset, only Torrance Stroman (board_member & Secretary) exists. He is NOT an employee. He can appoint himself as CEO first, then appoint others.';

