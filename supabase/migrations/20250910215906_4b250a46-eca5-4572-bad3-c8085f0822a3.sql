-- Create storage buckets for restaurant images and fix restaurant registration issues

-- Create storage bucket for restaurant images
INSERT INTO storage.buckets (id, name, public) VALUES ('restaurant-images', 'restaurant-images', true);

-- Create RLS policies for restaurant images
CREATE POLICY "Restaurant images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'restaurant-images');

CREATE POLICY "Authenticated users can upload restaurant images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'restaurant-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own restaurant images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'restaurant-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own restaurant images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'restaurant-images' AND auth.uid() IS NOT NULL);

-- Add missing columns to restaurants table for registration
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS owner_id uuid,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS zip_code text,
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS min_delivery_time integer DEFAULT 20,
ADD COLUMN IF NOT EXISTS max_delivery_time integer DEFAULT 40,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Create RLS policies for restaurants table
CREATE POLICY "Restaurant owners can manage their restaurants" 
ON public.restaurants 
FOR ALL 
USING (auth.uid() = owner_id);

-- Create trigger for updated_at
CREATE TRIGGER update_restaurants_updated_at
BEFORE UPDATE ON public.restaurants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();