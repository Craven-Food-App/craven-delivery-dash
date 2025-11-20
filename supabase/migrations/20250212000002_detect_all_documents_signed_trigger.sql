-- ============================================================================
-- DETECT ALL DOCUMENTS SIGNED TRIGGER
-- Automatically moves appointment to READY_FOR_SECRETARY_REVIEW when all docs signed
-- ============================================================================

-- Function to check if all required documents are signed
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
  
  -- Get appointment to check if formation_mode
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

-- Trigger function to update appointment status when documents are signed
CREATE OR REPLACE FUNCTION public.handle_document_signed()
RETURNS TRIGGER AS $$
DECLARE
  v_appointment_id UUID;
  v_all_signed BOOLEAN;
  v_current_status TEXT;
BEGIN
  -- Only process if signature_status changed to 'signed'
  IF NEW.signature_status = 'signed' AND (OLD.signature_status IS NULL OR OLD.signature_status != 'signed') THEN
    v_appointment_id := NEW.appointment_id;
    
    IF v_appointment_id IS NOT NULL THEN
      -- Get current status to avoid unnecessary updates
      SELECT status INTO v_current_status
      FROM public.executive_appointments
      WHERE id = v_appointment_id;
      
      -- Only proceed if not already in a later stage
      IF v_current_status NOT IN ('READY_FOR_SECRETARY_REVIEW', 'SECRETARY_APPROVED', 'ACTIVATING', 'ACTIVE') THEN
        -- Check if all documents are signed
        v_all_signed := public.check_all_documents_signed(v_appointment_id);
        
        IF v_all_signed THEN
          -- Update appointment status
          UPDATE public.executive_appointments
          SET status = 'READY_FOR_SECRETARY_REVIEW',
              updated_at = now()
          WHERE id = v_appointment_id;
          
          -- Log timeline event
          INSERT INTO public.officer_activation_timeline (
            appointment_id,
            event_type,
            event_description,
            performed_by,
            metadata
          ) VALUES (
            v_appointment_id,
            'DOCUMENTS_SIGNED',
            'All required documents have been signed',
            NEW.signed_by_user,
            jsonb_build_object(
              'document_type', NEW.type,
              'document_id', NEW.id,
              'signed_at', NEW.signed_at
            )
          );
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_document_signed ON public.executive_documents;
CREATE TRIGGER trigger_document_signed
  AFTER UPDATE OF signature_status ON public.executive_documents
  FOR EACH ROW
  WHEN (NEW.signature_status = 'signed' AND (OLD.signature_status IS NULL OR OLD.signature_status != 'signed'))
  EXECUTE FUNCTION public.handle_document_signed();

COMMENT ON FUNCTION public.check_all_documents_signed IS 'Checks if all required documents for an appointment are signed';
COMMENT ON FUNCTION public.handle_document_signed IS 'Trigger function that moves appointment to READY_FOR_SECRETARY_REVIEW when all docs are signed';

