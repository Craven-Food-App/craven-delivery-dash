-- ================================================================
-- INTEGRATE NEW DRIVER ONBOARDING WITH EXISTING WAITLIST SYSTEM
-- ================================================================
-- This connects the new onboarding flow (drivers table) with the
-- existing craver_applications waitlist infrastructure

-- Add new status values to craver_applications to match new onboarding flow
ALTER TABLE public.craver_applications
DROP CONSTRAINT IF EXISTS craver_applications_status_check;

ALTER TABLE public.craver_applications
ADD CONSTRAINT craver_applications_status_check CHECK (status IN (
  'pending',
  'approved', 
  'rejected',
  'waitlist',
  'invited',
  'started',
  'consents_ok',
  'id_submitted',
  'pending_check',
  'awaiting_contract',
  'contract_signed',
  'waitlisted_contract_signed',
  'eligible',
  'active',
  'suspended'
));

-- Add new columns to track onboarding progress
ALTER TABLE public.craver_applications
ADD COLUMN IF NOT EXISTS onboarding_step TEXT DEFAULT 'signup',
ADD COLUMN IF NOT EXISTS contract_signed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS signature_image_url TEXT,
ADD COLUMN IF NOT EXISTS tos_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tos_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS privacy_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS fcra_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fcra_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS consent_ip_address TEXT,
ADD COLUMN IF NOT EXISTS consent_user_agent TEXT;

-- Create a view that combines drivers and craver_applications
CREATE OR REPLACE VIEW public.unified_driver_applications AS
SELECT 
  ca.id,
  ca.user_id as auth_user_id,
  ca.first_name || ' ' || ca.last_name as full_name,
  ca.email,
  ca.phone,
  ca.city,
  ca.zip_code as zip,
  ca.status,
  ca.ssn_last_four as ssn_last4,
  ca.contract_signed_at,
  ca.created_at,
  ca.updated_at,
  ca.waitlist_joined_at,
  ca.waitlist_position,
  ca.points,
  ca.priority_score,
  ca.region_id,
  r.name as region_name,
  r.status as region_status,
  r.active_quota as region_capacity
FROM public.craver_applications ca
LEFT JOIN public.regions r ON ca.region_id = r.id;

-- Function to sync driver record to craver_applications when contract is signed
CREATE OR REPLACE FUNCTION sync_driver_to_craver_application()
RETURNS TRIGGER AS $$
BEGIN
  -- When a driver in the new table signs contract, update/create craver_application
  IF NEW.status = 'contract_signed' AND (OLD.status IS NULL OR OLD.status != 'contract_signed') THEN
    INSERT INTO public.craver_applications (
      user_id,
      first_name,
      last_name,
      email,
      phone,
      city,
      state,
      zip_code,
      ssn_last_four,
      status,
      contract_signed_at,
      date_of_birth,
      street_address,
      vehicle_type,
      drivers_license,
      license_plate,
      vehicle_make,
      vehicle_model,
      vehicle_year,
      vehicle_color,
      insurance_provider,
      insurance_policy
    )
    VALUES (
      NEW.auth_user_id,
      split_part(NEW.full_name, ' ', 1),
      split_part(NEW.full_name, ' ', 2),
      NEW.email,
      NEW.phone,
      NEW.city,
      'OH', -- Default state, should be added to drivers table
      NEW.zip,
      NEW.ssn_last4,
      'waitlist', -- Start as waitlist by default
      NEW.contract_signed_at,
      '1990-01-01', -- Placeholder, should come from encrypted data
      'Not Provided', -- Placeholder
      'car', -- Default
      'Not Provided', -- Placeholder
      'Not Provided', -- Placeholder
      'Not Provided', -- Placeholder
      'Not Provided', -- Placeholder
      2020, -- Placeholder
      'Not Provided', -- Placeholder
      'Not Provided', -- Placeholder
      'Not Provided' -- Placeholder
    )
    ON CONFLICT (user_id) DO UPDATE
    SET
      status = 'waitlist',
      contract_signed_at = NEW.contract_signed_at,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync drivers to craver_applications
DROP TRIGGER IF EXISTS trigger_sync_driver_to_craver ON public.drivers;
CREATE TRIGGER trigger_sync_driver_to_craver
  AFTER INSERT OR UPDATE ON public.drivers
  FOR EACH ROW
  EXECUTE FUNCTION sync_driver_to_craver_application();

COMMENT ON FUNCTION sync_driver_to_craver_application IS 'Syncs new driver onboarding records to existing craver_applications waitlist system';

