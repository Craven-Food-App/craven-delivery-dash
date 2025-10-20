-- =====================================================
-- Restaurant Onboarding Admin Portal - Database Setup
-- =====================================================
-- This migration adds all required tables and fields for
-- the Restaurant Onboarding Admin Portal features
-- =====================================================

-- 1. Add assigned_admin_id to restaurant_onboarding table
-- =====================================================
-- This enables Team Assignment feature
ALTER TABLE restaurant_onboarding 
ADD COLUMN IF NOT EXISTS assigned_admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_onboarding_assigned_admin 
ON restaurant_onboarding(assigned_admin_id);

-- Add comment
COMMENT ON COLUMN restaurant_onboarding.assigned_admin_id IS 'Admin user assigned to manage this restaurant onboarding';


-- 2. Ensure onboarding_status column exists
-- =====================================================
-- This is used throughout the admin portal
ALTER TABLE restaurant_onboarding 
ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'pending';

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_onboarding_status 
ON restaurant_onboarding(onboarding_status);


-- 3. Add indexes for performance
-- =====================================================
-- These improve query performance for the admin portal

-- Index for date-based queries (SLA tracking, analytics)
CREATE INDEX IF NOT EXISTS idx_onboarding_created_at 
ON restaurant_onboarding(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_onboarding_updated_at 
ON restaurant_onboarding(updated_at DESC);

-- Index for verification status (used in multiple views)
CREATE INDEX IF NOT EXISTS idx_onboarding_business_verified 
ON restaurant_onboarding(business_info_verified);

-- Index for go-live status (analytics)
CREATE INDEX IF NOT EXISTS idx_onboarding_go_live 
ON restaurant_onboarding(go_live_ready);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_onboarding_status_verification 
ON restaurant_onboarding(onboarding_status, business_info_verified);


-- 4. Create Activity Log Table
-- =====================================================
-- This enables Activity Log feature for audit trail

CREATE TABLE IF NOT EXISTS restaurant_onboarding_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  action_description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE restaurant_onboarding_activity_log IS 'Audit trail of all admin actions on restaurant onboarding';
COMMENT ON COLUMN restaurant_onboarding_activity_log.action_type IS 'Type of action: approved, rejected, updated, email_sent, document_verified, assigned, note_added, status_changed, exported, imported';
COMMENT ON COLUMN restaurant_onboarding_activity_log.metadata IS 'Additional JSON data related to the action';

-- Create indexes for activity log
CREATE INDEX IF NOT EXISTS idx_activity_log_restaurant 
ON restaurant_onboarding_activity_log(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_activity_log_admin 
ON restaurant_onboarding_activity_log(admin_id);

CREATE INDEX IF NOT EXISTS idx_activity_log_created 
ON restaurant_onboarding_activity_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_log_action_type 
ON restaurant_onboarding_activity_log(action_type);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_activity_log_restaurant_created 
ON restaurant_onboarding_activity_log(restaurant_id, created_at DESC);


-- 5. Enable Row Level Security
-- =====================================================

-- Enable RLS on activity log table
ALTER TABLE restaurant_onboarding_activity_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can insert activity logs" ON restaurant_onboarding_activity_log;
DROP POLICY IF EXISTS "Admins can read activity logs" ON restaurant_onboarding_activity_log;

-- Policy: Admins can insert activity logs
CREATE POLICY "Admins can insert activity logs"
  ON restaurant_onboarding_activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can read activity logs
CREATE POLICY "Admins can read activity logs"
  ON restaurant_onboarding_activity_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can update restaurant_onboarding
DROP POLICY IF EXISTS "Admins can update onboarding data" ON restaurant_onboarding;
CREATE POLICY "Admins can update onboarding data"
  ON restaurant_onboarding
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can read all onboarding data
DROP POLICY IF EXISTS "Admins can read onboarding data" ON restaurant_onboarding;
CREATE POLICY "Admins can read onboarding data"
  ON restaurant_onboarding
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );


-- 6. Ensure profiles table has role column
-- =====================================================
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Create index for role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_role 
ON profiles(role);

-- Add comment
COMMENT ON COLUMN profiles.role IS 'User role: admin, merchant, driver, customer, user';


-- 7. Create helpful views (optional)
-- =====================================================

-- View: Restaurant Onboarding Overview
CREATE OR REPLACE VIEW restaurant_onboarding_overview AS
SELECT 
  r.id,
  r.name,
  r.email,
  r.phone,
  r.city,
  r.state,
  r.cuisine_type,
  r.created_at as application_date,
  ro.business_info_verified,
  ro.menu_preparation_status,
  ro.go_live_ready,
  ro.assigned_admin_id,
  ro.onboarding_status,
  ro.created_at as onboarding_started_at,
  ro.updated_at as last_updated_at,
  ro.business_verified_at,
  ro.menu_ready_at,
  p.email as assigned_admin_email,
  p.full_name as assigned_admin_name,
  CASE 
    WHEN ro.go_live_ready THEN 'live'
    WHEN ro.menu_preparation_status = 'ready' AND r.banking_complete THEN 'ready_to_launch'
    WHEN ro.business_info_verified THEN 'setup_in_progress'
    WHEN r.business_license_url IS NOT NULL AND r.owner_id_url IS NOT NULL THEN 'verification_pending'
    ELSE 'documents_pending'
  END as current_stage,
  EXTRACT(DAY FROM NOW() - ro.created_at)::integer as days_in_onboarding
FROM restaurants r
LEFT JOIN restaurant_onboarding ro ON r.id = ro.restaurant_id
LEFT JOIN profiles p ON ro.assigned_admin_id = p.id
WHERE r.onboarding_status IS NOT NULL;

COMMENT ON VIEW restaurant_onboarding_overview IS 'Consolidated view of restaurant onboarding status for admin portal';


-- 8. Create function to log activities (helper)
-- =====================================================

CREATE OR REPLACE FUNCTION log_onboarding_activity(
  p_restaurant_id UUID,
  p_action_type TEXT,
  p_action_description TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO restaurant_onboarding_activity_log (
    restaurant_id,
    admin_id,
    action_type,
    action_description,
    metadata
  ) VALUES (
    p_restaurant_id,
    auth.uid(),
    p_action_type,
    p_action_description,
    p_metadata
  )
  RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$;

COMMENT ON FUNCTION log_onboarding_activity IS 'Helper function to log admin activities on restaurant onboarding';


-- 9. Create trigger to auto-log status changes
-- =====================================================

CREATE OR REPLACE FUNCTION log_onboarding_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log when business is verified
  IF OLD.business_info_verified = FALSE AND NEW.business_info_verified = TRUE THEN
    PERFORM log_onboarding_activity(
      NEW.restaurant_id,
      'approved',
      'Business documents approved and verified',
      jsonb_build_object('verified_at', NEW.business_verified_at)
    );
  END IF;
  
  -- Log when admin assignment changes
  IF OLD.assigned_admin_id IS DISTINCT FROM NEW.assigned_admin_id THEN
    PERFORM log_onboarding_activity(
      NEW.restaurant_id,
      'assigned',
      'Restaurant assigned to admin: ' || COALESCE(NEW.assigned_admin_id::text, 'unassigned'),
      jsonb_build_object(
        'old_admin_id', OLD.assigned_admin_id,
        'new_admin_id', NEW.assigned_admin_id
      )
    );
  END IF;
  
  -- Log when menu becomes ready
  IF OLD.menu_preparation_status != 'ready' AND NEW.menu_preparation_status = 'ready' THEN
    PERFORM log_onboarding_activity(
      NEW.restaurant_id,
      'updated',
      'Menu preparation completed',
      jsonb_build_object('menu_ready_at', NEW.menu_ready_at)
    );
  END IF;
  
  -- Log when restaurant goes live
  IF OLD.go_live_ready = FALSE AND NEW.go_live_ready = TRUE THEN
    PERFORM log_onboarding_activity(
      NEW.restaurant_id,
      'go_live',
      'Restaurant went live on the platform',
      jsonb_build_object('go_live_at', NEW.updated_at)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_log_onboarding_changes ON restaurant_onboarding;
CREATE TRIGGER trigger_log_onboarding_changes
  AFTER UPDATE ON restaurant_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION log_onboarding_status_change();


-- 10. Grant permissions
-- =====================================================

-- Grant permissions to authenticated users (admins will be filtered by RLS)
GRANT SELECT ON restaurant_onboarding_activity_log TO authenticated;
GRANT INSERT ON restaurant_onboarding_activity_log TO authenticated;
GRANT SELECT ON restaurant_onboarding_overview TO authenticated;

-- Grant execute on helper function
GRANT EXECUTE ON FUNCTION log_onboarding_activity TO authenticated;


-- =====================================================
-- Migration Complete!
-- =====================================================
-- 
-- What was added:
-- ✅ assigned_admin_id column for team assignments
-- ✅ onboarding_status column for status tracking
-- ✅ restaurant_onboarding_activity_log table for audit trail
-- ✅ Performance indexes for all tables
-- ✅ Row Level Security policies for admins
-- ✅ Helper view for consolidated data
-- ✅ Helper function for logging activities
-- ✅ Auto-logging trigger for status changes
--
-- Next steps:
-- 1. Ensure at least one user in profiles has role = 'admin'
-- 2. Test the admin portal features
-- 3. All data will now be real - no mock data!
-- =====================================================

