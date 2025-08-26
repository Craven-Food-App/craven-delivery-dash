-- Fix the RLS policy - the issue is using restaurants.name instead of objects.name

-- Drop the incorrect policies
DROP POLICY IF EXISTS "Restaurant owners can upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant owners can manage menu images" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant owners can delete menu images" ON storage.objects;

-- Create correct policies using objects.name for the file path
CREATE POLICY "Restaurant owners can upload menu images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'menu-images' AND 
  EXISTS (
    SELECT 1 FROM public.restaurants 
    WHERE owner_id = auth.uid() 
    AND id::text = split_part(name, '/', 1)
  )
);

CREATE POLICY "Restaurant owners can manage menu images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'menu-images' AND 
  EXISTS (
    SELECT 1 FROM public.restaurants 
    WHERE owner_id = auth.uid() 
    AND id::text = split_part(name, '/', 1)
  )
);

CREATE POLICY "Restaurant owners can delete menu images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'menu-images' AND 
  EXISTS (
    SELECT 1 FROM public.restaurants 
    WHERE owner_id = auth.uid() 
    AND id::text = split_part(name, '/', 1)
  )
);