-- Table to store encrypted SSNs for executives
-- Only accessible via Edge Functions with service role key

CREATE TABLE IF NOT EXISTS public.executive_identity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  executive_id UUID NOT NULL REFERENCES public.exec_users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'US',
  ssn_ciphertext TEXT NOT NULL,  -- base64 encrypted SSN
  ssn_iv TEXT NOT NULL,          -- base64 initialization vector
  ssn_last4 TEXT NOT NULL CHECK (char_length(ssn_last4) = 4),
  w9_storage_path TEXT,          -- optional: Supabase Storage path for W-9
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (executive_id)
);

-- Lock it down (no direct access from anon)
ALTER TABLE public.executive_identity ENABLE ROW LEVEL SECURITY;

-- No public policies - only service role can access via Edge Functions
-- This ensures SSN data is never accessible via client-side RLS

-- Admin view (without sensitive SSN ciphertext/iv)
-- Only shows metadata and last 4 digits
CREATE OR REPLACE VIEW public.executive_identity_admin AS
  SELECT 
    id, 
    executive_id, 
    full_name, 
    date_of_birth, 
    city, 
    state, 
    postal_code, 
    country, 
    w9_storage_path, 
    created_at,
    updated_at,
    ssn_last4
  FROM public.executive_identity;

-- Grant select on admin view (optional, for internal admin access)
-- Only authenticated users can see metadata, not encrypted SSN
GRANT SELECT ON public.executive_identity_admin TO authenticated;

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_executive_identity_exec_id ON public.executive_identity(executive_id);

-- Comment explaining the security model
COMMENT ON TABLE public.executive_identity IS 'Stores encrypted executive SSNs. Only accessible via Edge Functions with service role. SSN is encrypted with AES-256-GCM.';
COMMENT ON COLUMN public.executive_identity.ssn_ciphertext IS 'Base64-encoded AES-GCM ciphertext. Requires ssn_iv to decrypt.';
COMMENT ON COLUMN public.executive_identity.ssn_iv IS 'Base64-encoded initialization vector for AES-GCM decryption.';
COMMENT ON COLUMN public.executive_identity.ssn_last4 IS 'Last 4 digits of SSN in plaintext for reference only.';

