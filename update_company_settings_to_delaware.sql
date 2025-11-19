-- ============================================================================
-- UPDATE COMPANY SETTINGS TO DELAWARE
-- Run this script in Supabase Dashboard SQL Editor to update existing settings
-- ============================================================================

-- Update state_of_incorporation to Delaware (force update all records)
UPDATE public.company_settings
SET 
  setting_value = 'Delaware',
  updated_at = now()
WHERE setting_key = 'state_of_incorporation';

-- Update state_filing_office to Delaware Secretary of State (force update all records)
UPDATE public.company_settings
SET 
  setting_value = 'Delaware Secretary of State',
  updated_at = now()
WHERE setting_key = 'state_filing_office';

-- If registered_office needs updating (optional)
UPDATE public.company_settings
SET 
  setting_value = '123 Main St, Wilmington, DE 19801',
  updated_at = now()
WHERE setting_key = 'registered_office'
  AND setting_value LIKE '%Cleveland%';

-- Verify the changes
SELECT setting_key, setting_value 
FROM public.company_settings 
WHERE setting_key IN ('state_of_incorporation', 'state_filing_office', 'registered_office')
ORDER BY setting_key;

