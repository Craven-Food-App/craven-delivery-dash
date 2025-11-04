-- Create documents storage bucket for executive documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
  DROP POLICY IF EXISTS "Anyone can read public documents" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can update documents" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can delete documents" ON storage.objects;
END $$;

-- Create storage policies for documents bucket
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Anyone can read public documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can update documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can delete documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'documents');