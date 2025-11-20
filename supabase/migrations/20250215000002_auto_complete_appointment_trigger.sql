-- Auto-complete appointment when all documents are signed
-- This trigger automatically calls governance-complete-appointment when all signing is done

-- Function to check if all documents are signed and trigger completion
CREATE OR REPLACE FUNCTION public.auto_complete_executive_appointment()
RETURNS TRIGGER AS $$
DECLARE
  v_appointment_id UUID;
  v_user_id UUID;
  v_all_signed BOOLEAN;
  v_onboarding_id UUID;
  v_supabase_url TEXT;
  v_service_key TEXT;
BEGIN
  -- Only proceed if document status changed to 'completed'
  IF NEW.signing_status = 'completed' AND (OLD.signing_status IS NULL OR OLD.signing_status != 'completed') THEN
    v_appointment_id := NEW.related_appointment_id;
    
    IF v_appointment_id IS NOT NULL THEN
      -- Get user_id from appointment
      SELECT appointee_user_id INTO v_user_id
      FROM public.appointments
      WHERE id = v_appointment_id;
      
      IF v_user_id IS NOT NULL THEN
        -- Check if all documents for this appointment are signed
        SELECT NOT EXISTS (
          SELECT 1
          FROM public.board_documents
          WHERE related_appointment_id = v_appointment_id
            AND signing_status != 'completed'
        ) INTO v_all_signed;
        
        -- If all documents are signed, trigger completion
        IF v_all_signed THEN
          -- Get onboarding record
          SELECT id INTO v_onboarding_id
          FROM public.executive_onboarding
          WHERE appointment_id = v_appointment_id
            AND user_id = v_user_id
            AND status != 'completed';
          
          -- Only trigger if onboarding exists and is not already completed
          IF v_onboarding_id IS NOT NULL THEN
            -- Get Supabase URL and service key from settings or environment
            v_supabase_url := current_setting('app.supabase_url', true);
            v_service_key := current_setting('app.supabase_service_role_key', true);
            
            -- If settings not available, use default (for local dev)
            IF v_supabase_url IS NULL THEN
              v_supabase_url := 'http://localhost:54321';
            END IF;
            
            -- Call governance-complete-appointment edge function
            IF v_service_key IS NOT NULL THEN
              PERFORM net.http_post(
                url := v_supabase_url || '/functions/v1/governance-complete-appointment',
                headers := jsonb_build_object(
                  'Content-Type', 'application/json',
                  'Authorization', 'Bearer ' || v_service_key
                ),
                body := jsonb_build_object(
                  'appointment_id', v_appointment_id
                )
              );
            ELSE
              -- Fallback: Use pg_net if available, or log for manual trigger
              RAISE NOTICE 'All documents signed for appointment %. Please manually trigger governance-complete-appointment for appointment_id: %', v_appointment_id, v_appointment_id;
            END IF;
          END IF;
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on board_documents table
DROP TRIGGER IF EXISTS trg_auto_complete_executive_appointment ON public.board_documents;

CREATE TRIGGER trg_auto_complete_executive_appointment
  AFTER UPDATE OF signing_status ON public.board_documents
  FOR EACH ROW
  WHEN (NEW.signing_status = 'completed' AND (OLD.signing_status IS NULL OR OLD.signing_status != 'completed'))
  EXECUTE FUNCTION public.auto_complete_executive_appointment();

COMMENT ON FUNCTION public.auto_complete_executive_appointment IS 'Automatically triggers governance-complete-appointment when all documents for an appointment are signed';
COMMENT ON TRIGGER trg_auto_complete_executive_appointment ON public.board_documents IS 'Triggers appointment completion when all documents are signed';

