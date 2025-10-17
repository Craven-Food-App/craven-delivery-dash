-- Create enum for verification task types
CREATE TYPE verification_task_type AS ENUM (
  'business_license_review',
  'menu_import',
  'quality_check',
  'insurance_review',
  'banking_review'
);

-- Create enum for verification task status
CREATE TYPE verification_task_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'rejected'
);

-- Create enum for menu preparation status
CREATE TYPE menu_preparation_status AS ENUM (
  'not_started',
  'in_progress',
  'ready'
);

-- Add new columns to restaurants table
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS setup_deadline DATE,
ADD COLUMN IF NOT EXISTS business_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS menu_ready_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tablet_shipped_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS go_live_scheduled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS header_image_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_handle TEXT,
ADD COLUMN IF NOT EXISTS banking_complete BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS readiness_score INTEGER DEFAULT 0;

-- Create restaurant_groups table for multi-location management
CREATE TABLE IF NOT EXISTS restaurant_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  commission_tier TEXT DEFAULT 'basic',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create restaurant_onboarding_progress table
CREATE TABLE IF NOT EXISTS restaurant_onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE UNIQUE NOT NULL,
  business_info_verified BOOLEAN DEFAULT FALSE,
  business_verified_at TIMESTAMP WITH TIME ZONE,
  menu_preparation_status menu_preparation_status DEFAULT 'not_started',
  menu_ready_at TIMESTAMP WITH TIME ZONE,
  tablet_shipped BOOLEAN DEFAULT FALSE,
  tablet_shipped_at TIMESTAMP WITH TIME ZONE,
  tablet_delivered_at TIMESTAMP WITH TIME ZONE,
  go_live_ready BOOLEAN DEFAULT FALSE,
  go_live_scheduled_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create restaurant_verification_tasks table
CREATE TABLE IF NOT EXISTS restaurant_verification_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  task_type verification_task_type NOT NULL,
  status verification_task_status DEFAULT 'pending',
  assigned_admin_id UUID REFERENCES auth.users(id),
  completion_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create restaurant_go_live_checklist table
CREATE TABLE IF NOT EXISTS restaurant_go_live_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  item_key TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_description TEXT,
  is_required BOOLEAN DEFAULT TRUE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  is_blocker BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(restaurant_id, item_key)
);

-- Enable RLS on all new tables
ALTER TABLE restaurant_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_verification_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_go_live_checklist ENABLE ROW LEVEL SECURITY;

-- RLS Policies for restaurant_groups
CREATE POLICY "Restaurant owners can view their groups"
  ON restaurant_groups FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Restaurant owners can manage their groups"
  ON restaurant_groups FOR ALL
  USING (auth.uid() = owner_id);

CREATE POLICY "Admins can view all groups"
  ON restaurant_groups FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all groups"
  ON restaurant_groups FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for restaurant_onboarding_progress
CREATE POLICY "Restaurant owners can view their onboarding progress"
  ON restaurant_onboarding_progress FOR SELECT
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all onboarding progress"
  ON restaurant_onboarding_progress FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all onboarding progress"
  ON restaurant_onboarding_progress FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for restaurant_verification_tasks
CREATE POLICY "Restaurant owners can view their verification tasks"
  ON restaurant_verification_tasks FOR SELECT
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all verification tasks"
  ON restaurant_verification_tasks FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all verification tasks"
  ON restaurant_verification_tasks FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for restaurant_go_live_checklist
CREATE POLICY "Restaurant owners can view their checklist"
  ON restaurant_go_live_checklist FOR SELECT
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all checklists"
  ON restaurant_go_live_checklist FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all checklists"
  ON restaurant_go_live_checklist FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Create function to initialize onboarding progress when restaurant is created
CREATE OR REPLACE FUNCTION initialize_restaurant_onboarding()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO restaurant_onboarding_progress (restaurant_id)
  VALUES (NEW.id);
  
  -- Initialize go-live checklist with default items
  INSERT INTO restaurant_go_live_checklist (restaurant_id, item_key, item_name, item_description, is_required, is_blocker)
  VALUES
    (NEW.id, 'menu_items', 'Add menu items', 'At least 10 menu items required', TRUE, TRUE),
    (NEW.id, 'business_verified', 'Business verification', 'Business documents verified by admin', TRUE, TRUE),
    (NEW.id, 'banking_info', 'Banking information', 'Complete banking details for payouts', TRUE, TRUE),
    (NEW.id, 'store_hours', 'Store hours', 'Set operating hours', TRUE, TRUE),
    (NEW.id, 'logo_uploaded', 'Upload logo', 'Store logo uploaded', TRUE, FALSE),
    (NEW.id, 'header_uploaded', 'Upload header image', 'Store header image uploaded', FALSE, FALSE),
    (NEW.id, 'delivery_settings', 'Delivery settings', 'Configure delivery radius and fees', TRUE, FALSE);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to initialize onboarding
CREATE TRIGGER trigger_initialize_onboarding
  AFTER INSERT ON restaurants
  FOR EACH ROW
  EXECUTE FUNCTION initialize_restaurant_onboarding();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_restaurant_onboarding_progress_updated_at
  BEFORE UPDATE ON restaurant_onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_updated_at();

CREATE TRIGGER update_restaurant_verification_tasks_updated_at
  BEFORE UPDATE ON restaurant_verification_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_updated_at();

CREATE TRIGGER update_restaurant_go_live_checklist_updated_at
  BEFORE UPDATE ON restaurant_go_live_checklist
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_updated_at();

CREATE TRIGGER update_restaurant_groups_updated_at
  BEFORE UPDATE ON restaurant_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_updated_at();