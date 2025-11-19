-- ============================================================================
-- FORCE ENABLE FORMATION MODE AND CLEAR PRE-INCORPORATION CONSENT URL
-- This ensures the document will be regenerated
-- ============================================================================

-- Step 1: Ensure columns exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'executive_appointments' 
    AND column_name = 'formation_mode'
  ) THEN
    ALTER TABLE public.executive_appointments
    ADD COLUMN formation_mode BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'executive_appointments' 
    AND column_name = 'pre_incorporation_consent_url'
  ) THEN
    ALTER TABLE public.executive_appointments
    ADD COLUMN pre_incorporation_consent_url TEXT;
  END IF;
END $$;

-- Step 2: Enable formation_mode and clear the URL to force regeneration
UPDATE public.executive_appointments
SET 
  formation_mode = true,
  pre_incorporation_consent_url = NULL,  -- Clear it so it will regenerate
  updated_at = now()
WHERE proposed_officer_email = 'tstroman.ceo@cravenusa.com'
  AND (proposed_officer_name ILIKE '%Torrance%Stroman%' 
    OR proposed_officer_name ILIKE '%Torrace%Stroman%');

-- Step 3: Verify
SELECT 
  id,
  proposed_officer_name,
  proposed_officer_email,
  formation_mode,
  pre_incorporation_consent_url,
  status
FROM public.executive_appointments
WHERE proposed_officer_email = 'tstroman.ceo@cravenusa.com'
ORDER BY created_at DESC;


