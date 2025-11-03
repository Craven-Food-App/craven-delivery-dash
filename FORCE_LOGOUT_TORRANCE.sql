-- Force logout Torrance Stroman
-- This script will invalidate all active sessions for Torrance Stroman

-- Method 1: Delete all sessions for Torrance Stroman's user
-- First, we need to find his user ID from auth.users
DO $$
DECLARE
  torrance_user_id UUID;
BEGIN
  -- Find Torrance Stroman's user ID from auth.users by email
  SELECT id INTO torrance_user_id
  FROM auth.users
  WHERE email = 'torrance.stroman@cravenusa.com'
     OR email ILIKE '%torrance%stroman%'
  LIMIT 1;
  
  IF torrance_user_id IS NOT NULL THEN
    -- Delete all sessions for this user
    DELETE FROM auth.sessions
    WHERE user_id = torrance_user_id;
    
    RAISE NOTICE 'Successfully logged out user with ID: %', torrance_user_id;
  ELSE
    RAISE NOTICE 'Could not find Torrance Stroman in auth.users';
    
    -- Try alternative: find by exec_users table
    SELECT u.id INTO torrance_user_id
    FROM auth.users u
    JOIN public.exec_users eu ON u.id = eu.user_id
    WHERE eu.first_name ILIKE '%Torrance%'
      AND eu.last_name ILIKE '%Stroman%'
    LIMIT 1;
    
    IF torrance_user_id IS NOT NULL THEN
      DELETE FROM auth.sessions
      WHERE user_id = torrance_user_id;
      
      RAISE NOTICE 'Successfully logged out user (found via exec_users) with ID: %', torrance_user_id;
    ELSE
      RAISE NOTICE 'Could not find Torrance Stroman user. Please check the email or exec_users table.';
    END IF;
  END IF;
END $$;

-- Alternative: If you know the exact user ID, you can directly delete:
-- DELETE FROM auth.sessions WHERE user_id = 'USER_ID_HERE';

-- To verify the logout worked, check active sessions:
-- SELECT user_id, created_at, updated_at 
-- FROM auth.sessions 
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'torrance.stroman@cravenusa.com');

