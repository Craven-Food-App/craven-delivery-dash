-- CREATE CEO IN SUPABASE SQL EDITOR
-- Copy and paste this ENTIRE file

WITH auth_user AS (
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'torrence.stroman@cravenusa.com',
    crypt('TempPass123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"first_name":"Torrence","last_name":"Stroman","position":"CEO","department":"Executive"}'
  ) RETURNING id
)
INSERT INTO public.employees (
  user_id,
  employee_number,
  first_name,
  last_name,
  email,
  position,
  employment_type,
  employment_status,
  hire_date,
  salary,
  hired_by
) 
SELECT 
  auth_user.id,
  'CEO-001',
  'Torrence',
  'Stroman',
  'torrence.stroman@cravenusa.com',
  'CEO',
  'full-time',
  'active',
  CURRENT_DATE,
  200000,
  auth_user.id
FROM auth_user;

INSERT INTO public.exec_users (
  user_id,
  role,
  access_level,
  title,
  department,
  approved_at
)
SELECT 
  id,
  'ceo',
  10,
  'CEO',
  'Executive',
  NOW()
FROM auth.users WHERE email = 'torrence.stroman@cravenusa.com'
ON CONFLICT (user_id) DO UPDATE SET
  role = 'ceo',
  access_level = 10,
  title = 'CEO',
  department = 'Executive';

