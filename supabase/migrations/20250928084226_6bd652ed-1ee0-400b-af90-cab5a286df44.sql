-- Add navigation settings to user_profiles table if not exists
-- This migration adds navigation preferences to the settings jsonb column

-- Add a comment to document the navigation settings structure
COMMENT ON COLUMN user_profiles.settings IS 'JSON settings including navigation preferences: {navigation: {provider: string, voiceGuidance: boolean, avoidTolls: boolean, avoidHighways: boolean}}';

-- Create an index on the settings column for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_settings_gin ON user_profiles USING GIN (settings);

-- Update existing user profiles to have default navigation settings if they don't exist
UPDATE user_profiles 
SET settings = COALESCE(settings, '{}'::jsonb) || jsonb_build_object(
  'navigation', jsonb_build_object(
    'provider', 'mapbox',
    'voiceGuidance', true,
    'avoidTolls', false,
    'avoidHighways', false
  )
)
WHERE settings IS NULL OR NOT (settings ? 'navigation');