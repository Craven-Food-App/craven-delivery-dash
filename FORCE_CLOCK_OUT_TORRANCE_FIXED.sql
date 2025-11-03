-- Force clock out Torrance Stroman - Fixed Version
-- Run this in Supabase SQL Editor

-- First, let's find all active clock-ins for debugging
SELECT 
  te.id,
  te.user_id,
  u.email,
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
WHERE te.status = 'clocked_in'
  AND te.clock_out_at IS NULL
ORDER BY te.clock_in_at DESC;

-- Now force clock out Torrance Stroman
UPDATE public.time_entries
SET 
  clock_out_at = now(),
  status = 'clocked_out',
  updated_at = now()
WHERE id IN (
  SELECT te.id
  FROM public.time_entries te
  LEFT JOIN auth.users u ON te.user_id = u.id
  LEFT JOIN public.employees e ON te.employee_id = e.id
  LEFT JOIN public.exec_users eu ON te.exec_user_id = eu.id
  WHERE (
    u.email = 'crave@usa.com'
    OR u.email = 'torrance.stroman@cravenusa.com'
    OR u.email ILIKE '%torrance%stroman%'
    OR u.email ILIKE '%crave@usa%'
  )
  AND te.status = 'clocked_in'
  AND te.clock_out_at IS NULL
);

-- Verify the update
SELECT 
  te.id,
  te.user_id,
  u.email,
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
  u.email = 'crave@usa.com'
  OR u.email = 'torrance.stroman@cravenusa.com'
  OR u.email ILIKE '%torrance%stroman%'
  OR (eu.first_name ILIKE '%Torrance%' AND eu.last_name ILIKE '%Stroman%')
)
ORDER BY te.clock_in_at DESC
LIMIT 5;

-- Alternative: If you know the exact entry ID, use this:
-- UPDATE public.time_entries
-- SET clock_out_at = now(), status = 'clocked_out', updated_at = now()
-- WHERE id = 'ENTRY_ID_HERE';

