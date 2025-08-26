-- Update RLS policies to allow anonymous Craver applications

-- First, update the craver_applications table policy to allow anonymous inserts
DROP POLICY IF EXISTS "Users can create their own application" ON public.craver_applications;

-- Create new policy that allows both authenticated users and anonymous applications
CREATE POLICY "Anyone can create craver applications" 
ON public.craver_applications 
FOR INSERT 
WITH CHECK (true);

-- Update storage policies for craver-documents bucket to allow anonymous uploads
-- First check if the bucket exists, if not create it
INSERT INTO storage.buckets (id, name, public) 
VALUES ('craver-documents', 'craver-documents', false) 
ON CONFLICT (id) DO NOTHING;

-- Allow anonymous uploads to craver-documents bucket
CREATE POLICY "Allow anonymous uploads to craver-documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'craver-documents');

-- Allow anonymous users to view their uploaded documents (using path structure)
CREATE POLICY "Allow anonymous access to craver documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'craver-documents');