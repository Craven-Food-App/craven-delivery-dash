CREATE TABLE IF NOT EXISTS public.iboe_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'iboe',
  html_content TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_iboe_templates_key ON public.iboe_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_iboe_templates_default ON public.iboe_templates(is_default);

ALTER TABLE public.iboe_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Executives and admins can view IBOE templates" ON public.iboe_templates;
DROP POLICY IF EXISTS "Executives and admins can manage IBOE templates" ON public.iboe_templates;

CREATE POLICY "Executives and admins can view IBOE templates"
ON public.iboe_templates FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.exec_users eu
    WHERE eu.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

CREATE POLICY "Executives and admins can manage IBOE templates"
ON public.iboe_templates FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.exec_users eu
    WHERE eu.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

CREATE TRIGGER update_iboe_templates_updated_at
  BEFORE UPDATE ON public.iboe_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

