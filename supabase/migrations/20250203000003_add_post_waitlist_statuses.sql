-- Add new post-waitlist onboarding status values to craver_applications
-- These statuses track drivers through the 8-step onboarding flow

ALTER TABLE public.craver_applications
DROP CONSTRAINT IF EXISTS craver_applications_status_check;

ALTER TABLE public.craver_applications
ADD CONSTRAINT craver_applications_status_check CHECK (status IN (
  'pending',
  'approved', 
  'rejected',
  'waitlist',
  'invited',                        -- Removed from waitlist, email sent to continue
  'verifying_identity',            -- Step 1: Identity verification in progress
  'collecting_docs',               -- Steps 2-4: License, vehicle, insurance docs
  'verifying_background',          -- Step 6: Background check running
  'signing_agreements',            -- Step 7: Legal agreements (DocuSign)
  'pending_review',                -- Step 8: All docs submitted, awaiting admin
  'started',
  'consents_ok',
  'id_submitted',
  'awaiting_contract',
  'contract_signed',
  'waitlisted_contract_signed',
  'eligible',
  'active',
  'suspended'
));

COMMENT ON COLUMN public.craver_applications.status IS 'Driver application status: waitlist -> invited -> verifying_identity -> collecting_docs -> verifying_background -> signing_agreements -> pending_review -> active';

