-- Add RLS policies for support_agents table
-- Admins can manage all support agents
CREATE POLICY "Admins can manage support_agents"
ON support_agents
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Support agents can view their own record
CREATE POLICY "Support agents can view their own record"
ON support_agents
FOR SELECT
TO authenticated
USING (user_id = auth.uid());