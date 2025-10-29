-- Add sample executives for Board Portal testing
-- These are demo accounts - in production, create real auth.users first

-- Create sample auth users for executives (if they don't exist)
DO $$
DECLARE
  cfo_user_id UUID;
  coo_user_id UUID;
  cto_user_id UUID;
  board1_user_id UUID;
BEGIN
  -- Check if sample users exist, if not create them
  -- Note: In production, create these via Supabase Auth UI
  
  -- For now, just create exec_users entries with NULL user_id
  -- This allows messaging to work even without auth accounts
  
  -- CFO
  INSERT INTO public.exec_users (user_id, role, access_level, title, department, approved_at)
  SELECT 
    (SELECT id FROM auth.users WHERE email = 'cfo@craven.com'),
    'cfo',
    2,
    'Chief Financial Officer',
    'Finance',
    now()
  WHERE NOT EXISTS (SELECT 1 FROM public.exec_users WHERE role = 'cfo')
  ON CONFLICT (user_id) DO NOTHING;
  
  -- If no auth user, insert with generated UUID
  IF NOT EXISTS (SELECT 1 FROM public.exec_users WHERE role = 'cfo') THEN
    INSERT INTO public.exec_users (id, user_id, role, access_level, title, department, approved_at)
    VALUES (
      gen_random_uuid(),
      gen_random_uuid(), -- Placeholder user_id
      'cfo',
      2,
      'Chief Financial Officer',
      'Finance',
      now()
    );
  END IF;
  
  -- COO
  IF NOT EXISTS (SELECT 1 FROM public.exec_users WHERE role = 'coo') THEN
    INSERT INTO public.exec_users (id, user_id, role, access_level, title, department, approved_at)
    VALUES (
      gen_random_uuid(),
      gen_random_uuid(),
      'coo',
      2,
      'Chief Operating Officer',
      'Operations',
      now()
    );
  END IF;
  
  -- CTO
  IF NOT EXISTS (SELECT 1 FROM public.exec_users WHERE role = 'cto') THEN
    INSERT INTO public.exec_users (id, user_id, role, access_level, title, department, approved_at)
    VALUES (
      gen_random_uuid(),
      gen_random_uuid(),
      'cto',
      2,
      'Chief Technology Officer',
      'Technology',
      now()
    );
  END IF;
  
  -- Board Member 1
  IF NOT EXISTS (SELECT 1 FROM public.exec_users WHERE role = 'board_member' LIMIT 1) THEN
    INSERT INTO public.exec_users (id, user_id, role, access_level, title, approved_at)
    VALUES (
      gen_random_uuid(),
      gen_random_uuid(),
      'board_member',
      3,
      'Board Member - Strategic Advisor',
      now()
    );
  END IF;
  
  -- Board Member 2
  INSERT INTO public.exec_users (id, user_id, role, access_level, title, approved_at)
  SELECT 
    gen_random_uuid(),
    gen_random_uuid(),
    'board_member',
    3,
    'Board Member - Finance Committee',
    now()
  WHERE (SELECT COUNT(*) FROM public.exec_users WHERE role = 'board_member') < 2;

END $$;

-- Verify exec users
SELECT role, title, department, approved_at 
FROM public.exec_users 
ORDER BY access_level, role;

