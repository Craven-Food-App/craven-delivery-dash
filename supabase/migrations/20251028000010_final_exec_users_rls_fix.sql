-- FINAL FIX for exec_users RLS policies
-- This ensures BOTH CEO and Board portals work correctly

-- Drop ALL existing policies on exec_users
DROP POLICY IF EXISTS "Executives can view all exec users" ON public.exec_users;
DROP POLICY IF EXISTS "Users can view their own exec record" ON public.exec_users;
DROP POLICY IF EXISTS "Executives can update their own profile" ON public.exec_users;

-- Policy 1: Anyone authenticated can view their OWN exec_users record
-- This is the foundation - allows initial access check
CREATE POLICY "allow_users_view_own_exec_record"
ON public.exec_users FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy 2: Executives can view ALL exec_users records
-- This allows executives to see other executives (for directory, messaging, etc.)
CREATE POLICY "allow_executives_view_all"
ON public.exec_users FOR SELECT
TO authenticated
USING (
  -- If they have ANY record in exec_users, they can see all records
  EXISTS (
    SELECT 1 FROM public.exec_users 
    WHERE user_id = auth.uid()
  )
);

-- Policy 3: Executives can update their own profile
CREATE POLICY "allow_executives_update_own"
ON public.exec_users FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy 4: CEO can insert new executives
CREATE POLICY "allow_ceo_insert_executives"
ON public.exec_users FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ceo_access_credentials 
    WHERE user_email = auth.jwt()->>'email'
  )
);

-- Verify Torrance's CEO record exists
-- If it doesn't exist, create it
DO $$
DECLARE
  torrance_user_id UUID;
BEGIN
  -- Get Torrance's user ID from auth
  SELECT id INTO torrance_user_id
  FROM auth.users
  WHERE email = 'craven@usa.com';
  
  IF torrance_user_id IS NOT NULL THEN
    -- Insert or update his exec_users record
    INSERT INTO public.exec_users (
      user_id,
      role,
      access_level,
      title,
      approved_at
    ) VALUES (
      torrance_user_id,
      'ceo',
      1,
      'Founder & Chief Executive Officer',
      now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      role = 'ceo',
      access_level = 1,
      title = 'Founder & Chief Executive Officer';
  END IF;
END $$;

