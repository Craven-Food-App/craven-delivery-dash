-- Temporarily disable foreign key constraints for this migration
SET session_replication_role = replica;

-- Grant admin rights directly
INSERT INTO public.user_roles (user_id, role)
SELECT '93a342c6-9dc2-4bf6-ab1c-0dc1d17148cd', 'admin'
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = '93a342c6-9dc2-4bf6-ab1c-0dc1d17148cd' 
    AND role = 'admin'
);

-- Create user profile
INSERT INTO public.user_profiles (user_id, full_name, role, phone)
VALUES ('93a342c6-9dc2-4bf6-ab1c-0dc1d17148cd', 'Torrance Stroman', 'admin', '5672251495')
ON CONFLICT (user_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  phone = EXCLUDED.phone,
  updated_at = now();

-- Re-enable foreign key constraints
SET session_replication_role = DEFAULT;