-- Add menu management fields to menu_items table
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS prep_time_minutes INTEGER DEFAULT 15;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS dietary_tags TEXT[];
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS spice_level INTEGER DEFAULT 0;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create menu_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL, -- in cents
  image_url TEXT,
  category TEXT NOT NULL,
  is_available BOOLEAN DEFAULT true,
  prep_time_minutes INTEGER DEFAULT 15,
  dietary_tags TEXT[],
  spice_level INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view available menu items"
  ON menu_items FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Restaurant owners can manage their menu items"
  ON menu_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = menu_items.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all menu items"
  ON menu_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_available ON menu_items(is_available);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_menu_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER menu_items_updated_at_trigger
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_menu_items_updated_at();

-- Create storage bucket for menu item images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('menu-items', 'menu-items', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for menu-items bucket
CREATE POLICY "Anyone can view menu item images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'menu-items');

CREATE POLICY "Restaurant owners can upload menu item images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'menu-items');

CREATE POLICY "Restaurant owners can update their menu item images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'menu-items');

CREATE POLICY "Restaurant owners can delete their menu item images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'menu-items');

