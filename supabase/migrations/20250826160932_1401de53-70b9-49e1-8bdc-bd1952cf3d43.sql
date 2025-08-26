-- Drop all existing storage policies for menu-images and recreate correctly

-- Get all policies on storage.objects and drop menu-related ones
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND (policyname ILIKE '%menu%' OR policyname ILIKE '%restaurant%')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
    END LOOP;
END $$;

-- Now create the correct policies
CREATE POLICY "Restaurant owners upload menu images" 
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

CREATE POLICY "Public can view menu images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'menu-images');

CREATE POLICY "Restaurant owners update menu images" 
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

CREATE POLICY "Restaurant owners delete menu images" 
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