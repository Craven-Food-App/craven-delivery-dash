-- Storage policies for delivery-photos bucket
-- Allow authenticated users to upload, update, and view their own files under a folder named with their user id

-- Insert
DROP POLICY IF EXISTS "Users can upload their own delivery photos" ON storage.objects;
CREATE POLICY "Users can upload their own delivery photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'delivery-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Update
DROP POLICY IF EXISTS "Users can update their own delivery photos" ON storage.objects;
CREATE POLICY "Users can update their own delivery photos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'delivery-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'delivery-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Select
DROP POLICY IF EXISTS "Users can view their own delivery photos" ON storage.objects;
CREATE POLICY "Users can view their own delivery photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'delivery-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
