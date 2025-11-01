-- Add signed ICA URL column to driver_signatures table
ALTER TABLE public.driver_signatures 
ADD COLUMN IF NOT EXISTS signed_ica_url TEXT;

COMMENT ON COLUMN public.driver_signatures.signed_ica_url IS 'URL to the signed ICA document with embedded signature';

