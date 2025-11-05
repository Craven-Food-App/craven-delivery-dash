// Document templates configuration
export type TemplateMeta = {
  id: string;
  title: string;
  placeholders: string[];
};

export const templates: TemplateMeta[] = [
  { 
    id: "employment_agreement", 
    title: "Executive Employment Agreement", 
    placeholders: ["company_name", "full_name", "role", "equity_percentage", "effective_date", "funding_trigger", "governing_law"]
  },
  { 
    id: "board_resolution", 
    title: "Board Resolution – Appointment of Officers", 
    placeholders: ["company_name", "date", "directors", "ceo_name", "cfo_name", "cxo_name", "equity_ceo", "equity_cfo", "equity_cxo", "funding_trigger"]
  },
  { 
    id: "founders_agreement", 
    title: "Founders' / Shareholders' Agreement", 
    placeholders: ["company_name", "founders_table_html", "vesting_years", "cliff_months", "governing_law"]
  },
  { 
    id: "stock_issuance", 
    title: "Stock Subscription / Issuance Agreement", 
    placeholders: ["company_name", "full_name", "role", "share_count", "class_name", "par_value", "consideration", "vesting_schedule"]
  },
  { 
    id: "confidentiality_ip", 
    title: "Confidentiality & IP Assignment Agreement", 
    placeholders: ["company_name", "full_name", "role", "effective_date", "governing_law"]
  },
  { 
    id: "deferred_comp_addendum", 
    title: "Deferred Compensation Addendum", 
    placeholders: ["company_name", "full_name", "role", "funding_trigger", "effective_date", "governing_law"]
  },
  { 
    id: "offer_letter", 
    title: "Executive Offer Letter", 
    placeholders: [
      "company_name","offer_date","executive_name","executive_first_name","executive_address","executive_email",
      "position_title","reporting_to_title","work_location","start_date",
      "annual_base_salary","currency","funding_trigger_amount",
      "share_count","share_class","ownership_percent","vesting_period","vesting_cliff","bonus_structure",
      "employment_country","governing_law_state","signatory_name","signatory_title","company_mission_statement"
    ]
  },
  { 
    id: "bylaws_officers_excerpt", 
    title: "Bylaws – Officers (Excerpt)", 
    placeholders: [
      "company_name","state_of_incorporation","adoption_date","effective_date","execution_date","secretary_name"
    ]
  },
  { 
    id: "irs_83b", 
    title: "IRS Form 83(b) – Info Sheet", 
    placeholders: [
      "company_name","recipient_name","grant_date","share_class","share_type","share_count","price_per_share","currency",
      "total_grant_value","total_payment","cfo_name","cfo_email","company_address",
      "recipient_address","recipient_ssn","tax_year","taxable_difference","vesting_schedule"
    ]
  }
];

// Template HTML generators
export function renderHtml(templateId: string, data: Record<string, any>): string {
  const template = templates.find(t => t.id === templateId);
  if (!template) throw new Error(`Template not found: ${templateId}`);

  const styles = `
    <style>
      body { 
        font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
        color: #111827; 
        padding: 48px; 
        line-height: 1.6;
        max-width: 800px;
        margin: 0 auto;
      }
      h1 { color: #ff7a45; margin: 0 0 8px; font-size: 24px; }
      h2 { margin: 24px 0 12px; font-size: 20px; }
      h3 { margin: 16px 0 8px; font-size: 16px; }
      .muted { color: #6b7280; font-size: 14px; }
      .sig-block { margin-top: 60px; display: flex; gap: 48px; flex-wrap: wrap; }
      .sig { width: 280px; border-top: 1px solid #000; padding-top: 8px; }
      .label { font-size: 12px; color: #6b7280; margin-top: 4px; }
      .section { margin: 24px 0; }
      p { margin: 12px 0; }
      ul, ol { margin: 12px 0; padding-left: 24px; }
      li { margin: 6px 0; }
    </style>
  `;

  let body = "";

  // Generate HTML based on template type
  switch (templateId) {
    case "employment_agreement":
      body = `
        <h1>Executive Employment Agreement</h1>
        <div class="muted">Between ${data.company_name || "Company"} and ${data.full_name || "Executive"}</div>
        
        <div class="section">
          <p><strong>Effective Date:</strong> ${data.effective_date || "TBD"}</p>
          <p><strong>Position:</strong> ${data.role || "Executive"}</p>
          <p><strong>Equity:</strong> ${data.equity_percentage || "0"}%</p>
        </div>

        <div class="section">
          <h2>1. Employment Terms</h2>
          <p>${data.company_name || "The Company"} hereby employs ${data.full_name || "Executive"} as ${data.role || "an executive officer"}, and ${data.full_name || "Executive"} accepts such employment, subject to the terms and conditions set forth in this Agreement.</p>
        </div>

        <div class="section">
          <h2>2. Compensation</h2>
          <p>The Executive shall receive equity compensation of ${data.equity_percentage || "0"}% of the company, subject to vesting schedules and funding triggers as described in separate documentation.</p>
          <p><strong>Funding Trigger:</strong> ${data.funding_trigger || "Upon Series A funding or significant investment event"}</p>
        </div>

        <div class="section">
          <h2>3. Governing Law</h2>
          <p>This Agreement shall be governed by the laws of ${data.governing_law || "the State of Delaware"}.</p>
        </div>

        <div class="sig-block">
          <div class="sig">
            ${data.signature_company_html || ""}
            <div class="label">Company Representative</div>
            <div class="label">${data.company_name || "Company Name"}</div>
          </div>
          <div class="sig">
            ${data.signature_executive_html || ""}
            <div class="label">${data.full_name || "Executive Name"}</div>
            <div class="label">${data.role || "Title"}</div>
          </div>
        </div>
      `;
      break;

    case "offer_letter":
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Executive Offer Letter</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    @page { size: A4; margin: 24mm 18mm; }
    body {
      font-family: "Inter","Helvetica Neue",Arial,sans-serif;
      font-size: 14px;
      line-height: 1.55;
      color: #111;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 {
      text-align: center;
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 8px;
      text-transform: uppercase;
    }
    h2 { font-size: 16px; margin: 16px 0 6px; font-weight: 600; }
    p { margin: 6px 0 10px; }
    ul { margin: 6px 0 10px 22px; }
    table { border-collapse: collapse; width: 100%; margin: 8px 0 16px; }
    th, td { border: 1px solid #d9d9d9; padding: 8px 10px; vertical-align: top; }
    th { background: #fafafa; text-align: left; font-weight: 600; }
    .muted { color: #666; font-size: 13px; }
    .sig-grid { width: 100%; border-collapse: separate; border-spacing: 0 18px; }
    .line { display: block; border-bottom: 1px solid #333; height: 24px; margin-bottom: 4px; }
    .small { font-size: 12px; color: #666; }
    .note { background: #fffbea; border: 1px solid #f3e29e; padding: 8px 10px; font-size: 13px; }
  </style>
</head>
<body>

  <h1>EXECUTIVE OFFER LETTER</h1>

  <p>Date: ${data.offer_date || ''}</p>

  <p>
    <strong>${data.executive_name || ''}</strong><br/>
    ${data.executive_address || ''}<br/>
    ${data.executive_email || ''}
  </p>

  <p>Dear ${data.executive_first_name || (data.executive_name?.split(' ')[0] || 'Candidate')},</p>

  <p>
    On behalf of <strong>${data.company_name || 'Company'}</strong> (the “Company”), we are pleased to extend this formal offer of employment
    for the position of <strong>${data.position_title || 'Executive'}</strong>. We are confident that your skills and experience will make a
    significant contribution to our leadership team and our mission to ${data.company_mission_statement || 'deliver on our vision'}.
  </p>

  <h2>1. Position and Reporting</h2>
  <p>
    You will serve as <strong>${data.position_title || 'Executive'}</strong> of the Company, reporting directly to ${data.reporting_to_title || 'the Board of Directors'}.
    You will be expected to perform all duties consistent with such position and as assigned from time to time by the Board of Directors.
    Your primary work location will be ${data.work_location || 'Company HQ'}; remote and hybrid work arrangements may be approved by the Board.
  </p>

  <h2>2. Start Date</h2>
  <p>Your expected start date is <strong>${data.start_date || 'TBD'}</strong>.</p>

  <h2>3. Compensation</h2>
  <table>
    <tr>
      <th>Base Salary</th>
      <td>${data.annual_base_salary || '0'} ${data.currency || 'USD'} per year, paid in accordance with standard Company payroll practices.</td>
    </tr>
    <tr>
      <th>Deferred Compensation</th>
      <td>
        As part of the Company’s early-stage policy, your salary will be deferred until funding reaches
        <strong>${data.funding_trigger_amount || '0'} ${data.currency || 'USD'}</strong>, as described in the
        <strong>Deferred Compensation Addendum</strong>.
      </td>
    </tr>
    <tr>
      <th>Equity</th>
      <td>
        You will be granted <strong>${data.share_count || ''}</strong> shares of ${data.share_class || ''} stock (representing approximately
        ${data.ownership_percent || '0'}% ownership), subject to the terms of the <strong>Founders’/Shareholders’ Agreement</strong> and the
        <strong>Stock Subscription Agreement</strong>. These shares will vest over <strong>${data.vesting_period || '4'}</strong> years
        with a <strong>${data.vesting_cliff || '1 year'}</strong> cliff.
      </td>
    </tr>
    <tr>
      <th>Bonuses</th>
      <td>${data.bonus_structure || 'As determined by the Board'} (if applicable).</td>
    </tr>
  </table>

  <h2>4. Benefits</h2>
  <ul>
    <li>Eligibility for Company benefits in accordance with standard policies (health, PTO, etc.) as they become available.</li>
    <li>Reimbursement for reasonable business expenses incurred in the course of performing your duties.</li>
    <li>Access to Company devices, software, and systems necessary to perform your role.</li>
  </ul>

  <h2>5. At-Will Employment</h2>
  <p>
    Employment with the Company is “at will,” meaning that either you or the Company may terminate employment at any time,
    with or without cause or notice. No statement in this Offer Letter or any other document alters this at-will relationship.
  </p>

  <h2>6. Confidentiality and IP Assignment</h2>
  <p>
    As a condition of employment, you are required to sign and comply with the Company’s
    <strong>Confidentiality & IP Assignment Agreement</strong>.
  </p>

  <h2>7. Other Terms</h2>
  <ul>
    <li>This offer is contingent on verification of your eligibility to work in ${data.employment_country || 'the United States'}.</li>
    <li>You agree to comply with all Company policies, including ethics, data security, and non-solicitation requirements.</li>
    <li>You represent that you are not bound by any restriction that would prevent you from performing your duties here.</li>
  </ul>

  <h2>8. Governing Law</h2>
  <p>
    This Offer Letter shall be governed by the laws of ${data.governing_law_state || 'Delaware'}, without regard to its conflict-of-law provisions.
  </p>

  <h2>9. Acceptance of Offer</h2>
  <p>
    To indicate your acceptance of this offer, please sign and date this letter in the space provided below. Your signature confirms
    that you have read, understood, and agree to the terms and conditions of employment with ${data.company_name || 'the Company'}.
  </p>

  <h2>Sincerely,</h2>
  <table class="sig-grid">
    <tr>
      <td style="width:60%">
        <div class="line"></div>
        <div class="small">For the Company: ${data.signatory_name || ''}, ${data.signatory_title || ''}, ${data.company_name || 'Company'}</div>
      </td>
      <td style="width:5%"></td>
      <td>
        <div class="line"></div>
        <div class="small">Date</div>
      </td>
    </tr>
  </table>

  <h2>Accepted and Agreed:</h2>
  <table class="sig-grid">
    <tr>
      <td style="width:60%">
        <div class="line"></div>
        <div class="small">Executive: ${data.executive_name || ''}</div>
      </td>
      <td style="width:5%"></td>
      <td>
        <div class="line"></div>
        <div class="small">Date</div>
      </td>
    </tr>
  </table>

  <hr/>
  <p class="muted">
    Developer placeholders: {{'{{company_name}}'}}, {{'{{executive_name}}'}}, {{'{{executive_first_name}}'}},
    {{'{{position_title}}'}}, {{'{{reporting_to_title}}'}}, {{'{{work_location}}'}}, {{'{{annual_base_salary}}'}},
    {{'{{currency}}'}}, {{'{{funding_trigger_amount}}'}}, {{'{{share_count}}'}}, {{'{{share_class}}'}},
    {{'{{ownership_percent}}'}}, {{'{{vesting_period}}'}}, {{'{{vesting_cliff}}'}}, {{'{{bonus_structure}}'}},
    {{'{{employment_country}}'}}, {{'{{governing_law_state}}'}}, {{'{{signatory_name}}'}}, {{'{{signatory_title}}'}},
    {{'{{offer_date}}'}}, {{'{{executive_address}}'}}, {{'{{executive_email}}'}}, {{'{{start_date}}'}},
    {{'{{company_mission_statement}}'}}.
  </p>

</body>
</html>`;

    case "bylaws_officers_excerpt":
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Bylaws – Officers (Excerpt)</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    @page { size: A4; margin: 24mm 18mm; }
    body {
      font-family: "Inter","Helvetica Neue",Arial,sans-serif;
      font-size: 14px;
      line-height: 1.55;
      color: #111;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 {
      text-align: center;
      font-size: 20px;
      font-weight: 700;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    h2 {
      font-size: 16px;
      font-weight: 600;
      margin: 18px 0 8px;
      border-bottom: 1px solid #d9d9d9;
      padding-bottom: 3px;
    }
    h3 {
      font-size: 14px;
      margin: 12px 0 6px;
      font-weight: 600;
    }
    p { margin: 6px 0 10px; }
    ul { margin: 6px 0 10px 22px; }
    .muted { color: #666; font-size: 13px; }
    table { border-collapse: collapse; width: 100%; margin: 10px 0 18px; }
    th, td { border: 1px solid #d9d9d9; padding: 8px 10px; vertical-align: top; }
    th { background: #fafafa; text-align: left; font-weight: 600; }
    .sig-grid { width: 100%; border-collapse: separate; border-spacing: 0 18px; }
    .line { display: block; border-bottom: 1px solid #333; height: 24px; margin-bottom: 4px; }
    .small { font-size: 12px; color: #666; }
  </style>
</head>
<body>

  <h1>BYLAWS – OFFICERS (EXCERPT)</h1>
  <p style="text-align:center;">
    <strong>${data.company_name || 'Company'}</strong><br/>
    State of Incorporation: ${data.state_of_incorporation || ''}<br/>
    Adopted by the Board of Directors on ${data.adoption_date || ''}
  </p>
  <hr/>

  <p>
    The following excerpt from the Company’s Bylaws sets forth the provisions relating to corporate officers, including
    their appointment, authority, duties, and removal. This section supplements the full Bylaws of the Company and shall be
    incorporated therein by reference.
  </p>

  <h2>ARTICLE IV – OFFICERS</h2>

  <h3>Section 4.1 – Officers</h3>
  <p>
    The officers of the Company shall consist of a Chief Executive Officer (“CEO”), Chief Financial Officer (“CFO”),
    Chief Experience Officer (“CXO”), Corporate Secretary, and such other officers or assistant officers as may be appointed
    by the Board of Directors from time to time. Any number of offices may be held by the same person unless prohibited by law.
  </p>

  <h3>Section 4.2 – Appointment and Term</h3>
  <p>
    The officers shall be appointed annually by the Board of Directors at the first meeting following the annual meeting
    of shareholders, or at such other times as the Board may determine. Each officer shall hold office until a successor
    is duly appointed and qualified, or until the officer’s earlier resignation, removal, or death.
  </p>

  <h3>Section 4.3 – Removal and Resignation</h3>
  <p>
    Any officer may be removed, with or without cause, by the Board of Directors at any time. An officer may resign at any
    time by delivering written notice to the Board or the Corporate Secretary. Such resignation shall take effect at the time
    specified or, if none, upon receipt.
  </p>

  <h3>Section 4.4 – Vacancies</h3>
  <p>
    A vacancy in any office may be filled by the Board of Directors at any time. The officer so selected shall serve for
    the unexpired term of the predecessor and until a successor is duly appointed and qualified.
  </p>

  <h3>Section 4.5 – Chief Executive Officer (CEO)</h3>
  <ul>
    <li>The CEO shall be the principal executive officer of the Company and shall have general supervision, direction, and control of the business and affairs of the Company, subject to the authority of the Board of Directors.</li>
    <li>The CEO shall preside at all meetings of the Board and shareholders (unless the Board appoints a separate Chair).</li>
    <li>The CEO may execute bonds, contracts, and other instruments on behalf of the Company, except where required by law or the Board to be otherwise signed or executed.</li>
    <li>The CEO shall have such other powers and duties as may be prescribed by the Board or these Bylaws.</li>
  </ul>

  <h3>Section 4.6 – Chief Financial Officer (CFO)</h3>
  <ul>
    <li>The CFO shall have charge and custody of all funds, securities, and financial records of the Company.</li>
    <li>The CFO shall oversee financial reporting, accounting controls, and tax compliance.</li>
    <li>The CFO shall render financial statements and reports as requested by the CEO or Board of Directors.</li>
    <li>The CFO may sign checks, drafts, and other instruments for the payment of money, subject to the Board’s approval policies.</li>
  </ul>

  <h3>Section 4.7 – Chief Experience Officer (CXO)</h3>
  <ul>
    <li>The CXO shall be responsible for the overall user, customer, and partner experience strategy of the Company.</li>
    <li>The CXO shall oversee operational and experiential excellence across delivery, brand, and support channels.</li>
    <li>The CXO may develop programs, tools, and initiatives to improve customer satisfaction, retention, and market engagement.</li>
  </ul>

  <h3>Section 4.8 – Corporate Secretary</h3>
  <ul>
    <li>The Corporate Secretary shall maintain the Company’s records, minutes, and corporate seal.</li>
    <li>The Secretary shall ensure proper notice and documentation of all meetings of shareholders and the Board.</li>
    <li>The Secretary shall authenticate records, filings, and correspondence of the Company.</li>
    <li>The Secretary may delegate recordkeeping duties under the Board’s supervision.</li>
  </ul>

  <h3>Section 4.9 – Additional Officers</h3>
  <p>
    The Board may create such other offices as it deems necessary, including but not limited to Chief Operating Officer,
    Chief Technology Officer, or Vice Presidents of specific divisions. The duties of such officers shall be as determined by
    the Board or by the officer designated by the Board to prescribe their duties.
  </p>

  <h3>Section 4.10 – Compensation of Officers</h3>
  <p>
    The compensation of officers shall be fixed or approved by the Board of Directors, which may delegate authority to
    a compensation committee. Compensation may include salary, equity, deferred compensation, and performance incentives as
    set forth in applicable agreements and resolutions.
  </p>

  <h3>Section 4.11 – Delegation of Authority</h3>
  <p>
    In case of the absence of any officer, or for any reason that the Board may deem sufficient, the Board may delegate the
    powers or duties of such officer to any other officer or director, temporarily or permanently.
  </p>

  <h3>Section 4.12 – Fidelity Bonds</h3>
  <p>
    The Board of Directors may require any officer or employee of the Company to furnish a bond for the faithful performance
    of duties, in such amount and with such sureties as the Board may determine.
  </p>

  <h2>Certification</h2>
  <p>
    The undersigned, ${data.secretary_name || ''}, Corporate Secretary of ${data.company_name || 'Company'}, hereby certifies that the foregoing is a
    true and correct copy of the Officers’ Article of the Bylaws, duly adopted by the Board of Directors on
    ${data.adoption_date || ''} and in full force and effect as of ${data.effective_date || ''}.
  </p>

  <table class="sig-grid">
    <tr>
      <td style="width:60%">
        <div class="line"></div>
        <div class="small">Signature: ${data.secretary_name || ''}, Corporate Secretary</div>
      </td>
      <td style="width:5%"></td>
      <td>
        <div class="line"></div>
        <div class="small">Date: ${data.execution_date || ''}</div>
      </td>
    </tr>
  </table>

  <hr/>
  <p class="muted">
    Developer placeholders: {{'{{company_name}}'}}, {{'{{state_of_incorporation}}'}}, {{'{{adoption_date}}'}},
    {{'{{effective_date}}'}}, {{'{{execution_date}}'}}, {{'{{secretary_name}}'}}.
  </p>

</body>
</html>`;

    case "irs_83b":
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>IRS Form 83(b) Election – Information Sheet</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    @page { size: A4; margin: 24mm 18mm; }
    body {
      font-family: "Inter","Helvetica Neue",Arial,sans-serif;
      font-size: 14px;
      line-height: 1.55;
      color: #111;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 {
      text-align: center;
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 8px;
      text-transform: uppercase;
    }
    h2 {
      font-size: 16px;
      font-weight: 600;
      margin: 16px 0 6px;
    }
    h3 { font-size: 14px; margin: 12px 0 6px; font-weight: 600; }
    p { margin: 6px 0 10px; }
    ul, ol { margin: 6px 0 10px 22px; }
    table { border-collapse: collapse; width: 100%; margin: 10px 0 18px; }
    th, td { border: 1px solid #d9d9d9; padding: 8px 10px; vertical-align: top; }
    th { background: #fafafa; text-align: left; font-weight: 600; }
    .muted { color: #666; font-size: 13px; }
    .small { font-size: 12px; color: #666; }
    .note { background: #fffbea; border: 1px solid #f3e29e; padding: 8px 10px; font-size: 13px; }
    .page-break { page-break-before: always; }
    .sig-grid { width: 100%; border-collapse: separate; border-spacing: 0 18px; }
    .line { display: block; border-bottom: 1px solid #333; height: 24px; margin-bottom: 4px; }
  </style>
</head>
<body>

  <h1>IRS FORM 83(b) ELECTION – INFORMATION & INSTRUCTIONS</h1>

  <p style="text-align:center;">
    Company: <strong>${data.company_name || 'Company'}</strong><br/>
    Recipient: <strong>${data.recipient_name || ''}</strong><br/>
    Equity Grant Date: ${data.grant_date || ''}<br/>
    Share Class: ${data.share_class || ''} (${data.share_type || ''})<br/>
    Number of Shares: ${data.share_count || ''}<br/>
    Price per Share: ${data.price_per_share || ''} ${data.currency || 'USD'}
  </p>
  <hr/>

  <div class="note small">
    This document provides general information for filing an IRS Section 83(b) election in connection with a restricted stock grant.
    It is not legal or tax advice. The recipient should consult a qualified tax professional before filing.
  </div>

  <h2>1. What is an 83(b) Election?</h2>
  <p>
    Under U.S. tax law (Section 83(b) of the Internal Revenue Code), when a person receives stock subject to vesting or other restrictions,
    the IRS generally treats the value of those shares as taxable income only when they vest.
    However, by filing an “83(b) election,” the taxpayer elects to be taxed immediately on the value of the shares
    at the time of purchase/grant, rather than later as they vest.
  </p>

  <p>
    For early-stage founders and employees, this often results in significant tax advantages — since the stock value
    at grant is usually very low, future appreciation can then qualify as long-term capital gains instead of ordinary income.
  </p>

  <h2>2. When to File</h2>
  <ul>
    <li>You must file your 83(b) election with the IRS <strong>within 30 calendar days</strong> of the date the stock was transferred (your grant date).</li>
    <li>This 30-day deadline is absolute — there are no extensions.</li>
  </ul>

  <h2>3. How to File</h2>
  <p>Follow these steps carefully:</p>
  <ol>
    <li>Complete and sign the <strong>83(b) Election Letter</strong> (see attached template below).</li>
    <li>Mail or deliver the signed letter to your local IRS office <strong>within 30 days</strong> of ${data.grant_date || ''}. Use certified mail with return receipt requested or a courier with tracking.</li>
    <li>Include a copy of the letter with your federal income tax return for the year of the grant.</li>
    <li>Provide one copy to ${data.company_name || 'the Company'} for its records (typically to the CFO or HR department).</li>
  </ol>

  <h2>4. Where to Send It</h2>
  <p>
    Mail the election to the IRS office that handles your tax return (based on your home address). The IRS maintains a
    <a href="https://www.irs.gov/filing/where-to-file-paper-tax-returns-with-or-without-a-payment" target="_blank">list of regional filing addresses</a>.
  </p>

  <h2>5. Example Calculation</h2>
  <p>
    Suppose you receive ${data.share_count || ''} shares at $${data.price_per_share || ''} per share on ${data.grant_date || ''}. The total value is
    ${data.total_grant_value || ''} ${data.currency || 'USD'}. You pay ${data.total_payment || ''} ${data.currency || 'USD'} for the shares. If you file the 83(b) election, you pay
    income tax on the difference (typically zero for par-value shares), and future appreciation is taxed as capital gain.
  </p>

  <h2>6. Common Mistakes to Avoid</h2>
  <ul>
    <li>Missing the 30-day filing deadline (cannot be fixed later).</li>
    <li>Failing to include a copy with your tax return or to notify the company.</li>
    <li>Listing incorrect share counts, grant dates, or values.</li>
    <li>Assuming this applies to options — 83(b) elections apply only to stock that has been purchased or issued, not unexercised options.</li>
  </ul>

  <h2>7. Company Contact for 83(b) Filings</h2>
  <table>
    <tr>
      <th>Contact Person</th><td>${data.cfo_name || ''}, Chief Financial Officer</td>
    </tr>
    <tr>
      <th>Email</th><td>${data.cfo_email || ''}</td>
    </tr>
    <tr>
      <th>Mailing Address</th><td>${data.company_address || ''}</td>
    </tr>
  </table>

  <h2>8. Acknowledgment</h2>
  <p>
    I, ${data.recipient_name || ''}, acknowledge receipt of this 83(b) information sheet and understand that it is my sole responsibility
    to timely file the 83(b) election with the IRS within 30 days of my stock grant date.
  </p>

  <table class="sig-grid">
    <tr>
      <td style="width:60%">
        <div class="line"></div>
        <div class="small">Signature: ${data.recipient_name || ''}</div>
      </td>
      <td style="width:5%"></td>
      <td>
        <div class="line"></div>
        <div class="small">Date</div>
      </td>
    </tr>
  </table>

  <hr/>
  <p class="muted">
    Developer placeholders: {{'{{company_name}}'}}, {{'{{recipient_name}}'}}, {{'{{grant_date}}'}}, {{'{{share_count}}'}},
    {{'{{price_per_share}}'}}, {{'{{currency}}'}}, {{'{{total_grant_value}}'}}, {{'{{total_payment}}'}},
    {{'{{share_class}}'}}, {{'{{share_type}}'}}, {{'{{cfo_name}}'}}, {{'{{cfo_email}}'}}, {{'{{company_address}}'}}.
  </p>

  <div class="page-break"></div>

  <h1>ATTACHMENT: SAMPLE 83(b) ELECTION LETTER</h1>
  <p>(Print on plain paper and sign before mailing to IRS)</p>

  <p>To: Internal Revenue Service<br/>
  [Appropriate IRS Office Address]</p>

  <p><strong>Re: Section 83(b) Election</strong></p>

  <p>
    Pursuant to Section 83(b) of the Internal Revenue Code, I hereby elect to include in my gross income for the current
    taxable year the fair market value of the property described below that was transferred to me in connection with the performance
    of services.
  </p>

  <h3>Taxpayer Information</h3>
  <table>
    <tr><th>Name:</th><td>${data.recipient_name || ''}</td></tr>
    <tr><th>Address:</th><td>${data.recipient_address || ''}</td></tr>
    <tr><th>Social Security No.:</th><td>${data.recipient_ssn || ''}</td></tr>
    <tr><th>Tax Year:</th><td>${data.tax_year || ''}</td></tr>
  </table>

  <h3>Description of Property</h3>
  <table>
    <tr><th>Type of Property:</th><td>${data.share_class || ''} Stock (${data.share_type || ''})</td></tr>
    <tr><th>Date of Transfer:</th><td>${data.grant_date || ''}</td></tr>
    <tr><th>Number of Shares:</th><td>${data.share_count || ''}</td></tr>
    <tr><th>Fair Market Value per Share:</th><td>${data.price_per_share || ''} ${data.currency || 'USD'}</td></tr>
    <tr><th>Total Fair Market Value:</th><td>${data.total_grant_value || ''} ${data.currency || 'USD'}</td></tr>
    <tr><th>Amount Paid for Shares:</th><td>${data.total_payment || ''} ${data.currency || 'USD'}</td></tr>
    <tr><th>Amount to Include in Income:</th><td>${data.taxable_difference || ''} ${data.currency || 'USD'}</td></tr>
  </table>

  <h3>Statement</h3>
  <p>
    These shares are subject to vesting over ${data.vesting_schedule || '4 years with 1-year cliff'}, and may be forfeited if my service terminates before full vesting.
    I will notify the Company if the shares are forfeited and will not seek a refund of taxes paid under this election.
  </p>

  <p>
    Copies of this election have been furnished to the Company and will be attached to my federal income tax return for
    the year ${data.tax_year || ''}.
  </p>

  <table class="sig-grid">
    <tr>
      <td style="width:60%">
        <div class="line"></div>
        <div class="small">Signature: ${data.recipient_name || ''}</div>
      </td>
      <td style="width:5%"></td>
      <td>
        <div class="line"></div>
        <div class="small">Date: ${data.grant_date || ''}</div>
      </td>
    </tr>
  </table>

  <hr/>
  <p class="small muted">
    Reminder: Mail this election within 30 days of ${data.grant_date || ''}. Send one copy to the IRS, one to ${data.company_name || 'the Company'}, and retain one for your records.
  </p>

</body>
</html>`;

      body = `
        <h1>${template.title}</h1>
        <div class="section">
          <p><strong>Company:</strong> ${data.company_name || "Crave'n, Inc."}</p>
          ${data.full_name ? `<p><strong>Name:</strong> ${data.full_name}</p>` : ""}
          ${data.role ? `<p><strong>Role:</strong> ${data.role}</p>` : ""}
        </div>
        <div class="section">
          <p>This document contains the terms and conditions for ${template.title.toLowerCase()}.</p>
        </div>
      `;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${template.title}</title>
  ${styles}
</head>
<body>
  ${body}
</body>
</html>`;
}
