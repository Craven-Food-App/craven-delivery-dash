-- Grant full access to craven@usa.com (Torrance Stroman) for all governance tables
-- This ensures the founder always has complete access regardless of roles

-- Update RLS policies to allow craven@usa.com full access

-- user_roles: Allow craven@usa.com to manage all roles
DROP POLICY IF EXISTS "craven_usa_com_full_access_user_roles" ON public.user_roles;
CREATE POLICY "craven_usa_com_full_access_user_roles"
ON public.user_roles FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'craven@usa.com')
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('CRAVEN_FOUNDER', 'CRAVEN_CORPORATE_SECRETARY'))
);

-- board_members: Allow craven@usa.com full access
DROP POLICY IF EXISTS "craven_usa_com_full_access_board_members" ON public.board_members;
CREATE POLICY "craven_usa_com_full_access_board_members"
ON public.board_members FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'craven@usa.com')
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('CRAVEN_FOUNDER', 'CRAVEN_CORPORATE_SECRETARY'))
  OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'ceo')
);

-- governance_board_resolutions: Allow craven@usa.com full access
DROP POLICY IF EXISTS "craven_usa_com_full_access_resolutions" ON public.governance_board_resolutions;
CREATE POLICY "craven_usa_com_full_access_resolutions"
ON public.governance_board_resolutions FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'craven@usa.com')
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('CRAVEN_FOUNDER', 'CRAVEN_CORPORATE_SECRETARY', 'CRAVEN_BOARD_MEMBER'))
  OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role IN ('ceo', 'board_member'))
);

-- board_resolution_votes: Allow craven@usa.com full access
DROP POLICY IF EXISTS "craven_usa_com_full_access_votes" ON public.board_resolution_votes;
CREATE POLICY "craven_usa_com_full_access_votes"
ON public.board_resolution_votes FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'craven@usa.com')
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('CRAVEN_FOUNDER', 'CRAVEN_CORPORATE_SECRETARY', 'CRAVEN_BOARD_MEMBER'))
  OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role IN ('ceo', 'board_member'))
);

-- corporate_officers: Allow craven@usa.com full access
DROP POLICY IF EXISTS "craven_usa_com_full_access_officers" ON public.corporate_officers;
CREATE POLICY "craven_usa_com_full_access_officers"
ON public.corporate_officers FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'craven@usa.com')
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('CRAVEN_FOUNDER', 'CRAVEN_CORPORATE_SECRETARY', 'CRAVEN_EXECUTIVE'))
  OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role IN ('ceo', 'cfo', 'cto', 'coo', 'cxo'))
);

-- executive_appointments: Allow craven@usa.com full access
DROP POLICY IF EXISTS "craven_usa_com_full_access_appointments" ON public.executive_appointments;
CREATE POLICY "craven_usa_com_full_access_appointments"
ON public.executive_appointments FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'craven@usa.com')
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('CRAVEN_FOUNDER', 'CRAVEN_CORPORATE_SECRETARY'))
  OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'ceo')
);

-- governance_logs: Allow craven@usa.com full access
DROP POLICY IF EXISTS "craven_usa_com_full_access_logs" ON public.governance_logs;
CREATE POLICY "craven_usa_com_full_access_logs"
ON public.governance_logs FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'craven@usa.com')
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('CRAVEN_FOUNDER', 'CRAVEN_CORPORATE_SECRETARY', 'CRAVEN_EXECUTIVE'))
  OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role IN ('ceo', 'cfo', 'cto', 'coo', 'cxo'))
);

