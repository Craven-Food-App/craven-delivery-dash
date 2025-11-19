-- ============================================================================
-- CREATE TSTRONAN.CEO@CRAVENUSA.COM ACCOUNT
-- Run this BEFORE running the migration 20250211000023_update_ceo_email_to_tstroman.sql
-- ============================================================================
-- 
-- NOTE: This script cannot directly create auth.users records via SQL.
-- You need to create the user account through one of these methods:
--
-- METHOD 1: Supabase Dashboard
--   1. Go to Authentication > Users
--   2. Click "Add User" > "Create new user"
--   3. Email: tstroman.ceo@cravenusa.com
--   4. Password: (use the same password as craven@usa.com)
--   5. Auto Confirm User: Yes
--
-- METHOD 2: Supabase CLI
--   supabase auth users create tstroman.ceo@cravenusa.com --password "YOUR_PASSWORD"
--
-- METHOD 3: After creating via dashboard, run this to verify:
-- ============================================================================

-- Verify the user exists
DO $$
DECLARE
  ceo_user_id UUID;
BEGIN
  SELECT id INTO ceo_user_id
  FROM auth.users
  WHERE email = 'tstroman.ceo@cravenusa.com';
  
  IF ceo_user_id IS NULL THEN
    RAISE EXCEPTION 'User tstroman.ceo@cravenusa.com does not exist. Please create the user account first via Supabase Dashboard or CLI.';
  ELSE
    RAISE NOTICE 'User tstroman.ceo@cravenusa.com exists with ID: %', ceo_user_id;
  END IF;
END $$;

-- After the user is created, the migration will copy the password hash automatically

