-- Create storage policies for restaurant-images bucket to allow restaurant owners to upload their images

-- Policy to allow authenticated users to upload restaurant images
CREATE POLICY "Restaurant owners can upload their images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'restaurant-images' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.restaurants 
    WHERE owner_id = auth.uid() 
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
);

-- Policy to allow restaurant owners to update their images  
CREATE POLICY "Restaurant owners can update their images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'restaurant-images' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.restaurants 
    WHERE owner_id = auth.uid() 
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
);

-- Policy to allow restaurant owners to delete their images
CREATE POLICY "Restaurant owners can delete their images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'restaurant-images' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.restaurants 
    WHERE owner_id = auth.uid() 
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
);

-- Policy to allow public read access to restaurant images
CREATE POLICY "Restaurant images are publicly viewable" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'restaurant-images');