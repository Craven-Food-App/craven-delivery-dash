-- Drop the incorrect policies for menu images
DROP POLICY IF EXISTS "Restaurant owners can upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant owners can manage menu images" ON storage.objects;  
DROP POLICY IF EXISTS "Restaurant owners can delete menu images" ON storage.objects;

-- Create correct policies for menu image uploads
CREATE POLICY "Restaurant owners can upload menu images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'menu-images' AND 
  EXISTS (
    SELECT 1 FROM restaurants 
    WHERE restaurants.owner_id = auth.uid() 
    AND restaurants.id::text = split_part(objects.name, '/', 1)
  )
);

CREATE POLICY "Restaurant owners can manage menu images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'menu-images' AND 
  EXISTS (
    SELECT 1 FROM restaurants 
    WHERE restaurants.owner_id = auth.uid() 
    AND restaurants.id::text = split_part(objects.name, '/', 1)
  )
);

CREATE POLICY "Restaurant owners can delete menu images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'menu-images' AND 
  EXISTS (
    SELECT 1 FROM restaurants 
    WHERE restaurants.owner_id = auth.uid() 
    AND restaurants.id::text = split_part(objects.name, '/', 1)
  )
);