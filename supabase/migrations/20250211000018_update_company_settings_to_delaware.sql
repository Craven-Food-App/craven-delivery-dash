-- ============================================================================
-- UPDATE COMPANY SETTINGS TO DELAWARE
-- This migration updates existing company_settings to use Delaware instead of Ohio
-- ============================================================================

-- Update state_of_incorporation to Delaware (update all records)
UPDATE public.company_settings
SET 
  setting_value = 'Delaware',
  updated_at = now()
WHERE setting_key = 'state_of_incorporation';

-- Update state_filing_office to Delaware Secretary of State (update all records)
UPDATE public.company_settings
SET 
  setting_value = 'Delaware Secretary of State',
  updated_at = now()
WHERE setting_key = 'state_filing_office';

-- Update registered_office if it contains Ohio address (optional - only if you want to change the address)
-- Uncomment the following if you want to update the registered office address:
-- UPDATE public.company_settings
-- SET 
--   setting_value = '123 Main St, Wilmington, DE 19801',
--   updated_at = now()
-- WHERE setting_key = 'registered_office' 
--   AND setting_value LIKE '%Cleveland%';

