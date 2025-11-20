-- Script to reset a document's signature status so it can be re-signed
-- This will allow the signature to be properly embedded

-- First, check the current document status
SELECT 
  id,
  type,
  signature_status,
  signed_file_url,
  file_url,
  signed_at
FROM executive_documents
WHERE type = 'pre_incorporation_consent'
  AND signature_status = 'signed'
ORDER BY created_at DESC
LIMIT 1;

-- Reset the signature status to allow re-signing
-- Replace DOCUMENT_ID with the actual document ID from above query
UPDATE executive_documents
SET 
  signature_status = 'pending',
  signed_file_url = NULL,
  signed_at = NULL,
  signed_by_user = NULL,
  updated_at = now()
WHERE type = 'pre_incorporation_consent'
  AND signature_status = 'signed'
  AND (signed_file_url IS NULL OR signed_file_url = file_url); -- Only reset if signed_file_url wasn't set properly

-- Verify the update
SELECT 
  id,
  type,
  signature_status,
  signed_file_url,
  file_url
FROM executive_documents
WHERE type = 'pre_incorporation_consent'
ORDER BY created_at DESC
LIMIT 1;

