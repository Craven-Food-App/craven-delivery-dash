-- Create comprehensive tablet inventory management system
-- This migration creates dedicated tables for tablet inventory tracking

-- Create tablet_inventory table for tracking individual tablets
CREATE TABLE IF NOT EXISTS tablet_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number TEXT UNIQUE NOT NULL,
  model TEXT NOT NULL DEFAULT 'CraveN-POS-Tablet',
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'allocated', 'shipped', 'delivered', 'returned', 'repair', 'retired')),
  condition TEXT NOT NULL DEFAULT 'new' CHECK (condition IN ('new', 'good', 'fair', 'poor', 'damaged')),
  warehouse_location TEXT,
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tablet_allocations table for tracking which tablets are assigned to restaurants
CREATE TABLE IF NOT EXISTS tablet_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tablet_id UUID NOT NULL REFERENCES tablet_inventory(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  allocated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  allocated_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'allocated' CHECK (status IN ('allocated', 'shipped', 'delivered', 'returned')),
  tracking_number TEXT,
  shipping_carrier TEXT,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  return_reason TEXT,
  returned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tablet_repairs table for tracking repair history
CREATE TABLE IF NOT EXISTS tablet_repairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tablet_id UUID NOT NULL REFERENCES tablet_inventory(id) ON DELETE CASCADE,
  repair_type TEXT NOT NULL CHECK (repair_type IN ('hardware', 'software', 'screen', 'battery', 'other')),
  description TEXT NOT NULL,
  cost_cents INTEGER DEFAULT 0,
  repair_status TEXT NOT NULL DEFAULT 'pending' CHECK (repair_status IN ('pending', 'in_progress', 'completed', 'failed')),
  assigned_technician TEXT,
  repair_notes TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tablet_stock_alerts table for inventory management
CREATE TABLE IF NOT EXISTS tablet_stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'overstock', 'maintenance_due')),
  threshold_value INTEGER NOT NULL,
  current_value INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tablet_batch_operations table for bulk operations
CREATE TABLE IF NOT EXISTS tablet_batch_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type TEXT NOT NULL CHECK (operation_type IN ('bulk_allocate', 'bulk_ship', 'bulk_return', 'bulk_repair')),
  batch_name TEXT NOT NULL,
  tablet_count INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_by UUID REFERENCES auth.users(id),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tablet_batch_items table for tracking individual items in batch operations
CREATE TABLE IF NOT EXISTS tablet_batch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES tablet_batch_operations(id) ON DELETE CASCADE,
  tablet_id UUID NOT NULL REFERENCES tablet_inventory(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tablet_inventory_serial ON tablet_inventory(serial_number);
CREATE INDEX IF NOT EXISTS idx_tablet_inventory_status ON tablet_inventory(status);
CREATE INDEX IF NOT EXISTS idx_tablet_allocations_restaurant ON tablet_allocations(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_tablet_allocations_tablet ON tablet_allocations(tablet_id);
CREATE INDEX IF NOT EXISTS idx_tablet_repairs_tablet ON tablet_repairs(tablet_id);
CREATE INDEX IF NOT EXISTS idx_tablet_repairs_status ON tablet_repairs(repair_status);
CREATE INDEX IF NOT EXISTS idx_tablet_batch_operations_type ON tablet_batch_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_tablet_batch_items_batch ON tablet_batch_items(batch_id);

-- Enable RLS on all tables
ALTER TABLE tablet_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE tablet_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tablet_repairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tablet_stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tablet_batch_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tablet_batch_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin access
CREATE POLICY "Admins can manage tablet inventory" ON tablet_inventory
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can manage tablet allocations" ON tablet_allocations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can manage tablet repairs" ON tablet_repairs
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can manage stock alerts" ON tablet_stock_alerts
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can manage batch operations" ON tablet_batch_operations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can manage batch items" ON tablet_batch_items
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- Grant permissions
GRANT ALL ON tablet_inventory TO authenticated;
GRANT ALL ON tablet_allocations TO authenticated;
GRANT ALL ON tablet_repairs TO authenticated;
GRANT ALL ON tablet_stock_alerts TO authenticated;
GRANT ALL ON tablet_batch_operations TO authenticated;
GRANT ALL ON tablet_batch_items TO authenticated;

-- Create functions for inventory management
CREATE OR REPLACE FUNCTION update_tablet_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_tablet_inventory_updated_at
  BEFORE UPDATE ON tablet_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_tablet_status();

CREATE TRIGGER update_tablet_allocations_updated_at
  BEFORE UPDATE ON tablet_allocations
  FOR EACH ROW
  EXECUTE FUNCTION update_tablet_status();

CREATE TRIGGER update_tablet_repairs_updated_at
  BEFORE UPDATE ON tablet_repairs
  FOR EACH ROW
  EXECUTE FUNCTION update_tablet_status();

-- Insert initial stock data
INSERT INTO tablet_inventory (serial_number, model, status, condition, warehouse_location, notes)
VALUES 
  ('TAB001', 'CraveN-POS-Tablet', 'available', 'new', 'Warehouse A', 'Initial stock'),
  ('TAB002', 'CraveN-POS-Tablet', 'available', 'new', 'Warehouse A', 'Initial stock'),
  ('TAB003', 'CraveN-POS-Tablet', 'available', 'new', 'Warehouse A', 'Initial stock'),
  ('TAB004', 'CraveN-POS-Tablet', 'available', 'new', 'Warehouse A', 'Initial stock'),
  ('TAB005', 'CraveN-POS-Tablet', 'available', 'new', 'Warehouse A', 'Initial stock')
ON CONFLICT (serial_number) DO NOTHING;
