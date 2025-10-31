-- Remove ALL placeholder/demo executives that don't have real auth.users accounts
-- Only keep executives that have actual user_id linked to auth.users
DELETE FROM public.exec_users
WHERE user_id IS NULL;

-- Ensure Torrance Stroman exists with proper data
DO $$
DECLARE
  torrance_user_id UUID;
  torrance_email TEXT := 'craven@usa.com';
BEGIN
  -- Get Torrance's user ID from auth
  SELECT id INTO torrance_user_id
  FROM auth.users
  WHERE email = torrance_email;
  
  IF torrance_user_id IS NOT NULL THEN
    -- Insert or update his exec_users record with name and email
    INSERT INTO public.exec_users (
      user_id,
      role,
      access_level,
      title,
      name,
      email,
      department,
      approved_at
    ) VALUES (
      torrance_user_id,
      'ceo',
      1,
      'Founder & Chief Executive Officer',
      'Torrance Stroman',
      torrance_email,
      'Executive',
      now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      role = 'ceo',
      access_level = 1,
      title = 'Founder & Chief Executive Officer',
      name = 'Torrance Stroman',
      email = torrance_email,
      department = 'Executive';
  END IF;
END $$;

