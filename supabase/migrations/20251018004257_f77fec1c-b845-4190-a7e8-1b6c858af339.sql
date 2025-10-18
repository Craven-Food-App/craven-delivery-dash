-- Create menu-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true);

-- Create RLS policies for menu-images bucket
CREATE POLICY "Public access to menu images"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-images');

CREATE POLICY "Restaurant owners can upload menu images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'menu-images' 
  AND auth.uid() IN (
    SELECT owner_id FROM restaurants
  )
);

CREATE POLICY "Restaurant owners can update their menu images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'menu-images'
  AND auth.uid() IN (
    SELECT owner_id FROM restaurants
  )
);

CREATE POLICY "Restaurant owners can delete their menu images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'menu-images'
  AND auth.uid() IN (
    SELECT owner_id FROM restaurants
  )
);