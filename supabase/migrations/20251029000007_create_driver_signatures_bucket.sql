-- ================================================================
-- CREATE DRIVER SIGNATURES STORAGE BUCKET AND POLICIES
-- ================================================================

-- Create the bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-signatures', 'driver-signatures', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to INSERT their own signatures
DROP POLICY IF EXISTS "drivers_upload_own_signature" ON storage.objects;
CREATE POLICY "drivers_upload_own_signature"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'driver-signatures'
);

-- Allow authenticated users to SELECT (view) their own signatures
DROP POLICY IF EXISTS "drivers_view_own_signature" ON storage.objects;
CREATE POLICY "drivers_view_own_signature"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'driver-signatures');

-- Allow authenticated users to UPDATE their own signatures (for upsert)
DROP POLICY IF EXISTS "drivers_update_own_signature" ON storage.objects;
CREATE POLICY "drivers_update_own_signature"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'driver-signatures')
WITH CHECK (bucket_id = 'driver-signatures');

COMMENT ON POLICY "drivers_upload_own_signature" ON storage.objects IS 
'Allows drivers to upload their signature images to driver-signatures bucket';

