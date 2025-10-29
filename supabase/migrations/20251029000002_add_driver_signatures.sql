-- ================================================================
-- DRIVER SIGNATURES - In-App Signature Storage
-- ================================================================
-- Tracks signed agreements with signature images and legal metadata

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

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_driver_signatures_driver ON public.driver_signatures(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_signatures_type ON public.driver_signatures(agreement_type);

-- Enable RLS
ALTER TABLE public.driver_signatures ENABLE ROW LEVEL SECURITY;

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
WITH CHECK (driver_id IN (SELECT id FROM public.drivers WHERE auth_user_id = auth.uid()));

-- Create storage bucket for signatures (run via Supabase Dashboard → Storage)
-- Bucket name: driver-signatures
-- Public: false
-- File size limit: 5MB
-- Allowed MIME types: image/png

COMMENT ON TABLE public.driver_signatures IS 'Stores driver agreement signatures with legal metadata for compliance';

