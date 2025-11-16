-- Create promotional_banners table for managing mobile app promotional carousel cards
CREATE TABLE IF NOT EXISTS public.promotional_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  image_url TEXT NOT NULL,
  
  -- Display settings
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Targeting (optional)
  target_audience TEXT DEFAULT 'all', -- 'all', 'new_users', 'existing_users'
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  
  -- Action (optional - for future use)
  action_url TEXT, -- URL to navigate when clicked
  action_type TEXT DEFAULT 'none', -- 'none', 'url', 'promo_code', 'restaurant'
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_promotional_banners_active 
  ON public.promotional_banners(is_active, display_order) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_promotional_banners_valid_period 
  ON public.promotional_banners(valid_from, valid_until);

-- Enable RLS
ALTER TABLE public.promotional_banners ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Anyone can view active promotional banners" ON public.promotional_banners;
DROP POLICY IF EXISTS "Marketing team can manage promotional banners" ON public.promotional_banners;

-- Policy: Anyone can read active banners
CREATE POLICY "Anyone can view active promotional banners"
  ON public.promotional_banners
  FOR SELECT
  USING (is_active = true AND (valid_until IS NULL OR valid_until > NOW()));

-- Policy: Marketing team can manage banners
CREATE POLICY "Marketing team can manage promotional banners"
  ON public.promotional_banners
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('marketing', 'admin', 'super_admin')
    )
  );

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_promotional_banners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_promotional_banners_updated_at
  BEFORE UPDATE ON public.promotional_banners
  FOR EACH ROW
  EXECUTE FUNCTION update_promotional_banners_updated_at();

