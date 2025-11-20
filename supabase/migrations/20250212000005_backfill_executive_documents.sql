-- Backfill executive_documents from existing appointment documents
-- This ensures all appointment documents are linked to executive_documents

CREATE OR REPLACE FUNCTION public.backfill_executive_documents_from_appointments()
RETURNS TABLE (
  appointment_id UUID,
  document_type TEXT,
  executive_id UUID,
  created BOOLEAN
) AS $$
DECLARE
  appointment_rec RECORD;
  exec_user_rec RECORD;
  doc_type TEXT;
  doc_url TEXT;
  exec_doc_id UUID;
  doc_fields TEXT[][];
  i INTEGER;
BEGIN
  -- Loop through all appointments
  FOR appointment_rec IN 
    SELECT * FROM public.executive_appointments
    WHERE status IN ('APPROVED', 'SENT_TO_BOARD', 'ACTIVE', 'DRAFT')
  LOOP
    -- Find the executive user by email
    SELECT eu.id INTO exec_user_rec
    FROM public.exec_users eu
    INNER JOIN auth.users au ON au.id = eu.user_id
    WHERE LOWER(au.email) = LOWER(appointment_rec.proposed_officer_email)
    LIMIT 1;

    -- If executive user found, process all document URLs
    IF exec_user_rec.id IS NOT NULL THEN
      -- Define all document fields to check
      doc_fields := ARRAY[
        ARRAY['pre_incorporation_consent', 'pre_incorporation_consent_url'],
        ARRAY['appointment_letter', 'appointment_letter_url'],
        ARRAY['board_resolution', 'board_resolution_url'],
        ARRAY['certificate', 'certificate_url'],
        ARRAY['employment_agreement', 'employment_agreement_url'],
        ARRAY['confidentiality_ip', 'confidentiality_ip_url'],
        ARRAY['stock_subscription', 'stock_subscription_url'],
        ARRAY['deferred_compensation', 'deferred_compensation_url']
      ];

      -- Process each document type
      FOR i IN 1..array_length(doc_fields, 1) LOOP
        doc_type := doc_fields[i][1];
        
        -- Get the URL value dynamically
        EXECUTE format('SELECT %I FROM public.executive_appointments WHERE id = $1', doc_fields[i][2])
        INTO doc_url
        USING appointment_rec.id;

        -- If URL exists, create/update executive_documents record
        IF doc_url IS NOT NULL AND doc_url != '' THEN
          -- Check if document already exists
          SELECT id INTO exec_doc_id
          FROM public.executive_documents
          WHERE appointment_id = appointment_rec.id
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
              appointment_rec.proposed_officer_name,
              appointment_rec.proposed_title,
              exec_user_rec.id,
              doc_url,
              appointment_rec.id,
              'pending',
              'generated',
              now()
            )
            RETURNING id INTO exec_doc_id;
            
            -- Return success
            appointment_id := appointment_rec.id;
            document_type := doc_type;
            executive_id := exec_user_rec.id;
            created := TRUE;
            RETURN NEXT;
          ELSE
            -- Update existing record with current URL
            UPDATE public.executive_documents
            SET 
              file_url = doc_url,
              updated_at = now()
            WHERE id = exec_doc_id;
            
            appointment_id := appointment_rec.id;
            document_type := doc_type;
            executive_id := exec_user_rec.id;
            created := FALSE;
            RETURN NEXT;
          END IF;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a simpler RPC function that can be called from the frontend
CREATE OR REPLACE FUNCTION public.backfill_my_executive_documents(p_user_email TEXT)
RETURNS INTEGER AS $$
DECLARE
  appointment_rec RECORD;
  exec_user_rec RECORD;
  doc_type TEXT;
  doc_url TEXT;
  exec_doc_id UUID;
  doc_fields TEXT[][];
  i INTEGER;
  count_created INTEGER := 0;
BEGIN
  -- Find the executive user by email
  SELECT eu.id INTO exec_user_rec
  FROM public.exec_users eu
  INNER JOIN auth.users au ON au.id = eu.user_id
  WHERE LOWER(au.email) = LOWER(p_user_email)
  LIMIT 1;

  IF exec_user_rec.id IS NULL THEN
    RETURN 0;
  END IF;

  -- Loop through appointments for this user
  FOR appointment_rec IN 
    SELECT * FROM public.executive_appointments
    WHERE LOWER(proposed_officer_email) = LOWER(p_user_email)
      AND status IN ('APPROVED', 'SENT_TO_BOARD', 'ACTIVE', 'DRAFT', 'AWAITING_SIGNATURES', 'READY_FOR_SECRETARY_REVIEW')
  LOOP
    -- Define all document fields to check
    doc_fields := ARRAY[
      ARRAY['pre_incorporation_consent', 'pre_incorporation_consent_url'],
      ARRAY['appointment_letter', 'appointment_letter_url'],
      ARRAY['board_resolution', 'board_resolution_url'],
      ARRAY['certificate', 'certificate_url'],
      ARRAY['employment_agreement', 'employment_agreement_url'],
      ARRAY['confidentiality_ip', 'confidentiality_ip_url'],
      ARRAY['stock_subscription', 'stock_subscription_url'],
      ARRAY['deferred_compensation', 'deferred_compensation_url']
    ];

    -- Process each document type
    FOR i IN 1..array_length(doc_fields, 1) LOOP
      doc_type := doc_fields[i][1];
      
      -- Get the URL value dynamically
      EXECUTE format('SELECT %I FROM public.executive_appointments WHERE id = $1', doc_fields[i][2])
      INTO doc_url
      USING appointment_rec.id;

      -- If URL exists, create/update executive_documents record
      IF doc_url IS NOT NULL AND doc_url != '' THEN
        -- Check if document already exists
        SELECT id INTO exec_doc_id
        FROM public.executive_documents
        WHERE appointment_id = appointment_rec.id
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
            appointment_rec.proposed_officer_name,
            appointment_rec.proposed_title,
            exec_user_rec.id,
            doc_url,
            appointment_rec.id,
            'pending',
            'generated',
            now()
          );
          
          count_created := count_created + 1;
        END IF;
      END IF;
    END LOOP;
  END LOOP;
  
  RETURN count_created;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the backfill for all users (optional, can be run manually)
-- SELECT * FROM public.backfill_executive_documents_from_appointments();

COMMENT ON FUNCTION public.backfill_executive_documents_from_appointments() IS 'Backfills executive_documents table from existing appointment documents. Run this to link all existing appointment documents to executives.';
COMMENT ON FUNCTION public.backfill_my_executive_documents(TEXT) IS 'Backfills executive_documents for a specific user email. Returns count of documents created.';

