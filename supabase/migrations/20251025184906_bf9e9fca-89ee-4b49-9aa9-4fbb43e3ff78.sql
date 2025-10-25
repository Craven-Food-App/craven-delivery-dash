-- Add missing columns to driver_preferences for navigation features
ALTER TABLE driver_preferences 
ADD COLUMN IF NOT EXISTS preferred_nav_app TEXT DEFAULT 'google_maps',
ADD COLUMN IF NOT EXISTS avoid_tolls BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS avoid_highways BOOLEAN DEFAULT false;

-- Add missing columns to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS total_amount INTEGER,
ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'delivery';

-- Create missing tables for incomplete features
CREATE TABLE IF NOT EXISTS favorite_restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, restaurant_id)
);

-- Enable RLS on favorite_restaurants
ALTER TABLE favorite_restaurants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their favorite restaurants"
ON favorite_restaurants
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);