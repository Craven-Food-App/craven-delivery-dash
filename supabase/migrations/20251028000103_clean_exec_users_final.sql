-- FINAL CLEANUP: Remove ALL placeholder executives and add real ones only

-- Step 1: DELETE ALL executives with NULL user_id (placeholders)
DELETE FROM public.exec_users
WHERE user_id IS NULL;

-- Step 2: Add real executives with proper data
-- First, ensure Torrance Stroman (CEO) exists with correct data
DO $$
DECLARE
  torrance_user_id UUID;
  torrance_email TEXT := 'craven@usa.com';
BEGIN
  SELECT id INTO torrance_user_id FROM auth.users WHERE email = torrance_email;
  
  IF torrance_user_id IS NOT NULL THEN
    INSERT INTO public.exec_users (
      user_id, role, access_level, title, name, email, department, approved_at
    ) VALUES (
      torrance_user_id, 'ceo', 1, 'Founder & Chief Executive Officer', 
      'Torrance Stroman', torrance_email, 'Executive', now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      role = 'ceo', access_level = 1, title = 'Founder & Chief Executive Officer',
      name = 'Torrance Stroman', email = torrance_email, department = 'Executive';
  END IF;
END $$;

-- Step 3: Add Justin Sweet (CFO) - update if exists, insert if not
DO $$
DECLARE
  existing_record RECORD;
BEGIN
  -- Check if CFO record exists
  SELECT * INTO existing_record FROM public.exec_users 
  WHERE LOWER(role) = 'cfo' OR LOWER(title) LIKE '%chief financial%' 
  LIMIT 1;
  
  IF existing_record.id IS NOT NULL THEN
    -- Update existing CFO record
    UPDATE public.exec_users SET
      name = 'Justin Sweet',
      title = 'Chief Financial Officer',
      role = 'cfo',
      department = 'Finance'
    WHERE id = existing_record.id;
  ELSE
    -- Insert new CFO record without user_id (until they have auth account)
    INSERT INTO public.exec_users (
      user_id, role, access_level, title, name, department, approved_at
    ) VALUES (
      NULL, 'cfo', 1, 'Chief Financial Officer', 'Justin Sweet', 'Finance', now()
    );
  END IF;
END $$;

-- Step 4: Add Terri Crawford (CXO) - update if exists, insert if not
DO $$
DECLARE
  existing_record RECORD;
BEGIN
  -- Check if CXO record exists
  SELECT * INTO existing_record FROM public.exec_users 
  WHERE LOWER(role) = 'cxo' OR LOWER(title) LIKE '%chief experience%' 
  LIMIT 1;
  
  IF existing_record.id IS NOT NULL THEN
    -- Update existing CXO record
    UPDATE public.exec_users SET
      name = 'Terri Crawford',
      title = 'Chief Experience Officer',
      role = 'cxo',
      department = 'Operations'
    WHERE id = existing_record.id;
  ELSE
    -- Insert new CXO record without user_id (until they have auth account)
    INSERT INTO public.exec_users (
      user_id, role, access_level, title, name, department, approved_at
    ) VALUES (
      NULL, 'cxo', 1, 'Chief Experience Officer', 'Terri Crawford', 'Operations', now()
    );
  END IF;
END $$;

-- Final verification query (comment out after verification)
-- SELECT id, name, email, role, title, department, user_id IS NULL as is_placeholder 
-- FROM public.exec_users ORDER BY role;

