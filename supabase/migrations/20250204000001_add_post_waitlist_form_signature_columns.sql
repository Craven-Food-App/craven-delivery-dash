-- Add columns for post-waitlist onboarding form signatures and consents
-- These columns track when drivers complete each required legal form

ALTER TABLE public.craver_applications
ADD COLUMN IF NOT EXISTS criminal_history_consent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS criminal_history_consent_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS facial_image_consent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS facial_image_consent_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS electronic_1099_consent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS electronic_1099_consent_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS w9_signed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS w9_signed_date TIMESTAMP WITH TIME ZONE;

-- Add comments for documentation
COMMENT ON COLUMN public.craver_applications.criminal_history_consent IS 'Driver consent to criminal history disclosure';
COMMENT ON COLUMN public.craver_applications.criminal_history_consent_date IS 'When criminal history consent was given';
COMMENT ON COLUMN public.craver_applications.facial_image_consent IS 'Driver consent to facial recognition/image collection';
COMMENT ON COLUMN public.craver_applications.facial_image_consent_date IS 'When facial image consent was given';
COMMENT ON COLUMN public.craver_applications.electronic_1099_consent IS 'Driver consent to electronic 1099-NEC delivery';
COMMENT ON COLUMN public.craver_applications.electronic_1099_consent_date IS 'When electronic 1099 consent was given';
COMMENT ON COLUMN public.craver_applications.w9_signed IS 'W-9 form completed and signed';
COMMENT ON COLUMN public.craver_applications.w9_signed_date IS 'When W-9 form was signed';

