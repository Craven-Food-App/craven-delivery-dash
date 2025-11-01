-- Make required fields nullable to support waitlist-only application flow
-- Fields will be collected later during full onboarding

ALTER TABLE public.craver_applications
ALTER COLUMN date_of_birth DROP NOT NULL,
ALTER COLUMN street_address DROP NOT NULL,
ALTER COLUMN drivers_license DROP NOT NULL,
ALTER COLUMN insurance_provider DROP NOT NULL,
ALTER COLUMN insurance_policy DROP NOT NULL,
ALTER COLUMN license_plate DROP NOT NULL,
ALTER COLUMN vehicle_color DROP NOT NULL,
ALTER COLUMN vehicle_make DROP NOT NULL,
ALTER COLUMN vehicle_model DROP NOT NULL,
ALTER COLUMN vehicle_type DROP NOT NULL,
ALTER COLUMN vehicle_year DROP NOT NULL;

-- Drop constraints that require these fields
ALTER TABLE public.craver_applications
DROP CONSTRAINT IF EXISTS valid_birth_date;

ALTER TABLE public.craver_applications
DROP CONSTRAINT IF EXISTS valid_license_expiry;

-- Add comments
COMMENT ON COLUMN public.craver_applications.date_of_birth IS 'Date of birth - optional for waitlist applications';
COMMENT ON COLUMN public.craver_applications.street_address IS 'Street address - optional for waitlist applications';
COMMENT ON COLUMN public.craver_applications.drivers_license IS 'Driver license number - optional for waitlist applications';
COMMENT ON COLUMN public.craver_applications.insurance_provider IS 'Insurance provider - optional for waitlist applications';
COMMENT ON COLUMN public.craver_applications.insurance_policy IS 'Insurance policy number - optional for waitlist applications';
COMMENT ON COLUMN public.craver_applications.license_plate IS 'Vehicle license plate - optional for waitlist applications';
COMMENT ON COLUMN public.craver_applications.vehicle_color IS 'Vehicle color - optional for waitlist applications';
COMMENT ON COLUMN public.craver_applications.vehicle_make IS 'Vehicle make - optional for waitlist applications';
COMMENT ON COLUMN public.craver_applications.vehicle_model IS 'Vehicle model - optional for waitlist applications';
COMMENT ON COLUMN public.craver_applications.vehicle_type IS 'Vehicle type - optional for waitlist applications';
COMMENT ON COLUMN public.craver_applications.vehicle_year IS 'Vehicle year - optional for waitlist applications';

