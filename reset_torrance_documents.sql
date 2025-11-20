-- Reset all Torrance Stroman documents to require re-signing
-- Run this in Supabase SQL Editor

-- First, let's see what documents exist for Torrance
SELECT 
  ed.id,
  ed.type,
  ed.officer_name,
  ed.signature_status,
  ed.executive_id,
  eu.user_id,
  au.email,
  ed.created_at
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
  OR au.email = 'tstroman.ceo@cravenusa.com';

-- Now reset all his documents
UPDATE public.executive_documents ed
SET 
  signature_status = 'pending',
  signed_at = NULL,
  signed_file_url = NULL,
  signed_by_user = NULL
FROM public.exec_users eu
LEFT JOIN auth.users au ON eu.user_id = au.id
WHERE ed.executive_id = eu.id
  AND (
    ed.officer_name ILIKE '%torrance%stroman%'
    OR ed.officer_name ILIKE '%stroman%torrance%'
    OR au.email ILIKE '%torrance%stroman%'
    OR au.email ILIKE '%stroman%torrance%'
    OR au.email = 'craven@usa.com'
    OR au.email = 'torrance.stroman@example.com'
    OR au.email = 'cmih@chef.net'
    OR au.email = 'tstroman.ceo@cravenusa.com'
  );

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

-- Verify the update
SELECT 
  COUNT(*) as total_documents,
  COUNT(CASE WHEN signature_status = 'pending' THEN 1 END) as pending_documents,
  COUNT(CASE WHEN signature_status = 'signed' THEN 1 END) as signed_documents
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
  OR au.email = 'tstroman.ceo@cravenusa.com';

