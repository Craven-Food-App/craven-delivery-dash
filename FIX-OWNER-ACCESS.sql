-- FIX OWNER ACCESS: Make craven@usa.com have unlimited access everywhere
-- This overrides ALL RLS policies and access checks

-- Step 1: Update is_admin function to grant owner full access
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- OWNER ALWAYS HAS ADMIN ACCESS
    IF EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = user_uuid AND email = 'craven@usa.com'
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Otherwise check regular admin role
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = user_uuid AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Step 2: Update is_ceo function to grant owner CEO access
CREATE OR REPLACE FUNCTION public.is_ceo(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- OWNER ALWAYS HAS CEO ACCESS
    IF EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = user_uuid AND email = 'craven@usa.com'
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Otherwise check regular CEO role
    RETURN EXISTS (
        SELECT 1 FROM public.exec_users
        WHERE user_id = user_uuid 
        AND role = 'ceo'
        AND access_level = 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Step 3: Create function to check if user is owner
CREATE OR REPLACE FUNCTION public.is_owner(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = user_uuid AND email = 'craven@usa.com'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Step 4: Update ALL exec_users RLS policies to grant owner access
DROP POLICY IF EXISTS "allow_users_view_own_exec_record" ON public.exec_users;
DROP POLICY IF EXISTS "allow_executives_view_all" ON public.exec_users;
DROP POLICY IF EXISTS "allow_executives_update_own" ON public.exec_users;
DROP POLICY IF EXISTS "allow_ceo_insert_executives" ON public.exec_users;

-- Recreate with owner access
CREATE POLICY "users_view_own_or_owner_all"
ON public.exec_users FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() 
    OR public.is_owner(auth.uid())
    OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid())
);

CREATE POLICY "executives_update_own_or_owner_all"
ON public.exec_users FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR public.is_owner(auth.uid()))
WITH CHECK (user_id = auth.uid() OR public.is_owner(auth.uid()));

CREATE POLICY "owner_or_ceo_insert_executives"
ON public.exec_users FOR INSERT
TO authenticated
WITH CHECK (
    public.is_owner(auth.uid())
    OR public.is_ceo(auth.uid())
);

-- Step 5: Ensure craven@usa.com exists in exec_users as CEO
INSERT INTO public.exec_users (user_id, role, access_level, title, department)
SELECT id, 'ceo', 1, 'Owner & CEO', 'Executive'
FROM auth.users
WHERE email = 'craven@usa.com'
ON CONFLICT (user_id) DO UPDATE
SET role = 'ceo', access_level = 1, title = 'Owner & CEO', department = 'Executive';

-- Step 6: Ensure craven@usa.com has admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'craven@usa.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Verification
SELECT 
    'Setup Complete' as status,
    COUNT(*) as owner_records
FROM auth.users
WHERE email = 'craven@usa.com';

