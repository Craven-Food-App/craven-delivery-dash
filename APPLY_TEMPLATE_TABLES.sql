-- Consolidated SQL script to create template management tables
-- Run this in the Supabase SQL Editor

-- Create email templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  template_key TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create document templates table
CREATE TABLE IF NOT EXISTS public.document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  html_content TEXT NOT NULL,
  placeholders JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create template usage mapping table
CREATE TABLE IF NOT EXISTS public.template_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type TEXT NOT NULL CHECK (template_type IN ('email', 'document')),
  template_id UUID NOT NULL,
  usage_context TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(template_type, usage_context, template_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_key ON public.email_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON public.email_templates(category);
CREATE INDEX IF NOT EXISTS idx_document_templates_key ON public.document_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_document_templates_category ON public.document_templates(category);
CREATE INDEX IF NOT EXISTS idx_template_usage_context ON public.template_usage(usage_context);
CREATE INDEX IF NOT EXISTS idx_template_usage_type_context ON public.template_usage(template_type, usage_context);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_usage ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Executives and admins can view email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Executives and admins can manage email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Executives and admins can view document templates" ON public.document_templates;
DROP POLICY IF EXISTS "Executives and admins can manage document templates" ON public.document_templates;
DROP POLICY IF EXISTS "Executives and admins can view template usage" ON public.template_usage;
DROP POLICY IF EXISTS "Executives and admins can manage template usage" ON public.template_usage;

-- RLS Policies for email_templates
CREATE POLICY "Executives and admins can view email templates"
ON public.email_templates FOR SELECT
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

CREATE POLICY "Executives and admins can manage email templates"
ON public.email_templates FOR ALL
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

-- RLS Policies for document_templates
CREATE POLICY "Executives and admins can view document templates"
ON public.document_templates FOR SELECT
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

CREATE POLICY "Executives and admins can manage document templates"
ON public.document_templates FOR ALL
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

-- RLS Policies for template_usage
CREATE POLICY "Executives and admins can view template usage"
ON public.template_usage FOR SELECT
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

CREATE POLICY "Executives and admins can manage template usage"
ON public.template_usage FOR ALL
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

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_email_templates_updated_at ON public.email_templates;
DROP TRIGGER IF EXISTS update_document_templates_updated_at ON public.document_templates;
DROP TRIGGER IF EXISTS update_template_usage_updated_at ON public.template_usage;

-- Create triggers for updated_at
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_templates_updated_at
  BEFORE UPDATE ON public.document_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_template_usage_updated_at
  BEFORE UPDATE ON public.template_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

