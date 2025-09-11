-- Grant admin rights to craven@usa.com user
INSERT INTO public.user_roles (user_id, role)
VALUES ('93a342c6-9dc2-4bf6-ab1c-0dc1d17148cd', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Create/update user profile for admin user
INSERT INTO public.user_profiles (user_id, full_name, role, phone)
VALUES ('93a342c6-9dc2-4bf6-ab1c-0dc1d17148cd', 'Torrance Stroman', 'admin', '5672251495')
ON CONFLICT (user_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  phone = EXCLUDED.phone,
  updated_at = now();