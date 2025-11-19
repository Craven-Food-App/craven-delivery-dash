-- Add Stock Certificate template to document_templates table
-- This template is used for generating stock certificates for executive appointments

INSERT INTO public.document_templates (
  template_key,
  name,
  description,
  category,
  html_content,
  placeholders,
  is_active,
  created_at,
  updated_at
) VALUES (
  'stock_certificate',
  'Stock Certificate',
  'Template for stock certificates issued to executives',
  'governance',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Stock Certificate - {{executive_name}}</title>
  <style>
    body { font-family: "Times New Roman", serif; font-size: 14px; }
    .certificate {
      width: 900px;
      margin: 40px auto;
      padding: 40px;
      border: 4px double #000;
    }
    .title { text-align: center; font-size: 22px; font-weight: bold; text-transform: uppercase; }
    .subtitle { text-align: center; font-size: 14px; margin-bottom: 20px; }
    .center { text-align: center; }
    .big { font-size: 20px; font-weight: bold; }
    .signature-row { margin-top: 60px; display: flex; justify-content: space-between; }
    .sig-block { width: 40%; text-align: center; }
    .sig-line { border-top: 1px solid #000; margin-top: 40px; }
  </style>
</head>
<body>
<div class="certificate">
  <div class="title">{{company_name}}</div>
  <div class="subtitle">Incorporated in {{company_state}}</div>

  <p class="center big">STOCK CERTIFICATE</p>

  <p class="center">
    Certificate No.: {{certificate_number}}<br />
    Number of Shares: {{number_of_shares}}
  </p>

  <p>
    THIS CERTIFIES that <strong>{{executive_name}}</strong> is the record holder of
    <strong>{{number_of_shares}}</strong> fully paid and non-assessable shares of
    <strong>{{share_class}}</strong> stock of <strong>{{company_name}}</strong> (the "Company"),
    transferable only on the books of the Company by the holder hereof in person or by duly authorized
    attorney upon surrender of this Certificate properly endorsed.
  </p>

  <p>
    This Certificate and the shares represented hereby are subject to all of the provisions of the
    Company''s Articles/Certificate of Incorporation, Bylaws, and any applicable Shareholders''
    Agreement (each as amended from time to time), and may be subject to restrictions on transfer
    under such documents and under applicable securities laws.
  </p>

  <p class="center">IN WITNESS WHEREOF, the Company has caused this Certificate to be executed by its duly authorized officers as of {{issue_date}}.</p>

  <div class="signature-row">
    <div class="sig-block">
      <div class="sig-line"></div>
      <p>{{company_signatory_name}}<br />{{company_signatory_title}}</p>
    </div>
    <div class="sig-block">
      <div class="sig-line"></div>
      <p>{{secretary_name}}<br />Secretary</p>
    </div>
  </div>

</div>
</body>
</html>',
  '["executive_name", "full_name", "name", "proposed_officer_name", "title", "proposed_title", "company_name", "company_state", "certificate_number", "number_of_shares", "share_count", "share_class", "issue_date", "effective_date", "date", "company_signatory_name", "company_signatory_title", "secretary_name", "equity_percentage", "vesting_schedule", "exercise_price", "proposed_officer_email", "proposed_officer_phone", "reporting_to", "department", "annual_salary", "base_salary", "annual_bonus_percentage", "performance_bonus", "benefits", "appointment_type", "board_meeting_date", "authority_granted", "term_length_months", "notes"]'::jsonb,
  true,
  now(),
  now()
) ON CONFLICT (template_key) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  placeholders = EXCLUDED.placeholders,
  updated_at = now();

