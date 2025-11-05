-- Add photo_url column to exec_users table
ALTER TABLE public.exec_users 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Create storage bucket for executive photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('executive-photos', 'executive-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for executive photos
CREATE POLICY "Executive photos are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'executive-photos');

CREATE POLICY "Authenticated users can upload executive photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'executive-photos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update executive photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'executive-photos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete executive photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'executive-photos' 
  AND auth.role() = 'authenticated'
);