-- Create tablet_inventory table
CREATE TABLE IF NOT EXISTS tablet_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number TEXT UNIQUE NOT NULL,
  model TEXT DEFAULT 'Standard Tablet',
  condition TEXT CHECK (condition IN ('new', 'refurbished', 'used', 'repair')) DEFAULT 'new',
  status TEXT CHECK (status IN ('available', 'shipped', 'repair', 'retired')) DEFAULT 'available',
  warehouse_location TEXT DEFAULT 'Main Warehouse',
  assigned_to UUID REFERENCES restaurants(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tablet_shipments table
CREATE TABLE IF NOT EXISTS tablet_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tablet_id UUID REFERENCES tablet_inventory(id) ON DELETE SET NULL,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  tracking_number TEXT,
  carrier TEXT CHECK (carrier IN ('USPS', 'UPS', 'FedEx', 'DHL', 'Other')),
  status TEXT CHECK (status IN ('pending', 'in_transit', 'delivered', 'returned', 'lost')) DEFAULT 'pending',
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  estimated_delivery TIMESTAMPTZ,
  shipping_cost DECIMAL(10, 2),
  shipping_label_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tablet_inventory_status ON tablet_inventory(status);
CREATE INDEX IF NOT EXISTS idx_tablet_inventory_assigned_to ON tablet_inventory(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tablet_shipments_restaurant_id ON tablet_shipments(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_tablet_shipments_status ON tablet_shipments(status);
CREATE INDEX IF NOT EXISTS idx_tablet_shipments_tracking ON tablet_shipments(tracking_number);

-- Enable RLS
ALTER TABLE tablet_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE tablet_shipments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tablet_inventory
CREATE POLICY "Admins can view all tablet inventory"
  ON tablet_inventory FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert tablet inventory"
  ON tablet_inventory FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update tablet inventory"
  ON tablet_inventory FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete tablet inventory"
  ON tablet_inventory FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for tablet_shipments
CREATE POLICY "Admins can view all tablet shipments"
  ON tablet_shipments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Restaurants can view their tablet shipments"
  ON tablet_shipments FOR SELECT
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert tablet shipments"
  ON tablet_shipments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update tablet shipments"
  ON tablet_shipments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tablet_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER tablet_inventory_updated_at
  BEFORE UPDATE ON tablet_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_tablet_updated_at();

CREATE TRIGGER tablet_shipments_updated_at
  BEFORE UPDATE ON tablet_shipments
  FOR EACH ROW
  EXECUTE FUNCTION update_tablet_updated_at();

-- Function to log tablet shipment activity
CREATE OR REPLACE FUNCTION log_tablet_shipment()
RETURNS TRIGGER AS $$
BEGIN
  -- Log in activity log if exists
  IF TG_OP = 'INSERT' THEN
    INSERT INTO restaurant_onboarding_activity_log (
      restaurant_id,
      admin_id,
      action_type,
      action_details
    )
    VALUES (
      NEW.restaurant_id,
      auth.uid(),
      'tablet_shipped',
      jsonb_build_object(
        'shipment_id', NEW.id,
        'tracking_number', NEW.tracking_number,
        'carrier', NEW.carrier
      )
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    INSERT INTO restaurant_onboarding_activity_log (
      restaurant_id,
      admin_id,
      action_type,
      action_details
    )
    VALUES (
      NEW.restaurant_id,
      auth.uid(),
      'tablet_delivered',
      jsonb_build_object(
        'shipment_id', NEW.id,
        'delivered_at', NEW.delivered_at
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for tablet shipment logging
CREATE TRIGGER log_tablet_shipment_trigger
  AFTER INSERT OR UPDATE ON tablet_shipments
  FOR EACH ROW
  EXECUTE FUNCTION log_tablet_shipment();

