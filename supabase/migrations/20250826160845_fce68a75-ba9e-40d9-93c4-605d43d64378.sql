-- Drop existing policies and recreate them correctly for menu image uploads

-- Drop existing policies
DROP POLICY IF EXISTS "Restaurant owners can upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view menu images" ON storage.objects;  
DROP POLICY IF EXISTS "Restaurant owners can manage their menu images" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant owners can delete their menu images" ON storage.objects;

-- Create correct policy for restaurant owners to upload menu images
CREATE POLICY "Restaurant owners can upload menu images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'menu-images' AND 
  auth.uid()::text = (storage.foldername(name))[1] AND
  EXISTS (
    SELECT 1 FROM public.restaurants 
    WHERE owner_id = auth.uid() AND id::text = (storage.foldername(name))[1]
  )
);

-- Create policy for anyone to view menu images (since bucket is public)
CREATE POLICY "Anyone can view menu images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'menu-images');

-- Create policy for restaurant owners to update their menu images
CREATE POLICY "Restaurant owners can update their menu images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'menu-images' AND 
  auth.uid()::text = (storage.foldername(name))[1] AND
  EXISTS (
    SELECT 1 FROM public.restaurants 
    WHERE owner_id = auth.uid() AND id::text = (storage.foldername(name))[1]
  )
);

-- Create policy for restaurant owners to delete their menu images
CREATE POLICY "Restaurant owners can delete their menu images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'menu-images' AND 
  auth.uid()::text = (storage.foldername(name))[1] AND
  EXISTS (
    SELECT 1 FROM public.restaurants 
    WHERE owner_id = auth.uid() AND id::text = (storage.foldername(name))[1]
  )
);