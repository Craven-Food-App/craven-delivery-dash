-- ============================================================================
-- CREATE SECURITY DEFINER FUNCTION FOR USER_ROLES SYNC
-- ============================================================================
-- This function bypasses RLS to allow role synchronization
-- ============================================================================

-- Function to sync user_roles for an employee
-- Uses SECURITY DEFINER to bypass RLS
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
  -- Ensure employee role exists
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

  -- Ensure executive role exists (if provided)
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

  -- Mark as successful if no errors
  IF jsonb_array_length(COALESCE(v_result->'errors', '[]'::jsonb)) = 0 THEN
    v_result := jsonb_set(v_result, '{success}', 'true'::jsonb);
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.sync_user_roles_for_employee TO authenticated;

-- Verify the function
DO $$
BEGIN
  RAISE NOTICE '✅ Created sync_user_roles_for_employee function';
  RAISE NOTICE '   - Uses SECURITY DEFINER to bypass RLS';
  RAISE NOTICE '   - Can be called by authenticated users';
END $$;

