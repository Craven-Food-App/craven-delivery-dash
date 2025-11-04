-- Migration: Ensure all C-level employees have exec_users records
-- This syncs existing C-level employees from the employees table to exec_users
-- so they can use the executive messaging system

INSERT INTO public.exec_users (user_id, role, department, title, access_level)
SELECT 
  e.user_id,
  CASE 
    WHEN LOWER(e.position) LIKE '%ceo%' OR LOWER(e.position) LIKE '%chief executive%' THEN 'ceo'
    WHEN LOWER(e.position) LIKE '%cfo%' OR LOWER(e.position) LIKE '%chief financial%' THEN 'cfo'
    WHEN LOWER(e.position) LIKE '%coo%' OR LOWER(e.position) LIKE '%chief operating%' THEN 'coo'
    WHEN LOWER(e.position) LIKE '%cto%' OR LOWER(e.position) LIKE '%chief technology%' THEN 'cto'
    WHEN LOWER(e.position) LIKE '%cmo%' OR LOWER(e.position) LIKE '%chief marketing%' THEN 'cmo'
    WHEN LOWER(e.position) LIKE '%cro%' OR LOWER(e.position) LIKE '%chief revenue%' THEN 'board_member'
    WHEN LOWER(e.position) LIKE '%cpo%' OR LOWER(e.position) LIKE '%chief product%' THEN 'board_member'
    WHEN LOWER(e.position) LIKE '%cdo%' OR LOWER(e.position) LIKE '%chief data%' THEN 'board_member'
    WHEN LOWER(e.position) LIKE '%chro%' OR LOWER(e.position) LIKE '%chief human%' THEN 'board_member'
    WHEN LOWER(e.position) LIKE '%clo%' OR LOWER(e.position) LIKE '%chief legal%' THEN 'board_member'
    WHEN LOWER(e.position) LIKE '%cso%' OR LOWER(e.position) LIKE '%chief security%' THEN 'board_member'
    WHEN LOWER(e.position) LIKE '%cxo%' THEN 'board_member'
    WHEN LOWER(e.position) LIKE '%president%' THEN 'board_member'
    ELSE 'board_member'
  END as role,
  COALESCE(d.name, 'Executive') as department,
  e.position as title,
  1 as access_level
FROM public.employees e
LEFT JOIN public.departments d ON d.id = e.department_id
WHERE e.user_id IS NOT NULL
  AND (
    LOWER(e.position) LIKE '%ceo%' OR
    LOWER(e.position) LIKE '%cfo%' OR
    LOWER(e.position) LIKE '%coo%' OR
    LOWER(e.position) LIKE '%cto%' OR
    LOWER(e.position) LIKE '%cmo%' OR
    LOWER(e.position) LIKE '%cro%' OR
    LOWER(e.position) LIKE '%cpo%' OR
    LOWER(e.position) LIKE '%cdo%' OR
    LOWER(e.position) LIKE '%chro%' OR
    LOWER(e.position) LIKE '%clo%' OR
    LOWER(e.position) LIKE '%cso%' OR
    LOWER(e.position) LIKE '%cxo%' OR
    LOWER(e.position) LIKE '%chief%' OR
    LOWER(e.position) LIKE '%president%' OR
    LOWER(e.position) LIKE '%board member%' OR
    LOWER(e.position) LIKE '%advisor%'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.exec_users eu 
    WHERE eu.user_id = e.user_id
  )
ON CONFLICT (user_id) DO NOTHING;

-- Add comment
COMMENT ON TABLE public.exec_users IS 'Executive users table - automatically synced with C-level employees from employees table';

