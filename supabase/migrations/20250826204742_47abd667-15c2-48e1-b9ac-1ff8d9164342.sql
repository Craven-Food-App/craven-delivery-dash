-- Simplify the restaurant-images storage policies to fix the upload issue

-- Drop the current policies
DROP POLICY "Restaurant owners can upload their images" ON storage.objects;
DROP POLICY "Restaurant owners can update their images" ON storage.objects;
DROP POLICY "Restaurant owners can delete their images" ON storage.objects;

-- Create simpler, working policies
CREATE POLICY "Restaurant owners can upload their images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'restaurant-images' 
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Restaurant owners can update their images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'restaurant-images' 
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Restaurant owners can delete their images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'restaurant-images' 
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);