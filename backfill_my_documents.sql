-- Quick script to backfill executive_documents for tstroman.ceo@cravenusa.com
-- Run this in Supabase SQL Editor

-- First, let's see what appointments exist
SELECT 
  id,
  proposed_officer_email,
  proposed_officer_name,
  status,
  appointment_letter_url IS NOT NULL as has_appointment_letter,
  board_resolution_url IS NOT NULL as has_board_resolution,
  certificate_url IS NOT NULL as has_certificate,
  employment_agreement_url IS NOT NULL as has_employment_agreement,
  confidentiality_ip_url IS NOT NULL as has_confidentiality_ip,
  stock_subscription_url IS NOT NULL as has_stock_subscription,
  deferred_compensation_url IS NOT NULL as has_deferred_compensation,
  pre_incorporation_consent_url IS NOT NULL as has_pre_incorporation_consent
FROM executive_appointments
WHERE LOWER(proposed_officer_email) LIKE '%tstroman%' OR LOWER(proposed_officer_email) LIKE '%cravenusa%';

-- Now run the backfill function
SELECT * FROM backfill_my_executive_documents('tstroman.ceo@cravenusa.com');

-- Check what was created
SELECT 
  ed.id,
  ed.type,
  ed.signature_status,
  ed.file_url,
  ed.appointment_id,
  ea.proposed_officer_email,
  ea.proposed_officer_name
FROM executive_documents ed
LEFT JOIN executive_appointments ea ON ea.id = ed.appointment_id
WHERE ed.executive_id IN (
  SELECT eu.id 
  FROM exec_users eu
  INNER JOIN auth.users au ON au.id = eu.user_id
  WHERE LOWER(au.email) = 'tstroman.ceo@cravenusa.com'
)
ORDER BY ed.created_at DESC;

