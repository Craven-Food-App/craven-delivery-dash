-- Create company settings table for incorporation status and company details
CREATE TABLE IF NOT EXISTS public.company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_company_settings_key ON public.company_settings(setting_key);

-- Enable RLS
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_settings
-- Only executives/admins can view company settings
CREATE POLICY "Executives and admins can view company settings"
ON public.company_settings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.exec_users
    WHERE user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.employees
    WHERE user_id = auth.uid()
    AND position IN ('CEO', 'CFO', 'COO', 'CTO', 'CXO', 'Admin')
  )
);

-- Only executives/admins can update company settings
CREATE POLICY "Executives and admins can update company settings"
ON public.company_settings FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.exec_users
    WHERE user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.employees
    WHERE user_id = auth.uid()
    AND position IN ('CEO', 'CFO', 'COO', 'CTO', 'CXO', 'Admin')
  )
);

-- Insert default company settings
INSERT INTO public.company_settings (setting_key, setting_value)
VALUES 
  ('incorporation_status', 'pre_incorporation'),
  ('state_of_incorporation', 'Ohio'),
  ('registered_office', '123 Main St, Cleveland, OH 44101'),
  ('state_filing_office', 'Ohio Secretary of State'),
  ('registered_agent_name', 'TBD'),
  ('registered_agent_address', 'TBD'),
  ('fiscal_year_end', 'December 31'),
  ('incorporator_name', 'Torrance Stroman'),
  ('incorporator_address', '123 Main St, Cleveland, OH 44101'),
  ('incorporator_email', 'craven@usa.com'),
  ('county', 'Cuyahoga'),
  ('company_name', 'Crave''n, Inc.')
ON CONFLICT (setting_key) DO NOTHING;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_company_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_settings_updated_at
  BEFORE UPDATE ON public.company_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_company_settings_updated_at();

COMMENT ON TABLE public.company_settings IS 'Stores company-wide settings including incorporation status and legal details';
COMMENT ON COLUMN public.company_settings.setting_key IS 'Unique key for the setting (e.g., incorporation_status, registered_agent_name)';
COMMENT ON COLUMN public.company_settings.setting_value IS 'Value of the setting';

