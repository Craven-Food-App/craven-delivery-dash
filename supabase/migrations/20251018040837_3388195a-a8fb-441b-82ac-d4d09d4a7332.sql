-- Add shipping label URL to restaurant onboarding progress
ALTER TABLE restaurant_onboarding_progress
ADD COLUMN IF NOT EXISTS tablet_shipping_label_url TEXT;