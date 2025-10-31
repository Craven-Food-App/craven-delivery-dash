-- =====================================================
-- FIX ADMIN OPERATIONS RLS POLICIES
-- Replace USING(true) with proper admin checks
-- =====================================================

-- Ensure the is_admin function exists and works correctly
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = user_uuid AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Drop existing insecure policies
DROP POLICY IF EXISTS "Admins can view all refund requests" ON refund_requests;
DROP POLICY IF EXISTS "Admins can manage refund requests" ON refund_requests;
DROP POLICY IF EXISTS "Admins can view all disputes" ON disputes;
DROP POLICY IF EXISTS "Admins can manage disputes" ON disputes;
DROP POLICY IF EXISTS "Admins can view dispute messages" ON dispute_messages;
DROP POLICY IF EXISTS "Admins can manage dispute messages" ON dispute_messages;
DROP POLICY IF EXISTS "Admins can view all support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can manage support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can view ticket messages" ON ticket_messages;
DROP POLICY IF EXISTS "Admins can manage ticket messages" ON ticket_messages;
DROP POLICY IF EXISTS "Admins can view audit logs" ON admin_audit_logs;
DROP POLICY IF EXISTS "Admins can create audit logs" ON admin_audit_logs;

-- Create secure policies for refund_requests
CREATE POLICY "Admins can view all refund requests"
  ON refund_requests FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage refund requests"
  ON refund_requests FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Create secure policies for disputes
CREATE POLICY "Admins can view all disputes"
  ON disputes FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage disputes"
  ON disputes FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Create secure policies for dispute_messages
CREATE POLICY "Admins can view dispute messages"
  ON dispute_messages FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage dispute messages"
  ON dispute_messages FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Create secure policies for support_tickets
CREATE POLICY "Admins can view all support tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage support tickets"
  ON support_tickets FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Create secure policies for ticket_messages
CREATE POLICY "Admins can view ticket messages"
  ON ticket_messages FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage ticket messages"
  ON ticket_messages FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Create secure policies for admin_audit_logs
CREATE POLICY "Admins can view audit logs"
  ON admin_audit_logs FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can create audit logs"
  ON admin_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

-- Verify the fix
DO $$
BEGIN
  RAISE NOTICE '✅ Admin operations RLS policies fixed!';
  RAISE NOTICE 'All admin tables now properly protected with is_admin() checks';
END $$;

