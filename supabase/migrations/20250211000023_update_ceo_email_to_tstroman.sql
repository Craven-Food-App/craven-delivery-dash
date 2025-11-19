-- ============================================================================
-- UPDATE CEO EMAIL FROM craven@usa.com TO tstroman.ceo@cravenusa.com
-- This separates Torrance's executive/company account from driver/merchant accounts
-- craven@usa.com should only be used for Driver and Merchant accounts
-- ============================================================================

-- Update RLS policies that check for CEO email
-- These are for company/business/executive access, NOT driver/merchant

-- exec_users policies
DROP POLICY IF EXISTS "ceo_full_access" ON public.exec_users;
CREATE POLICY "ceo_full_access"
ON public.exec_users FOR ALL
TO authenticated
USING (auth.jwt()->>'email' = 'tstroman.ceo@cravenusa.com')
WITH CHECK (auth.jwt()->>'email' = 'tstroman.ceo@cravenusa.com');

DROP POLICY IF EXISTS "ceo_can_view_all_exec_users" ON public.exec_users;
CREATE POLICY "ceo_can_view_all_exec_users"
ON public.exec_users FOR SELECT
TO authenticated
USING (
  auth.jwt()->>'email' = 'tstroman.ceo@cravenusa.com'
  OR user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "ceo_can_manage_exec_users" ON public.exec_users;
CREATE POLICY "ceo_can_manage_exec_users"
ON public.exec_users FOR ALL
TO authenticated
USING (auth.jwt()->>'email' = 'tstroman.ceo@cravenusa.com');

-- Update helper function for CEO checks
CREATE OR REPLACE FUNCTION public.is_ceo_email(p_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN p_email = 'tstroman.ceo@cravenusa.com';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update CEO access credentials
UPDATE public.ceo_access_credentials
SET user_email = 'tstroman.ceo@cravenusa.com'
WHERE user_email = 'craven@usa.com';

-- Insert new CEO access credential if it doesn't exist
-- PIN: 020304 (stored as plain text since verify_ceo_pin function doesn't verify hash)
INSERT INTO public.ceo_access_credentials (user_email, pin_hash)
VALUES ('tstroman.ceo@cravenusa.com', '020304')
ON CONFLICT (user_email) DO UPDATE SET pin_hash = '020304';

-- Update company settings incorporator_email
UPDATE public.company_settings
SET setting_value = 'tstroman.ceo@cravenusa.com'
WHERE setting_key = 'incorporator_email'
AND setting_value = 'craven@usa.com';

-- Update corporate_officers email if it exists
UPDATE public.corporate_officers
SET email = 'tstroman.ceo@cravenusa.com'
WHERE email = 'craven@usa.com'
AND full_name ILIKE '%Torrance%Stroman%';

-- Update executive_appointments proposed_officer_email
UPDATE public.executive_appointments
SET proposed_officer_email = 'tstroman.ceo@cravenusa.com'
WHERE proposed_officer_email = 'craven@usa.com'
AND proposed_officer_name ILIKE '%Torrance%Stroman%';

-- Update exec_users records
-- Note: exec_users doesn't have an email column, it uses user_id referencing auth.users
-- So we need to find the user_id from auth.users and update based on that
DO $$
DECLARE
  old_ceo_user_id UUID;
  new_ceo_user_id UUID;
BEGIN
  -- Get user IDs for both emails
  SELECT id INTO old_ceo_user_id
  FROM auth.users
  WHERE email = 'craven@usa.com'
  LIMIT 1;
  
  SELECT id INTO new_ceo_user_id
  FROM auth.users
  WHERE email = 'tstroman.ceo@cravenusa.com'
  LIMIT 1;
  
  -- If we have both user IDs, update exec_users to point to the new CEO account
  IF old_ceo_user_id IS NOT NULL AND new_ceo_user_id IS NOT NULL THEN
    -- Update exec_users records that reference the old CEO user_id
    UPDATE public.exec_users
    SET user_id = new_ceo_user_id
    WHERE user_id = old_ceo_user_id
    AND role = 'ceo';
  END IF;
  
  -- Also update any exec_users records with CEO title for Torrance
  IF new_ceo_user_id IS NOT NULL THEN
    UPDATE public.exec_users
    SET user_id = new_ceo_user_id
    WHERE title ILIKE '%CEO%' 
    AND title ILIKE '%Torrance%'
    AND (user_id IS NULL OR user_id != new_ceo_user_id);
  END IF;
END $$;

-- Copy password from craven@usa.com to tstroman.ceo@cravenusa.com
-- This ensures both accounts have the same password
-- NOTE: If tstroman.ceo@cravenusa.com doesn't exist yet, this will skip password copy
-- You'll need to create the user via Supabase Dashboard first, then re-run password copy
DO $$
DECLARE
  old_ceo_user_id UUID;
  new_ceo_user_id UUID;
  password_hash TEXT;
BEGIN
  -- Get user IDs and password hash
  SELECT id, encrypted_password INTO old_ceo_user_id, password_hash
  FROM auth.users
  WHERE email = 'craven@usa.com'
  LIMIT 1;
  
  SELECT id INTO new_ceo_user_id
  FROM auth.users
  WHERE email = 'tstroman.ceo@cravenusa.com'
  LIMIT 1;
  
  -- If both users exist and we have a password hash, copy it
  IF old_ceo_user_id IS NOT NULL AND new_ceo_user_id IS NOT NULL AND password_hash IS NOT NULL THEN
    UPDATE auth.users
    SET encrypted_password = password_hash,
        updated_at = now()
    WHERE id = new_ceo_user_id;
    
    RAISE NOTICE 'Successfully copied password from craven@usa.com to tstroman.ceo@cravenusa.com';
  ELSIF new_ceo_user_id IS NULL THEN
    RAISE WARNING 'User tstroman.ceo@cravenusa.com does not exist in auth.users. Skipping password copy.';
    RAISE WARNING 'Please create the user account via Supabase Dashboard (Authentication > Users > Add User), then re-run the password copy section of this migration.';
  ELSIF old_ceo_user_id IS NULL THEN
    RAISE WARNING 'User craven@usa.com does not exist in auth.users. Cannot copy password.';
  ELSE
    RAISE WARNING 'Password hash is NULL for craven@usa.com. Cannot copy password.';
  END IF;
END $$;

-- Update user_roles - grant CEO role to tstroman.ceo@cravenusa.com
DO $$
DECLARE
  ceo_user_id UUID;
BEGIN
  -- Get user ID for tstroman.ceo@cravenusa.com
  SELECT id INTO ceo_user_id
  FROM auth.users
  WHERE email = 'tstroman.ceo@cravenusa.com';
  
  IF ceo_user_id IS NOT NULL THEN
    -- Grant all executive roles (only roles that exist in the constraint)
    INSERT INTO public.user_roles (user_id, role)
    SELECT ceo_user_id, role_name
    FROM (VALUES 
      ('admin'),
      ('ceo'),
      ('cfo'),
      ('coo'),
      ('cto'),
      ('board_member'),
      ('CRAVEN_FOUNDER'),
      ('CRAVEN_CORPORATE_SECRETARY'),
      ('CRAVEN_BOARD_MEMBER'),
      ('CRAVEN_EXECUTIVE'),
      ('CRAVEN_CEO'),
      ('CRAVEN_CFO'),
      ('CRAVEN_CTO'),
      ('CRAVEN_COO')
    ) AS roles(role_name)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = ceo_user_id AND role = roles.role_name
    );
  END IF;
END $$;

-- Update RLS policies for governance tables (company/business side only)
-- These should check for tstroman.ceo@cravenusa.com

-- Note: We're NOT updating driver/merchant related policies
-- Those should continue to use craven@usa.com

COMMENT ON FUNCTION public.is_ceo_email IS 'Checks if email is the CEO executive account (tstroman.ceo@cravenusa.com). Does NOT include driver/merchant account (craven@usa.com).';

