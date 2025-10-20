-- Fix infinite recursion in user_profiles policy
-- Run this in Supabase SQL Editor

-- Step 1: Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all user profiles" ON user_profiles;

-- Step 2: Create a security definer function to check admin role
-- This bypasses RLS and prevents infinite recursion
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_profiles
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Step 3: Create new policy using the function
CREATE POLICY "Admins can view all user profiles"
  ON user_profiles FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR is_admin_user()
  );

-- Step 4: Update other policies to use the function
DROP POLICY IF EXISTS "Agents and admins can view chats" ON driver_support_chats;
DROP POLICY IF EXISTS "Agents and admins can update chats" ON driver_support_chats;
DROP POLICY IF EXISTS "Agents and admins can view messages" ON driver_support_messages;
DROP POLICY IF EXISTS "Agents and admins can insert messages" ON driver_support_messages;

CREATE POLICY "Agents and admins can view chats"
  ON driver_support_chats FOR SELECT TO authenticated
  USING (
    agent_id = auth.uid() OR 
    driver_id = auth.uid() OR 
    is_admin_user()
  );

CREATE POLICY "Agents and admins can update chats"
  ON driver_support_chats FOR UPDATE TO authenticated
  USING (
    agent_id = auth.uid() OR is_admin_user()
  );

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
    is_admin_user()
  );

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
      is_admin_user()
    )
  );

-- Verify
DO $$ 
DECLARE
  is_admin BOOLEAN;
BEGIN
  is_admin := is_admin_user();
  
  IF is_admin THEN
    RAISE NOTICE '✅ You are an admin!';
  ELSE
    RAISE NOTICE '❌ You are NOT an admin';
    RAISE NOTICE '💡 Run: UPDATE user_profiles SET role = ''admin'' WHERE user_id = auth.uid();';
  END IF;
  
  RAISE NOTICE '==========================================';
  RAISE NOTICE '✅ Infinite recursion fixed!';
  RAISE NOTICE 'Refresh your admin dashboard and try again';
END $$;

