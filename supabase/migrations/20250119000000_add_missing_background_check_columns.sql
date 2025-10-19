-- Add missing background check and onboarding columns to craver_applications
-- These columns are needed for the mobile driver app login flow

-- Add background check timing columns
ALTER TABLE public.craver_applications
ADD COLUMN IF NOT EXISTS background_check_initiated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS background_check_estimated_completion TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS background_check_approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS background_check_report_id TEXT,
ADD COLUMN IF NOT EXISTS background_check_consent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS background_check_consent_date TIMESTAMP WITH TIME ZONE;

-- Add onboarding and welcome screen tracking
ALTER TABLE public.craver_applications
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS welcome_screen_shown BOOLEAN DEFAULT false;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_craver_applications_background_check_status 
ON public.craver_applications(background_check_approved_at, onboarding_completed_at);

CREATE INDEX IF NOT EXISTS idx_craver_applications_onboarding 
ON public.craver_applications(onboarding_completed_at);

-- Add comments
COMMENT ON COLUMN public.craver_applications.background_check_initiated_at IS 'When background check was started';
COMMENT ON COLUMN public.craver_applications.background_check_estimated_completion IS 'Estimated completion date for background check';
COMMENT ON COLUMN public.craver_applications.background_check_approved_at IS 'When background check was approved';
COMMENT ON COLUMN public.craver_applications.background_check_report_id IS 'External background check provider report ID';
COMMENT ON COLUMN public.craver_applications.background_check_consent IS 'Driver consent to background check';
COMMENT ON COLUMN public.craver_applications.background_check_consent_date IS 'When driver gave consent';
COMMENT ON COLUMN public.craver_applications.onboarding_completed_at IS 'When driver completed mobile onboarding';
COMMENT ON COLUMN public.craver_applications.welcome_screen_shown IS 'Whether welcome confetti has been shown';

-- Add welcome screen column to restaurants table
ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS merchant_welcome_shown BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.restaurants.merchant_welcome_shown IS 'Whether merchant welcome confetti has been shown';

