-- Create trigger to automatically send email when board documents are created for appointments
-- This ensures appointees are notified when their documents are ready to sign

CREATE OR REPLACE FUNCTION public.send_appointment_documents_email_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_appointment_id UUID;
  v_appointee_email TEXT;
  v_appointee_name TEXT;
  v_appointee_user_id UUID;
BEGIN
  -- Only trigger for documents linked to appointments
  IF NEW.related_appointment_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_appointment_id := NEW.related_appointment_id;

  -- Get appointment details
  SELECT appointee_user_id INTO v_appointee_user_id
  FROM public.appointments
  WHERE id = v_appointment_id
  LIMIT 1;

  -- If no appointment found, try executive_appointments
  IF v_appointee_user_id IS NULL THEN
    -- Try to get from executive_appointments by matching document
    SELECT ea.proposed_officer_email, ea.proposed_officer_name
    INTO v_appointee_email, v_appointee_name
    FROM public.executive_appointments ea
    WHERE ea.id = v_appointment_id
    LIMIT 1;
  ELSE
    -- Get email from auth.users
    SELECT email INTO v_appointee_email
    FROM auth.users
    WHERE id = v_appointee_user_id
    LIMIT 1;

    -- Get name from user_profiles
    SELECT full_name INTO v_appointee_name
    FROM public.user_profiles
    WHERE user_id = v_appointee_user_id
    LIMIT 1;
  END IF;

  -- Only send if we have an email and document is pending
  IF v_appointee_email IS NOT NULL AND NEW.signing_status = 'pending' THEN
    -- Call edge function to send email (async, don't wait)
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-appointment-documents-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key', true)
      ),
      body := jsonb_build_object(
        'appointmentId', v_appointment_id::text,
        'documentIds', jsonb_build_array(NEW.id::text)
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_send_appointment_documents_email ON public.board_documents;
CREATE TRIGGER trigger_send_appointment_documents_email
  AFTER INSERT ON public.board_documents
  FOR EACH ROW
  WHEN (NEW.related_appointment_id IS NOT NULL AND NEW.signing_status = 'pending')
  EXECUTE FUNCTION public.send_appointment_documents_email_trigger();

COMMENT ON FUNCTION public.send_appointment_documents_email_trigger IS 
'Automatically sends email notification to appointee when board documents are created and ready for signature.';

