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

<p class="muted">${data.company_name || "Company"}</p>

<p>This Executive Employment Agreement ("Agreement") is entered into as of ${data.effective_date || "TBD"} by and between ${data.company_name || "Company"} ("Company") and ${data.full_name || "Executive"} ("Executive"), who will serve as ${data.role || "Executive"}.</p>

<h3>1. Duties</h3>

<p>Executive shall devote professional efforts to the duties customary of a ${data.role || "Executive"} and as directed by the Board.</p>

<h3>2. Equity</h3>

<p>As additional consideration, Executive is granted ${data.equity_percentage || "0"}% equity in the Company, subject to any applicable vesting terms and the Company's equity plan and stock agreements executed concurrently.</p>

<h3>3. Compensation (Deferred)</h3>

<p>Base salary shall be <strong>deferred</strong> until the Company secures at least <strong>${data.funding_trigger || "Series A funding"}</strong> in funding (equity, debt, or grants) or net revenue, as determined by the Board. Upon such event, accrued base salary shall become payable within thirty (30) days unless otherwise agreed in writing. Prior to such event, no cash salary shall be due.</p>

<h3>4. Confidentiality & IP Assignment</h3>

<p>Executive agrees to be bound by the Company's Confidentiality & Intellectual Property Assignment Agreement executed concurrently with this Agreement.</p>

<h3>5. At-Will Employment</h3>

<p>Employment is at-will and may be terminated by either party at any time, with or without cause or notice, subject to any equity and accrued obligations herein.</p>

<h3>6. Restrictive Covenants</h3>

<p>During employment and for 12 months after termination, Executive shall not solicit employees or contractors of the Company. Non-compete obligations, if any, are as allowed by applicable law.</p>

<h3>7. Dispute Resolution</h3>

<p>Any dispute shall be resolved in the courts of the State of ${data.governing_law || "Delaware"} unless the parties later agree to arbitration.</p>

<div class="sig-block">
  <div class="sig">
    <div style="height:80px">${data.signature_company_html || ""}</div>
    <div class="label">${data.company_name || "Company"}</div>
  </div>
  <div class="sig">
    <div style="height:80px">${data.signature_executive_html || ""}</div>
    <div class="label">${data.full_name || "Executive"}, ${data.role || "Title"}</div>
  </div>
</div>
      `;
      break;

    case "board_resolution":
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Board Resolution – Appointment of Officers</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    @page {
      size: A4;
      margin: 24mm 18mm 24mm 18mm;
    }
    :root {
      --text: #111;
      --muted: #555;
      --border: #d9d9d9;
      --accent: #222;
      --small: 12px;
      --base: 14px;
      --h1: 20px;
      --h2: 16px;
    }
    html, body {
      font-family: "Inter", "Helvetica Neue", Arial, sans-serif;
      color: var(--text);
      line-height: 1.45;
      font-size: var(--base);
    }
    .doc {
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 16px;
    }
    .company-name {
      font-weight: 700;
      font-size: var(--h2);
      letter-spacing: .3px;
    }
    .doc-title {
      font-weight: 800;
      font-size: var(--h1);
      margin-top: 6px;
      text-transform: uppercase;
    }
    .meta {
      text-align: center;
      font-size: var(--small);
      color: var(--muted);
      margin-bottom: 18px;
    }
    hr.rule {
      border: 0;
      border-top: 1px solid var(--border);
      margin: 12px 0 18px;
    }
    h3 {
      font-size: var(--h2);
      margin: 16px 0 6px;
      color: var(--accent);
    }
    p {
      margin: 6px 0 10px;
    }
    .whereas p { margin: 6px 0; }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0 14px;
      font-size: var(--base);
    }
    .table th, .table td {
      border: 1px solid var(--border);
      padding: 8px 10px;
      vertical-align: top;
    }
    .table th {
      text-align: left;
      background: #fafafa;
      font-weight: 600;
    }
    .sig-grid {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0 22px;
      margin-top: 8px;
    }
    .sig {
      width: 100%;
    }
    .sig .line {
      display: block;
      border-bottom: 1px solid #333;
      height: 24px;
      margin-bottom: 4px;
    }
    .sig .label {
      font-size: var(--small);
      color: var(--muted);
    }
    .muted { color: var(--muted); }
    .small { font-size: var(--small); }
    .page-break { page-break-before: always; }
    ul { margin: 6px 0 10px 20px; }
  </style>
</head>
<body>
  <div class="doc">
    <div class="header">
      <div class="company-name">${data.company_name || 'Company'}</div>
      <div class="doc-title">Board Resolution – Appointment of Officers</div>
      <div class="meta">Adopted on ${data.adoption_date || data.date || ''}</div>
    </div>

    <hr class="rule" />

    <p>
      The undersigned, being all of the members of the Board of Directors (the "Board") of
      <strong>${data.company_name || 'Company'}</strong>, a <strong>${data.state_of_incorporation || 'Delaware'}</strong> corporation (the "Company"),
      hereby adopts the following resolutions by unanimous written consent pursuant to the laws of the State of
      <strong>${data.state_of_incorporation || 'Delaware'}</strong> and the Company's Bylaws.
    </p>

    <h3>Whereas</h3>
    <div class="whereas">
      <p>1. The Company has been duly formed and organized under the laws of the State of ${data.state_of_incorporation || 'Delaware'}; and</p>
      <p>2. The Board deems it in the best interest of the Company to appoint officers to manage and oversee its operations, and to define their roles and powers as set forth herein.</p>
    </div>

    <h3>Now, therefore, be it resolved that:</h3>

    <p><strong>1. Appointment of Officers.</strong> The following individuals are hereby appointed to serve as officers of the Company effective as of <strong>${data.effective_date || data.date || ''}</strong>, to hold their respective offices until their successors are duly appointed or until their earlier resignation or removal:</p>

    <table class="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Title</th>
          <th>Term</th>
          <th>Signature (acknowledgment)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${data.ceo_name || ''}</td>
          <td>Chief Executive Officer (CEO)</td>
          <td>Indefinite</td>
          <td>&nbsp;</td>
        </tr>
        <tr>
          <td>${data.cfo_name || ''}</td>
          <td>Chief Financial Officer (CFO)</td>
          <td>Indefinite</td>
          <td>&nbsp;</td>
        </tr>
        <tr>
          <td>${data.cxo_name || ''}</td>
          <td>Chief Experience Officer (CXO)</td>
          <td>Indefinite</td>
          <td>&nbsp;</td>
        </tr>
        <tr>
          <td>${data.secretary_name || ''}</td>
          <td>Corporate Secretary</td>
          <td>Indefinite</td>
          <td>&nbsp;</td>
        </tr>
      </tbody>
    </table>

    <p><strong>2. Duties and Responsibilities.</strong> Each officer shall have the powers and perform the duties customarily associated with their office and as provided in the Company's Bylaws, including but not limited to the following:
      <span class="small muted">(summary)</span>
    </p>
    <ul>
      <li><strong>Chief Executive Officer:</strong> general supervision and control over all business and affairs of the Company.</li>
      <li><strong>Chief Financial Officer:</strong> oversight of financial policies, books and records, reporting, and regulatory compliance.</li>
      <li><strong>Chief Experience Officer:</strong> strategy and oversight for customer/merchant/driver experience and brand execution.</li>
      <li><strong>Corporate Secretary:</strong> custody of corporate records and minutes; preparation and filing of required notices and consents.</li>
    </ul>

    <p><strong>3. Authority to Act.</strong> Each officer named above is authorized and empowered to execute, acknowledge, and deliver any and all contracts, documents, or instruments on behalf of the Company consistent with the ordinary course of business.</p>

    <p><strong>4. Ratification.</strong> All prior acts taken by these officers in connection with the Company's formation and organization are hereby ratified, confirmed, and approved.</p>

    <p><strong>5. Filing and Maintenance.</strong> A copy of this resolution shall be filed in the corporate record book of the Company, maintained by the Corporate Secretary.</p>

    <h3>In Witness Whereof</h3>
    <p>
      The undersigned have executed this Resolution as of <strong>${data.execution_date || data.date || ''}</strong>.
    </p>

    <h3>Board of Directors</h3>
    <table class="sig-grid">
      <tr>
        <td>
          <div class="sig">
            <span class="line"></span>
            <div class="label">Signature</div>
          </div>
        </td>
        <td style="width: 40px;"></td>
        <td>
          <div class="sig">
            <span class="line"></span>
            <div class="label">Date</div>
          </div>
        </td>
      </tr>
      <tr>
        <td colspan="3" class="small"><strong>Name:</strong> ${data.board_member_1 || data.directors || ''} &nbsp; | &nbsp; <strong>Title:</strong> Director</td>
      </tr>
    </table>

    <table class="sig-grid">
      <tr>
        <td>
          <div class="sig">
            <span class="line"></span>
            <div class="label">Signature</div>
          </div>
        </td>
        <td style="width: 40px;"></td>
        <td>
          <div class="sig">
            <span class="line"></span>
            <div class="label">Date</div>
          </div>
        </td>
      </tr>
      <tr>
        <td colspan="3" class="small"><strong>Name:</strong> ${data.board_member_2 || ''} &nbsp; | &nbsp; <strong>Title:</strong> Director</td>
      </tr>
    </table>

  </div>
</body>
</html>`;

    case "founders_agreement":
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Founders' / Shareholders' Agreement</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    @page {
      size: A4;
      margin: 24mm 18mm 24mm 18mm;
    }
    body {
      font-family: "Inter", "Helvetica Neue", Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #111;
      max-width: 800px;
      margin: 0 auto;
    }
    h1, h2, h3 {
      font-weight: 700;
      margin-bottom: 6px;
    }
    h1 { text-align: center; font-size: 20px; text-transform: uppercase; }
    h2 { font-size: 16px; margin-top: 18px; }
    h3 { font-size: 14px; margin-top: 12px; }
    p { margin: 6px 0 10px; }
    ul { margin: 6px 0 10px 20px; }
    ol { margin: 6px 0 10px 20px; }
    table { border-collapse: collapse; width: 100%; margin: 10px 0 18px; }
    th, td { border: 1px solid #d9d9d9; padding: 8px 10px; }
    th { background: #f8f8f8; text-align: left; font-weight: 600; }
    .signature { margin-top: 28px; }
    .sig-line {
      border-bottom: 1px solid #333;
      height: 24px;
      width: 100%;
      display: block;
      margin-bottom: 4px;
    }
    .sig-label { font-size: 12px; color: #666; }
    .page-break { page-break-before: always; }
  </style>
</head>
<body>

  <h1>FOUNDERS' / SHAREHOLDERS' AGREEMENT</h1>
  <p style="text-align:center;"><strong>${data.company_name || 'Company'}</strong><br>
  Effective Date: ${data.effective_date || ''}</p>
  <hr>

  <p>This Founders' / Shareholders' Agreement (the "Agreement") is entered into on ${data.effective_date || ''} by and among the undersigned founders and shareholders of <strong>${data.company_name || 'Company'}</strong>, a ${data.state_of_incorporation || 'Delaware'} corporation (the "Company").</p>

  <h2>1. Purpose</h2>
  <p>This Agreement sets forth the mutual understanding of the Founders regarding their rights, obligations, and ownership interests in the Company, as well as the management and operation of the Company and protection of its intellectual property.</p>

  <h2>2. Parties</h2>
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Title/Role</th>
        <th>Equity %</th>
        <th>Shares</th>
        <th>Vesting</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${data.founder_1_name || ''}</td>
        <td>${data.founder_1_role || ''}</td>
        <td>${data.founder_1_percent || ''}%</td>
        <td>${data.founder_1_shares || ''}</td>
        <td>${data.founder_1_vesting || data.vesting_years + ' years'}</td>
      </tr>
      <tr>
        <td>${data.founder_2_name || ''}</td>
        <td>${data.founder_2_role || ''}</td>
        <td>${data.founder_2_percent || ''}%</td>
        <td>${data.founder_2_shares || ''}</td>
        <td>${data.founder_2_vesting || data.vesting_years + ' years'}</td>
      </tr>
      <tr>
        <td>${data.founder_3_name || ''}</td>
        <td>${data.founder_3_role || ''}</td>
        <td>${data.founder_3_percent || ''}%</td>
        <td>${data.founder_3_shares || ''}</td>
        <td>${data.founder_3_vesting || data.vesting_years + ' years'}</td>
      </tr>
    </tbody>
  </table>

  <h2>3. Capital Structure</h2>
  <p>The Company's authorized capital stock shall consist of ${data.authorized_shares || ''} shares of common stock, par value ${data.par_value || '$0.0001'} per share. The distribution of shares among the Founders is detailed above.</p>

  <h2>4. Vesting</h2>
  <p>To ensure long-term commitment, each Founder's shares shall be subject to a vesting schedule of four (4) years, with a one (1) year cliff, unless otherwise agreed in writing. If a Founder ceases to be employed by or involved with the Company before full vesting, all unvested shares shall be forfeited or subject to repurchase by the Company at cost.</p>

  <h2>5. Roles and Responsibilities</h2>
  <ul>
    <li><strong>Chief Executive Officer (${data.founder_1_name || ''}):</strong> Overall leadership, strategy, and operations.</li>
    <li><strong>Chief Financial Officer (${data.founder_2_name || ''}):</strong> Oversees finances, accounting, and investment relations.</li>
    <li><strong>Chief Experience Officer (${data.founder_3_name || ''}):</strong> Directs user experience, branding, and engagement.</li>
  </ul>

  <h2>6. Decision-Making and Voting</h2>
  <p>All major company decisions shall require the approval of the majority of shares outstanding. For critical matters such as mergers, acquisitions, or dissolution, unanimous consent of the Founders is required.</p>

  <h2>7. Transfer of Shares</h2>
  <p>No Founder shall transfer or sell any shares without first offering such shares to the Company and then to the remaining Founders, in that order, at fair market value. Any transfer not in accordance with this section shall be void.</p>

  <h2>8. Intellectual Property Assignment</h2>
  <p>Each Founder hereby assigns and transfers to the Company all rights, title, and interest in and to any inventions, works, software, designs, trade secrets, or other intellectual property developed in connection with the Company's business, whether developed before or after the date of this Agreement.</p>

  <h2>9. Confidentiality</h2>
  <p>All information related to the Company's products, strategy, finances, or clients shall be treated as confidential. No Founder shall disclose any confidential information without prior written consent from the Board of Directors.</p>

  <h2>10. Founder Departure or Termination</h2>
  <p>If a Founder voluntarily leaves or is removed for cause, the Company retains the right to repurchase all or part of that Founder's shares at the original issue price or fair market value, whichever is lower, subject to vesting status.</p>

  <h2>11. Dispute Resolution</h2>
  <p>Any dispute arising under this Agreement shall first be attempted to be resolved through mediation. If unresolved, it shall be submitted to binding arbitration in ${data.state_of_incorporation || data.governing_law || 'Delaware'} under the rules of the American Arbitration Association.</p>

  <h2>12. Governing Law</h2>
  <p>This Agreement shall be governed by and construed in accordance with the laws of the State of ${data.state_of_incorporation || data.governing_law || 'Delaware'}, without regard to conflict of laws principles.</p>

  <h2>13. Entire Agreement</h2>
  <p>This document constitutes the entire understanding among the Founders and supersedes all prior oral or written agreements. Amendments must be in writing and signed by all Founders.</p>

  <div class="page-break"></div>

  <h2>IN WITNESS WHEREOF</h2>
  <p>The undersigned Founders have executed this Agreement as of the date first written above.</p>

  <table class="signature">
    <tr>
      <td>
        <span class="sig-line"></span>
        <div class="sig-label">Signature of ${data.founder_1_name || 'Founder 1'}</div>
      </td>
      <td style="width:40px;"></td>
      <td>
        <span class="sig-line"></span>
        <div class="sig-label">Date</div>
      </td>
    </tr>
  </table>

  <table class="signature">
    <tr>
      <td>
        <span class="sig-line"></span>
        <div class="sig-label">Signature of ${data.founder_2_name || 'Founder 2'}</div>
      </td>
      <td style="width:40px;"></td>
      <td>
        <span class="sig-line"></span>
        <div class="sig-label">Date</div>
      </td>
    </tr>
  </table>

  <table class="signature">
    <tr>
      <td>
        <span class="sig-line"></span>
        <div class="sig-label">Signature of ${data.founder_3_name || 'Founder 3'}</div>
      </td>
      <td style="width:40px;"></td>
      <td>
        <span class="sig-line"></span>
        <div class="sig-label">Date</div>
      </td>
    </tr>
  </table>

  <hr>
  <p style="font-size:12px;color:#777;">
    Developer Note: Replace placeholders using your automated data injection system. Store signed PDF in the corporate document registry for recordkeeping.
  </p>

</body>
</html>`;

    case "stock_issuance":
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Stock Subscription / Issuance Agreement</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    @page { size: A4; margin: 24mm 18mm; }
    :root {
      --text:#111; --muted:#666; --border:#d9d9d9;
      --small:12px; --base:14px; --h1:20px; --h2:16px;
    }
    body { font-family: "Inter","Helvetica Neue",Arial,sans-serif; color:var(--text); font-size:var(--base); line-height:1.5; }
    .doc { max-width:800px; margin:0 auto; }
    h1 { text-align:center; font-size:var(--h1); text-transform:uppercase; margin-bottom:6px; }
    h2 { font-size:var(--h2); margin:18px 0 8px; }
    h3 { font-size:14px; margin:12px 0 6px; }
    p { margin:6px 0 10px; }
    ul { margin:6px 0 10px 20px; }
    ol { margin:6px 0 10px 20px; }
    table { border-collapse: collapse; width:100%; margin:8px 0 16px; }
    th, td { border:1px solid var(--border); padding:8px 10px; vertical-align:top; }
    th { background:#fafafa; text-align:left; font-weight:600; }
    .small { font-size:var(--small); color:var(--muted); }
    .muted { color:var(--muted); }
    .sig-table { width:100%; border-collapse:separate; border-spacing:0 18px; }
    .line { display:block; border-bottom:1px solid #333; height:24px; margin-bottom:4px; }
    .page-break { page-break-before: always; }
  </style>
</head>
<body>
  <div class="doc">
    <h1>STOCK SUBSCRIPTION / ISSUANCE AGREEMENT</h1>
    <p style="text-align:center;">
      <strong>${data.company_name || 'Company'}</strong> (a ${data.state_of_incorporation || 'Delaware'} corporation)<br/>
      Effective Date: ${data.effective_date || ''}
    </p>
    <hr/>

    <p>
      This Stock Subscription / Issuance Agreement (this "Agreement") is entered into by and between
      <strong>${data.company_name || 'Company'}</strong>, a ${data.state_of_incorporation || 'Delaware'} corporation (the "Company"), and
      <strong>${data.subscriber_name || data.full_name || ''}</strong> (the "Subscriber").
    </p>

    <h2>1. Subscription and Purchase</h2>
    <p>
      Subject to the terms and conditions herein, the Subscriber hereby irrevocably subscribes for and agrees to purchase
      from the Company, and the Company agrees to issue and sell to the Subscriber, the following securities (the "Shares"):
    </p>
    <table>
      <tr><th>Share Class</th><td>${data.share_class || data.class_name || 'Common'} ${data.series_label || ''}</td></tr>
      <tr><th>Number of Shares</th><td>${data.share_count || ''}</td></tr>
      <tr><th>Price per Share</th><td>${data.price_per_share || data.par_value || ''} ${data.currency || 'USD'}</td></tr>
      <tr><th>Total Purchase Price</th><td>${data.total_purchase_price || ''} ${data.currency || 'USD'}</td></tr>
      <tr><th>Consideration</th><td>${data.consideration_type || data.consideration || 'Services'}</td></tr>
      <tr><th>Vesting (if applicable)</th><td>${data.vesting_terms || data.vesting_schedule || '4 years, 1-year cliff'}</td></tr>
      <tr><th>Certificate/Book-Entry</th><td>${data.certificate_form || 'Book-entry'}</td></tr>
    </table>

    <h2>2. Closing; Delivery</h2>
    <p>
      The closing of the purchase and sale of the Shares (the "Closing") shall occur on ${data.closing_date || data.effective_date || ''} or such other date as
      the Company and Subscriber may mutually agree. At Closing, (a) the Subscriber shall deliver the Total Purchase Price by
      ${data.payment_method || 'wire transfer'}, and (b) the Company shall issue the Shares to the Subscriber and update its stock ledger.
    </p>

    <h2>3. Subscriber Representations and Warranties</h2>
    <p>The Subscriber represents and warrants to the Company as of the Effective Date and the Closing that:</p>
    <ul>
      <li><strong>Authority.</strong> Subscriber has full power and authority to enter into this Agreement and perform its obligations.</li>
      <li><strong>Accredited / Sophistication.</strong> Subscriber is ${data.accredited_status || 'an accredited investor'} or otherwise has such knowledge and experience in financial and business matters to evaluate the merits and risks of the investment.</li>
      <li><strong>Investment Intent.</strong> The Shares are being acquired for investment for Subscriber's own account, not with a view to distribution.</li>
      <li><strong>Information.</strong> Subscriber has had access to all information it deems necessary to make an informed investment decision.</li>
      <li><strong>Compliance.</strong> Subscriber acknowledges the Shares have not been registered under the Securities Act of 1933, as amended (the "Securities Act"), or any state securities laws, and are being offered and sold pursuant to exemptions therefrom.</li>
      <li><strong>Legends/Transfer Restrictions.</strong> Subscriber understands the Shares may bear restrictive legends and are subject to transfer restrictions under applicable law and Company agreements (including any shareholders' agreement or ROFR/co-sale provisions).</li>
    </ul>

    <h2>4. Company Representations and Warranties</h2>
    <ul>
      <li><strong>Organization; Authority.</strong> The Company is duly organized, validly existing, and in good standing under the laws of ${data.state_of_incorporation || 'Delaware'}, and has the requisite corporate power to execute and deliver this Agreement and issue the Shares.</li>
      <li><strong>Authorization.</strong> All corporate actions required for the authorization, execution, delivery, and performance of this Agreement, and for the issuance and delivery of the Shares, have been duly taken (see Board Resolution reference: ${data.board_resolution_date || ''}).</li>
      <li><strong>Valid Issuance.</strong> Upon issuance and payment therefor, the Shares will be duly authorized, validly issued, fully paid, and non-assessable, subject to restrictions under applicable securities laws and Company agreements.</li>
    </ul>

    <h2>5. Transfer Restrictions; Company Agreements</h2>
    <p>
      The Shares are subject to the Company's organizational documents and any agreements to which Subscriber becomes a party,
      including a shareholders'/founders' agreement, right of first refusal and co-sale (ROFR/Co-Sale), and market-standard
      drag-along/tag-along provisions (each, as applicable). Any attempted transfer in violation of the foregoing shall be void.
    </p>

    <h2>6. Governing Law</h2>
    <p>This Agreement shall be governed by the laws of the State of ${data.governing_law_state || data.governing_law || 'Delaware'}, without regard to conflict-of-laws principles.</p>

    <h2>Signatures</h2>
    <table class="sig-table">
      <tr>
        <td style="width:60%">
          <div class="line"></div>
          <div class="small">Subscriber Signature: ${data.subscriber_name || data.full_name || ''}</div>
        </td>
        <td style="width:5%"></td>
        <td>
          <div class="line"></div>
          <div class="small">Date</div>
        </td>
      </tr>
    </table>

    <table class="sig-table">
      <tr>
        <td style="width:60%">
          <div class="line"></div>
          <div class="small">Company Signature: ${data.signatory_name || ''}, ${data.signatory_title || ''}</div>
        </td>
        <td style="width:5%"></td>
        <td>
          <div class="line"></div>
          <div class="small">Date</div>
        </td>
      </tr>
    </table>

  </div>
</body>
</html>`;

    case "confidentiality_ip":
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Confidentiality & IP Assignment Agreement</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    @page { size: A4; margin: 24mm 18mm; }
    :root {
      --text:#111; --muted:#666; --border:#d9d9d9;
      --small:12px; --base:14px; --h1:20px; --h2:16px;
    }
    body { font-family:"Inter","Helvetica Neue",Arial,sans-serif; color:var(--text); font-size:var(--base); line-height:1.52; }
    .doc { max-width:800px; margin:0 auto; }
    h1 { text-align:center; font-size:var(--h1); text-transform:uppercase; margin-bottom:6px; }
    h2 { font-size:var(--h2); margin:18px 0 8px; }
    h3 { font-size:14px; margin:12px 0 6px; }
    p { margin:6px 0 10px; }
    ul { margin:6px 0 10px 20px; }
    table { border-collapse:collapse; width:100%; margin:8px 0 16px; }
    th, td { border:1px solid var(--border); padding:8px 10px; vertical-align:top; }
    th { background:#fafafa; text-align:left; font-weight:600; }
    .muted { color:var(--muted); }
    .small { font-size:var(--small); color:var(--muted); }
    .sig-grid { width:100%; border-collapse:separate; border-spacing:0 18px; }
    .line { display:block; border-bottom:1px solid #333; height:24px; margin-bottom:4px; }
    .page-break { page-break-before:always; }
    .note { background:#fffbea; border:1px solid #f3e29e; padding:8px 10px; font-size:13px; }
  </style>
</head>
<body>
  <div class="doc">
    <h1>CONFIDENTIALITY & IP ASSIGNMENT AGREEMENT</h1>
    <p style="text-align:center;">
      <strong>${data.company_name || 'Company'}</strong>, a ${data.state_of_incorporation || 'Delaware'} corporation (the "Company")<br/>
      Counterparty: <strong>${data.counterparty_name || data.full_name || ''}</strong> (the "Contributor")<br/>
      Effective Date: ${data.effective_date || ''}
    </p>
    <hr/>

    <div class="note small">
      Developer note: This agreement is used for employees, founders, executives, contractors, and advisors.
    </div>

    <h2>1. Definitions</h2>
    <p><strong>"Confidential Information"</strong> means any non-public information disclosed by or on behalf of the Company, whether oral, visual, written, electronic, or otherwise, including without limitation product plans, designs, software, source code, data, customer lists, pricing, financials, strategies, roadmaps, know-how, trade secrets, and third-party information held in confidence by the Company. Confidential Information includes the existence and terms of this Agreement.</p>
    <p><strong>"Inventions"</strong> means any and all discoveries, developments, works of authorship, designs, methods, processes, formulas, compositions, techniques, databases, mask works, trademarks, trade dress, copyrights, trade secrets, and patentable or unpatentable ideas, whether or not reduced to practice.</p>

    <h2>2. Confidentiality Obligations</h2>
    <ul>
      <li><strong>Non-use / Non-disclosure.</strong> Contributor shall hold Confidential Information in strict confidence and not use it for any purpose other than performing services or duties for the Company.</li>
      <li><strong>Standard of care.</strong> At least the care Contributor uses to protect its own similar information, and no less than reasonable care.</li>
      <li><strong>Access limitation.</strong> Disclose only to persons who have a need to know for Company purposes and who are bound by obligations at least as protective as this Agreement.</li>
    </ul>

    <h2>3. Exclusions</h2>
    <p>Obligations in Section 2 do not apply to information that: (a) is or becomes generally available without breach; (b) was known to Contributor without restriction before disclosure as evidenced by written records; (c) is independently developed without use of Confidential Information; or (d) is rightfully received from a third party without duty of confidentiality.</p>

    <h2>4. Return / Deletion</h2>
    <p>Upon the earlier of the Company's request or termination of engagement, Contributor shall promptly cease use of, and return or securely delete, all Confidential Information and Company Property.</p>

    <h2>5. Inventions; Assignment</h2>
    <ul>
      <li><strong>Disclosure.</strong> Contributor will promptly disclose to the Company all Inventions that Contributor conceives, reduces to practice, or develops, alone or jointly, in connection with services to the Company, or that relate to the Company's business, R&D, or anticipated products ("<strong>Company Inventions</strong>").</li>
      <li><strong>Work-Made-for-Hire.</strong> To the maximum extent permitted by law, Company Inventions are "works made for hire." To the extent not so deemed, Contributor hereby irrevocably assigns to the Company all right, title, and interest worldwide in and to all Company Inventions and all associated IP rights.</li>
      <li><strong>Moral Rights.</strong> Contributor irrevocably waives and agrees not to assert any moral rights (or similar) in Company Inventions, to the extent permitted.</li>
      <li><strong>Further Assurances.</strong> Contributor will execute documents and take actions reasonably requested to perfect, record, or enforce the Company's rights.</li>
    </ul>

    <h2>6. Non-Solicitation</h2>
    <p>Contributor will not directly solicit for employment or engagement any Company employee or contractor with whom Contributor worked, for 12 months post-termination, except via public, non-targeted advertisements.</p>

    <h2>7. Governing Law</h2>
    <p>This Agreement is governed by the laws of ${data.governing_law_state || data.governing_law || 'Delaware'}, without regard to conflicts principles.</p>

    <h2>Signatures</h2>
    <table class="sig-grid">
      <tr>
        <td style="width:60%">
          <div class="line"></div>
          <div class="small">Contributor: ${data.counterparty_name || data.full_name || ''}</div>
        </td>
        <td style="width:5%"></td>
        <td>
          <div class="line"></div>
          <div class="small">Date</div>
        </td>
      </tr>
    </table>
    <table class="sig-grid">
      <tr>
        <td style="width:60%">
          <div class="line"></div>
          <div class="small">Company: ${data.signatory_name || ''}, ${data.signatory_title || ''}, ${data.company_name || 'Company'}</div>
        </td>
        <td style="width:5%"></td>
        <td>
          <div class="line"></div>
          <div class="small">Date</div>
        </td>
      </tr>
    </table>

  </div>
</body>
</html>`;

    case "deferred_comp_addendum":
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Deferred Compensation Addendum</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    @page { size: A4; margin: 24mm 18mm; }
    :root {
      --text:#111; --muted:#666; --border:#d9d9d9;
      --small:12px; --base:14px; --h1:20px; --h2:16px;
    }
    body { font-family:"Inter","Helvetica Neue",Arial,sans-serif; color:var(--text); font-size:var(--base); line-height:1.52; }
    .doc { max-width:800px; margin:0 auto; }
    h1 { text-align:center; font-size:var(--h1); text-transform:uppercase; margin-bottom:6px; }
    h2 { font-size:var(--h2); margin:18px 0 8px; }
    h3 { font-size:14px; margin:12px 0 6px; }
    p { margin:6px 0 10px; }
    ul { margin:6px 0 10px 20px; }
    ol { margin:6px 0 10px 20px; }
    table { border-collapse:collapse; width:100%; margin:8px 0 16px; }
    th, td { border:1px solid var(--border); padding:8px 10px; vertical-align:top; }
    th { background:#fafafa; text-align:left; font-weight:600; }
    .muted { color:var(--muted); }
    .small { font-size:var(--small); color:var(--muted); }
    .sig-grid { width:100%; border-collapse:separate; border-spacing:0 18px; }
    .line { display:block; border-bottom:1px solid #333; height:24px; margin-bottom:4px; }
    .page-break { page-break-before:always; }
    .note { background:#fffbea; border:1px solid #f3e29e; padding:8px 10px; font-size:13px; }
    .callout { background:#f7faff; border:1px solid #cfe3ff; padding:8px 10px; }
  </style>
</head>
<body>
  <div class="doc">
    <h1>DEFERRED COMPENSATION ADDENDUM</h1>
    <p style="text-align:center;">
      Addendum to: <strong>${data.base_agreement_title || 'Executive Employment Agreement'}</strong><br/>
      Company: <strong>${data.company_name || 'Company'}</strong>, a ${data.state_of_incorporation || 'Delaware'} corporation (the "Company")<br/>
      Executive: <strong>${data.executive_name || data.full_name || ''}</strong> (the "Executive")<br/>
      Effective Date: ${data.effective_date || ''}
    </p>
    <hr/>

    <div class="note small">
      Developer note: Attach this to an Executive Employment Agreement / Offer Letter. Use this addendum to defer cash salary until a funding or revenue trigger occurs.
    </div>

    <h2>1. Purpose; Incorporation</h2>
    <p>
      This Deferred Compensation Addendum (the "Addendum") modifies and is incorporated into the ${data.base_agreement_title || 'Executive Employment Agreement'} between the Company and the Executive dated ${data.base_agreement_date || data.effective_date || ''} (the "Base Agreement"). Except as expressly modified herein, the Base Agreement remains in full force and effect.
    </p>

    <h2>2. Covered Compensation</h2>
    <table>
      <tr><th>Role / Title</th><td>${data.position_title || data.role || ''}</td></tr>
      <tr><th>Annual Base Salary (Gross)</th><td>${data.annual_base_salary || ''} ${data.currency || 'USD'} (the "Base Salary")</td></tr>
      <tr><th>Deferral Start Date</th><td>${data.deferral_start_date || data.effective_date || ''}</td></tr>
      <tr><th>Deferral Percentage</th><td>${data.deferral_percentage || '100'}% of Base Salary</td></tr>
    </table>

    <h2>3. Deferral Mechanics; Accrual</h2>
    <ul>
      <li><strong>Deferral.</strong> During the Deferral Period (Section 4), the Deferred Portion of Base Salary shall accrue but not be paid in cash.</li>
      <li><strong>Ledger.</strong> The Company shall maintain a deferred compensation ledger for the Executive itemizing gross amounts, statutory deductions, and net balances.</li>
      <li><strong>Tax Withholding.</strong> Amounts paid when due shall be subject to applicable withholding and payroll taxes at the time of payment, unless otherwise required by law.</li>
    </ul>

    <h2>4. Deferral Period; Payment Triggers</h2>
    <p>The "Deferral Period" begins on ${data.deferral_start_date || data.effective_date || ''} and ends upon the earliest to occur of the following triggers (each, a "Payment Trigger"):</p>
    <ol>
      <li><strong>Funding Trigger:</strong> The Company receives aggregate new funding or cash from operations of at least <strong>${data.funding_trigger_amount || data.funding_trigger || 'Series A funding'} ${data.currency || 'USD'}</strong> after the Effective Date; or</li>
      <li><strong>Board Trigger:</strong> The Board authorizes payment of all or a portion of deferred amounts; or</li>
      <li><strong>Exit Trigger:</strong> A Change in Control, asset sale, or similar liquidity event; or</li>
      <li><strong>Termination Trigger:</strong> Termination of Executive's service for any reason (see Section 6).</li>
    </ol>

    <h2>5. Payment Timing; Priority; Method</h2>
    <ul>
      <li><strong>Timing.</strong> Upon a Payment Trigger, the Company shall pay accrued deferred amounts (plus any applicable interest) within <strong>${data.payment_deadline_days || '30'}</strong> days.</li>
      <li><strong>Priority.</strong> Payments under this Addendum rank as unsecured general obligations of the Company.</li>
      <li><strong>Method.</strong> Payments shall be made via the Company's payroll system by ACH/wire to the Executive's designated payroll account.</li>
    </ul>

    <h2>6. Termination of Service</h2>
    <ul>
      <li><strong>Without Cause / Resignation for Good Reason.</strong> Accrued deferred amounts (plus applicable interest) become due per Section 5.</li>
      <li><strong>For Cause / Voluntary Resignation.</strong> Accrued deferred amounts through the termination date remain payable per Section 5.</li>
      <li><strong>Death or Disability.</strong> Accrued deferred amounts become payable to the Executive (or estate) in accordance with Section 5.</li>
    </ul>

    <h2>7. Governing Law; Dispute Resolution</h2>
    <p>This Addendum shall be governed by the laws of ${data.governing_law_state || data.governing_law || 'Delaware'}, without regard to conflicts rules.</p>

    <h2>Signatures</h2>
    <table class="sig-grid">
      <tr>
        <td style="width:60%">
          <div class="line"></div>
          <div class="small">Executive: ${data.executive_name || data.full_name || ''}</div>
        </td>
        <td style="width:5%"></td>
        <td>
          <div class="line"></div>
          <div class="small">Date</div>
        </td>
      </tr>
    </table>
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

  </div>
</body>
</html>`;

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
