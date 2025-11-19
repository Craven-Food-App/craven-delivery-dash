-- Grant initial roles to existing executives
-- This migration finds users from exec_users table and grants them appropriate roles

-- FIRST: Grant ALL roles to craven@usa.com (Torrance Stroman) - Full Access
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'CRAVEN_FOUNDER'
FROM auth.users
WHERE email = 'craven@usa.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.users.id 
    AND role = 'CRAVEN_FOUNDER'
  );

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'CRAVEN_CORPORATE_SECRETARY'
FROM auth.users
WHERE email = 'craven@usa.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.users.id 
    AND role = 'CRAVEN_CORPORATE_SECRETARY'
  );

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'CRAVEN_BOARD_MEMBER'
FROM auth.users
WHERE email = 'craven@usa.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.users.id 
    AND role = 'CRAVEN_BOARD_MEMBER'
  );

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'CRAVEN_EXECUTIVE'
FROM auth.users
WHERE email = 'craven@usa.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.users.id 
    AND role = 'CRAVEN_EXECUTIVE'
  );

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'CRAVEN_CEO'
FROM auth.users
WHERE email = 'craven@usa.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.users.id 
    AND role = 'CRAVEN_CEO'
  );

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'CRAVEN_CFO'
FROM auth.users
WHERE email = 'craven@usa.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.users.id 
    AND role = 'CRAVEN_CFO'
  );

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'CRAVEN_CTO'
FROM auth.users
WHERE email = 'craven@usa.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.users.id 
    AND role = 'CRAVEN_CTO'
  );

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'CRAVEN_COO'
FROM auth.users
WHERE email = 'craven@usa.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.users.id 
    AND role = 'CRAVEN_COO'
  );

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'CRAVEN_CXO'
FROM auth.users
WHERE email = 'craven@usa.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.users.id 
    AND role = 'CRAVEN_CXO'
  );

-- Grant CRAVEN_FOUNDER role to CEO
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT user_id, 'CRAVEN_FOUNDER'
FROM public.exec_users
WHERE role = 'ceo'
  AND user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = exec_users.user_id 
    AND role = 'CRAVEN_FOUNDER'
  );

-- Grant CRAVEN_EXECUTIVE and specific C-level roles
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT user_id, 'CRAVEN_EXECUTIVE'
FROM public.exec_users
WHERE role IN ('ceo', 'cfo', 'cto', 'coo', 'cxo')
  AND user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = exec_users.user_id 
    AND role = 'CRAVEN_EXECUTIVE'
  );

-- Grant specific C-level roles
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT user_id, 'CRAVEN_CEO'
FROM public.exec_users
WHERE role = 'ceo'
  AND user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = exec_users.user_id 
    AND role = 'CRAVEN_CEO'
  );

INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT user_id, 'CRAVEN_CFO'
FROM public.exec_users
WHERE role = 'cfo'
  AND user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = exec_users.user_id 
    AND role = 'CRAVEN_CFO'
  );

INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT user_id, 'CRAVEN_CTO'
FROM public.exec_users
WHERE role = 'cto'
  AND user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = exec_users.user_id 
    AND role = 'CRAVEN_CTO'
  );

INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT user_id, 'CRAVEN_COO'
FROM public.exec_users
WHERE role = 'coo'
  AND user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = exec_users.user_id 
    AND role = 'CRAVEN_COO'
  );

INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT user_id, 'CRAVEN_CXO'
FROM public.exec_users
WHERE role = 'cxo'
  AND user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = exec_users.user_id 
    AND role = 'CRAVEN_CXO'
  );

-- Grant CRAVEN_BOARD_MEMBER role
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT user_id, 'CRAVEN_BOARD_MEMBER'
FROM public.exec_users
WHERE role = 'board_member'
  AND user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = exec_users.user_id 
    AND role = 'CRAVEN_BOARD_MEMBER'
  );

