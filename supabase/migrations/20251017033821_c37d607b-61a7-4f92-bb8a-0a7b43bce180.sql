-- Add W-9 fields to craver_applications
ALTER TABLE craver_applications 
ADD COLUMN IF NOT EXISTS w9_document TEXT,
ADD COLUMN IF NOT EXISTS tax_classification TEXT,
ADD COLUMN IF NOT EXISTS business_name TEXT;

-- Add W-9 tracking to onboarding progress
ALTER TABLE driver_onboarding_progress
ADD COLUMN IF NOT EXISTS w9_completed BOOLEAN DEFAULT FALSE;

-- Update onboarding_completed_at to allow NULL for in-progress onboarding
-- (already nullable, just documenting the intent)