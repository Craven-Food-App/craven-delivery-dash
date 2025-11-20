-- Fix the trigger to use case-insensitive email matching
-- This ensures documents are linked even if emails have different cases

CREATE OR REPLACE FUNCTION public.link_appointment_document_to_executive()
RETURNS TRIGGER AS $$
DECLARE
  exec_user_record RECORD;
  exec_doc_id UUID;
  doc_type TEXT;
  doc_url TEXT;
BEGIN
  -- Only process if a document URL was just set (not NULL)
  -- Check which document field was updated
  IF NEW.pre_incorporation_consent_url IS DISTINCT FROM OLD.pre_incorporation_consent_url 
     AND NEW.pre_incorporation_consent_url IS NOT NULL THEN
    doc_type := 'pre_incorporation_consent';
    doc_url := NEW.pre_incorporation_consent_url;
  ELSIF NEW.appointment_letter_url IS DISTINCT FROM OLD.appointment_letter_url 
        AND NEW.appointment_letter_url IS NOT NULL THEN
    doc_type := 'appointment_letter';
    doc_url := NEW.appointment_letter_url;
  ELSIF NEW.board_resolution_url IS DISTINCT FROM OLD.board_resolution_url 
        AND NEW.board_resolution_url IS NOT NULL THEN
    doc_type := 'board_resolution';
    doc_url := NEW.board_resolution_url;
  ELSIF NEW.certificate_url IS DISTINCT FROM OLD.certificate_url 
        AND NEW.certificate_url IS NOT NULL THEN
    doc_type := 'certificate';
    doc_url := NEW.certificate_url;
  ELSIF NEW.employment_agreement_url IS DISTINCT FROM OLD.employment_agreement_url 
        AND NEW.employment_agreement_url IS NOT NULL THEN
    doc_type := 'employment_agreement';
    doc_url := NEW.employment_agreement_url;
  ELSIF NEW.confidentiality_ip_url IS DISTINCT FROM OLD.confidentiality_ip_url 
        AND NEW.confidentiality_ip_url IS NOT NULL THEN
    doc_type := 'confidentiality_ip';
    doc_url := NEW.confidentiality_ip_url;
  ELSIF NEW.stock_subscription_url IS DISTINCT FROM OLD.stock_subscription_url 
        AND NEW.stock_subscription_url IS NOT NULL THEN
    doc_type := 'stock_subscription';
    doc_url := NEW.stock_subscription_url;
  ELSIF NEW.deferred_compensation_url IS DISTINCT FROM OLD.deferred_compensation_url 
        AND NEW.deferred_compensation_url IS NOT NULL THEN
    doc_type := 'deferred_compensation';
    doc_url := NEW.deferred_compensation_url;
  ELSE
    -- No document URL was updated, exit
    RETURN NEW;
  END IF;

  -- Find the executive user by email (case-insensitive)
  SELECT eu.id INTO exec_user_record
  FROM public.exec_users eu
  INNER JOIN auth.users au ON au.id = eu.user_id
  WHERE LOWER(au.email) = LOWER(NEW.proposed_officer_email)
  LIMIT 1;

  -- If executive user found, create/update executive_documents record
  IF exec_user_record.id IS NOT NULL THEN
    -- Check if document already exists
    SELECT id INTO exec_doc_id
    FROM public.executive_documents
    WHERE appointment_id = NEW.id
      AND type = doc_type
    LIMIT 1;

    IF exec_doc_id IS NULL THEN
      -- Create new executive_documents record
      INSERT INTO public.executive_documents (
        type,
        officer_name,
        role,
        executive_id,
        file_url,
        appointment_id,
        signature_status,
        status,
        created_at
      ) VALUES (
        doc_type,
        NEW.proposed_officer_name,
        NEW.proposed_title,
        exec_user_record.id,
        doc_url,
        NEW.id,
        'pending',
        'generated',
        now()
      );
    ELSE
      -- Update existing record with new URL
      UPDATE public.executive_documents
      SET 
        file_url = doc_url,
        updated_at = now()
      WHERE id = exec_doc_id;
    END IF;
  ELSE
    -- Log warning if executive user not found
    RAISE WARNING 'Executive user not found for email: %', NEW.proposed_officer_email;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.link_appointment_document_to_executive() IS 'Automatically creates executive_documents records when appointment documents are generated, linking them to the executive user. Updated to use case-insensitive email matching.';

