-- Add tablet shipping tracking fields to restaurant_onboarding_progress
ALTER TABLE restaurant_onboarding_progress
ADD COLUMN IF NOT EXISTS tablet_preparing_shipment BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tablet_preparing_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tablet_tracking_number TEXT,
ADD COLUMN IF NOT EXISTS tablet_shipping_carrier TEXT,
ADD COLUMN IF NOT EXISTS tablet_shipping_label_url TEXT;