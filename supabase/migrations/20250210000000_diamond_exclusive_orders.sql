-- Diamond Exclusive Orders System Migration
-- Adds rating tiers, diamond points, and exclusive order types

-- Add rating_tier and diamond_points to driver_profiles
ALTER TABLE public.driver_profiles 
ADD COLUMN IF NOT EXISTS rating_tier TEXT CHECK (rating_tier IN ('Bronze', 'Silver', 'Gold', 'Diamond')) DEFAULT 'Bronze',
ADD COLUMN IF NOT EXISTS diamond_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS acceptance_rate INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS completed_orders INTEGER DEFAULT 0;

-- Add exclusive order fields to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS exclusive_type TEXT CHECK (exclusive_type IN ('flash_drop', 'vault', 'mystery', 'hotspot', 'batch', 'arena', 'none')) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS diamond_only_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payout_hidden BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS batch_id UUID,
ADD COLUMN IF NOT EXISTS pickup_location JSONB,
ADD COLUMN IF NOT EXISTS dropoff_location JSONB,
ADD COLUMN IF NOT EXISTS base_pay NUMERIC,
ADD COLUMN IF NOT EXISTS tip NUMERIC;

-- Create order_batches table
CREATE TABLE IF NOT EXISTS public.order_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_ids UUID[] NOT NULL,
  batch_type TEXT CHECK (batch_type IN ('surprise', 'stacked')) NOT NULL,
  diamond_only_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create hotspots table
CREATE TABLE IF NOT EXISTS public.hotspots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  claimed_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create arena_competitions table
CREATE TABLE IF NOT EXISTS public.arena_competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  eligible_drivers UUID[] NOT NULL,
  winner_driver_id UUID REFERENCES auth.users(id),
  claim_window_seconds INTEGER DEFAULT 10,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Create diamond_points_history table for tracking
CREATE TABLE IF NOT EXISTS public.diamond_points_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('flash_drop', 'mystery', 'batch', 'hotspot', 'arena')),
  order_id UUID REFERENCES public.orders(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_exclusive_type ON public.orders(exclusive_type, diamond_only_until);
CREATE INDEX IF NOT EXISTS idx_orders_batch_id ON public.orders(batch_id);
CREATE INDEX IF NOT EXISTS idx_hotspots_expires ON public.hotspots(expires_at);
CREATE INDEX IF NOT EXISTS idx_hotspots_location ON public.hotspots(lat, lng);
CREATE INDEX IF NOT EXISTS idx_arena_competitions_order ON public.arena_competitions(order_id);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_tier ON public.driver_profiles(rating_tier);
CREATE INDEX IF NOT EXISTS idx_diamond_points_driver ON public.diamond_points_history(driver_id, created_at DESC);

-- RLS Policies
ALTER TABLE public.order_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotspots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diamond_points_history ENABLE ROW LEVEL SECURITY;

-- Drivers can view their own diamond points history
CREATE POLICY "Drivers can view own diamond points" ON public.diamond_points_history
FOR SELECT USING (auth.uid() = driver_id);

-- Drivers can view available hotspots
CREATE POLICY "Drivers can view available hotspots" ON public.hotspots
FOR SELECT USING (expires_at > NOW() AND claimed_by IS NULL);

-- Drivers can view arena competitions they're eligible for
CREATE POLICY "Drivers can view eligible arena competitions" ON public.arena_competitions
FOR SELECT USING (auth.uid() = ANY(eligible_drivers) OR winner_driver_id IS NULL);

-- Drivers can update hotspots when claiming
CREATE POLICY "Drivers can claim hotspots" ON public.hotspots
FOR UPDATE USING (auth.uid() = claimed_by OR claimed_by IS NULL);

-- Function to add diamond points
CREATE OR REPLACE FUNCTION add_diamond_points(
  p_driver_id UUID,
  p_points INTEGER,
  p_source TEXT,
  p_order_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Insert into history
  INSERT INTO public.diamond_points_history (driver_id, points, source, order_id)
  VALUES (p_driver_id, p_points, p_source, p_order_id);
  
  -- Update driver profile
  UPDATE public.driver_profiles
  SET diamond_points = diamond_points + p_points
  WHERE user_id = p_driver_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if driver is Diamond tier
CREATE OR REPLACE FUNCTION is_diamond_driver(p_driver_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.driver_profiles
    WHERE user_id = p_driver_id AND rating_tier = 'Diamond'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

