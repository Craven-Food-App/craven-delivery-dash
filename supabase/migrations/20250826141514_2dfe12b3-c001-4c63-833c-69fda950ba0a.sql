-- Create storage bucket for menu item images
INSERT INTO storage.buckets (id, name, public) VALUES ('menu-images', 'menu-images', true);

-- Create policies for menu image uploads
CREATE POLICY "Menu images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'menu-images');

CREATE POLICY "Restaurant owners can upload menu images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'menu-images' AND 
  EXISTS (
    SELECT 1 FROM restaurants 
    WHERE restaurants.owner_id = auth.uid() 
    AND restaurants.id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Restaurant owners can update their menu images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'menu-images' AND 
  EXISTS (
    SELECT 1 FROM restaurants 
    WHERE restaurants.owner_id = auth.uid() 
    AND restaurants.id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Restaurant owners can delete their menu images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'menu-images' AND 
  EXISTS (
    SELECT 1 FROM restaurants 
    WHERE restaurants.owner_id = auth.uid() 
    AND restaurants.id::text = (storage.foldername(name))[1]
  )
);