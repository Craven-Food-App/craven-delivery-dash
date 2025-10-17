-- Create storage bucket for restaurant documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'restaurant-documents',
  'restaurant-documents',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for restaurant-documents bucket
CREATE POLICY "Restaurant owners can upload their documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'restaurant-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Restaurant owners can view their documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'restaurant-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all restaurant documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'restaurant-documents' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add new columns to restaurants table for additional verification data
ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS business_license_url text,
ADD COLUMN IF NOT EXISTS insurance_certificate_url text,
ADD COLUMN IF NOT EXISTS health_permit_url text,
ADD COLUMN IF NOT EXISTS owner_id_url text,
ADD COLUMN IF NOT EXISTS ssn_last4 text,
ADD COLUMN IF NOT EXISTS background_check_authorized boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS restaurant_type text,
ADD COLUMN IF NOT EXISTS expected_monthly_orders integer,
ADD COLUMN IF NOT EXISTS pos_system text,
ADD COLUMN IF NOT EXISTS has_physical_location boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS marketing_opt_in boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS commission_tier text DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS onboarding_status text DEFAULT 'in_progress',
ADD COLUMN IF NOT EXISTS verification_notes jsonb DEFAULT '{}'::jsonb;