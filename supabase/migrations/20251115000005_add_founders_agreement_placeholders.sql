-- Add placeholders metadata to founders_agreement template
-- Update placeholders JSONB column to document available placeholders

UPDATE public.document_templates
SET placeholders = '[
  "company_name",
  "effective_date",
  "founder_trust_name",
  "founder_individual_name",
  "founder_trust_equity_percent",
  "founder_individual_equity_percent",
  "founder_trust_state",
  "founder_individual_state",
  "company_state",
  "trust_state",
  "governing_law_state",
  "arbitration_state",
  "founder_trust_title",
  "founders_table_html",
  "founders_signature_html",
  "founders_addressed_name",
  "founders_addressed_role",
  "founders_addressed_equity",
  "founders_addressed_shares",
  "founders_addressed_vesting",
  "founders_ceo_name",
  "founders_ceo_role",
  "founders_ceo_equity",
  "founders_ceo_shares",
  "founders_ceo_vesting"
]'::jsonb
WHERE template_key = 'founders_agreement';

-- Add optional company settings for Founders Agreement
INSERT INTO public.company_settings (setting_key, setting_value)
VALUES
  ('trust_state', 'Ohio'),
  ('founder_state', 'Ohio'),
  ('governing_law_state', 'Ohio'),
  ('arbitration_state', 'Ohio')
ON CONFLICT (setting_key) DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  updated_at = now();

