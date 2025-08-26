-- Fix the restaurant-images storage policies - they were incorrectly referencing restaurants.name instead of objects.name

-- Drop the incorrect policies
DROP POLICY "Restaurant owners can upload their images" ON storage.objects;
DROP POLICY "Restaurant owners can update their images" ON storage.objects;
DROP POLICY "Restaurant owners can delete their images" ON storage.objects;

-- Create corrected policies
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