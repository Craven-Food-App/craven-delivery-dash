-- Force clock out Torrance Stroman
-- This will find his active clock-in entry and clock him out

DO $$
DECLARE
  torrance_user_id UUID;
  active_entry_id UUID;
BEGIN
  -- Find Torrance Stroman's user ID
  SELECT id INTO torrance_user_id
  FROM auth.users
  WHERE email = 'crave@usa.com'
     OR email = 'torrance.stroman@cravenusa.com'
     OR email ILIKE '%torrance%stroman%'
  LIMIT 1;
  
  IF torrance_user_id IS NULL THEN
    -- Try finding via exec_users table
    SELECT u.id INTO torrance_user_id
    FROM auth.users u
    JOIN public.exec_users eu ON u.id = eu.user_id
    WHERE eu.first_name ILIKE '%Torrance%'
      AND eu.last_name ILIKE '%Stroman%'
    LIMIT 1;
  END IF;
  
  IF torrance_user_id IS NOT NULL THEN
    -- Find active clock-in entry
    SELECT id INTO active_entry_id
    FROM public.time_entries
    WHERE user_id = torrance_user_id
      AND status = 'clocked_in'
      AND clock_out_at IS NULL
    ORDER BY clock_in_at DESC
    LIMIT 1;
    
    IF active_entry_id IS NOT NULL THEN
      -- Clock out the active entry
      UPDATE public.time_entries
      SET 
        clock_out_at = now(),
        status = 'clocked_out',
        updated_at = now()
      WHERE id = active_entry_id;
      
      RAISE NOTICE 'Successfully clocked out user % (entry ID: %)', torrance_user_id, active_entry_id;
    ELSE
      RAISE NOTICE 'No active clock-in found for user %', torrance_user_id;
    END IF;
  ELSE
    RAISE NOTICE 'Could not find Torrance Stroman user.';
  END IF;
END $$;

-- Verify the clock out worked
SELECT 
  te.id,
  te.user_id,
  te.clock_in_at,
  te.clock_out_at,
  te.status,
  CASE 
    WHEN e.id IS NOT NULL THEN e.first_name || ' ' || e.last_name
    WHEN up.id IS NOT NULL THEN up.full_name
    WHEN u.email IS NOT NULL THEN u.email
    ELSE 'Unknown'
  END AS user_name
FROM public.time_entries te
LEFT JOIN auth.users u ON te.user_id = u.id
LEFT JOIN public.employees e ON te.employee_id = e.id
LEFT JOIN public.exec_users eu ON te.exec_user_id = eu.id
LEFT JOIN public.user_profiles up ON te.user_id = up.user_id
WHERE (
  te.user_id = (SELECT id FROM auth.users WHERE email = 'crave@usa.com' LIMIT 1)
  OR te.user_id = (SELECT id FROM auth.users WHERE email = 'torrance.stroman@cravenusa.com' LIMIT 1)
)
ORDER BY te.clock_in_at DESC
LIMIT 5;

