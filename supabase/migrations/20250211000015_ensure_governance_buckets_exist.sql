-- Ensure all governance storage buckets exist
-- This migration ensures buckets are created even if previous migrations failed

-- Create governance-certificates bucket (public for easier document viewing)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('governance-certificates', 'governance-certificates', true, 5242880, ARRAY['application/pdf', 'text/html', 'image/png', 'image/jpeg'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  allowed_mime_types = ARRAY['application/pdf', 'text/html', 'image/png', 'image/jpeg'];

-- Create governance-resolutions bucket (public for easier document viewing)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('governance-resolutions', 'governance-resolutions', true, 10485760, ARRAY['application/pdf', 'text/html'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  allowed_mime_types = ARRAY['application/pdf', 'text/html'];

-- Create contracts-executives bucket (public for easier document viewing)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('contracts-executives', 'contracts-executives', true, 10485760, ARRAY['application/pdf', 'text/html'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  allowed_mime_types = ARRAY['application/pdf', 'text/html'];

-- Create governance-minutes bucket (if needed)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('governance-minutes', 'governance-minutes', false, 10485760, ARRAY['application/pdf'])
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

