-- Create marketing_settings table for marketing-related configuration
CREATE TABLE IF NOT EXISTS public.marketing_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Hero Image Settings
  mobile_hero_image_url TEXT,
  
  -- Metadata
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create unique constraint to ensure only one row exists
-- Using a partial unique index on a constant to ensure singleton pattern
CREATE UNIQUE INDEX IF NOT EXISTS idx_marketing_settings_single_row ON public.marketing_settings((1));

-- Insert default row only if table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.marketing_settings LIMIT 1) THEN
    INSERT INTO public.marketing_settings (mobile_hero_image_url)
    VALUES (NULL);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.marketing_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Public can view marketing settings" ON public.marketing_settings;
DROP POLICY IF EXISTS "Marketing team can manage marketing settings" ON public.marketing_settings;

-- Policy: Anyone can read marketing settings (for public display)
CREATE POLICY "Public can view marketing settings"
  ON public.marketing_settings
  FOR SELECT
  USING (true);

-- Policy: Marketing team can manage settings
CREATE POLICY "Marketing team can manage marketing settings"
  ON public.marketing_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('marketing', 'admin', 'super_admin')
    )
  );

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_marketing_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_marketing_settings_updated_at
  BEFORE UPDATE ON public.marketing_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_marketing_settings_updated_at();

