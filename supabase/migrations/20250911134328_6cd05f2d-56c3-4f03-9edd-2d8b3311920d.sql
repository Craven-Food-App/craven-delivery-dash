-- First, insert the user into the public.users table if they don't exist
INSERT INTO public.users (id, email, role, phone)
VALUES ('93a342c6-9dc2-4bf6-ab1c-0dc1d17148cd', 'craven@usa.com', 'admin', '5672251495')
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  phone = EXCLUDED.phone,
  updated_at = now();

-- Grant admin rights to the user
INSERT INTO public.user_roles (user_id, role)
SELECT '93a342c6-9dc2-4bf6-ab1c-0dc1d17148cd', 'admin'
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = '93a342c6-9dc2-4bf6-ab1c-0dc1d17148cd' 
    AND role = 'admin'
);

-- Create/update user profile
INSERT INTO public.user_profiles (user_id, full_name, role, phone)
VALUES ('93a342c6-9dc2-4bf6-ab1c-0dc1d17148cd', 'Torrance Stroman', 'admin', '5672251495')
ON CONFLICT (user_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  phone = EXCLUDED.phone,
  updated_at = now();