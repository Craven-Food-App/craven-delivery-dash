-- Insert feature toggle for restaurants page visibility
INSERT INTO public.admin_settings (setting_key, setting_value, description)
VALUES (
  'feature_restaurants_visible',
  '{"enabled": false}'::jsonb,
  'Controls whether restaurants page is visible to users'
)
ON CONFLICT (setting_key) DO NOTHING;

-- Make admin_settings readable by everyone (for feature flags)
-- Admins still need special permission to modify
DROP POLICY IF EXISTS "Everyone can view feature flags" ON public.admin_settings;
CREATE POLICY "Everyone can view feature flags"
ON public.admin_settings
FOR SELECT
USING (true);

