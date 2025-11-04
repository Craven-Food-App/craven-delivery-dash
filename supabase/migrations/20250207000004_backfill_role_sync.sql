-- Backfill Role Synchronization
-- Syncs all existing employees to exec_users and user_roles
-- Ensures historical data is properly registered

-- Step 1: Sync all C-level employees to exec_users
INSERT INTO public.exec_users (user_id, role, department, title, access_level)
SELECT 
  e.user_id,
  public.position_to_exec_role(e.position) as role,
  public.get_department_name(e.department_id) as department,
  e.position as title,
  1 as access_level
FROM public.employees e
WHERE e.user_id IS NOT NULL
  AND public.is_c_level_position(e.position)
  AND public.position_to_exec_role(e.position) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.exec_users eu 
    WHERE eu.user_id = e.user_id
  )
ON CONFLICT (user_id) DO NOTHING;

-- Step 2: Sync all employees to user_roles (employee role)
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT
  e.user_id,
  'employee' as role
FROM public.employees e
WHERE e.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = e.user_id AND ur.role = 'employee'
  )
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 3: Sync C-level employees to user_roles (executive role)
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT
  e.user_id,
  'executive' as role
FROM public.employees e
WHERE e.user_id IS NOT NULL
  AND public.is_c_level_position(e.position)
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = e.user_id AND ur.role = 'executive'
  )
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 4: Update existing exec_users records with correct role and department
UPDATE public.exec_users eu
SET
  role = public.position_to_exec_role(e.position),
  department = public.get_department_name(e.department_id),
  title = e.position,
  updated_at = now()
FROM public.employees e
WHERE eu.user_id = e.user_id
  AND e.user_id IS NOT NULL
  AND public.is_c_level_position(e.position)
  AND (
    eu.role != public.position_to_exec_role(e.position) OR
    eu.title != e.position OR
    eu.department != public.get_department_name(e.department_id)
  );

-- Step 5: Remove exec_users records for employees no longer in C-level positions
-- BUT preserve records that have related time_entries (historical data)
-- First check if time_entries has exec_user_id column
DO $$
DECLARE
  has_exec_user_id_column BOOLEAN;
BEGIN
  -- Check if time_entries table has exec_user_id column
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'time_entries' 
    AND column_name = 'exec_user_id'
  ) INTO has_exec_user_id_column;
  
  IF has_exec_user_id_column THEN
    -- Only delete exec_users that don't have time_entries
    DELETE FROM public.exec_users eu
    WHERE NOT EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.user_id = eu.user_id
        AND public.is_c_level_position(e.position)
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.time_entries te
      WHERE te.exec_user_id = eu.id
    );
  ELSE
    -- No exec_user_id column, safe to delete all non-C-level
    DELETE FROM public.exec_users eu
    WHERE NOT EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.user_id = eu.user_id
        AND public.is_c_level_position(e.position)
    );
  END IF;
END $$;

-- Step 6: Remove executive role from user_roles for employees no longer in C-level positions
DELETE FROM public.user_roles ur
WHERE ur.role = 'executive'
  AND NOT EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.user_id = ur.user_id
      AND public.is_c_level_position(e.position)
  );

-- Add summary comment
COMMENT ON SCHEMA public IS 'Role synchronization system ensures all C-level positions are automatically registered in exec_users and user_roles tables';

