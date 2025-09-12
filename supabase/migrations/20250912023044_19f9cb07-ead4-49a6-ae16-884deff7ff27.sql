-- Create storage bucket for craver application documents
INSERT INTO storage.buckets (id, name, public) VALUES ('craver-documents', 'craver-documents', false);

-- Create storage policies for craver documents
CREATE POLICY "Anyone can upload craver documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'craver-documents');

CREATE POLICY "Admins can view all craver documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'craver-documents');

CREATE POLICY "Users can update their own craver documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'craver-documents');

-- Add missing columns to craver_applications table
ALTER TABLE public.craver_applications 
ADD COLUMN IF NOT EXISTS license_number text,
ADD COLUMN IF NOT EXISTS license_state text,
ADD COLUMN IF NOT EXISTS license_expiry date,
ADD COLUMN IF NOT EXISTS ssn_last_four text,
ADD COLUMN IF NOT EXISTS bank_account_type text,
ADD COLUMN IF NOT EXISTS routing_number text,
ADD COLUMN IF NOT EXISTS account_number_last_four text,
ADD COLUMN IF NOT EXISTS drivers_license_front text,
ADD COLUMN IF NOT EXISTS drivers_license_back text,
ADD COLUMN IF NOT EXISTS insurance_document text,
ADD COLUMN IF NOT EXISTS vehicle_registration text;