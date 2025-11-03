-- Check Torrance Stroman's current clock status
-- This will show all his time entries and current status

SELECT 
  te.id AS entry_id,
  te.user_id,
  u.email,
  te.clock_in_at,
  te.clock_out_at,
  te.status,
  te.work_location,
  te.total_hours,
  CASE 
    WHEN e.id IS NOT NULL THEN e.first_name || ' ' || e.last_name || ' (Employee)'
    WHEN up.id IS NOT NULL THEN up.full_name || ' (Executive)'
    WHEN u.email IS NOT NULL THEN u.email || ' (User)'
    ELSE 'Unknown User'
  END AS user_name,
  te.created_at,
  te.updated_at
FROM public.time_entries te
LEFT JOIN auth.users u ON te.user_id = u.id
LEFT JOIN public.employees e ON te.employee_id = e.id
LEFT JOIN public.exec_users eu ON te.exec_user_id = eu.id
LEFT JOIN public.user_profiles up ON te.user_id = up.user_id
WHERE (
  u.email = 'crave@usa.com'
  OR u.email = 'torrance.stroman@cravenusa.com'
  OR u.email ILIKE '%torrance%stroman%'
  OR u.email ILIKE '%crave@usa%'
  OR (e.first_name ILIKE '%Torrance%' AND e.last_name ILIKE '%Stroman%')
)
ORDER BY te.clock_in_at DESC
LIMIT 20;

-- Also check what get_employee_clock_status returns for Torrance
-- (You'll need to run this with Torrance's user_id)
SELECT 
  u.id AS user_id,
  u.email,
  'Run get_employee_clock_status with this user_id:' AS instruction,
  u.id AS user_id_to_use
FROM auth.users u
WHERE u.email = 'crave@usa.com'
   OR u.email = 'torrance.stroman@cravenusa.com'
   OR u.email ILIKE '%torrance%stroman%';

