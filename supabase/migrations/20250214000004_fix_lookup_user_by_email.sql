-- Fix lookup_user_by_email function
-- The error was about eu.email not existing, but the function should only use u.email from auth.users
-- This ensures the function works correctly with the current schema

CREATE OR REPLACE FUNCTION public.lookup_user_by_email(p_email TEXT)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
  v_full_name TEXT;
  v_created_at TIMESTAMPTZ;
  v_exec_name TEXT;
  v_profile_name TEXT;
BEGIN
  -- Check if caller has governance management permissions
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('CRAVEN_FOUNDER', 'CRAVEN_CORPORATE_SECRETARY')
  ) THEN
    RAISE EXCEPTION 'Access denied. Only Founders and Corporate Secretaries can lookup users.';
  END IF;

  -- Try to find user in auth.users first (most reliable)
  -- Use u.email (from auth.users), NOT eu.email (exec_users doesn't have reliable email)
  SELECT u.id, u.email, 
         COALESCE(
           (u.raw_user_meta_data->>'full_name')::TEXT,
           (u.raw_user_meta_data->>'name')::TEXT,
           ''
         ),
         u.created_at
  INTO v_user_id, v_email, v_full_name, v_created_at
  FROM auth.users u
  WHERE LOWER(u.email) = LOWER(p_email)
  LIMIT 1;

  -- If found, try to get additional info from exec_users
  -- Use title column which definitely exists (name might not exist in all environments)
  IF v_user_id IS NOT NULL THEN
    -- Get title from exec_users (this column definitely exists)
    SELECT eu.title
    INTO v_exec_name
    FROM public.exec_users eu
    WHERE eu.user_id = v_user_id
    LIMIT 1;
    
    -- Use exec_users.title if available and not empty
    IF v_exec_name IS NOT NULL AND v_exec_name != '' THEN
      v_full_name := v_exec_name;
    END IF;
    
    -- Also try to get name from user_profiles as fallback
    IF (v_full_name IS NULL OR v_full_name = '') THEN
      SELECT up.full_name
      INTO v_profile_name
      FROM public.user_profiles up
      WHERE up.user_id = v_user_id
      LIMIT 1;
      
      IF v_profile_name IS NOT NULL AND v_profile_name != '' THEN
        v_full_name := v_profile_name;
      END IF;
    END IF;
  END IF;

  -- Return results
  IF v_user_id IS NOT NULL THEN
    RETURN QUERY SELECT 
      v_user_id AS user_id, 
      v_email AS email, 
      v_full_name AS full_name, 
      v_created_at AS created_at;
  END IF;

  -- If still not found, return empty result
  RETURN;
END;
$$;

COMMENT ON FUNCTION public.lookup_user_by_email IS 
'Lookup user information by email. Requires CRAVEN_FOUNDER or CRAVEN_CORPORATE_SECRETARY role. Uses u.email from auth.users, not eu.email from exec_users.';

