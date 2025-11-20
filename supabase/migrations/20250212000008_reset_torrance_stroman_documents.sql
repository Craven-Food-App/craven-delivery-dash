-- Reset all Torrance Stroman documents to require re-signing
-- This sets signature_status back to 'pending' and clears signature data

DO $$
DECLARE
  torrance_executive_id UUID;
  torrance_user_id UUID;
  documents_updated INTEGER;
BEGIN
  -- Find Torrance Stroman's user ID from auth.users
  -- Try multiple possible email variations
  SELECT id INTO torrance_user_id
  FROM auth.users
  WHERE email ILIKE '%torrance%stroman%'
     OR email ILIKE '%stroman%torrance%'
     OR email = 'craven@usa.com'
     OR email = 'torrance.stroman@example.com'
     OR email = 'cmih@chef.net'
  LIMIT 1;

  -- If not found by email, try to find by name in user_profiles
  IF torrance_user_id IS NULL THEN
    SELECT user_id INTO torrance_user_id
    FROM public.user_profiles
    WHERE full_name ILIKE '%torrance%stroman%'
       OR full_name ILIKE '%stroman%torrance%'
    LIMIT 1;
  END IF;

  -- Find executive_id from exec_users table
  IF torrance_user_id IS NOT NULL THEN
    SELECT id INTO torrance_executive_id
    FROM public.exec_users
    WHERE user_id = torrance_user_id
    LIMIT 1;
  END IF;

  -- Update all documents for Torrance Stroman
  IF torrance_executive_id IS NOT NULL THEN
    UPDATE public.executive_documents
    SET 
      signature_status = 'pending',
      signed_at = NULL,
      signed_file_url = NULL,
      signed_by_user = NULL
    WHERE executive_id = torrance_executive_id;

    GET DIAGNOSTICS documents_updated = ROW_COUNT;
    
    RAISE NOTICE 'Reset % documents for Torrance Stroman (executive_id: %)', documents_updated, torrance_executive_id;
  ELSE
    -- Try updating by email directly if executive_id not found
    UPDATE public.executive_documents ed
    SET 
      signature_status = 'pending',
      signed_at = NULL,
      signed_file_url = NULL,
      signed_by_user = NULL
    FROM public.exec_users eu
    JOIN auth.users au ON eu.user_id = au.id
    WHERE ed.executive_id = eu.id
      AND (
        au.email ILIKE '%torrance%stroman%'
        OR au.email ILIKE '%stroman%torrance%'
        OR au.email = 'craven@usa.com'
        OR au.email = 'torrance.stroman@example.com'
        OR au.email = 'cmih@chef.net'
      );

    GET DIAGNOSTICS documents_updated = ROW_COUNT;
    
    RAISE NOTICE 'Reset % documents for Torrance Stroman (by email match)', documents_updated;
  END IF;

  -- Also update documents by officer_name directly (in case executive_id is NULL)
  UPDATE public.executive_documents
  SET 
    signature_status = 'pending',
    signed_at = NULL,
    signed_file_url = NULL,
    signed_by_user = NULL
  WHERE officer_name ILIKE '%torrance%stroman%'
     OR officer_name ILIKE '%stroman%torrance%';

  -- Also delete signatures from the signatures table for these documents
  DELETE FROM public.signatures sig
  WHERE sig.document_id IN (
    SELECT ed.id
    FROM public.executive_documents ed
    LEFT JOIN public.exec_users eu ON ed.executive_id = eu.id
    LEFT JOIN auth.users au ON eu.user_id = au.id
    WHERE 
      ed.officer_name ILIKE '%torrance%stroman%'
      OR ed.officer_name ILIKE '%stroman%torrance%'
      OR au.email ILIKE '%torrance%stroman%'
      OR au.email ILIKE '%stroman%torrance%'
      OR au.email = 'craven@usa.com'
      OR au.email = 'torrance.stroman@example.com'
      OR au.email = 'cmih@chef.net'
      OR au.email = 'tstroman.ceo@cravenusa.com'
  );

  GET DIAGNOSTICS documents_updated = ROW_COUNT;
  
  IF documents_updated > 0 THEN
    RAISE NOTICE 'Reset % additional documents for Torrance Stroman (by officer_name)', documents_updated;
  END IF;

END $$;

COMMENT ON FUNCTION public.reset_torrance_documents() IS 'Resets all documents for Torrance Stroman to require re-signing';

