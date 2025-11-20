-- ============================================================================
-- FIX TRIGGER FUNCTION TYPE MISMATCH
-- Fixes the "operator does not exist: text = boolean" error
-- ============================================================================

-- Fix the check_all_documents_signed function
CREATE OR REPLACE FUNCTION public.check_all_documents_signed(p_appointment_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  required_docs TEXT[] := ARRAY[
    'pre_incorporation_consent',
    'appointment_letter',
    'board_resolution',
    'certificate',
    'confidentiality_ip',
    'bylaws_acknowledgment',
    'conflict_of_interest'
  ];
  signed_count INTEGER;
  total_required INTEGER;
  is_formation_mode BOOLEAN;
BEGIN
  -- For formation_mode appointments, pre_incorporation_consent is required
  -- For regular appointments, it's not required
  
  -- Get appointment to check if formation_mode (use BOOLEAN type)
  SELECT COALESCE(formation_mode, false) INTO is_formation_mode
  FROM public.executive_appointments
  WHERE id = p_appointment_id;
  
  -- Count signed documents for this appointment
  SELECT COUNT(DISTINCT type)
  INTO signed_count
  FROM public.executive_documents
  WHERE appointment_id = p_appointment_id
    AND signature_status = 'signed';
  
  -- Count required documents that exist for this appointment
  -- Pre-incorporation consent only required if formation_mode = true
  SELECT COUNT(DISTINCT type)
  INTO total_required
  FROM public.executive_documents
  WHERE appointment_id = p_appointment_id
    AND (
      (is_formation_mode = true AND type = ANY(required_docs))
      OR
      (is_formation_mode = false AND type = ANY(required_docs) AND type != 'pre_incorporation_consent')
    );
  
  -- All required documents must be signed
  RETURN signed_count >= total_required AND total_required > 0;
END;
$$ LANGUAGE plpgsql STABLE;

-- Verify the function was created correctly
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'check_all_documents_signed';

