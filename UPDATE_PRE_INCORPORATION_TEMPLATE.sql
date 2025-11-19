-- Update Pre-Incorporation Consent template with exact HTML provided
UPDATE public.document_templates
SET 
  html_content = '<!DOCTYPE html>

<html lang="en">

<head>
  <meta charset="utf-8" />
  <title>Pre-Incorporation Consent (Conditional Appointments)</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    html, body { margin:0; padding:0; font-family:"Times New Roman", Times, serif; color:#111; }
    .doc { max-width:800px; margin:0 auto; padding:48px 56px; }
    h1, h2, h3 { margin:0 0 12px; font-weight:700; }
    h1 { font-size:22px; text-align:center; text-transform:uppercase; letter-spacing:.5px; }
    h2 { font-size:16px; text-transform:uppercase; letter-spacing:.4px; }
    h3 { font-size:15px; }
    p { line-height:1.35; margin:8px 0; }
    .muted { color:#555; font-size:12px; }
    .small { font-size:12px; }
    .center { text-align:center; }
    .right { text-align:right; }
    .spacer-8 { height:8px; }
    .spacer-16 { height:16px; }
    .spacer-24 { height:24px; }
    .spacer-32 { height:32px; }
    .hr { border-top:1px solid #222; margin:16px 0; }
    .section { margin-top:18px; }
    .box { border:1px solid #222; padding:14px; }
    .table { width:100%; border-collapse:collapse; }
    .table th, .table td { border:1px solid #222; padding:8px 10px; vertical-align:top; }
    .table th { background:#f2f2f2; font-weight:700; }
    .signature-line { border-bottom:1px solid #222; height:22px; }
    .label { font-weight:700; }
    .page-break { page-break-before:always; }
    @page { size:Letter; margin:.75in; }
    @media print { .no-print{display:none;} }
  </style>
</head>

<body>
<div class="doc">

<h1>Pre-Incorporation Written Consent<br/>of the Sole Incorporator</h1>
<p class="center"><span class="label">{{company_name}}</span></p>
<p class="center small muted">
  Intended State of Incorporation: {{state}} &nbsp;|&nbsp; Intended Registered Office: {{registered_office}}<br/>
  Effective Upon: Filing and acceptance of the Articles of Incorporation by {{state_filing_office}} (the "Effective Time")
</p>

<div class="section">
  <h2>Recitals</h2>
  <div class="box">
    <p>I, the undersigned, being the sole incorporator ("Incorporator") of
      <span class="label">{{company_name}}</span>, a corporation to be formed under the laws of
      <span class="label">{{state}}</span>, adopt the following resolutions by written consent in lieu of an organizational meeting.
      This consent is executed prior to filing the Articles of Incorporation and shall become operative automatically as of the Effective Time.</p>
    <p>Prior to the Effective Time the Corporation does not yet exist as a legal entity; accordingly, the actions below are expressly made conditional and shall be deemed authorized and effective only as of the Effective Time.</p>
  </div>
</div>

<div class="section">
  <h2>1. Articles of Incorporation</h2>
  <p>RESOLVED: The Incorporator approves the filing of the Articles of Incorporation in substantially the form attached
    as <em>Exhibit A</em>, and authorizes submission for filing with {{state_filing_office}}. This resolution is ratified effective as of the Effective Time.</p>
</div>

<div class="section">
  <h2>2. Adoption of Bylaws</h2>
  <p>RESOLVED: Effective as of the Effective Time, the Bylaws of the Corporation in the form attached as <em>Exhibit B</em> are adopted and approved.</p>
</div>

<div class="section">
  <h2>3. Appointment of Initial Board of Directors (Conditional)</h2>
  <p>RESOLVED: Effective as of the Effective Time, the following individuals are appointed to serve as the initial members of the Board of Directors of the Corporation, to hold office until successors are duly elected and qualified or until earlier death, resignation, or removal in accordance with the Bylaws:</p>

  <table class="table">
    <thead><tr><th>Director Name</th><th>Address</th><th>Email</th><th>Term Notes</th></thead>
    <tbody>
      <tr><td>{{director_1_name}}</td><td>{{director_1_address}}</td><td>{{director_1_email}}</td><td>Initial director; serves per Bylaws</td></tr>
      <tr><td>{{director_2_name}}</td><td>{{director_2_address}}</td><td>{{director_2_email}}</td><td>Initial director; serves per Bylaws</td></tr>
    </tbody>
  </table>
</div>

<div class="section">
  <h2>4. Appointment of Initial Officers (Conditional)</h2>
  <p>RESOLVED: Effective as of the Effective Time, the following individuals are appointed to the officer positions indicated below, to serve at the pleasure of the Board and in accordance with the Bylaws:</p>

  <table class="table">
    <thead><tr><th>Officer Name</th><th>Title</th><th>Email</th><th>Notes</th></thead>
    <tbody>
      <tr><td>{{officer_1_name}}</td><td>{{officer_1_title}}</td><td>{{officer_1_email}}</td><td>Appointment effective at Effective Time</td></tr>
      <tr><td>{{officer_2_name}}</td><td>{{officer_2_title}}</td><td>{{officer_2_email}}</td><td>Appointment effective at Effective Time</td></tr>
      <tr><td>{{officer_3_name}}</td><td>{{officer_3_title}}</td><td>{{officer_3_email}}</td><td>Appointment effective at Effective Time</td></tr>
    </tbody>
  </table>
</div>

<div class="section">
  <h2>5. Organizational Actions Upon Effectiveness</h2>
  <p>RESOLVED: As of the Effective Time, the Board is authorized to open and maintain bank accounts, apply for an EIN, issue stock, and take such further actions as necessary to fully organize the Corporation.</p>
</div>

<div class="section">
  <h2>6. Ratification of Pre-Incorporation Agreements</h2>
  <p>RESOLVED: Subject to Board review, any pre-incorporation agreements entered into by or on behalf of the Corporation, as listed on <em>Exhibit C</em> (if any), are adopted and ratified as of the Effective Time.</p>
</div>

<div class="section">
  <h2>7. Fiscal Year</h2>
  <p>RESOLVED: The fiscal year of the Corporation shall end on {{fiscal_year_end}} unless changed by the Board.</p>
</div>

<div class="section">
  <h2>8. Registered Agent</h2>
  <p>RESOLVED: The Incorporator approves the designation of {{registered_agent_name}}, located at {{registered_agent_address}}, as the Corporation''s registered agent in {{state}}, effective as of the Effective Time.</p>
</div>

<div class="section">
  <h2>9. General Authorization</h2>
  <p>RESOLVED: The officers and directors appointed as of the Effective Time are authorized to execute and deliver any documents and instruments necessary to effectuate these resolutions.</p>
</div>

<div class="section">
  <h2>Execution</h2>
  <p>IN WITNESS WHEREOF, the undersigned Incorporator has executed this Written Consent as of {{consent_date}}. This Written Consent shall be filed in the Corporation''s minute book following the Effective Time.</p>

  <div class="spacer-24"></div>
  <table class="table">
    <tbody>
      <tr>
        <td style="width:60%;">
          <div class="signature-line"></div>
          <div><span class="label">Incorporator:</span> {{incorporator_name}}</div>
          <div class="small muted">Address: {{incorporator_address}}</div>
          <div class="small muted">Email: {{incorporator_email}}</div>
        </td>
        <td style="width:40%;">
          <div class="label small">Date Signed</div>
          <div class="signature-line"></div>
          <div class="label small">City/State</div>
          <div class="signature-line"></div>
        </td>
      </tr>
    </tbody>
  </table>
</div>

<!-- Optional Notary -->
<div class="section">
  <h3>Optional Notary Acknowledgment</h3>
  <div class="box small">
    <p>State of {{state}} )</p>
    <p>County of {{county}} )</p>
    <p>Subscribed and sworn before me on {{notary_date}} by {{incorporator_name}}.</p>
    <div class="spacer-16"></div>
    <div class="signature-line"></div><div class="small">Notary Public</div>
    <div class="spacer-8"></div>
    <div class="signature-line"></div><div class="small">My Commission Expires</div>
  </div>
</div>

<div class="page-break"></div>

<!-- Officer/Director Acceptance -->
<div class="section">
  <h2>Officer/Director Acceptance (Effective Upon Filing)</h2>
  <p>Each undersigned acknowledges appointment and agrees to serve effective as of the Effective Time, subject to the Bylaws and applicable law.</p>

  <div class="box"><p><span class="label">Name:</span> {{appointee_1_name}}</p><p><span class="label">Role:</span> {{appointee_1_role}}</p><p><span class="label">Email:</span> {{appointee_1_email}}</p><div class="spacer-16"></div><div class="signature-line"></div><div class="small">Signature of Appointee  Date: __________</div></div>
  <div class="spacer-16"></div>
  <div class="box"><p><span class="label">Name:</span> {{appointee_2_name}}</p><p><span class="label">Role:</span> {{appointee_2_role}}</p><p><span class="label">Email:</span> {{appointee_2_email}}</p><div class="spacer-16"></div><div class="signature-line"></div><div class="small">Signature of Appointee  Date: __________</div></div>
</div>

<div class="page-break"></div>

<!-- Exhibit A -->
<div class="section">
  <h2>Exhibit A — Articles of Incorporation (Draft)</h2>
  <div class="hr"></div>
  <div style="height:400px;"></div>
</div>

<!-- Exhibit B — Full Bylaws -->
<div class="section page-break">
  <h2>Exhibit B — Bylaws of {{company_name}}</h2>
  <div class="hr"></div>

  <h1 class="center">BYLAWS OF {{company_name}}</h1>
  <p class="center small muted">Adopted as of the Effective Time under the Pre-Incorporation Consent</p>

  <h2>ARTICLE I — Offices</h2>
  <p><strong>Section 1.</strong> Principal Office. The principal office shall be at {{principal_office}} or such other place as the Board may determine.</p>
  <p><strong>Section 2.</strong> Other Offices. The Corporation may have other offices as determined by the Board.</p>

  <h2>ARTICLE II — Shareholders</h2>
  <p><strong>Section 1.</strong> Annual Meetings. An annual meeting of shareholders shall be held at such time and place as the Board determines for electing directors and transacting business.</p>
  <p><strong>Section 2.</strong> Special Meetings. Special meetings may be called by the President, the Board, or shareholders holding not less than one-tenth of all shares entitled to vote.</p>
  <p><strong>Section 3.</strong> Notice. Written notice of any meeting shall be delivered not less than 10 nor more than 60 days before the meeting.</p>

  <h2>ARTICLE III — Board of Directors</h2>
  <p><strong>Section 1.</strong> General Powers. The business and affairs of the Corporation shall be managed by its Board of Directors.</p>
  <p><strong>Section 2.</strong> Number and Tenure. The number of directors shall be fixed by resolution of the Board or shareholders.</p>
  <p><strong>Section 3.</strong> Meetings. Regular and special meetings may be held with notice as determined by the Board.</p>
  <p><strong>Section 4.</strong> Quorum. A majority of the directors constitutes a quorum. The act of a majority present is the act of the Board.</p>
  <p><strong>Section 5.</strong> Action Without Meeting. Any action may be taken without a meeting if consented to in writing by all directors.</p>

  <h2>ARTICLE IV — Officers</h2>
  <p><strong>Section 1.</strong> Officers. The principal officers shall be a {{role}}, President, {{role}}, Secretary, and others as the Board appoints.</p>
  <p><strong>Section 2.</strong> Election and Term. Officers are elected annually by the Board and serve until successors are chosen or until resignation or removal.</p>
  <p><strong>Section 3.</strong> Duties. (a) {{role}} — general supervision and control of business and affairs. (b) President — acts as {{role}}. (c) {{role}} — chief accounting and financial officer. (d) Secretary — keeps minutes and records of the corporation.</p>

  <h2>ARTICLE V — Committees</h2>
  <p>The Board may designate committees and delegate authority as permitted by law. Each committee shall keep minutes and report to the Board.</p>

  <h2>ARTICLE VI — Indemnification</h2>
  <p>The Corporation shall indemnify directors, officers, and authorized agents to the fullest extent permitted by law against expenses and liabilities reasonably incurred in connection with service to the Corporation.</p>

  <h2>ARTICLE VII — Stock and Certificates</h2>
  <p>Shares may be issued in certificated or uncertificated form as determined by the Board. Certificates shall bear signatures of the President and Secretary and the corporate seal if any.</p>

  <h2>ARTICLE VIII — Fiscal Matters</h2>
  <p><strong>Section 1.</strong> Fiscal Year. The fiscal year ends on {{fiscal_year_end}} unless changed by Board resolution.</p>
  <p><strong>Section 2.</strong> Checks and Drafts. All checks, drafts, or orders for payment shall be signed as authorized by the Board.</p>

  <h2>ARTICLE IX — Corporate Seal</h2>
  <p>The Corporation may adopt a seal bearing its name and state of incorporation; use is not required for validity of acts or documents.</p>

  <h2>ARTICLE X — Amendments</h2>
  <p>These Bylaws may be amended or repealed, and new Bylaws adopted, by majority vote of the Board or shareholders as permitted by law and the Articles of Incorporation.</p>

  <div class="spacer-32"></div>
  <p class="center small muted">Certified to be the true and correct Bylaws of {{company_name}} as adopted on {{effective_date}}.</p>
  <div class="signature-line"></div>
  <p class="small">Secretary: __________________________</p>
</div>

<!-- Exhibit C -->
<div class="page-break"></div>
<div class="section">
  <h2>Exhibit C — Pre-Incorporation Agreements List (If Any)</h2>
  <table class="table small">
    <thead><tr><th>Counterparty</th><th>Agreement Name</th><th>Date</th><th>Assumption Notes</th></tr></thead>
    <tbody>
      <tr><td>{{counterparty_1}}</td><td>{{agreement_1_name}}</td><td>{{agreement_1_date}}</td><td>{{agreement_1_notes}}</td></tr>
    </tbody>
  </table>
</div>

<p class="small muted center">This Pre-Incorporation Consent template may require modification to comply with the laws of {{state}}. Consult counsel for your specific facts.</p>

</div>
</body>
</html>',
  updated_at = now()
WHERE template_key = 'pre_incorporation_consent';

SELECT 'Template updated successfully' AS result;
