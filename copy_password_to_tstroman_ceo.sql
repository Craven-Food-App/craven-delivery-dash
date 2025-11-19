-- ============================================================================
-- COPY PASSWORD FROM craven@usa.com TO tstroman.ceo@cravenusa.com
-- Run this AFTER creating the tstroman.ceo@cravenusa.com user account
-- ============================================================================
-- 
-- Prerequisites:
-- 1. User tstroman.ceo@cravenusa.com must exist in auth.users
-- 2. User craven@usa.com must exist in auth.users
--
-- This script copies the encrypted password hash so both accounts use the same password
-- ============================================================================

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
  
  -- Verify both users exist
  IF old_ceo_user_id IS NULL THEN
    RAISE EXCEPTION 'User craven@usa.com does not exist in auth.users';
  END IF;
  
  IF new_ceo_user_id IS NULL THEN
    RAISE EXCEPTION 'User tstroman.ceo@cravenusa.com does not exist. Please create the user account first via Supabase Dashboard (Authentication > Users > Add User)';
  END IF;
  
  IF password_hash IS NULL THEN
    RAISE EXCEPTION 'Password hash is NULL for craven@usa.com. Cannot copy password.';
  END IF;
  
  -- Copy the password hash
  UPDATE auth.users
  SET encrypted_password = password_hash,
      updated_at = now()
  WHERE id = new_ceo_user_id;
  
  RAISE NOTICE 'Successfully copied password from craven@usa.com to tstroman.ceo@cravenusa.com';
  RAISE NOTICE 'Both accounts now use the same password. You can log in with tstroman.ceo@cravenusa.com';
END $$;

