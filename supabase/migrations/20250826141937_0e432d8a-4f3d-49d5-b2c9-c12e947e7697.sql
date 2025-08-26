-- Create storage bucket for restaurant images
INSERT INTO storage.buckets (id, name, public) VALUES ('restaurant-images', 'restaurant-images', true);

-- Create policies for restaurant image uploads
CREATE POLICY "Restaurant images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'restaurant-images');

CREATE POLICY "Restaurant owners can upload their images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'restaurant-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Restaurant owners can update their images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'restaurant-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Restaurant owners can delete their images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'restaurant-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);