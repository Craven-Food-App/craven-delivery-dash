-- ============================================
-- COMPLETE DRIVER CHAT FIX
-- Copy ALL of this and run in Supabase SQL Editor
-- ============================================

-- STEP 1: Enable Realtime
ALTER TABLE public.driver_support_chats REPLICA IDENTITY FULL;
ALTER TABLE public.driver_support_messages REPLICA IDENTITY FULL;

DO $$ 
BEGIN
  -- Only add to publication if not already there
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'driver_support_chats'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_support_chats;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'driver_support_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_support_messages;
  END IF;
END $$;

-- STEP 2: Fix RLS Policies
DROP POLICY IF EXISTS "Agents can view assigned chats" ON driver_support_chats;
DROP POLICY IF EXISTS "Agents can manage chat messages" ON driver_support_messages;
DROP POLICY IF EXISTS "Agents and admins can view chats" ON driver_support_chats;
DROP POLICY IF EXISTS "Agents and admins can update chats" ON driver_support_chats;
DROP POLICY IF EXISTS "Agents and admins can view messages" ON driver_support_messages;
DROP POLICY IF EXISTS "Agents and admins can insert messages" ON driver_support_messages;

-- Admins can view ALL chats
CREATE POLICY "Agents and admins can view chats"
  ON driver_support_chats FOR SELECT TO authenticated
  USING (
    agent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Admins can update ALL chats
CREATE POLICY "Agents and admins can update chats"
  ON driver_support_chats FOR UPDATE TO authenticated
  USING (
    agent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Admins can view ALL messages
CREATE POLICY "Agents and admins can view messages"
  ON driver_support_messages FOR SELECT TO authenticated
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

-- Admins can send messages
CREATE POLICY "Agents and admins can insert messages"
  ON driver_support_messages FOR INSERT TO authenticated
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

-- STEP 3: Fix user_profiles policies
DROP POLICY IF EXISTS "Admins can view all user profiles" ON user_profiles;

CREATE POLICY "Admins can view all user profiles"
  ON user_profiles FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() 
      AND up.role = 'admin'
    )
  );

-- STEP 4: Verify your admin role
DO $$
DECLARE
  user_role TEXT;
  policy_count INT;
BEGIN
  -- Check your role
  SELECT role INTO user_role FROM user_profiles WHERE user_id = auth.uid();
  
  IF user_role = 'admin' THEN
    RAISE NOTICE '✅ Your role: ADMIN';
  ELSE
    RAISE NOTICE '⚠️  Your role: % (Not admin!)', COALESCE(user_role, 'NO PROFILE');
    RAISE NOTICE '💡 Run: UPDATE user_profiles SET role = ''admin'' WHERE user_id = auth.uid();';
  END IF;
  
  -- Check policies
  SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'driver_support_chats';
  RAISE NOTICE '✅ Policies active: %', policy_count;
  
  -- Check realtime
  SELECT COUNT(*) INTO policy_count FROM pg_publication_tables 
  WHERE pubname = 'supabase_realtime' AND tablename IN ('driver_support_chats', 'driver_support_messages');
  
  IF policy_count = 2 THEN
    RAISE NOTICE '✅ Realtime enabled for both tables';
  ELSE
    RAISE NOTICE '⚠️  Realtime only enabled for % tables', policy_count;
  END IF;
  
  RAISE NOTICE '==========================================';
  RAISE NOTICE '🎉 Driver Chat Fix Applied!';
  RAISE NOTICE 'Refresh your admin dashboard and try again';
END $$;

