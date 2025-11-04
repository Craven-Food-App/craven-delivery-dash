-- Role Synchronization Triggers
-- Automatically syncs employees table with exec_users and user_roles
-- Ensures C-level positions are always registered system-wide

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

-- Add comments
COMMENT ON FUNCTION public.sync_employee_to_exec_users IS 'Automatically creates/updates exec_users record when employee has C-level position';
COMMENT ON FUNCTION public.sync_employee_to_user_roles IS 'Automatically syncs user_roles when employee record is created/updated';
COMMENT ON FUNCTION public.handle_employee_position_change IS 'Handles position changes (promotions/demotions) and updates exec_users accordingly';

