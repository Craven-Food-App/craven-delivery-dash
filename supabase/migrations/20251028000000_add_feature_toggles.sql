-- Create admin_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on admin_settings
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can view settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Admins can manage settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Public can view admin settings" ON public.admin_settings;

-- Create RLS policies
CREATE POLICY "Admins can view settings"
ON public.admin_settings
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage settings"
ON public.admin_settings
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view admin settings"
ON public.admin_settings
FOR SELECT
USING (true);

-- Insert feature toggle for restaurants page visibility
INSERT INTO public.admin_settings (setting_key, setting_value, description)
VALUES (
  'feature_restaurants_visible',
  '{"enabled": false}'::jsonb,
  'Controls whether restaurants page is visible to users'
)
ON CONFLICT (setting_key) DO NOTHING;

-- Also insert the background check delay setting if needed
INSERT INTO public.admin_settings (setting_key, setting_value, description)
VALUES (
  'background_check_delay_days',
  '{"min": 1, "max": 5, "default": 3, "enabled": true}'::jsonb,
  'Number of days for simulated background check processing'
)
ON CONFLICT (setting_key) DO NOTHING;

