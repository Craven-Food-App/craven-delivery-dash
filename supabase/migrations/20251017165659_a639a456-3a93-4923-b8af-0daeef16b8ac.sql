-- Add account settings columns to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS auto_descriptions_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS chat_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS alcohol_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS tablet_password text DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.restaurants.auto_descriptions_enabled IS 'Enable AI-generated menu descriptions';
COMMENT ON COLUMN public.restaurants.chat_enabled IS 'Enable chat feature on tablet';
COMMENT ON COLUMN public.restaurants.alcohol_enabled IS 'Enable alcohol sales (requires state compliance)';
COMMENT ON COLUMN public.restaurants.tablet_password IS 'Hashed password for tablet login';