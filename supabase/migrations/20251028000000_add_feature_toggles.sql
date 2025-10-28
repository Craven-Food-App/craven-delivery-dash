-- Insert feature toggle for restaurants page visibility
INSERT INTO public.admin_settings (setting_key, setting_value, description)
VALUES (
  'feature_restaurants_visible',
  '{"enabled": false}'::jsonb,
  'Controls whether restaurants page is visible to users'
)
ON CONFLICT (setting_key) DO NOTHING;

-- Make admin_settings readable by everyone (for feature flags)
-- Note: Update permission is already granted by existing "Admins can manage settings" policy
DROP POLICY IF EXISTS "Public can view admin settings" ON public.admin_settings;
CREATE POLICY "Public can view admin settings"
ON public.admin_settings
FOR SELECT
USING (true);

