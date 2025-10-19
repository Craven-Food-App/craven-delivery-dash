-- Fix RLS policies for tablet shipping operations
-- This migration adds the missing RLS policies for admin operations

-- Enable RLS on admin_audit_logs if not already enabled
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for admin_audit_logs - allow admins to insert/select
CREATE POLICY IF NOT EXISTS "Admins can manage audit logs" ON admin_audit_logs
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- Create RLS policy for restaurant_onboarding_progress updates
-- Allow admins to update tablet shipping fields
CREATE POLICY IF NOT EXISTS "Admins can update tablet shipping" ON restaurant_onboarding_progress
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- Allow admins to select restaurant_onboarding_progress
CREATE POLICY IF NOT EXISTS "Admins can view onboarding progress" ON restaurant_onboarding_progress
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- Allow admins to select restaurants
CREATE POLICY IF NOT EXISTS "Admins can view restaurants" ON restaurants
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- Allow admins to select user_profiles
CREATE POLICY IF NOT EXISTS "Admins can view user profiles" ON user_profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles up2
    WHERE up2.user_id = auth.uid() 
    AND up2.role = 'admin'
  )
);

-- Grant necessary permissions
GRANT SELECT, UPDATE ON restaurant_onboarding_progress TO authenticated;
GRANT SELECT ON restaurants TO authenticated;
GRANT SELECT ON user_profiles TO authenticated;
GRANT INSERT, SELECT ON admin_audit_logs TO authenticated;
