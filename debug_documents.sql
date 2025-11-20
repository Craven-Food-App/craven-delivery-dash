-- Debug script to check why documents aren't linking
-- Run this in Supabase SQL Editor to diagnose the issue

-- 1. Check if exec_users record exists for tstroman.ceo@cravenusa.com
SELECT 
  eu.id as exec_user_id,
  eu.user_id,
  au.email,
  au.id as auth_user_id
FROM exec_users eu
INNER JOIN auth.users au ON au.id = eu.user_id
WHERE LOWER(au.email) LIKE '%tstroman%' OR LOWER(au.email) LIKE '%cravenusa%';

-- 2. Check appointments for this email
SELECT 
  id,
  proposed_officer_email,
  proposed_officer_name,
  status,
  CASE WHEN appointment_letter_url IS NOT NULL THEN 'YES' ELSE 'NO' END as has_appointment_letter,
  CASE WHEN board_resolution_url IS NOT NULL THEN 'YES' ELSE 'NO' END as has_board_resolution,
  CASE WHEN certificate_url IS NOT NULL THEN 'YES' ELSE 'NO' END as has_certificate,
  CASE WHEN employment_agreement_url IS NOT NULL THEN 'YES' ELSE 'NO' END as has_employment_agreement,
  CASE WHEN confidentiality_ip_url IS NOT NULL THEN 'YES' ELSE 'NO' END as has_confidentiality_ip,
  CASE WHEN stock_subscription_url IS NOT NULL THEN 'YES' ELSE 'NO' END as has_stock_subscription,
  CASE WHEN deferred_compensation_url IS NOT NULL THEN 'YES' ELSE 'NO' END as has_deferred_compensation,
  CASE WHEN pre_incorporation_consent_url IS NOT NULL THEN 'YES' ELSE 'NO' END as has_pre_incorporation_consent
FROM executive_appointments
WHERE LOWER(proposed_officer_email) LIKE '%tstroman%' 
   OR LOWER(proposed_officer_email) LIKE '%cravenusa%'
   OR LOWER(proposed_officer_email) = 'tstroman.ceo@cravenusa.com';

-- 3. Check existing executive_documents
SELECT 
  ed.id,
  ed.type,
  ed.signature_status,
  ed.executive_id,
  ed.appointment_id,
  ed.file_url,
  eu.user_id,
  au.email as exec_email
FROM executive_documents ed
LEFT JOIN exec_users eu ON eu.id = ed.executive_id
LEFT JOIN auth.users au ON au.id = eu.user_id
WHERE LOWER(au.email) LIKE '%tstroman%' OR LOWER(au.email) LIKE '%cravenusa%'
ORDER BY ed.created_at DESC;

-- 4. Try manual backfill for specific appointment
-- Replace APPOINTMENT_ID with actual appointment ID from step 2
DO $$
DECLARE
  v_appointment_id UUID;
  v_exec_user_id UUID;
  v_appointment RECORD;
  v_doc_count INTEGER := 0;
BEGIN
  -- Get appointment ID
  SELECT id INTO v_appointment_id
  FROM executive_appointments
  WHERE LOWER(proposed_officer_email) LIKE '%tstroman%' 
     OR LOWER(proposed_officer_email) LIKE '%cravenusa%'
  ORDER BY created_at DESC
  LIMIT 1;
  
  RAISE NOTICE 'Found appointment ID: %', v_appointment_id;
  
  -- Get exec_user_id
  SELECT eu.id INTO v_exec_user_id
  FROM exec_users eu
  INNER JOIN auth.users au ON au.id = eu.user_id
  WHERE LOWER(au.email) LIKE '%tstroman%' OR LOWER(au.email) LIKE '%cravenusa%'
  LIMIT 1;
  
  RAISE NOTICE 'Found exec_user_id: %', v_exec_user_id;
  
  IF v_appointment_id IS NULL THEN
    RAISE EXCEPTION 'No appointment found';
  END IF;
  
  IF v_exec_user_id IS NULL THEN
    RAISE EXCEPTION 'No exec_user found';
  END IF;
  
  -- Get appointment data
  SELECT * INTO v_appointment
  FROM executive_appointments
  WHERE id = v_appointment_id;
  
  -- Create documents for each URL that exists
  IF v_appointment.appointment_letter_url IS NOT NULL THEN
    INSERT INTO executive_documents (type, officer_name, role, executive_id, file_url, appointment_id, signature_status, status, created_at)
    VALUES ('appointment_letter', v_appointment.proposed_officer_name, v_appointment.proposed_title, v_exec_user_id, v_appointment.appointment_letter_url, v_appointment_id, 'pending', 'generated', now())
    ON CONFLICT DO NOTHING;
    v_doc_count := v_doc_count + 1;
  END IF;
  
  IF v_appointment.board_resolution_url IS NOT NULL THEN
    INSERT INTO executive_documents (type, officer_name, role, executive_id, file_url, appointment_id, signature_status, status, created_at)
    VALUES ('board_resolution', v_appointment.proposed_officer_name, v_appointment.proposed_title, v_exec_user_id, v_appointment.board_resolution_url, v_appointment_id, 'pending', 'generated', now())
    ON CONFLICT DO NOTHING;
    v_doc_count := v_doc_count + 1;
  END IF;
  
  IF v_appointment.certificate_url IS NOT NULL THEN
    INSERT INTO executive_documents (type, officer_name, role, executive_id, file_url, appointment_id, signature_status, status, created_at)
    VALUES ('certificate', v_appointment.proposed_officer_name, v_appointment.proposed_title, v_exec_user_id, v_appointment.certificate_url, v_appointment_id, 'pending', 'generated', now())
    ON CONFLICT DO NOTHING;
    v_doc_count := v_doc_count + 1;
  END IF;
  
  IF v_appointment.employment_agreement_url IS NOT NULL THEN
    INSERT INTO executive_documents (type, officer_name, role, executive_id, file_url, appointment_id, signature_status, status, created_at)
    VALUES ('employment_agreement', v_appointment.proposed_officer_name, v_appointment.proposed_title, v_exec_user_id, v_appointment.employment_agreement_url, v_appointment_id, 'pending', 'generated', now())
    ON CONFLICT DO NOTHING;
    v_doc_count := v_doc_count + 1;
  END IF;
  
  IF v_appointment.confidentiality_ip_url IS NOT NULL THEN
    INSERT INTO executive_documents (type, officer_name, role, executive_id, file_url, appointment_id, signature_status, status, created_at)
    VALUES ('confidentiality_ip', v_appointment.proposed_officer_name, v_appointment.proposed_title, v_exec_user_id, v_appointment.confidentiality_ip_url, v_appointment_id, 'pending', 'generated', now())
    ON CONFLICT DO NOTHING;
    v_doc_count := v_doc_count + 1;
  END IF;
  
  IF v_appointment.stock_subscription_url IS NOT NULL THEN
    INSERT INTO executive_documents (type, officer_name, role, executive_id, file_url, appointment_id, signature_status, status, created_at)
    VALUES ('stock_subscription', v_appointment.proposed_officer_name, v_appointment.proposed_title, v_exec_user_id, v_appointment.stock_subscription_url, v_appointment_id, 'pending', 'generated', now())
    ON CONFLICT DO NOTHING;
    v_doc_count := v_doc_count + 1;
  END IF;
  
  IF v_appointment.deferred_compensation_url IS NOT NULL THEN
    INSERT INTO executive_documents (type, officer_name, role, executive_id, file_url, appointment_id, signature_status, status, created_at)
    VALUES ('deferred_compensation', v_appointment.proposed_officer_name, v_appointment.proposed_title, v_exec_user_id, v_appointment.deferred_compensation_url, v_appointment_id, 'pending', 'generated', now())
    ON CONFLICT DO NOTHING;
    v_doc_count := v_doc_count + 1;
  END IF;
  
  IF v_appointment.pre_incorporation_consent_url IS NOT NULL THEN
    INSERT INTO executive_documents (type, officer_name, role, executive_id, file_url, appointment_id, signature_status, status, created_at)
    VALUES ('pre_incorporation_consent', v_appointment.proposed_officer_name, v_appointment.proposed_title, v_exec_user_id, v_appointment.pre_incorporation_consent_url, v_appointment_id, 'pending', 'generated', now())
    ON CONFLICT DO NOTHING;
    v_doc_count := v_doc_count + 1;
  END IF;
  
  RAISE NOTICE 'Created % documents', v_doc_count;
END $$;

-- 5. Check results
SELECT 
  ed.id,
  ed.type,
  ed.signature_status,
  ed.file_url,
  ed.appointment_id
FROM executive_documents ed
WHERE ed.executive_id IN (
  SELECT eu.id 
  FROM exec_users eu
  INNER JOIN auth.users au ON au.id = eu.user_id
  WHERE LOWER(au.email) LIKE '%tstroman%' OR LOWER(au.email) LIKE '%cravenusa%'
)
ORDER BY ed.created_at DESC;

