-- Create storage buckets for governance documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('governance-certificates', 'governance-certificates', false, 5242880, ARRAY['application/pdf', 'image/png', 'image/jpeg']),
  ('governance-minutes', 'governance-minutes', false, 10485760, ARRAY['application/pdf']),
  ('governance-resolutions', 'governance-resolutions', false, 10485760, ARRAY['application/pdf']),
  ('contracts-executives', 'contracts-executives', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for governance-certificates
DROP POLICY IF EXISTS "Governance admins can manage certificates" ON storage.objects;
CREATE POLICY "Governance admins can manage certificates"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'governance-certificates' AND (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('CRAVEN_FOUNDER', 'CRAVEN_CORPORATE_SECRETARY'))
    OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'ceo')
  )
);

DROP POLICY IF EXISTS "Executives can view their certificates" ON storage.objects;
CREATE POLICY "Executives can view their certificates"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'governance-certificates'
);

-- RLS Policies for governance-resolutions
DROP POLICY IF EXISTS "Board members can view resolutions" ON storage.objects;
CREATE POLICY "Board members can view resolutions"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'governance-resolutions' AND (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('CRAVEN_FOUNDER', 'CRAVEN_BOARD_MEMBER', 'CRAVEN_CORPORATE_SECRETARY'))
    OR EXISTS (SELECT 1 FROM public.board_members WHERE user_id = auth.uid() AND is_active = true)
  )
);

DROP POLICY IF EXISTS "Governance admins can manage resolutions" ON storage.objects;
CREATE POLICY "Governance admins can manage resolutions"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'governance-resolutions' AND (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('CRAVEN_FOUNDER', 'CRAVEN_CORPORATE_SECRETARY'))
    OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'ceo')
  )
);

-- RLS Policies for contracts-executives
DROP POLICY IF EXISTS "Executives can view their contracts" ON storage.objects;
CREATE POLICY "Executives can view their contracts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'contracts-executives'
);

DROP POLICY IF EXISTS "Governance admins can manage contracts" ON storage.objects;
CREATE POLICY "Governance admins can manage contracts"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'contracts-executives' AND (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('CRAVEN_FOUNDER', 'CRAVEN_CORPORATE_SECRETARY'))
    OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'ceo')
  )
);

-- RLS Policies for governance-minutes
DROP POLICY IF EXISTS "Board members can view minutes" ON storage.objects;
CREATE POLICY "Board members can view minutes"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'governance-minutes' AND (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('CRAVEN_FOUNDER', 'CRAVEN_BOARD_MEMBER', 'CRAVEN_CORPORATE_SECRETARY'))
    OR EXISTS (SELECT 1 FROM public.board_members WHERE user_id = auth.uid() AND is_active = true)
  )
);

DROP POLICY IF EXISTS "Governance admins can manage minutes" ON storage.objects;
CREATE POLICY "Governance admins can manage minutes"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'governance-minutes' AND (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('CRAVEN_FOUNDER', 'CRAVEN_CORPORATE_SECRETARY'))
    OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'ceo')
  )
);

-- Add document URL columns to executive_appointments
ALTER TABLE public.executive_appointments
ADD COLUMN IF NOT EXISTS appointment_letter_url TEXT,
ADD COLUMN IF NOT EXISTS board_resolution_url TEXT,
ADD COLUMN IF NOT EXISTS employment_agreement_url TEXT,
ADD COLUMN IF NOT EXISTS certificate_url TEXT;

