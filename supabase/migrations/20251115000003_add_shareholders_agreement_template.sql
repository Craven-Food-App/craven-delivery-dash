-- Add Shareholders' Agreement template to document_templates table
-- This template requires shareholder and officer signatures, so signature fields are also added

-- First, ensure the table has the required columns
ALTER TABLE public.document_templates
ADD COLUMN IF NOT EXISTS template_key TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS html_content TEXT,
ADD COLUMN IF NOT EXISTS placeholders JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS description TEXT;

-- If html_content is null but template_html exists, copy the data
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'document_templates' 
    AND column_name = 'template_html'
  ) THEN
    UPDATE public.document_templates
    SET html_content = template_html
    WHERE html_content IS NULL AND template_html IS NOT NULL;
  END IF;
END $$;

-- Insert or update the template
INSERT INTO public.document_templates (
  template_key,
  name,
  description,
  category,
  html_content,
  is_active
) VALUES (
  'shareholders_agreement',
  'Shareholders'' Agreement',
  'Agreement among all shareholders establishing rights, obligations, vesting schedules, transfer restrictions, and governance framework.',
  'legal',
  '<!DOCTYPE html>

<html lang="en">

<head>

  <meta charset="utf-8" />

  <title>Shareholders'' Agreement</title>

  <meta name="viewport" content="width=device-width, initial-scale=1" />

  <style>

    @page { size: A4; margin: 24mm 18mm 24mm 18mm; }

    body { font-family: "Inter","Helvetica Neue",Arial,sans-serif; font-size:14px; line-height:1.5; color:#111; max-width:800px; margin:0 auto; padding:20px; }

    h1,h2,h3 { font-weight:700; margin-bottom:6px; }

    h1 { text-align:center; font-size:20px; text-transform:uppercase; }

    h2 { font-size:16px; margin-top:18px; }

    h3 { font-size:14px; margin-top:12px; }

    p { margin:6px 0 10px; }

    ul { margin:6px 0 10px 20px; }

    ol { margin:6px 0 10px 20px; }

    table { border-collapse:collapse; width:100%; margin:10px 0 18px; }

    th,td { border:1px solid #d9d9d9; padding:8px 10px; }

    th { background:#f8f8f8; font-weight:600; text-align:left; }

    .signature { margin-top:28px; margin-bottom:20px; }

    .sig-line { border-bottom:1px solid #333; height:24px; width:100%; display:block; margin-bottom:4px; }

    .sig-label { font-size:12px; color:#666; }

    .page-break { page-break-before:always; }

  </style>

</head>

<body>



<h1>SHAREHOLDERS'' AGREEMENT</h1>

<p style="text-align:center;"><strong>{{company_name}}</strong><br>Effective Date: {{effective_date}}</p>

<hr>



<p>This Shareholders'' Agreement (the "Agreement") is entered into on {{effective_date}} by and among the undersigned shareholders of <strong>{{company_name}}</strong>, a {{state_of_incorporation}} corporation (the "Company").</p>



<h2>1. Purpose</h2>

<p>This Agreement sets forth the rights, obligations, ownership interests, governance framework, and operational rules of the Company.</p>



<h2>2. Parties</h2>

<p>The current shareholders of the Company and their respective ownership interests are as follows:</p>



<table id="shareholdersTable">

  <thead>

    <tr>

      <th>Name</th>

      <th>Title/Role</th>

      <th>Equity %</th>

      <th>Number of Shares</th>

      <th>Vesting Schedule</th>

    </tr>

  </thead>

  <tbody id="shareholdersList">

    {{shareholders_table_html}}

  </tbody>

</table>



<h2>3. Capital Structure</h2>

<p>The Company is authorized to issue {{authorized_shares}} shares of common stock, par value ${{par_value}} per share.</p>



<h2>4. Vesting</h2>

<p>Share vesting schedules are defined in Section 2. Unvested shares may be forfeited or repurchased if a shareholder departs prior to full vesting.</p>



<h2>5. Roles and Responsibilities</h2>

<p>Shareholders agree to serve in the following capacities based on their roles in the organization:</p>

<ul id="rolesList">

  {{role_rows}}

</ul>



<h2>6. Admission of New Shareholders</h2>

<p>New shareholders may be admitted through equity issuance, transfer, appointment, or other board-approved mechanisms. All new shareholders must execute a joinder to this Agreement.</p>



<h2>7. Decision-Making and Voting</h2>

<p>Major Company decisions require approval by shareholders holding a majority of outstanding shares. Critical matters require {{supermajority_threshold}}% approval.</p>



<h2>8. Transfer of Shares</h2>

<p>No Shareholder may transfer shares without first offering them to the Company and then to other Shareholders on a pro rata basis.</p>



<h2>9. Right of First Refusal</h2>

<p>If a Shareholder receives a third-party offer, the Company has 30 days to purchase the shares; remaining shareholders then have 30 days to purchase any remaining shares.</p>



<h2>10. Intellectual Property Assignment</h2>

<p>All inventions, software, trademarks, designs, and IP created in connection with the Company are assigned to the Company.</p>



<h2>11. Confidentiality</h2>

<p>Shareholders must keep all Company information confidential unless legally required to disclose it.</p>



<h2>12. Non-Compete and Non-Solicitation</h2>

<p>During involvement with the Company and for {{non_compete_period}} thereafter within {{non_compete_geography}}, shareholders shall not compete or solicit employees or clients.</p>



<h2>13. Departure or Termination</h2>

<p>Departing shareholders'' shares may be repurchased based on vesting status and fair market value.</p>



<h2>14. Drag-Along Rights</h2>

<p>If shareholders holding {{drag_along_threshold}}% approve a sale, all shareholders must participate under identical terms.</p>



<h2>15. Tag-Along Rights</h2>

<p>If a shareholder sells shares, others may participate proportionally under the same terms.</p>



<h2>16. Dispute Resolution</h2>

<p>Disputes shall be mediated first; if unresolved, they will proceed to binding arbitration in {{arbitration_location}}.</p>



<h2>17. Amendments</h2>

<p>This Agreement may only be amended by shareholders holding {{amendment_threshold}}% of outstanding shares.</p>



<h2>18. Governing Law</h2>

<p>This Agreement is governed by the laws of {{governing_law}}.</p>



<h2>19. Severability</h2>

<p>If any section is invalid, the remainder shall remain enforceable.</p>



<h2>20. Entire Agreement</h2>

<p>This document constitutes the full understanding among the Shareholders.</p>



<div class="page-break"></div>



<h2>IN WITNESS WHEREOF</h2>

<p>The undersigned shareholders execute this Agreement as of {{effective_date}}.</p>



<div id="signatureBlocks">

  {{shareholders_signature_html}}

</div>



</body>

</html>',
  true
)
ON CONFLICT (template_key) 
DO UPDATE SET
  html_content = EXCLUDED.html_content,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = now();

-- Add signature fields for 'shareholder' and 'officer' roles
-- These fields will be positioned on the signature page (page 2)
DO $$
DECLARE
  template_id_val UUID;
BEGIN
  -- Get the template ID
  SELECT id INTO template_id_val 
  FROM public.document_templates 
  WHERE template_key = 'shareholders_agreement';
  
  IF template_id_val IS NOT NULL THEN
    -- Delete existing signature fields for this template to avoid duplicates
    DELETE FROM public.document_template_signature_fields 
    WHERE template_id = template_id_val;
    
    -- Insert signature fields for shareholders/officers on the signature page (page 2)
    -- Position: Bottom area where signature blocks appear
    -- Note: Multiple shareholders may sign, so we position fields to accommodate multiple signatures
    INSERT INTO public.document_template_signature_fields (
      template_id,
      field_type,
      signer_role,
      page_number,
      x_percent,
      y_percent,
      width_percent,
      height_percent,
      label,
      required
    ) VALUES (
      template_id_val,
      'signature',
      'shareholder', -- For all shareholders (including Invero Business Trust representative)
      2, -- Page 2 (signature page)
      15.0, -- x position: 15% from left
      60.0, -- y position: 60% from top (allows space for multiple signatures)
      35.0, -- width: 35% of page width
      4.0,  -- height: 4% of page height
      'Shareholder Signature',
      true
    ),
    (
      template_id_val,
      'date',
      'shareholder',
      2, -- Page 2
      55.0, -- x position: 55% from left (next to signature)
      60.0, -- y position: 60% from top
      15.0, -- width: 15% of page width
      4.0,  -- height: 4% of page height
      'Date',
      true
    ),
    (
      template_id_val,
      'signature',
      'officer', -- For executive shareholders (CFO, CXO, etc.)
      2, -- Page 2
      15.0, -- x position: 15% from left
      70.0, -- y position: 70% from top (below shareholder signature)
      35.0, -- width: 35% of page width
      4.0,  -- height: 4% of page height
      'Officer Signature',
      true
    ),
    (
      template_id_val,
      'date',
      'officer',
      2, -- Page 2
      55.0, -- x position: 55% from left
      70.0, -- y position: 70% from top
      15.0, -- width: 15% of page width
      4.0,  -- height: 4% of page height
      'Date',
      true
    );
    
    RAISE NOTICE 'Added signature fields for shareholders_agreement template (template_id: %)', template_id_val;
  ELSE
    RAISE WARNING 'Template shareholders_agreement not found';
  END IF;
END $$;

