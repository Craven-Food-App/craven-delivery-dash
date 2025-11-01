-- ================================================================
-- EMERGENCY DEPLOYMENT: DRIVER SIGNATURES SYSTEM
-- ================================================================
-- This creates the driver_signatures table, unique constraint, RLS policies, and storage bucket
-- Run this ENTIRE file in Supabase SQL Editor
-- ================================================================

-- STEP 1: Create driver_signatures table
-- ================================================================
CREATE TABLE IF NOT EXISTS public.driver_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  agreement_type TEXT NOT NULL DEFAULT 'ICA', -- ICA, Terms, Privacy, etc.
  agreement_version TEXT NOT NULL DEFAULT '2025-10-29',
  signature_image_url TEXT NOT NULL, -- Supabase Storage URL
  ip_address TEXT,
  user_agent TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  signed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(driver_id, agreement_type)
);

-- Indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_driver_signatures_driver ON public.driver_signatures(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_signatures_type ON public.driver_signatures(agreement_type);

-- Enable RLS
ALTER TABLE public.driver_signatures ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.driver_signatures IS 'Stores driver agreement signatures with legal metadata for compliance';

-- STEP 2: Fix unique constraint for upsert operations
-- ================================================================
-- Drop the constraint if it exists (unnamed constraint from table creation)
DO $$ 
BEGIN
  -- Try to drop unnamed constraint if it exists
  ALTER TABLE public.driver_signatures 
  DROP CONSTRAINT IF EXISTS driver_signatures_driver_id_agreement_type_key;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Add named unique constraint (required for upsert onConflict)
ALTER TABLE public.driver_signatures
DROP CONSTRAINT IF EXISTS unique_driver_agreement;

ALTER TABLE public.driver_signatures
ADD CONSTRAINT unique_driver_agreement
UNIQUE (driver_id, agreement_type);

COMMENT ON CONSTRAINT unique_driver_agreement ON public.driver_signatures IS 
'Ensures one signature per driver per agreement type - required for upsert operations';

-- STEP 3: Create RLS policies
-- ================================================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "drivers_own_signatures_select" ON public.driver_signatures;
DROP POLICY IF EXISTS "drivers_own_signatures_insert" ON public.driver_signatures;
DROP POLICY IF EXISTS "drivers_own_signatures_update" ON public.driver_signatures;

-- Drivers can view their own signatures
CREATE POLICY "drivers_own_signatures_select"
ON public.driver_signatures FOR SELECT
TO authenticated
USING (
  driver_id IN (SELECT id FROM public.drivers WHERE auth_user_id = auth.uid())
  OR auth.jwt()->>'email' = 'craven@usa.com'
);

-- Drivers can insert their own signatures
CREATE POLICY "drivers_own_signatures_insert"
ON public.driver_signatures FOR INSERT
TO authenticated
WITH CHECK (
  driver_id IN (SELECT id FROM public.drivers WHERE auth_user_id = auth.uid())
  OR auth.jwt()->>'email' = 'craven@usa.com'
);

-- ADD UPDATE POLICY (critical for upsert to work!)
CREATE POLICY "drivers_own_signatures_update"
ON public.driver_signatures FOR UPDATE
TO authenticated
USING (
  driver_id IN (SELECT id FROM public.drivers WHERE auth_user_id = auth.uid())
  OR auth.jwt()->>'email' = 'craven@usa.com'
)
WITH CHECK (
  driver_id IN (SELECT id FROM public.drivers WHERE auth_user_id = auth.uid())
  OR auth.jwt()->>'email' = 'craven@usa.com'
);

-- Ensure proper grants
GRANT SELECT, INSERT, UPDATE ON public.driver_signatures TO authenticated;

COMMENT ON POLICY "drivers_own_signatures_update" ON public.driver_signatures IS 
'Allows drivers to update their own signatures - critical for upsert operations';

-- STEP 4: Create storage policies for driver signatures
-- ================================================================
-- NOTE: Bucket must be created manually in Supabase Dashboard → Storage
-- Bucket name: driver-signatures
-- Public: false
-- File size limit: 5MB
-- Allowed MIME types: image/png, image/jpeg, image/jpg

-- Drop existing storage policies
DROP POLICY IF EXISTS "drivers_upload_own_signature" ON storage.objects;
DROP POLICY IF EXISTS "drivers_view_own_signature" ON storage.objects;
DROP POLICY IF EXISTS "drivers_update_own_signature" ON storage.objects;

-- Allow authenticated users to INSERT their own signatures
CREATE POLICY "drivers_upload_own_signature"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'driver-signatures'
);

-- Allow authenticated users to SELECT (view) their own signatures
CREATE POLICY "drivers_view_own_signature"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'driver-signatures');

-- Allow authenticated users to UPDATE their own signatures (for upsert)
CREATE POLICY "drivers_update_own_signature"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'driver-signatures')
WITH CHECK (bucket_id = 'driver-signatures');

COMMENT ON POLICY "drivers_upload_own_signature" ON storage.objects IS 
'Allows drivers to upload their signature images to driver-signatures bucket';

-- ================================================================
-- VERIFICATION
-- ================================================================
-- Check if table was created
SELECT 
  'driver_signatures table exists' as check_result
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'driver_signatures';

-- Check if constraint exists
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
AND table_name = 'driver_signatures' 
AND constraint_name = 'unique_driver_agreement';

-- Check storage policies exist
SELECT 
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects' 
AND policyname LIKE '%driver%signature%';

