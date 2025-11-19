-- ============================================================================
-- ENABLE FORMATION MODE FOR TORRANCE STROMAN APPOINTMENT
-- This script enables formation_mode for tstroman.ceo@cravenusa.com
-- ============================================================================

-- First, check if the appointment exists
DO $$
DECLARE
  appointment_record RECORD;
BEGIN
  -- Find the appointment
  SELECT id, proposed_officer_name, proposed_officer_email, proposed_title, status, formation_mode
  INTO appointment_record
  FROM public.executive_appointments
  WHERE proposed_officer_email = 'tstroman.ceo@cravenusa.com'
    AND proposed_officer_name ILIKE '%Torrance%Stroman%'
  LIMIT 1;

  IF appointment_record.id IS NULL THEN
    RAISE NOTICE 'No appointment found for tstroman.ceo@cravenusa.com';
    RAISE NOTICE 'Please create an appointment first or check the email address.';
  ELSE
    RAISE NOTICE 'Found appointment: % (ID: %)', appointment_record.proposed_officer_name, appointment_record.id;
    RAISE NOTICE 'Current status: %, Current formation_mode: %', appointment_record.status, appointment_record.formation_mode;
    
    -- Update the appointment to enable formation_mode
    UPDATE public.executive_appointments
    SET 
      formation_mode = true,
      updated_at = now()
    WHERE id = appointment_record.id;
    
    RAISE NOTICE 'Successfully enabled formation_mode for appointment ID: %', appointment_record.id;
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Go to the Governance Admin portal';
    RAISE NOTICE '2. Find the appointment for Torrance Stroman';
    RAISE NOTICE '3. Click "Regenerate Documents" to generate the Pre-Incorporation Consent';
    RAISE NOTICE '';
    RAISE NOTICE 'OR call the edge function: governance-backfill-appointment-documents';
    RAISE NOTICE 'with body: {"appointment_id": "%", "force_regenerate": false}', appointment_record.id;
  END IF;
END $$;

-- Display updated appointment info
SELECT 
  id,
  proposed_officer_name,
  proposed_officer_email,
  proposed_title,
  formation_mode,
  pre_incorporation_consent_url,
  status,
  created_at,
  updated_at
FROM public.executive_appointments
WHERE proposed_officer_email = 'tstroman.ceo@cravenusa.com'
  AND proposed_officer_name ILIKE '%Torrance%Stroman%'
ORDER BY created_at DESC;
