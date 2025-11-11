CREATE TABLE IF NOT EXISTS public.document_template_signature_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.document_templates(id) ON DELETE CASCADE,
  field_type TEXT NOT NULL CHECK (field_type IN ('signature', 'initials', 'date', 'text')),
  signer_role TEXT NOT NULL,
  page_number INTEGER NOT NULL CHECK (page_number >= 1),
  x_percent NUMERIC NOT NULL CHECK (x_percent >= 0 AND x_percent <= 100),
  y_percent NUMERIC NOT NULL CHECK (y_percent >= 0 AND y_percent <= 100),
  width_percent NUMERIC NOT NULL CHECK (width_percent > 0 AND width_percent <= 100),
  height_percent NUMERIC NOT NULL CHECK (height_percent > 0 AND height_percent <= 100),
  label TEXT,
  required BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS document_template_signature_fields_template_idx
  ON public.document_template_signature_fields (template_id);

ALTER TABLE public.document_template_signature_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "board_members_manage_template_signature_fields"
ON public.document_template_signature_fields
FOR ALL
USING (
  auth.uid() IN (
    SELECT user_id FROM public.exec_users WHERE role IN ('board_member', 'ceo', 'cfo')
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.exec_users WHERE role IN ('board_member', 'ceo', 'cfo')
  )
);


