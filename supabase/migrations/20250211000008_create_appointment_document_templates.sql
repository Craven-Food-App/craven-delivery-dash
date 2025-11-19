-- Create default document templates for executive appointments
-- These templates are required for document generation

-- Offer Letter Template (for appointment letters)
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
  'offer_letter',
  'Executive Appointment Letter',
  'Template for executive appointment letters',
  'governance',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Executive Appointment Letter</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      line-height: 1.6;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .company-name {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .date {
      text-align: right;
      margin-bottom: 20px;
    }
    .content {
      margin: 30px 0;
    }
    .signature {
      margin-top: 60px;
    }
    .signature-line {
      border-top: 1px solid #000;
      width: 300px;
      margin-top: 50px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">{{company_name}}</div>
  </div>
  
  <div class="date">
    {{date}}
  </div>
  
  <div class="content">
    <p>{{full_name}}</p>
    <p>{{proposed_officer_email}}</p>
    
    <p>Dear {{full_name}},</p>
    
    <p>We are pleased to offer you the position of <strong>{{title}}</strong> at {{company_name}}, effective {{effective_date}}.</p>
    
    <h3>Position Details</h3>
    <p><strong>Title:</strong> {{title}}</p>
    <p><strong>Effective Date:</strong> {{effective_date}}</p>
    <p><strong>Term Length:</strong> {{term_length_months}} months</p>
    
    <h3>Compensation</h3>
    <p><strong>Annual Base Salary:</strong> ${{annual_salary}}</p>
    <p><strong>Equity:</strong> {{equity_percentage}}% ({{share_count}} shares)</p>
    
    <h3>Authority and Responsibilities</h3>
    <p>{{authority_granted}}</p>
    
    <p>We look forward to your acceptance of this appointment and to working with you in this capacity.</p>
    
    <p>Sincerely,</p>
    
    <div class="signature">
      <div class="signature-line"></div>
      <p>Board of Directors<br>{{company_name}}</p>
    </div>
  </div>
</body>
</html>',
  '["full_name", "title", "company_name", "effective_date", "annual_salary", "equity_percentage", "share_count", "authority_granted", "date", "proposed_officer_email", "term_length_months"]'::jsonb,
  true,
  now(),
  now()
) ON CONFLICT (template_key) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  updated_at = now();

-- Board Resolution Template
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
  'board_resolution',
  'Board Resolution',
  'Template for board resolutions',
  'governance',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Board Resolution</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      line-height: 1.6;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .company-name {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .resolution-number {
      text-align: right;
      margin-bottom: 20px;
      font-weight: bold;
    }
    .content {
      margin: 30px 0;
    }
    .whereas {
      margin: 15px 0;
      text-indent: 20px;
    }
    .resolved {
      margin: 20px 0;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">{{company_name}}</div>
    <div>BOARD RESOLUTION</div>
  </div>
  
  <div class="resolution-number">
    Resolution No. {{resolution_number}}
  </div>
  
  <div class="date">
    Date: {{resolution_date}}
  </div>
  
  <div class="content">
    <p class="whereas">WHEREAS, the Board of Directors of {{company_name}} desires to appoint an executive officer;</p>
    
    <p class="whereas">WHEREAS, {{full_name}} has been proposed for the position of {{title}};</p>
    
    <p class="whereas">WHEREAS, the Board has reviewed and approved the terms of this appointment;</p>
    
    <p class="resolved">NOW, THEREFORE, BE IT RESOLVED:</p>
    
    <p>1. That {{full_name}} is hereby appointed as {{title}} of {{company_name}}, effective {{effective_date}}.</p>
    
    <p>2. That the terms of this appointment include:</p>
    <ul>
      <li>Annual base salary of ${{annual_salary}}</li>
      <li>Equity grant of {{equity_percentage}}% ({{share_count}} shares)</li>
      <li>Term length of {{term_length_months}} months</li>
    </ul>
    
    <p>3. That {{full_name}} is granted the following authority: {{authority_granted}}</p>
    
    <p>4. That this resolution shall take effect immediately upon adoption.</p>
    
    <p>Adopted by the Board of Directors on {{resolution_date}}.</p>
    
    <div style="margin-top: 60px;">
      <div style="border-top: 1px solid #000; width: 300px; margin-top: 50px;"></div>
      <p>Secretary<br>{{company_name}}</p>
    </div>
  </div>
</body>
</html>',
  '["full_name", "title", "company_name", "effective_date", "annual_salary", "equity_percentage", "share_count", "authority_granted", "resolution_number", "resolution_date", "term_length_months"]'::jsonb,
  true,
  now(),
  now()
) ON CONFLICT (template_key) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  updated_at = now();

-- Employment Agreement Template
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
  'employment_agreement',
  'Executive Employment Agreement',
  'Template for executive employment agreements',
  'governance',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Executive Employment Agreement</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      line-height: 1.6;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .company-name {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .content {
      margin: 30px 0;
    }
    h3 {
      margin-top: 30px;
      margin-bottom: 15px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">{{company_name}}</div>
    <div>EXECUTIVE EMPLOYMENT AGREEMENT</div>
  </div>
  
  <div class="content">
    <p>This Executive Employment Agreement ("Agreement") is entered into on {{date}} between {{company_name}} ("Company") and {{full_name}} ("Executive").</p>
    
    <h3>1. Position and Duties</h3>
    <p>Executive shall serve as {{title}} of the Company, effective {{effective_date}}. Executive shall have such duties and responsibilities as are customary for such position and as may be assigned by the Board of Directors.</p>
    
    <h3>2. Authority</h3>
    <p>{{authority_granted}}</p>
    
    <h3>3. Compensation</h3>
    <p>Executive shall receive an annual base salary of ${{annual_salary}}, payable in accordance with the Company''s standard payroll practices.</p>
    <p>Executive shall also receive an equity grant of {{equity_percentage}}% ({{share_count}} shares) in the Company.</p>
    
    <h3>4. Term</h3>
    <p>This Agreement shall have a term of {{term_length_months}} months, commencing on {{effective_date}}.</p>
    
    <h3>5. General Provisions</h3>
    <p>This Agreement constitutes the entire agreement between the parties and supersedes all prior agreements and understandings relating to the subject matter hereof.</p>
    
    <p>IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.</p>
    
    <div style="margin-top: 60px;">
      <div style="display: flex; justify-content: space-between;">
        <div>
          <div style="border-top: 1px solid #000; width: 300px; margin-top: 50px;"></div>
          <p>{{company_name}}</p>
        </div>
        <div>
          <div style="border-top: 1px solid #000; width: 300px; margin-top: 50px;"></div>
          <p>{{full_name}}</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>',
  '["full_name", "title", "company_name", "effective_date", "annual_salary", "equity_percentage", "share_count", "authority_granted", "date", "term_length_months"]'::jsonb,
  true,
  now(),
  now()
) ON CONFLICT (template_key) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  updated_at = now();

