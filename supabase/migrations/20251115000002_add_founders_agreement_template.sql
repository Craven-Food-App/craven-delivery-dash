-- Add Founders' Agreement template to document_templates table
-- This template requires founder signatures, so signature fields are also added

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
  'founders_agreement',
  'Founders'' Agreement',
  'Agreement between the founding entities establishing equity ownership, contributions, IP assignment, and governance structure.',
  'legal',
  '<!--

  TEMPLATE NOTES FOR CRAVE''N SETUP



  Suggested values for your first use:

    {{company_name}}            = "Crave''n, Inc."

    {{effective_date}}          = e.g. "November 15, 2025"

    {{company_state}}           = "Delaware" (or Ohio, if you choose)

    {{trust_state}}             = "Ohio" (or applicable state)

    {{governing_law_state}}     = "Delaware"

    {{arbitration_state}}       = "Delaware"

    {{founder_trust_name}}      = "Invero Business Trust"

    {{founder_trust_title}}     = "Trustee / Authorized Agent"

    {{founder_individual_name}} = "Torrance A. Stroman"

-->



<!DOCTYPE html>

<html lang="en">

<head>

  <meta charset="UTF-8" />

  <title>Founders'' Agreement – {{company_name}}</title>

  <meta name="viewport" content="width=device-width, initial-scale=1" />

  <style>

    body {

      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;

      line-height: 1.6;

      padding: 2rem;

      max-width: 900px;

      margin: 0 auto;

      background-color: #ffffff;

      color: #111111;

    }

    h1, h2, h3 {

      margin-top: 1.5rem;

      margin-bottom: 0.75rem;

    }

    h1 {

      text-transform: uppercase;

      letter-spacing: 0.08em;

      font-size: 1.4rem;

      text-align: center;

    }

    h2 {

      font-size: 1.1rem;

      border-bottom: 1px solid #ddd;

      padding-bottom: 0.25rem;

    }

    h3 {

      font-size: 1rem;

    }

    p {

      margin: 0.5rem 0;

    }

    .center {

      text-align: center;

    }

    .section {

      margin-top: 1.5rem;

    }

    .signature-block {

      margin-top: 2rem;

      border-top: 1px solid #ccc;

      padding-top: 1rem;

    }

    .signature-line {

      margin-top: 2rem;

    }

    .signature-line span {

      display: inline-block;

      min-width: 250px;

      border-bottom: 1px solid #000;

      height: 1.5rem;

    }

    .signature-label {

      margin-top: 0.25rem;

      font-size: 0.9rem;

      color: #555;

    }

    .meta {

      text-align: center;

      margin-bottom: 1rem;

      font-size: 0.95rem;

    }

  </style>

</head>

<body>



  <h1>FOUNDERS'' AGREEMENT</h1>

  <div class="center"><strong>OF {{company_name}}</strong></div>



  <div class="meta">

    This Founders'' Agreement (this "Agreement") is entered into as of

    <strong>{{effective_date}}</strong> (the "Effective Date").

  </div>



  <div class="section">

    <p>This Agreement is made by and between:</p>

    <p>

      1. <strong>{{founder_trust_name}}</strong>, a business trust organized under the laws of the State of {{trust_state}},

      acting herein by and through its duly authorized trustee or agent ("Founder Trust"); and

    </p>

    <p>

      2. <strong>{{founder_individual_name}}</strong>, an individual residing in the State of {{founder_individual_state}}

      ("Founder Individual").

    </p>

    <p>

      Each of Founder Trust and Founder Individual may be referred to herein individually as a "Founder"

      and collectively as the "Founders."

    </p>

  </div>



  <div class="section">

    <h2>RECITALS</h2>

    <p>

      WHEREAS, the Founders have jointly conceived the business model, technological architecture, brand identity,

      and commercial vision underlying {{company_name}}, a corporation to be formed for the purpose of developing,

      operating, and commercializing a food-delivery logistics platform and related technology, including mobile

      applications, routing engines, restaurant tools, and associated intellectual property (the "Company");

    </p>

    <p>

      WHEREAS, the Founders desire to set forth in writing their respective rights, duties, obligations,

      contributions, ownership interests, intellectual property assignments, governance expectations,

      and restrictions arising from their founding roles in respect of the Company;

    </p>

    <p>

      WHEREAS, the Founders acknowledge that clarity at the founding stage is essential to the stability,

      continuity, scalability, and long-term capitalization of the Company; and

    </p>

    <p>

      NOW, THEREFORE, in consideration of the mutual covenants and promises contained herein, and for other good

      and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Founders agree as follows:

    </p>

  </div>



  <div class="section">

    <h2>1. DEFINITIONS</h2>

    <p><strong>1.1 "Agreement"</strong> means this Founders'' Agreement, as amended from time to time.</p>

    <p><strong>1.2 "Company"</strong> means {{company_name}}, a corporation to be formed under the laws of the State of {{company_state}}.</p>

    <p>

      <strong>1.3 "Founder Equity"</strong> means shares of the Company''s common stock or other equity interests

      issued to the Founders upon or in connection with the incorporation of the Company, in the percentages set forth in this Agreement.

    </p>

    <p>

      <strong>1.4 "Intellectual Property" or "IP"</strong> means all proprietary materials, whether now existing or hereafter

      developed, including without limitation: software, source code, object code, algorithms, inventions, designs, trademarks,

      service marks, trade dress, logos, graphics, artwork, documentation, specifications, business plans, trade secrets,

      processes, methodologies, data, databases, know-how, concepts, ideas, improvements, domain names, content, and any other

      work product created by or on behalf of either Founder relating to the Company.

    </p>

    <p>

      <strong>1.5 "Confidential Information"</strong> means all non-public, proprietary or confidential information belonging to

      or relating to the Company, including technical, financial, operational, strategic, and commercial information,

      whether oral, written, electronic, or otherwise, that is disclosed by or on behalf of the Company or a Founder.

    </p>

  </div>



  <div class="section">

    <h2>2. FORMATION OF THE COMPANY</h2>

    <p>

      2.1 The Founders shall cause the incorporation of the Company within a commercially reasonable time following the Effective Date.

      Upon incorporation, the Company shall be organized as a corporation under the laws of the State of {{company_state}}

      (or such other jurisdiction as the Founders may unanimously agree).

    </p>

    <p>

      2.2 Founder Trust shall be recorded in the Company''s organizational documents as the majority founding shareholder, and

      Founder Individual shall be recorded as a founding shareholder and shall be appointed as the initial Chief Executive Officer (the "CEO").

    </p>

  </div>



  <div class="section">

    <h2>3. PURPOSE OF THE COMPANY</h2>

    <p>

      The primary purpose of the Company is to design, build, develop, operate, and commercialize a delivery logistics

      ecosystem, including but not limited to:

    </p>

    <ul>

      <li>customer-facing applications and ordering platforms;</li>

      <li>driver and courier applications and tools;</li>

      <li>restaurant and merchant management portals;</li>

      <li>routing, fulfillment, and dispatch systems;</li>

      <li>data, analytics, and operational support systems; and</li>

      <li>any other lawful business that the Company''s board of directors (the "Board") may from time to time determine.</li>

    </ul>

  </div>



  <div class="section">

    <h2>4. FOUNDER EQUITY OWNERSHIP</h2>

    <p>

      4.1 Upon incorporation of the Company, and subject to such capitalization plan as may be approved by the Founders,

      the Founder Equity shall be allocated as follows (or such alternative allocation as the Founders may unanimously approve):

    </p>

    <ul>

      <li><strong>{{founder_trust_name}}:</strong> {{founder_trust_equity_percent}}% of the outstanding shares of the Company''s common stock; and</li>

      <li><strong>{{founder_individual_name}}:</strong> {{founder_individual_equity_percent}}% of the outstanding shares of the Company''s common stock.</li>

    </ul>

    <p>

      4.2 The foregoing allocation reflects the Founders'' respective contributions, responsibilities, and the intended

      governance structure of the Company as of the Effective Date.

    </p>

    <p>

      4.3 Voting rights attached to the Founder Equity shall, unless otherwise modified in a subsequent shareholders''

      agreement or the Company''s governing documents, be proportional to the respective equity holdings of the Founders.

      Founder Trust is intended to hold majority voting control in respect of the Company.

    </p>

  </div>



  <div class="section">

    <h2>5. CONTRIBUTIONS OF THE FOUNDERS</h2>

    <h3>5.1 Contributions of Founder Trust</h3>

    <p>

      Founder Trust shall contribute, or cause to be contributed, as applicable:

    </p>

    <ul>

      <li>initial capitalization in such form and amount as may be agreed by the Founders;</li>

      <li>strategic oversight and long-term corporate stewardship;</li>

      <li>holding-entity infrastructure, including any trust-level protections and structuring benefits;</li>

      <li>access to such support, advisory resources, or relationships as may benefit the Company''s growth.</li>

    </ul>



    <h3>5.2 Contributions of Founder Individual</h3>

    <p>

      Founder Individual shall contribute, or cause to be contributed, as applicable:

    </p>

    <ul>

      <li>

        day-to-day leadership and operational management in the capacity of CEO, including responsibility for execution of the

        Company''s business strategy;

      </li>

      <li>

        development of systems, workflows, architectures, platform flows, and product features that define the Company''s

        technology and user experience;

      </li>

      <li>

        brand creation and stewardship, including trade names, logos, visual identity, and customer-facing messaging;

      </li>

      <li>

        business plans, marketing strategy, investor outreach efforts, and early commercial relationships;

      </li>

      <li>

        any other labor, expertise, or services reasonably required to advance the Company''s objectives.

      </li>

    </ul>

  </div>



  <div class="section">

    <h2>6. INTELLECTUAL PROPERTY ASSIGNMENT</h2>

    <p>

      6.1 Each Founder hereby irrevocably assigns, transfers, and conveys to the Company, on a worldwide and perpetual basis,

      all right, title, and interest in and to any and all Intellectual Property that such Founder has created, developed,

      conceived, authored, or reduced to practice, whether alone or jointly, prior to or after the Effective Date, to the

      extent such Intellectual Property relates to the business of the Company.

    </p>

    <p>

      6.2 Each Founder agrees to execute such further documents, instruments, and assurances, and to take such further actions,

      as may reasonably be requested by the Company to perfect, record, or enforce the Company''s rights in and to such

      Intellectual Property.

    </p>

    <p>

      6.3 To the extent any moral rights or similar rights may not be assignable under applicable law, each Founder agrees

      not to enforce such rights against the Company and hereby irrevocably waives, to the maximum extent permitted by law,

      any such rights that may interfere with the Company''s use or exploitation of the Intellectual Property.

    </p>

  </div>



  <div class="section">

    <h2>7. ROLES AND RESPONSIBILITIES</h2>

    <h3>7.1 Founder Trust</h3>

    <p>

      Founder Trust shall exercise its role principally at the ownership and governance level, including:

    </p>

    <ul>

      <li>serving as majority owner of the Company;</li>

      <li>participating in and approving major strategic and capital-structure decisions;</li>

      <li>

        acting as a stabilizing and protective entity with respect to the Company''s long-term direction, mission,

        and foundational rights.

      </li>

    </ul>



    <h3>7.2 Founder Individual</h3>

    <p>

      Founder Individual shall serve as the Company''s initial CEO and, subject to the authority of the Board, shall:

    </p>

    <ul>

      <li>oversee the Company''s day-to-day management, operations, and personnel;</li>

      <li>lead the design and development of the Company''s products, services, and technology;</li>

      <li>serve as the primary public and investor-facing representative of the Company;</li>

      <li>implement and execute strategic objectives approved by the Board;</li>

      <li>perform such other duties as are customarily associated with the role of a CEO.</li>

    </ul>

  </div>



  <div class="section">

    <h2>8. CONFIDENTIALITY AND RESTRICTIONS</h2>

    <p>

      8.1 Each Founder agrees to hold all Confidential Information in strict confidence and not to use or disclose any

      Confidential Information except as necessary for the performance of obligations under this Agreement or as required by law.

    </p>

    <p>

      8.2 Each Founder agrees that, so long as he, she, or it remains a Founder and for such additional period as may be

      specified in a subsequent employment, services, or shareholders'' agreement, such Founder shall not:

    </p>

    <ul>

      <li>engage in any business that directly competes with the primary business of the Company within the Company''s core markets;</li>

      <li>solicit or encourage any employee, contractor, or consultant of the Company to terminate or alter his or her relationship with the Company;</li>

      <li>misuse, misappropriate, or disclose any Intellectual Property or Confidential Information of the Company.</li>

    </ul>

  </div>



  <div class="section">

    <h2>9. WITHDRAWAL, REMOVAL, AND DISABILITY</h2>

    <p>

      9.1 A Founder may voluntarily withdraw from active participation in the Company only upon not less than

      ninety (90) days'' prior written notice to the other Founder and, if applicable, in compliance with any

      equity-transfer or buyback provisions contained in this Agreement or in any shareholders'' agreement.

    </p>

    <p>

      9.2 In the event of a Founder''s voluntary withdrawal, material breach of this Agreement, permanent disability,

      or death, the Company and/or the remaining Founder shall have the right, but not the obligation, to purchase all

      or a portion of such Founder''s equity in the Company in accordance with a valuation methodology and terms that

      may be further detailed in a separate shareholders'' agreement.

    </p>

    <p>

      9.3 The Founders acknowledge that additional mechanisms governing buybacks, vesting, and forfeiture of shares

      may be established in future agreements (including any shareholders'' agreement) and that such mechanisms shall

      operate in addition to, and not in conflict with, this Agreement.

    </p>

  </div>



  <div class="section">

    <h2>10. DISPUTE RESOLUTION</h2>

    <p>

      10.1 In the event of any dispute, controversy, or claim arising out of or relating to this Agreement

      (a "Dispute"), the Founders shall first attempt in good faith to resolve the Dispute through direct negotiation.

    </p>

    <p>

      10.2 If the Dispute is not resolved within thirty (30) days after written notice of the Dispute is first given,

      the Founders shall submit the Dispute to non-binding mediation administered by a mutually agreed mediator

      in {{arbitration_state}} (or such other location as the Founders may agree).

    </p>

    <p>

      10.3 If the Dispute is not resolved by mediation, the Dispute shall be finally resolved by binding arbitration

      in {{arbitration_state}} in accordance with the rules of the American Arbitration Association then in effect,

      and judgment on the award rendered by the arbitrator(s) may be entered in any court having jurisdiction thereof.

    </p>

  </div>



  <div class="section">

    <h2>11. GOVERNING LAW</h2>

    <p>

      This Agreement shall be governed by, and construed in accordance with, the laws of the State of {{governing_law_state}},

      without giving effect to any choice or conflict of law provision or rule that would cause the application of

      the laws of any other jurisdiction.

    </p>

  </div>



  <div class="section">

    <h2>12. AMENDMENTS</h2>

    <p>

      No amendment, modification, or waiver of any provision of this Agreement shall be effective unless it is in writing

      and signed by both Founders. Any such amendment, modification, or waiver shall be binding upon and inure to the benefit

      of the Founders and their respective successors and permitted assigns.

    </p>

  </div>



  <div class="section">

    <h2>13. ENTIRE AGREEMENT</h2>

    <p>

      This Agreement constitutes the entire agreement between the Founders with respect to the subject matter hereof

      and supersedes all prior and contemporaneous understandings, agreements, negotiations, and representations,

      whether oral or written, concerning such subject matter.

    </p>

  </div>



  <div class="section signature-block">

    <h2>14. SIGNATURES</h2>

    <p>IN WITNESS WHEREOF, the Founders have executed this Agreement as of the Effective Date first written above.</p>



    <div class="signature-line">

      <span></span>

      <div class="signature-label">{{founder_trust_name}}</div>

    </div>

    <p>

      By: _______________________________________<br />

      Name: _____________________________________<br />

      Title: {{founder_trust_title}}<br />

      Date: _____________________________________

    </p>



    <div class="signature-line" style="margin-top: 3rem;">

      <span></span>

      <div class="signature-label">{{founder_individual_name}}</div>

    </div>

    <p>

      Signature: _________________________________<br />

      Name: {{founder_individual_name}}<br />

      Date: _____________________________________

    </p>

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

-- Add signature fields for 'founder' and 'officer' roles
-- These fields will be positioned on the signature page (last page)
DO $$
DECLARE
  template_id_val UUID;
BEGIN
  -- Get the template ID
  SELECT id INTO template_id_val 
  FROM public.document_templates 
  WHERE template_key = 'founders_agreement';
  
  IF template_id_val IS NOT NULL THEN
    -- Delete existing signature fields for this template to avoid duplicates
    DELETE FROM public.document_template_signature_fields 
    WHERE template_id = template_id_val;
    
    -- Insert signature field for founder/officer (Torrance Stroman) on the signature page
    -- Position: Bottom area where the signature lines appear
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
      'founder', -- Torrance Stroman signs as founder
      1, -- Assuming single page or last page
      15.0, -- x position: 15% from left
      85.0, -- y position: 85% from top (near bottom of page)
      35.0, -- width: 35% of page width
      4.0,  -- height: 4% of page height
      'Founder Signature',
      true
    ),
    (
      template_id_val,
      'date',
      'founder',
      1, -- Same page
      55.0, -- x position: 55% from left (next to signature)
      85.0, -- y position: 85% from top
      15.0, -- width: 15% of page width
      4.0,  -- height: 4% of page height
      'Date',
      true
    ),
    (
      template_id_val,
      'signature',
      'officer', -- Also allow officer role (Torrance is CEO)
      1,
      15.0,
      90.0, -- Slightly below founder signature
      35.0,
      4.0,
      'Officer Signature',
      true
    ),
    (
      template_id_val,
      'date',
      'officer',
      1,
      55.0,
      90.0,
      15.0,
      4.0,
      'Date',
      true
    );
    
    RAISE NOTICE 'Added signature fields for founders_agreement template (template_id: %)', template_id_val;
  ELSE
    RAISE WARNING 'Template founders_agreement not found';
  END IF;
END $$;

