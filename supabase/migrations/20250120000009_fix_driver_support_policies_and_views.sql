-- Fix driver support chat system RLS policies and add view for easier querying
-- This fixes "failed to load chats" error

-- 1. Drop old policies that reference wrong table name
DROP POLICY IF EXISTS "Agents can view assigned chats" ON driver_support_chats;
DROP POLICY IF EXISTS "Agents can manage chat messages" ON driver_support_messages;

-- 2. Recreate policies with correct table references
-- Allow admins and assigned agents to view all chats
CREATE POLICY "Agents and admins can view chats"
  ON driver_support_chats FOR SELECT
  TO authenticated
  USING (
    agent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Allow admins and assigned agents to update chats
CREATE POLICY "Agents and admins can update chats"
  ON driver_support_chats FOR UPDATE
  TO authenticated
  USING (
    agent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Allow admins and assigned agents to view and manage messages
CREATE POLICY "Agents and admins can view messages"
  ON driver_support_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM driver_support_chats
      WHERE driver_support_chats.id = chat_id
      AND (
        driver_support_chats.agent_id = auth.uid() OR
        driver_support_chats.driver_id = auth.uid()
      )
    ) OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Agents and admins can insert messages"
  ON driver_support_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND (
      EXISTS (
        SELECT 1 FROM driver_support_chats
        WHERE driver_support_chats.id = chat_id
        AND (
          driver_support_chats.agent_id = auth.uid() OR
          driver_support_chats.driver_id = auth.uid()
        )
      ) OR
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.role = 'admin'
      )
    )
  );

-- 3. Create a view that makes it easier to query chats with driver info
CREATE OR REPLACE VIEW driver_support_chats_with_profiles AS
SELECT 
  dsc.*,
  up.full_name as driver_full_name,
  up.phone as driver_phone,
  up.avatar_url as driver_avatar_url
FROM driver_support_chats dsc
LEFT JOIN user_profiles up ON up.user_id = dsc.driver_id;

-- Allow authenticated users to read from the view
GRANT SELECT ON driver_support_chats_with_profiles TO authenticated;

-- 4. Add policy to allow admins to view user_profiles for the join to work
DROP POLICY IF EXISTS "Admins can view all user profiles" ON user_profiles;
CREATE POLICY "Admins can view all user profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() 
      AND up.role = 'admin'
    )
  );

-- Verify fix
DO $$ 
BEGIN
  RAISE NOTICE '✅ Driver support chat policies fixed!';
  RAISE NOTICE '✅ Admins can now view all chats';
  RAISE NOTICE '✅ User profiles can be joined properly';
  RAISE NOTICE '📊 Created view: driver_support_chats_with_profiles';
END $$;

