-- Create storage bucket for promotional banners
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'promotional-banners',
  'promotional-banners',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for promotional banners storage
-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Marketing team can upload promotional banners" ON storage.objects;
DROP POLICY IF EXISTS "Promotional banners are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Marketing team can update promotional banners" ON storage.objects;
DROP POLICY IF EXISTS "Marketing team can delete promotional banners" ON storage.objects;

-- Marketing team can upload promotional banners
CREATE POLICY "Marketing team can upload promotional banners"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'promotional-banners' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('marketing', 'admin', 'super_admin')
  )
);

-- Promotional banners are publicly readable
CREATE POLICY "Promotional banners are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'promotional-banners');

-- Marketing team can update promotional banners
CREATE POLICY "Marketing team can update promotional banners"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'promotional-banners' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('marketing', 'admin', 'super_admin')
  )
);

-- Marketing team can delete promotional banners
CREATE POLICY "Marketing team can delete promotional banners"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'promotional-banners' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('marketing', 'admin', 'super_admin')
  )
);

