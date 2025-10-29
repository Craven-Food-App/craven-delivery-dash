-- Make exec_users more flexible for demo executives
-- Allows placeholder executives without real auth accounts

-- Drop the NOT NULL constraint on user_id
ALTER TABLE public.exec_users 
ALTER COLUMN user_id DROP NOT NULL;

-- Now we can insert sample executives without real auth users
INSERT INTO public.exec_users (id, user_id, role, access_level, title, department, approved_at)
VALUES 
  (gen_random_uuid(), NULL, 'cfo', 2, 'Chief Financial Officer', 'Finance', now()),
  (gen_random_uuid(), NULL, 'coo', 2, 'Chief Operating Officer', 'Operations', now()),
  (gen_random_uuid(), NULL, 'cto', 2, 'Chief Technology Officer', 'Technology', now()),
  (gen_random_uuid(), NULL, 'board_member', 3, 'Board Member - Strategic Advisor', NULL, now()),
  (gen_random_uuid(), NULL, 'board_member', 3, 'Board Member - Finance Committee', NULL, now())
ON CONFLICT DO NOTHING;

-- Verify
SELECT role, title, department FROM public.exec_users ORDER BY access_level, role;

