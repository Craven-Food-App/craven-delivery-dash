-- Add route optimization and ETA fields to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_distance_meters INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_duration_seconds INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS route_geometry JSONB;

-- Add route optimization fields to driver_profiles
ALTER TABLE driver_profiles ADD COLUMN IF NOT EXISTS optimized_route JSONB;
ALTER TABLE driver_profiles ADD COLUMN IF NOT EXISTS route_updated_at TIMESTAMP WITH TIME ZONE;

-- Create table for batched deliveries
CREATE TABLE IF NOT EXISTS batched_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
  total_distance_meters INTEGER,
  total_duration_seconds INTEGER,
  optimized_route JSONB,
  order_sequence TEXT[] -- Array of order IDs in optimal sequence
);

-- Create junction table for batch orders
CREATE TABLE IF NOT EXISTS batch_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID REFERENCES batched_deliveries(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL,
  pickup_eta TIMESTAMP WITH TIME ZONE,
  delivery_eta TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(batch_id, order_id)
);

-- Enable RLS
ALTER TABLE batched_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for batched_deliveries
CREATE POLICY "Drivers can view their own batches"
  ON batched_deliveries FOR SELECT
  TO authenticated
  USING (driver_id = auth.uid());

CREATE POLICY "Drivers can update their own batches"
  ON batched_deliveries FOR UPDATE
  TO authenticated
  USING (driver_id = auth.uid());

CREATE POLICY "System can create batches"
  ON batched_deliveries FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all batches"
  ON batched_deliveries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- RLS Policies for batch_orders
CREATE POLICY "Anyone can view batch orders"
  ON batch_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert batch orders"
  ON batch_orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_estimated_delivery_time ON orders(estimated_delivery_time);
CREATE INDEX IF NOT EXISTS idx_batched_deliveries_driver_id ON batched_deliveries(driver_id);
CREATE INDEX IF NOT EXISTS idx_batched_deliveries_status ON batched_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_batch_orders_batch_id ON batch_orders(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_orders_order_id ON batch_orders(order_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_batched_deliveries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER batched_deliveries_updated_at_trigger
  BEFORE UPDATE ON batched_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_batched_deliveries_updated_at();

-- Add comment
COMMENT ON TABLE batched_deliveries IS 'Manages batched/multi-stop deliveries for drivers';
COMMENT ON TABLE batch_orders IS 'Links orders to batched deliveries in optimal sequence';

