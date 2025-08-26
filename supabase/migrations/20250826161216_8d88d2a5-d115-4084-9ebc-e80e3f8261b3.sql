-- Check current storage policies and fix the RLS issue for menu images
-- The issue is likely that the policy is checking the first folder name but we're using restaurant_id

-- First, let's check if the menu-images bucket exists and is public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'menu-images';

-- Drop existing policies to start fresh
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname ILIKE '%menu%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
    END LOOP;
END $$;

-- Create a simple policy that allows restaurant owners to upload images using their restaurant_id as folder
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

-- Allow anyone to view menu images (public bucket)
CREATE POLICY "Anyone can view menu images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'menu-images');

-- Allow restaurant owners to update/delete their own menu images
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