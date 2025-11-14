-- Add signature tokens to existing executive documents that don't have them
-- This ensures all documents with executive_id have tokens for signing portal access

-- Function to generate a random token (similar to what document-generate does)
CREATE OR REPLACE FUNCTION generate_signature_token()
RETURNS TEXT AS $$
DECLARE
  token_part1 TEXT;
  token_part2 TEXT;
BEGIN
  -- Generate two UUIDs and combine them (removing dashes)
  -- This matches the format used in document-generate/index.ts
  token_part1 := replace(gen_random_uuid()::TEXT, '-', '');
  token_part2 := replace(gen_random_uuid()::TEXT, '-', '');
  -- Return 32 chars from first UUID + 16 chars from second = 48 chars total
  RETURN token_part1 || substring(token_part2, 1, 16);
END;
$$ LANGUAGE plpgsql;

-- Update documents that have executive_id but no signature_token
UPDATE public.executive_documents
SET 
  signature_token = generate_signature_token(),
  signature_token_expires_at = (CURRENT_TIMESTAMP + INTERVAL '30 days')
WHERE 
  executive_id IS NOT NULL
  AND signature_token IS NULL
  AND signature_status IS NULL OR signature_status = 'pending';

-- Clean up the function (optional, but keeps things tidy)
DROP FUNCTION IF EXISTS generate_signature_token();

-- Add comment explaining the update
COMMENT ON COLUMN public.executive_documents.signature_token IS 
  'Unique token for secure document portal access. Generated automatically for all documents with executive_id.';

