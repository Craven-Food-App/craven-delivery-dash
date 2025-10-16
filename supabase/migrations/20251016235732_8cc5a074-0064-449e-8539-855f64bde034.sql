-- Add full SSN, complete banking info, and payout method fields to craver_applications
-- These fields will store encrypted sensitive data similar to DoorDash's process

-- Add full SSN field (encrypted)
ALTER TABLE public.craver_applications
ADD COLUMN IF NOT EXISTS ssn_encrypted TEXT;

-- Add payout method selection
ALTER TABLE public.craver_applications
ADD COLUMN IF NOT EXISTS payout_method TEXT CHECK (payout_method IN ('direct_deposit', 'cashapp'));

-- Add full account number (encrypted, for direct deposit)
ALTER TABLE public.craver_applications
ADD COLUMN IF NOT EXISTS account_number_encrypted TEXT;

-- Add Cash App cash tag (for cashapp payout)
ALTER TABLE public.craver_applications
ADD COLUMN IF NOT EXISTS cash_tag TEXT;

-- Add comments explaining these fields
COMMENT ON COLUMN public.craver_applications.ssn_encrypted IS 'Full Social Security Number (encrypted) - required for tax reporting';
COMMENT ON COLUMN public.craver_applications.payout_method IS 'Driver payout preference: direct_deposit or cashapp';
COMMENT ON COLUMN public.craver_applications.account_number_encrypted IS 'Full bank account number (encrypted) - for direct deposit payouts';
COMMENT ON COLUMN public.craver_applications.cash_tag IS 'Cash App $cashtag for instant payouts';

-- Create index for payout method for efficient queries
CREATE INDEX IF NOT EXISTS idx_craver_applications_payout_method ON public.craver_applications(payout_method);
