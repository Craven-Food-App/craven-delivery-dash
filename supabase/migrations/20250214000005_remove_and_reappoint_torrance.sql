-- Remove and Reappoint Torrance Stroman
-- This removes all executive records and appointments, then recreates them fresh

DO $$
DECLARE
  torrance_user_id UUID;
  torrance_exec_id UUID;
  torrance_board_id UUID;
  records_deleted INTEGER;
BEGIN
  -- Step 1: Find Torrance's user_id from auth.users
  -- Try multiple email variations
  SELECT id INTO torrance_user_id
  FROM auth.users
  WHERE email ILIKE '%tstroman%'
     OR email ILIKE '%torrance%stroman%'
     OR email ILIKE '%stroman%torrance%'
     OR email = 'craven@usa.com'
     OR email = 'tstroman.ceo@cravenusa.com'
     OR email = 'torrance.stroman@example.com'
     OR email = 'cmih@chef.net'
  LIMIT 1;

  IF torrance_user_id IS NULL THEN
    RAISE NOTICE 'Torrance Stroman user not found in auth.users';
    RETURN;
  END IF;

  RAISE NOTICE 'Found Torrance user_id: %', torrance_user_id;

  -- Step 2: Get exec_users id before deletion
  SELECT id INTO torrance_exec_id
  FROM public.exec_users
  WHERE user_id = torrance_user_id
  LIMIT 1;

  -- Step 3: Get board_members id before deletion
  SELECT id INTO torrance_board_id
  FROM public.board_members
  WHERE user_id = torrance_user_id
  LIMIT 1;

  -- Step 4: Delete related records first (foreign key constraints)
  
  -- Delete executive_documents
  DELETE FROM public.executive_documents
  WHERE executive_id = torrance_exec_id
     OR (executive_id IS NULL AND officer_name ILIKE '%torrance%' OR officer_name ILIKE '%stroman%');
  GET DIAGNOSTICS records_deleted = ROW_COUNT;
  RAISE NOTICE 'Deleted % executive_documents', records_deleted;

  -- Delete executive_signatures
  DELETE FROM public.executive_signatures
  WHERE document_id IN (
    SELECT id FROM public.executive_documents 
    WHERE executive_id = torrance_exec_id
  );
  GET DIAGNOSTICS records_deleted = ROW_COUNT;
  RAISE NOTICE 'Deleted % executive_signatures', records_deleted;

  -- Delete appointment_documents (from appointments table, not executive_appointments)
  DELETE FROM public.appointment_documents
  WHERE appointment_id IN (
    SELECT id FROM public.appointments
    WHERE appointee_user_id = torrance_user_id
  );
  GET DIAGNOSTICS records_deleted = ROW_COUNT;
  RAISE NOTICE 'Deleted % appointment_documents', records_deleted;

  -- Delete appointments (governance system)
  DELETE FROM public.appointments
  WHERE appointee_user_id = torrance_user_id;
  GET DIAGNOSTICS records_deleted = ROW_COUNT;
  RAISE NOTICE 'Deleted % appointments', records_deleted;

  -- Delete officer_activation_timeline records first (foreign key constraint)
  DELETE FROM public.officer_activation_timeline
  WHERE appointment_id IN (
    SELECT id FROM public.executive_appointments
    WHERE proposed_officer_email IN (
      SELECT email FROM auth.users WHERE id = torrance_user_id
    )
    OR proposed_officer_name ILIKE '%torrance%'
    OR proposed_officer_name ILIKE '%stroman%'
  );
  GET DIAGNOSTICS records_deleted = ROW_COUNT;
  RAISE NOTICE 'Deleted % officer_activation_timeline records', records_deleted;

  -- Delete executive_appointments (by email/name match since it doesn't have user_id)
  DELETE FROM public.executive_appointments
  WHERE proposed_officer_email IN (
    SELECT email FROM auth.users WHERE id = torrance_user_id
  )
  OR proposed_officer_name ILIKE '%torrance%'
  OR proposed_officer_name ILIKE '%stroman%';
  GET DIAGNOSTICS records_deleted = ROW_COUNT;
  RAISE NOTICE 'Deleted % executive_appointments', records_deleted;

  -- Delete board_documents (if linked to board member)
  DELETE FROM public.board_documents
  WHERE id IN (
    SELECT bd.id
    FROM public.board_documents bd
    LEFT JOIN public.board_members bm ON bd.id = bm.id
    WHERE bm.user_id = torrance_user_id
  );
  GET DIAGNOSTICS records_deleted = ROW_COUNT;
  RAISE NOTICE 'Deleted % board_documents', records_deleted;

  -- Delete board_members
  DELETE FROM public.board_members
  WHERE user_id = torrance_user_id;
  GET DIAGNOSTICS records_deleted = ROW_COUNT;
  RAISE NOTICE 'Deleted % board_members', records_deleted;

  -- Delete user_roles (but keep CRAVEN_FOUNDER if exists - we'll add it back)
  DELETE FROM public.user_roles
  WHERE user_id = torrance_user_id
    AND role != 'CRAVEN_FOUNDER'; -- Keep founder role
  GET DIAGNOSTICS records_deleted = ROW_COUNT;
  RAISE NOTICE 'Deleted % user_roles (kept CRAVEN_FOUNDER if existed)', records_deleted;

  -- Delete exec_users
  DELETE FROM public.exec_users
  WHERE user_id = torrance_user_id;
  GET DIAGNOSTICS records_deleted = ROW_COUNT;
  RAISE NOTICE 'Deleted % exec_users records', records_deleted;

  -- Step 5: Recreate Torrance's executive record
  INSERT INTO public.exec_users (
    user_id,
    role,
    access_level,
    title,
    name,
    email,
    approved_at,
    created_at,
    updated_at
  ) VALUES (
    torrance_user_id,
    'ceo',
    1,
    'Founder & Chief Executive Officer',
    'Torrance Stroman',
    (SELECT email FROM auth.users WHERE id = torrance_user_id),
    now(),
    now(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    role = 'ceo',
    access_level = 1,
    title = 'Founder & Chief Executive Officer',
    name = 'Torrance Stroman',
    email = (SELECT email FROM auth.users WHERE id = torrance_user_id),
    updated_at = now();

  RAISE NOTICE 'Recreated exec_users record for Torrance';

  -- Step 6: Ensure CRAVEN_FOUNDER role exists
  INSERT INTO public.user_roles (user_id, role)
  VALUES (torrance_user_id, 'CRAVEN_FOUNDER')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Step 7: Ensure CRAVEN_CORPORATE_SECRETARY role exists
  INSERT INTO public.user_roles (user_id, role)
  VALUES (torrance_user_id, 'CRAVEN_CORPORATE_SECRETARY')
  ON CONFLICT (user_id, role) DO NOTHING;

  RAISE NOTICE 'Ensured Torrance has CRAVEN_FOUNDER and CRAVEN_CORPORATE_SECRETARY roles';

  -- Step 8: Recreate board_members record (if board system is initialized)
  IF EXISTS (SELECT 1 FROM public.company_settings WHERE setting_key = 'board_initialized' AND setting_value = 'true') THEN
    INSERT INTO public.board_members (
      full_name,
      email,
      role_title,
      appointment_date,
      status,
      signing_required,
      signing_completed,
      user_id,
      created_at,
      updated_at
    ) VALUES (
      'Torrance Stroman',
      (SELECT email FROM auth.users WHERE id = torrance_user_id),
      'Chairperson / Sole Director / Secretary',
      CURRENT_DATE,
      'Active',
      true,
      false,
      torrance_user_id,
      now(),
      now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      full_name = 'Torrance Stroman',
      email = (SELECT email FROM auth.users WHERE id = torrance_user_id),
      role_title = 'Chairperson / Sole Director / Secretary',
      status = 'Active',
      updated_at = now();

    RAISE NOTICE 'Recreated board_members record for Torrance';
  END IF;

  RAISE NOTICE 'Torrance Stroman removal and reappointment completed successfully';

END $$;

COMMENT ON FUNCTION public.remove_and_reappoint_torrance() IS 
'Removes all executive records and appointments for Torrance Stroman, then recreates them fresh. Preserves CRAVEN_FOUNDER role.';

