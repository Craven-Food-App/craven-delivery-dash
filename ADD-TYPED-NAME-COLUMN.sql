-- Add typed_name column to driver_signatures table
ALTER TABLE public.driver_signatures 
ADD COLUMN IF NOT EXISTS typed_name TEXT;

-- Remove NOT NULL constraint from signature_image_url (typed names don't need images)
ALTER TABLE public.driver_signatures 
ALTER COLUMN signature_image_url DROP NOT NULL;

COMMENT ON COLUMN public.driver_signatures.typed_name IS 'Typed name used as electronic signature';

