-- Ensure storage bucket for restaurant images exists
INSERT INTO storage.buckets (id, name, public) VALUES ('restaurant-images', 'restaurant-images', true)
ON CONFLICT (id) DO NOTHING;

-- Only create policies that don't already exist
DO $$
BEGIN
    -- Check and create upload policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Restaurant owners can upload their images'
    ) THEN
        CREATE POLICY "Restaurant owners can upload their images" 
        ON storage.objects 
        FOR INSERT 
        WITH CHECK (bucket_id = 'restaurant-images' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;

    -- Check and create update policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Restaurant owners can update their images'
    ) THEN
        CREATE POLICY "Restaurant owners can update their images" 
        ON storage.objects 
        FOR UPDATE 
        USING (bucket_id = 'restaurant-images' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;

    -- Check and create delete policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Restaurant owners can delete their images'
    ) THEN
        CREATE POLICY "Restaurant owners can delete their images" 
        ON storage.objects 
        FOR DELETE 
        USING (bucket_id = 'restaurant-images' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;
END $$;