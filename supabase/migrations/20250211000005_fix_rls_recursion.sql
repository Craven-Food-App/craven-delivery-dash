-- Fix infinite recursion in RLS policies
-- The issue is that policies checking user_roles cause recursion when accessing user_roles itself
-- Solution: Create a security definer function to check email safely

-- Create helper function to check if current user is craven@usa.com
-- This function runs with SECURITY DEFINER so it can access auth.users
CREATE OR REPLACE FUNCTION public.is_craven_founder()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = auth.uid();
  
  RETURN COALESCE(user_email = 'craven@usa.com', false);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_craven_founder() TO authenticated;

-- Create helper function to get current user email
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = auth.uid();
  
  RETURN user_email;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_current_user_email() TO authenticated;

-- IMPORTANT: Drop ALL existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "craven_usa_com_full_access_user_roles" ON public.user_roles;

-- Fix user_roles policies - craven@usa.com gets universal access FIRST
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (
  public.is_craven_founder()
  OR user_id = auth.uid()
);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (
  public.is_craven_founder()
  OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'ceo')
);

-- board_members policies - craven@usa.com gets universal access FIRST
DROP POLICY IF EXISTS "craven_usa_com_full_access_board_members" ON public.board_members;
DROP POLICY IF EXISTS "Founder and Secretary can manage board members" ON public.board_members;
DROP POLICY IF EXISTS "Board members can view their own record" ON public.board_members;

CREATE POLICY "Founder and Secretary can manage board members"
ON public.board_members FOR ALL
TO authenticated
USING (
  public.is_craven_founder()
  OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'ceo')
);

CREATE POLICY "Board members can view their own record"
ON public.board_members FOR SELECT
TO authenticated
USING (
  public.is_craven_founder()
  OR user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role IN ('ceo', 'board_member'))
);

-- governance_board_resolutions policies - craven@usa.com gets universal access FIRST
DROP POLICY IF EXISTS "craven_usa_com_full_access_resolutions" ON public.governance_board_resolutions;
DROP POLICY IF EXISTS "Founder and Secretary can manage resolutions" ON public.governance_board_resolutions;
DROP POLICY IF EXISTS "Authorized users can view resolutions" ON public.governance_board_resolutions;
DROP POLICY IF EXISTS "Founder and Secretary can update resolutions" ON public.governance_board_resolutions;
DROP POLICY IF EXISTS "Board members can view resolutions" ON public.governance_board_resolutions;

CREATE POLICY "Founder and Secretary can manage resolutions"
ON public.governance_board_resolutions FOR INSERT
TO authenticated
WITH CHECK (
  public.is_craven_founder()
  OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'ceo')
);

CREATE POLICY "Founder and Secretary can update resolutions"
ON public.governance_board_resolutions FOR UPDATE
TO authenticated
USING (
  public.is_craven_founder()
  OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'ceo')
);

CREATE POLICY "Board members can view resolutions"
ON public.governance_board_resolutions FOR SELECT
TO authenticated
USING (
  public.is_craven_founder()
  OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role IN ('ceo', 'board_member'))
  OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role IN ('cfo', 'cto', 'coo', 'cxo'))
);

-- board_resolution_votes policies - craven@usa.com gets universal access FIRST
DROP POLICY IF EXISTS "craven_usa_com_full_access_votes" ON public.board_resolution_votes;
DROP POLICY IF EXISTS "Board members can vote" ON public.board_resolution_votes;
DROP POLICY IF EXISTS "Board members can update their votes" ON public.board_resolution_votes;
DROP POLICY IF EXISTS "Authorized users can view votes" ON public.board_resolution_votes;
DROP POLICY IF EXISTS "Board members can view votes" ON public.board_resolution_votes;

CREATE POLICY "Board members can vote"
ON public.board_resolution_votes FOR INSERT
TO authenticated
WITH CHECK (
  public.is_craven_founder()
  OR EXISTS (
    SELECT 1 FROM public.board_members 
    WHERE id = board_member_id AND user_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role IN ('ceo', 'board_member'))
);

CREATE POLICY "Board members can update their votes"
ON public.board_resolution_votes FOR UPDATE
TO authenticated
USING (
  public.is_craven_founder()
  OR EXISTS (
    SELECT 1 FROM public.board_members 
    WHERE id = board_member_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Board members can view votes"
ON public.board_resolution_votes FOR SELECT
TO authenticated
USING (
  public.is_craven_founder()
  OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role IN ('ceo', 'board_member'))
);

-- corporate_officers policies - craven@usa.com gets universal access FIRST
DROP POLICY IF EXISTS "craven_usa_com_full_access_officers" ON public.corporate_officers;
DROP POLICY IF EXISTS "Authorized users can view officers" ON public.corporate_officers;
DROP POLICY IF EXISTS "Founder and Secretary can manage officers" ON public.corporate_officers;
DROP POLICY IF EXISTS "Officers can view their own record" ON public.corporate_officers;

CREATE POLICY "Founder and Secretary can manage officers"
ON public.corporate_officers FOR ALL
TO authenticated
USING (
  public.is_craven_founder()
  OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'ceo')
);

CREATE POLICY "Officers can view their own record"
ON public.corporate_officers FOR SELECT
TO authenticated
USING (
  public.is_craven_founder()
  OR email = public.get_current_user_email()
  OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role IN ('ceo', 'cfo', 'cto', 'coo', 'cxo'))
);

-- executive_appointments policies - craven@usa.com gets universal access FIRST
DROP POLICY IF EXISTS "craven_usa_com_full_access_appointments" ON public.executive_appointments;
DROP POLICY IF EXISTS "Founder and Secretary can manage appointments" ON public.executive_appointments;
DROP POLICY IF EXISTS "Executives can view their own appointments" ON public.executive_appointments;
DROP POLICY IF EXISTS "Authorized users can view appointments" ON public.executive_appointments;

CREATE POLICY "Founder and Secretary can manage appointments"
ON public.executive_appointments FOR ALL
TO authenticated
USING (
  public.is_craven_founder()
  OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'ceo')
);

CREATE POLICY "Executives can view their own appointments"
ON public.executive_appointments FOR SELECT
TO authenticated
USING (
  public.is_craven_founder()
  OR proposed_officer_email = public.get_current_user_email()
  OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role IN ('ceo', 'cfo', 'cto', 'coo', 'cxo'))
);

-- governance_logs policies - craven@usa.com gets universal access FIRST
DROP POLICY IF EXISTS "craven_usa_com_full_access_logs" ON public.governance_logs;
DROP POLICY IF EXISTS "Executives can view logs" ON public.governance_logs;
DROP POLICY IF EXISTS "Authorized users can view logs" ON public.governance_logs;
DROP POLICY IF EXISTS "System can insert logs" ON public.governance_logs;

CREATE POLICY "Executives can view logs"
ON public.governance_logs FOR SELECT
TO authenticated
USING (
  public.is_craven_founder()
  OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role IN ('ceo', 'cfo', 'cto', 'coo', 'cxo'))
);

CREATE POLICY "System can insert logs"
ON public.governance_logs FOR INSERT
TO authenticated
WITH CHECK (true);
