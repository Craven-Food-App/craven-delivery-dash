-- ============================================================================
-- COMPLETE ROLE SYNCHRONIZATION SYSTEM
-- ============================================================================
-- This script applies all role synchronization migrations in order
-- Run this in Supabase Dashboard SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 0: FIX USER_ROLES CONSTRAINT
-- ============================================================================
-- Must be done first to allow 'employee' and 'executive' roles
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_role_check;

ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_role_check 
CHECK (role IN ('admin', 'moderator', 'user', 'employee', 'executive', 'customer', 'driver'));

-- Step 0.5: Ensure is_admin function exists
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = user_uuid AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Step 0.6: Update exec_users constraint to allow 'executive' role
ALTER TABLE public.exec_users DROP CONSTRAINT IF EXISTS exec_users_role_check;
ALTER TABLE public.exec_users ADD CONSTRAINT exec_users_role_check 
CHECK (role IN ('ceo', 'cfo', 'coo', 'cto', 'cxo', 'cmo', 'cro', 'cpo', 'cdo', 'chro', 'clo', 'cso', 'board_member', 'advisor', 'executive'));

-- ============================================================================
-- MIGRATION 1: Sync existing C-level employees to exec_users
-- ============================================================================
INSERT INTO public.exec_users (user_id, role, department, title, access_level)
SELECT 
  e.user_id,
  CASE 
    WHEN LOWER(e.position) LIKE '%ceo%' OR LOWER(e.position) LIKE '%chief executive%' THEN 'ceo'
    WHEN LOWER(e.position) LIKE '%cfo%' OR LOWER(e.position) LIKE '%chief financial%' THEN 'cfo'
    WHEN LOWER(e.position) LIKE '%coo%' OR LOWER(e.position) LIKE '%chief operating%' THEN 'coo'
    WHEN LOWER(e.position) LIKE '%cto%' OR LOWER(e.position) LIKE '%chief technology%' THEN 'cto'
    WHEN LOWER(e.position) LIKE '%cmo%' OR LOWER(e.position) LIKE '%chief marketing%' THEN 'board_member'
    WHEN LOWER(e.position) LIKE '%cro%' OR LOWER(e.position) LIKE '%chief revenue%' THEN 'board_member'
    WHEN LOWER(e.position) LIKE '%cpo%' OR LOWER(e.position) LIKE '%chief product%' THEN 'board_member'
    WHEN LOWER(e.position) LIKE '%cdo%' OR LOWER(e.position) LIKE '%chief data%' THEN 'board_member'
    WHEN LOWER(e.position) LIKE '%chro%' OR LOWER(e.position) LIKE '%chief human%' THEN 'board_member'
    WHEN LOWER(e.position) LIKE '%clo%' OR LOWER(e.position) LIKE '%chief legal%' THEN 'board_member'
    WHEN LOWER(e.position) LIKE '%cso%' OR LOWER(e.position) LIKE '%chief security%' THEN 'board_member'
    WHEN LOWER(e.position) LIKE '%cxo%' THEN 'executive'
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

-- ============================================================================
-- MIGRATION 2: Create Role Synchronization Functions
-- ============================================================================

-- Function: Check if position is C-level executive
CREATE OR REPLACE FUNCTION public.is_c_level_position(position_text TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF position_text IS NULL OR position_text = '' THEN
    RETURN FALSE;
  END IF;
  
  RETURN LOWER(position_text) ~ '.*(chief|ceo|cfo|coo|cto|cmo|cro|cpo|cdo|chro|clo|cso|cxo|president|board member|advisor).*';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Normalize position to exec_users role
CREATE OR REPLACE FUNCTION public.position_to_exec_role(position_text TEXT)
RETURNS TEXT AS $$
DECLARE
  pos_lower TEXT;
BEGIN
  IF position_text IS NULL OR position_text = '' THEN
    RETURN NULL;
  END IF;
  
  pos_lower := LOWER(position_text);
  
  CASE
    WHEN pos_lower LIKE '%ceo%' OR pos_lower LIKE '%chief executive%' THEN 
      RETURN 'ceo';
    WHEN pos_lower LIKE '%cfo%' OR pos_lower LIKE '%chief financial%' THEN 
      RETURN 'cfo';
    WHEN pos_lower LIKE '%coo%' OR pos_lower LIKE '%chief operating%' THEN 
      RETURN 'coo';
    WHEN pos_lower LIKE '%cto%' OR pos_lower LIKE '%chief technology%' THEN 
      RETURN 'cto';
    WHEN pos_lower LIKE '%cmo%' OR pos_lower LIKE '%chief marketing%' THEN 
      RETURN 'board_member';
    WHEN pos_lower LIKE '%cro%' OR pos_lower LIKE '%chief revenue%' THEN 
      RETURN 'board_member';
    WHEN pos_lower LIKE '%cpo%' OR pos_lower LIKE '%chief product%' THEN 
      RETURN 'board_member';
    WHEN pos_lower LIKE '%cdo%' OR pos_lower LIKE '%chief data%' THEN 
      RETURN 'board_member';
    WHEN pos_lower LIKE '%chro%' OR pos_lower LIKE '%chief human%' THEN 
      RETURN 'board_member';
    WHEN pos_lower LIKE '%clo%' OR pos_lower LIKE '%chief legal%' THEN 
      RETURN 'board_member';
    WHEN pos_lower LIKE '%cso%' OR pos_lower LIKE '%chief security%' THEN 
      RETURN 'board_member';
    WHEN pos_lower LIKE '%cxo%' THEN 
      RETURN 'board_member';
    WHEN pos_lower LIKE '%president%' THEN 
      RETURN 'board_member';
    WHEN pos_lower LIKE '%board member%' OR pos_lower LIKE '%advisor%' THEN 
      RETURN 'board_member';
    ELSE 
      RETURN NULL;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Get department name from department_id
CREATE OR REPLACE FUNCTION public.get_department_name(dept_id UUID)
RETURNS TEXT AS $$
DECLARE
  dept_name TEXT;
BEGIN
  IF dept_id IS NULL THEN
    RETURN 'Executive';
  END IF;
  
  SELECT name INTO dept_name 
  FROM public.departments 
  WHERE id = dept_id;
  
  RETURN COALESCE(dept_name, 'Executive');
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- MIGRATION 3: Create Role Synchronization Triggers
-- ============================================================================

-- Function: Sync employee to exec_users when C-level position
CREATE OR REPLACE FUNCTION public.sync_employee_to_exec_users()
RETURNS TRIGGER AS $$
DECLARE
  exec_role TEXT;
  dept_name TEXT;
BEGIN
  -- Only process if user_id exists and position is C-level
  IF NEW.user_id IS NOT NULL AND public.is_c_level_position(NEW.position) THEN
    exec_role := public.position_to_exec_role(NEW.position);
    
    IF exec_role IS NOT NULL THEN
      -- Get department name
      dept_name := public.get_department_name(NEW.department_id);
      
      -- Insert or update exec_users
      INSERT INTO public.exec_users (user_id, role, department, title, access_level)
      VALUES (NEW.user_id, exec_role, dept_name, NEW.position, 1)
      ON CONFLICT (user_id) 
      DO UPDATE SET
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        title = EXCLUDED.title,
        updated_at = now();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Sync employee to user_roles
CREATE OR REPLACE FUNCTION public.sync_employee_to_user_roles()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    -- Add employee role (always)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'employee')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Add executive role if C-level
    IF public.is_c_level_position(NEW.position) THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.user_id, 'executive')
      ON CONFLICT (user_id, role) DO NOTHING;
    ELSE
      -- Remove executive role if not C-level
      DELETE FROM public.user_roles 
      WHERE user_id = NEW.user_id AND role = 'executive';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Handle position changes (promotions/demotions)
CREATE OR REPLACE FUNCTION public.handle_employee_position_change()
RETURNS TRIGGER AS $$
DECLARE
  exec_role TEXT;
  dept_name TEXT;
  has_time_entries BOOLEAN;
BEGIN
  -- Position changed
  IF OLD.position IS DISTINCT FROM NEW.position OR OLD.department_id IS DISTINCT FROM NEW.department_id THEN
    -- If position changed FROM C-level TO non-C-level, check if we can safely remove exec_users
    IF public.is_c_level_position(OLD.position) AND NOT public.is_c_level_position(NEW.position) THEN
      -- Check if there are time_entries that reference this exec_user
      -- If time_entries has exec_user_id column, check for references
      -- Otherwise, we can safely remove
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'time_entries' 
        AND column_name = 'exec_user_id'
      ) INTO has_time_entries;
      
      IF has_time_entries THEN
        -- Check if there are actually time_entries using this exec_user_id
        SELECT EXISTS (
          SELECT 1 FROM public.time_entries te
          JOIN public.exec_users eu ON eu.id = te.exec_user_id
          WHERE eu.user_id = NEW.user_id
        ) INTO has_time_entries;
        
        -- Only remove exec_users if no time_entries reference it
        -- Otherwise, keep the exec_user record (historical data preservation)
        IF NOT has_time_entries THEN
          DELETE FROM public.exec_users WHERE user_id = NEW.user_id;
        END IF;
      ELSE
        -- No exec_user_id column, safe to delete
        DELETE FROM public.exec_users WHERE user_id = NEW.user_id;
      END IF;
      
      DELETE FROM public.user_roles WHERE user_id = NEW.user_id AND role = 'executive';
    END IF;
    
    -- If position changed TO C-level, create/update exec_users
    IF NOT public.is_c_level_position(OLD.position) AND public.is_c_level_position(NEW.position) THEN
      IF NEW.user_id IS NOT NULL THEN
        exec_role := public.position_to_exec_role(NEW.position);
        IF exec_role IS NOT NULL THEN
          dept_name := public.get_department_name(NEW.department_id);
          
          INSERT INTO public.exec_users (user_id, role, department, title, access_level)
          VALUES (NEW.user_id, exec_role, dept_name, NEW.position, 1)
          ON CONFLICT (user_id) 
          DO UPDATE SET
            role = EXCLUDED.role,
            department = EXCLUDED.department,
            title = EXCLUDED.title,
            updated_at = now();
          
          INSERT INTO public.user_roles (user_id, role)
          VALUES (NEW.user_id, 'executive')
          ON CONFLICT (user_id, role) DO NOTHING;
        END IF;
      END IF;
    END IF;
    
    -- If still C-level but role might have changed, update exec_users
    IF public.is_c_level_position(NEW.position) AND public.is_c_level_position(OLD.position) THEN
      IF NEW.user_id IS NOT NULL THEN
        exec_role := public.position_to_exec_role(NEW.position);
        IF exec_role IS NOT NULL THEN
          dept_name := public.get_department_name(NEW.department_id);
          
          UPDATE public.exec_users
          SET role = exec_role,
              department = dept_name,
              title = NEW.position,
              updated_at = now()
          WHERE user_id = NEW.user_id;
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_sync_employee_to_exec_users ON public.employees;
CREATE TRIGGER trigger_sync_employee_to_exec_users
  AFTER INSERT OR UPDATE ON public.employees
  FOR EACH ROW
  WHEN (NEW.user_id IS NOT NULL)
  EXECUTE FUNCTION public.sync_employee_to_exec_users();

DROP TRIGGER IF EXISTS trigger_sync_employee_to_user_roles ON public.employees;
CREATE TRIGGER trigger_sync_employee_to_user_roles
  AFTER INSERT OR UPDATE ON public.employees
  FOR EACH ROW
  WHEN (NEW.user_id IS NOT NULL)
  EXECUTE FUNCTION public.sync_employee_to_user_roles();

DROP TRIGGER IF EXISTS trigger_handle_position_change ON public.employees;
CREATE TRIGGER trigger_handle_position_change
  AFTER UPDATE ON public.employees
  FOR EACH ROW
  WHEN (
    OLD.position IS DISTINCT FROM NEW.position OR 
    OLD.department_id IS DISTINCT FROM NEW.department_id OR
    OLD.user_id IS DISTINCT FROM NEW.user_id
  )
  EXECUTE FUNCTION public.handle_employee_position_change();

-- ============================================================================
-- MIGRATION 4: Backfill Existing Data
-- ============================================================================

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

-- ============================================================================
-- STEP 6: FIX USER_ROLES RLS POLICIES
-- ============================================================================
-- Allow executives to manage roles for role sync
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Executives can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "C-level can manage roles" ON public.user_roles;

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.is_admin(auth.uid()));

CREATE POLICY "Executives can manage roles"
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.exec_users eu
    WHERE eu.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.user_id = auth.uid()
    AND public.is_c_level_position(e.position)
  )
);

-- ============================================================================
-- STEP 7: CREATE SECURITY DEFINER FUNCTION FOR ROLE SYNC
-- ============================================================================
CREATE OR REPLACE FUNCTION public.sync_user_roles_for_employee(
  p_employee_id UUID,
  p_user_id UUID,
  p_employee_role TEXT DEFAULT 'employee',
  p_executive_role TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB := '{"success": false, "errors": []}'::jsonb;
  v_error TEXT;
BEGIN
  IF p_employee_role IS NOT NULL THEN
    BEGIN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (p_user_id, p_employee_role)
      ON CONFLICT (user_id, role) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      v_error := SQLERRM;
      v_result := jsonb_set(v_result, '{errors}', 
        COALESCE(v_result->'errors', '[]'::jsonb) || jsonb_build_array(v_error));
    END;
  END IF;

  IF p_executive_role IS NOT NULL THEN
    BEGIN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (p_user_id, p_executive_role)
      ON CONFLICT (user_id, role) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      v_error := SQLERRM;
      v_result := jsonb_set(v_result, '{errors}', 
        COALESCE(v_result->'errors', '[]'::jsonb) || jsonb_build_array(v_error));
    END;
  END IF;

  IF jsonb_array_length(COALESCE(v_result->'errors', '[]'::jsonb)) = 0 THEN
    v_result := jsonb_set(v_result, '{success}', 'true'::jsonb);
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.sync_user_roles_for_employee TO authenticated;

-- ============================================================================
-- COMPLETE - All migrations applied successfully!
-- ============================================================================
-- The role synchronization system is now active:
-- - All C-level positions automatically sync to exec_users
-- - All employees automatically sync to user_roles
-- - Position changes automatically update roles
-- - System-wide consistency ensured
-- - Executives can manage roles for role sync
-- ============================================================================

