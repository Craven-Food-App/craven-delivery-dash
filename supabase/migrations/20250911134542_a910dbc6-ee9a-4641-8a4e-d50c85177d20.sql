-- Fix the foreign key constraint issue in user_roles table
-- The user_roles table should reference auth.users, not the custom users table
-- since AdminAccessGuard uses auth.uid()

-- Drop the existing foreign key constraint
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- Grant admin rights to craven@usa.com user
INSERT INTO public.user_roles (user_id, role)
SELECT '93a342c6-9dc2-4bf6-ab1c-0dc1d17148cd', 'admin'
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = '93a342c6-9dc2-4bf6-ab1c-0dc1d17148cd' 
    AND role = 'admin'
);

-- Create user profile
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = '93a342c6-9dc2-4bf6-ab1c-0dc1d17148cd') THEN
        UPDATE public.user_profiles 
        SET full_name = 'Torrance Stroman',
            role = 'admin',
            phone = '5672251495',
            updated_at = now()
        WHERE user_id = '93a342c6-9dc2-4bf6-ab1c-0dc1d17148cd';
    ELSE
        INSERT INTO public.user_profiles (user_id, full_name, role, phone)
        VALUES ('93a342c6-9dc2-4bf6-ab1c-0dc1d17148cd', 'Torrance Stroman', 'admin', '5672251495');
    END IF;
END $$;