-- ================================================================
-- ENSURE UNIQUE CONSTRAINT EXISTS ON DRIVER_SIGNATURES
-- ================================================================
-- This ensures the upsert onConflict works properly

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

