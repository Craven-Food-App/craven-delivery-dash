-- Create favorite_restaurants table
CREATE TABLE IF NOT EXISTS favorite_restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, restaurant_id)
);

-- Enable RLS
ALTER TABLE favorite_restaurants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own favorites"
  ON favorite_restaurants FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can add their own favorites"
  ON favorite_restaurants FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove their own favorites"
  ON favorite_restaurants FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_favorite_restaurants_user_id ON favorite_restaurants(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_restaurants_restaurant_id ON favorite_restaurants(restaurant_id);

-- Add scheduled delivery fields to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_scheduled BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_instructions TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS leave_at_door BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_photo_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_photo_timestamp TIMESTAMP WITH TIME ZONE;

-- Create index for scheduled orders
CREATE INDEX IF NOT EXISTS idx_orders_scheduled_for ON orders(scheduled_for) WHERE is_scheduled = true;

-- Create delivery photos storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('delivery-photos', 'delivery-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for delivery-photos bucket
CREATE POLICY "Anyone can view delivery photos"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'delivery-photos');

CREATE POLICY "Drivers can upload delivery photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'delivery-photos' AND
    EXISTS (
      SELECT 1 FROM driver_profiles
      WHERE driver_profiles.user_id = auth.uid()
    )
  );

COMMENT ON TABLE favorite_restaurants IS 'Customer favorite restaurants for quick reordering';

