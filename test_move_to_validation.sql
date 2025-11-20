-- Test script to move Torrance Stroman's appointment to READY_FOR_SECRETARY_REVIEW
-- This simulates what happens when all documents are signed

-- First, let's see the current appointment
SELECT 
  id,
  proposed_officer_name,
  proposed_officer_email,
  status,
  formation_mode
FROM executive_appointments 
WHERE proposed_officer_email = 'tstroman.ceo@cravenusa.com'
ORDER BY created_at DESC
LIMIT 1;

-- Update the status to READY_FOR_SECRETARY_REVIEW
-- Replace 'YOUR_APPOINTMENT_ID' with the actual ID from the query above
UPDATE executive_appointments 
SET 
  status = 'READY_FOR_SECRETARY_REVIEW',
  updated_at = now()
WHERE proposed_officer_email = 'tstroman.ceo@cravenusa.com'
  AND status = 'APPROVED';

-- Verify the update
SELECT 
  id,
  proposed_officer_name,
  status,
  updated_at
FROM executive_appointments 
WHERE proposed_officer_email = 'tstroman.ceo@cravenusa.com';

-- Optionally, create a timeline event to simulate document signing
-- (Replace 'YOUR_APPOINTMENT_ID' with the actual ID)
INSERT INTO officer_activation_timeline (
  appointment_id,
  event_type,
  event_description,
  performed_by,
  metadata
) 
SELECT 
  id,
  'DOCUMENTS_SIGNED',
  'All required documents have been signed (test)',
  NULL,
  jsonb_build_object('test', true, 'simulated', true)
FROM executive_appointments 
WHERE proposed_officer_email = 'tstroman.ceo@cravenusa.com'
  AND status = 'READY_FOR_SECRETARY_REVIEW'
LIMIT 1;

