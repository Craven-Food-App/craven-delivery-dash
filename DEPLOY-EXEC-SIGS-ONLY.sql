-- JUST create the executive_signatures table
-- Run this if you already ran DEPLOY-ALL-IN-ONE.sql before

CREATE TABLE IF NOT EXISTS public.executive_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_email TEXT NOT NULL,
  employee_name TEXT,
  position TEXT,
  document_type TEXT NOT NULL CHECK (document_type IN ('offer_letter','equity_agreement','founders_agreement','board_resolution')),
  token TEXT NOT NULL UNIQUE,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '14 days'),
  signed_at TIMESTAMP WITH TIME ZONE,
  signer_ip TEXT,
  signer_user_agent TEXT,
  typed_name TEXT,
  signature_svg TEXT,
  signature_png_base64 TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.executive_signatures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "CEO and admins manage signatures" ON public.executive_signatures;
CREATE POLICY "CEO and admins manage signatures"
ON public.executive_signatures FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'ceo') OR
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE INDEX IF NOT EXISTS idx_exec_sigs_email ON public.executive_signatures(employee_email);
CREATE INDEX IF NOT EXISTS idx_exec_sigs_token ON public.executive_signatures(token);

