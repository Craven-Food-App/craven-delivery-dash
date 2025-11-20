-- Add Board Document Templates

-- A. Initial Action of Sole Director
INSERT INTO public.document_templates (
  template_key,
  name,
  category,
  html_content,
  description,
  is_active
) VALUES (
  'initial_director_consent',
  'Initial Action of Sole Director',
  'board',
  '<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Initial Action of Sole Director</title>
<style>
body { font-family:"Times New Roman", serif; line-height:1.35; }
h1 { text-align:center; text-transform:uppercase; font-size:22px; margin-bottom:12px; }
h2 { font-size:16px; text-transform:uppercase; margin-top:28px; }
.table { width:100%; border-collapse:collapse; margin-top:12px; }
.table th, .table td { border:1px solid #000; padding:8px; vertical-align:top; }
.signature-line { border-bottom:1px solid #000; height:24px; margin-top:16px; }
.bold { font-weight:bold; }
</style>
</head>
<body>

<h1>Initial Action of Sole Director<br/>of {{company_name}}</h1>
<p style="text-align:center;">A {{company_state}} Corporation</p>

<p>
I, <strong>{{director_name}}</strong>, the sole member of the Board of Directors (the "Board") of 
<strong>{{company_name}}</strong>, a {{company_state}} corporation (the "Corporation"), hereby adopt the following resolutions by 
written consent pursuant to Section 141(f) of the {{company_state}} General Corporation Law ("DGCL"), in lieu of an organizational meeting.
</p>

<hr/>

<h2>WHEREAS</h2>
<p>The Certificate of Incorporation of the Corporation has been filed with the {{state_filing_office}}, and the Corporation is duly formed under DGCL §106–107;</p>
<p>WHEREAS, the sole incorporator has executed a Pre-Incorporation Written Consent pursuant to DGCL §108 appointing the undersigned as the initial director;</p>
<p>WHEREAS, it is necessary and appropriate for the Board to complete the organization of the Corporation, elect officers, authorize the issuance of shares, and adopt certain corporate actions in accordance with DGCL §§141, 142, and 152–154;</p>

<hr/>

<h2>1. ADOPTION OF BYLAWS</h2>
<p>
RESOLVED: That the Bylaws presented to the Board and attached hereto as <em>Exhibit A</em> are hereby adopted as the Bylaws of the Corporation pursuant to DGCL §109, and the Secretary of the Corporation is directed to insert the same in the Corporation''s minute book.
</p>

<h2>2. ELECTION OF OFFICERS (DGCL §142)</h2>
<p>
RESOLVED: That the following individual is hereby elected to the officer positions set forth below, to serve at the pleasure of the Board and until a successor is duly elected or appointed:
</p>

<table class="table">
<tr><th>Officer Name</th><th>Officer Titles</th><th>Email</th></tr>
<tr>
<td>{{officer_name}}</td>
<td>
Chief Executive Officer (CEO)<br/>
Secretary<br/>
Treasurer<br/>
Chief Operating Officer (Acting)
</td>
<td>{{officer_email}}</td>
</tr>
</table>

<p>
RESOLVED FURTHER: That the officers shall have the authority and duties prescribed by the Bylaws and DGCL §142.
</p>

<h2>3. AUTHORIZATION OF CAPITALIZATION & ISSUANCE OF SHARES (DGCL §§152–154)</h2>
<p>
RESOLVED: That the Corporation is authorized to issue Ten Million (10,000,000) shares of Common Stock, par value $0.0001 per share, as set forth in the Certificate of Incorporation.
</p>

<p>
RESOLVED FURTHER: That the following issuances are hereby authorized as full and final founding issuances:
</p>

<table class="table">
<tr><th>Shareholder</th><th>Shares Issued</th><th>Ownership %</th><th>Consideration</th><th>Notes</th></tr>
<tr>
<td>Invero Business Trust (Irrevocable Trust)</td>
<td>6,000,000</td>
<td>60%</td>
<td>Full founder consideration</td>
<td>Majority shareholder</td>
</tr>
<tr>
<td>{{founder_name}}</td>
<td>2,000,000</td>
<td>20%</td>
<td>Founder labor, IP, and services</td>
<td>Founder and initial director</td>
</tr>
<tr>
<td>Unissued (Equity Pool)</td>
<td>2,000,000</td>
<td>20%</td>
<td>N/A</td>
<td>Reserved for future grants</td>
</tr>
</table>

<p>
RESOLVED FURTHER: That the Board hereby determines that the consideration received for such shares is adequate, that such issuances comply with DGCL §152, and that the shares shall be deemed fully paid and nonassessable pursuant to DGCL §153.
</p>

<h2>4. BANKING AUTHORITY</h2>
<p>
RESOLVED: That the officers of the Corporation are authorized to open and maintain bank accounts in the name of the Corporation, and to execute agreements with financial institutions on behalf of the Corporation.
</p>

<h2>5. ORGANIZATIONAL ACTIONS</h2>
<p>
RESOLVED: That the officers of the Corporation are authorized and directed to undertake all actions necessary to complete the organization of the Corporation, including but not limited to:
</p>
<ul>
<li>Obtaining an Employer Identification Number ("EIN") from the IRS;</li>
<li>Preparing and issuing stock certificates and maintaining the stock ledger;</li>
<li>Executing any agreements necessary for the operation of the Corporation;</li>
<li>Maintaining the corporate minute book and records in accordance with DGCL §224.</li>
</ul>

<h2>6. RATIFICATION OF PRIOR ACTIONS</h2>
<p>
RESOLVED: That any actions taken prior to this consent by the incorporator or the director relating to the formation or organization of the Corporation are hereby ratified, approved, and adopted as corporate acts.
</p>

<h2>EXECUTION</h2>
<p>IN WITNESS WHEREOF, the undersigned Sole Director has executed this Initial Action as of {{director_consent_date}}.</p>

<div class="signature-line"></div>
<p><strong>Sole Director:</strong> {{director_name}}</p>
<p><small>Email: {{director_email}} | Address: {{director_address}}</small></p>

<!-- Signature Tag -->
<span data-sig="DIRECTOR">{{SIGNATURE_DIRECTOR}}</span>

</body>
</html>',
  'Initial action document for sole director - comprehensive organizational resolutions',
  true
) ON CONFLICT (template_key) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  name = EXCLUDED.name;

-- B. Organizational Meeting Minutes of the Sole Director
INSERT INTO public.document_templates (
  template_key,
  name,
  category,
  html_content,
  description,
  is_active
) VALUES (
  'organizational_board_minutes',
  'Organizational Meeting Minutes of the Sole Director',
  'board',
  '<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Organizational Minutes of Sole Director</title>
<style>
body { font-family:"Times New Roman", serif; line-height:1.4; }
h1 { text-align:center; text-transform:uppercase; font-size:22px; margin-bottom:12px; }
h2 { text-transform:uppercase; font-size:16px; margin-top:28px; }
.table { width:100%; border-collapse:collapse; margin-top:12px; }
.table th, .table td { border:1px solid #000; padding:8px; vertical-align:top; }
.signature-line { border-bottom:1px solid #000; height:24px; margin-top:24px; }
.bold { font-weight:bold; }
</style>
</head>

<body>

<h1>Organizational Minutes<br/>of the Sole Director</h1>
<p style="text-align:center;"><strong>{{company_name}}</strong></p>
<p style="text-align:center;">A {{company_state}} Corporation</p>

<p>
These Organizational Minutes (the "Minutes") of the Sole Director of <strong>{{company_name}}</strong>, a {{company_state}} corporation (the "Corporation"), are entered into pursuant to the authority granted under the {{company_state}} General Corporation Law ("DGCL"), including but not limited to DGCL §§108, 109, 141, and 142.
</p>

<p>
The undersigned, <strong>{{director_name}}</strong>, being the sole member of the Board of Directors (the "Board"), hereby certifies the following proceedings as the official organizational actions of the Corporation.
</p>

<hr/>

<h2>1. CERTIFICATE OF INCORPORATION</h2>
<p>
The Director noted that the Certificate of Incorporation of the Corporation had been duly filed with the {{state_filing_office}} pursuant to DGCL §§102 and 103, thereby forming the Corporation as a legal entity under the laws of the State of {{company_state}}.
</p>

<h2>2. ADOPTION OF BYLAWS</h2>
<p>
RESOLVED: That the Bylaws presented to the Board and attached hereto as <em>Exhibit A</em> are hereby adopted as the Bylaws of the Corporation in accordance with DGCL §109.
</p>

<h2>3. ELECTION OF OFFICERS (DGCL §142)</h2>
<p>
The Director elected the following individual to serve as officers of the Corporation, to have the authority and perform the duties commonly associated with their respective offices and as described in the Bylaws:
</p>

<table class="table">
<tr><th>Officer Name</th><th>Officer Titles</th><th>Email</th></tr>
<tr>
<td>{{officer_name}}</td>
<td>
Chief Executive Officer (CEO)<br/>
Secretary<br/>
Treasurer<br/>
Chief Operating Officer (Acting)
</td>
<td>{{officer_email}}</td>
</tr>
</table>

<p>
The above-named officer accepted the office and shall serve until a successor is elected and qualified or until earlier resignation or removal, pursuant to DGCL §142(b).
</p>

<h2>4. ESTABLISHMENT OF CAPITALIZATION (DGCL §§152–154)</h2>
<p>
The Director reviewed the capitalization provisions of the Certificate of Incorporation, which authorize the issuance of up to Ten Million (10,000,000) shares of Common Stock, par value $0.0001 per share.
</p>

<p>
RESOLVED: That the Corporation hereby authorizes the following founding issuances:
</p>

<table class="table">
<tr><th>Shareholder</th><th>Shares Issued</th><th>Ownership %</th><th>Consideration</th><th>Notes</th></tr>
<tr>
<td>Invero Business Trust (Irrevocable Trust)</td>
<td>6,000,000</td>
<td>60%</td>
<td>Full founder consideration</td>
<td>Founding majority shareholder</td>
</tr>
<tr>
<td>{{founder_name}}</td>
<td>2,000,000</td>
<td>20%</td>
<td>Founder IP, effort, services</td>
<td>Founder, Director, Officer</td>
</tr>
<tr>
<td>Unissued (Equity Pool)</td>
<td>2,000,000</td>
<td>20%</td>
<td>N/A</td>
<td>Reserved for future issuance</td>
</tr>
</table>

<p>
RESOLVED FURTHER: That the Board hereby determines that the consideration received for the issuance of these shares is adequate and fair to the Corporation, and that such shares shall be deemed fully paid and nonassessable as provided under DGCL §153.
</p>

<h2>5. STOCK LEDGER AND CERTIFICATES</h2>
<p>
RESOLVED: That the Secretary shall record all share issuances in the Corporation''s official stock ledger pursuant to DGCL §224 and issue stock certificates or electronic book-entry statements reflecting the ownership of the foregoing shares.
</p>

<h2>6. BANKING AUTHORITY</h2>
<p>
RESOLVED: That the officers of the Corporation are hereby authorized to open one or more bank accounts in the name of the Corporation, execute banking resolutions, and enter agreements with financial institutions on behalf of the Corporation.
</p>

<h2>7. RATIFICATION OF PRIOR ACTIONS</h2>
<p>
RESOLVED: That all actions taken by the Sole Incorporator or the Sole Director prior to these Minutes relating to the organization of the Corporation are hereby approved, ratified, and confirmed as valid corporate acts.
</p>

<h2>EXECUTION AND CERTIFICATION</h2>
<p>
IN WITNESS WHEREOF, the undersigned Sole Director certifies that these Minutes constitute the true and correct record of the organizational actions of the Corporation as of {{minutes_date}}.
</p>

<div class="signature-line"></div>
<p><strong>Sole Director:</strong> {{director_name}}</p>
<p><small>Email: {{director_email}} | Address: {{director_address}}</small></p>

<!-- Signature Tag -->
<span data-sig="DIRECTOR">{{SIGNATURE_DIRECTOR}}</span>

<hr/>

<h2>SECRETARY CERTIFICATION</h2>
<p>
I, <strong>{{officer_name}}</strong>, Secretary of the Corporation, hereby certify that the foregoing constitutes a true, correct, and complete copy of the Organizational Minutes of the Sole Director of {{company_name}}.
</p>

<div class="signature-line"></div>
<p><strong>Secretary:</strong> {{officer_name}}</p>

<!-- Signature Tag -->
<span data-sig="SECRETARY">{{SIGNATURE_SECRETARY}}</span>

</body>
</html>',
  'Organizational meeting minutes of the sole director - comprehensive organizational actions',
  true
) ON CONFLICT (template_key) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  name = EXCLUDED.name;

-- C. Officer Appointment Resolution
INSERT INTO public.document_templates (
  template_key,
  name,
  category,
  html_content,
  description,
  is_active
) VALUES (
  'board_resolution_officer_appointment',
  'Officer Appointment Resolution',
  'board',
  '<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Officer Appointment Resolution</title>
<style>
body { font-family:"Times New Roman", serif; line-height:1.4; }
h1 { text-align:center; text-transform:uppercase; font-size:22px; margin-bottom:12px; }
h2 { font-size:16px; text-transform:uppercase; margin-top:28px; }
.table { width:100%; border-collapse:collapse; margin-top:12px; }
.table th, .table td { border:1px solid #000; padding:8px; vertical-align:top; }
.signature-line { border-bottom:1px solid #000; height:24px; margin-top:24px; }
.bold { font-weight:bold; }
</style>
</head>

<body>

<h1>BOARD RESOLUTION<br/>APPOINTING CORPORATE OFFICERS</h1>
<p style="text-align:center;"><strong>{{company_name}}</strong></p>
<p style="text-align:center;">A {{company_state}} Corporation</p>

<p>
The undersigned, <strong>{{director_name}}</strong>, being the sole member of the Board of Directors (the "Board") of 
<strong>{{company_name}}</strong> (the "Corporation"), acts pursuant to Section 141(f) of the {{company_state}} General Corporation Law ("DGCL") 
to take the following actions by written consent in lieu of a meeting:
</p>

<hr/>

<h2>WHEREAS</h2>
<p>
WHEREAS, the Certificate of Incorporation of the Corporation has been duly filed with the {{state_filing_office}} pursuant to DGCL §§102–103, and the Corporation has been duly formed;
</p>

<p>
WHEREAS, the Sole Incorporator has appointed the undersigned as the initial director pursuant to DGCL §108, and the Board has duly adopted the Corporation''s Bylaws pursuant to DGCL §109;
</p>

<p>
WHEREAS, the Corporation requires the appointment of officers to act on behalf of the Corporation pursuant to DGCL §142(a), and it is in the best interests of the Corporation to appoint such officers;
</p>

<hr/>

<h2>NOW, THEREFORE, BE IT RESOLVED THAT:</h2>

<h2>1. APPOINTMENT OF OFFICERS (DGCL §142)</h2>
<p>
RESOLVED: That the following individual is hereby appointed to the officer positions set forth below, to serve at the pleasure of the Board, with such duties and authority as prescribed by the Bylaws, the DGCL, and customary corporate practice:
</p>

<table class="table">
<tr><th>Officer Name</th><th>Officer Titles</th><th>Email</th></tr>
<tr>
<td>{{officer_name}}</td>
<td>
Chief Executive Officer (CEO)<br/>
Secretary<br/>
Treasurer<br/>
Chief Operating Officer (Acting)
</td>
<td>{{officer_email}}</td>
</tr>
</table>

<p>
RESOLVED FURTHER: That the CEO shall have the full executive authority to manage the business and affairs of the Corporation, 
including but not limited to strategic planning, financial oversight, operational supervision, contract execution, and 
representation of the Corporation in all lawful matters, subject only to Board oversight pursuant to DGCL §141(a).
</p>

<h2>2. AUTHORIZATION TO EXECUTE DOCUMENTS</h2>
<p>
RESOLVED: That the CEO and Secretary are authorized to execute, acknowledge, verify, and deliver any and all instruments, 
resolutions, certificates, agreements, and filings necessary to carry out the business and affairs of the Corporation, including 
but not limited to contracts, banking documents, regulatory filings, and equity-related instruments.
</p>

<h2>3. BANKING & FINANCIAL AUTHORITY</h2>
<p>
RESOLVED: That the Treasurer (and Acting COO where operationally applicable) is authorized to:
</p>
<ul>
<li>open and maintain bank accounts in the name of the Corporation;</li>
<li>deposit and withdraw funds;</li>
<li>execute banking resolutions and agreements;</li>
<li>oversee internal financial controls and reporting;</li>
<li>approve day-to-day operational expenditures;</li>
<li>and act as the primary financial officer until a CFO is appointed.</li>
</ul>

<h2>4. RATIFICATION OF PRIOR ACTS</h2>
<p>
RESOLVED: That any actions taken prior to the adoption of this Resolution by the officer named herein in furtherance of the 
organization or business of the Corporation are hereby approved, ratified, and confirmed as valid corporate acts pursuant to DGCL §141(f).
</p>

<h2>EXECUTION</h2>
<p>
IN WITNESS WHEREOF, the undersigned Sole Director has executed this Officer Appointment Resolution as of {{resolution_date}}, 
and the Secretary is directed to file this Resolution in the Corporation''s minute book pursuant to DGCL §142(b).
</p>

<div class="signature-line"></div>
<p><strong>Sole Director:</strong> {{director_name}}</p>
<p><small>Email: {{director_email}} | Address: {{director_address}}</small></p>

<!-- Signature Tag -->
<span data-sig="DIRECTOR">{{SIGNATURE_DIRECTOR}}</span>

<hr/>

<h2>OFFICER ACCEPTANCE (DGCL §142(b))</h2>
<p>
I, <strong>{{officer_name}}</strong>, hereby accept appointment to the offices of Chief Executive Officer, Secretary, Treasurer, 
and Acting Chief Operating Officer of {{company_name}}, effective as of {{resolution_date}}.
</p>

<div class="signature-line"></div>
<p><strong>Officer:</strong> {{officer_name}}</p>

<!-- Signature Tag -->
<span data-sig="OFFICER">{{SIGNATURE_OFFICER}}</span>

</body>
</html>',
  'Board resolution appointing corporate officers - comprehensive officer appointment',
  true
) ON CONFLICT (template_key) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  name = EXCLUDED.name;

-- D. Stock Issuance Resolution
INSERT INTO public.document_templates (
  template_key,
  name,
  category,
  html_content,
  description,
  is_active
) VALUES (
  'board_resolution_stock_issuance',
  'Stock Issuance Resolution (DGCL §§152–154)',
  'board',
  '<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Stock Issuance Resolution</title>
<style>
body { font-family:"Times New Roman", serif; line-height:1.4; }
h1 { text-align:center; text-transform:uppercase; font-size:22px; margin-bottom:12px; }
h2 { font-size:16px; text-transform:uppercase; margin-top:28px; }
.table { width:100%; border-collapse:collapse; margin-top:12px; }
.table th, .table td { border:1px solid #000; padding:8px; vertical-align:top; }
.signature-line { border-bottom:1px solid #000; height:24px; margin-top:24px; }
</style>
</head>

<body>

<h1>BOARD RESOLUTION<br/>AUTHORIZING ISSUANCE OF SHARES</h1>
<p style="text-align:center;"><strong>{{company_name}}</strong></p>
<p style="text-align:center;">A {{company_state}} Corporation</p>

<p>
The undersigned, <strong>{{director_name}}</strong>, being the sole member of the Board of Directors (the "Board") of 
<strong>{{company_name}}</strong>, a {{company_state}} corporation (the "Corporation"), hereby adopts the following resolutions pursuant to 
Section 141(f) of the {{company_state}} General Corporation Law ("DGCL") in lieu of a meeting:
</p>

<hr/>

<h2>WHEREAS</h2>

<p>WHEREAS, the Certificate of Incorporation of the Corporation authorizes the issuance of Ten Million (10,000,000) shares of Common Stock with a par value of $0.0001 per share pursuant to DGCL §102(a)(4);</p>

<p>WHEREAS, the Board is authorized under DGCL §152 to determine the consideration for which the Corporation''s shares shall be issued and to determine that such consideration is adequate, thereby rendering the shares fully paid and nonassessable pursuant to DGCL §153;</p>

<p>WHEREAS, the Corporation desires to issue founding shares to its majority shareholder, <strong>Invero Business Trust (Irrevocable Trust)</strong>, and to its founder, <strong>{{founder_name}}</strong>, and to create an unissued equity pool for future grants;</p>

<hr/>

<h2>NOW, THEREFORE, BE IT RESOLVED:</h2>

<h2>1. AUTHORIZATION OF ISSUANCE OF FOUNDING SHARES</h2>

<p>
RESOLVED: That the Corporation hereby authorizes the issuance of the following shares of Common Stock, par value $0.0001 per share, as the initial founding issuances:
</p>

<table class="table">
<tr><th>Shareholder</th><th>Shares Issued</th><th>Ownership %</th><th>Consideration</th><th>Notes</th></tr>

<tr>
<td>Invero Business Trust (Irrevocable Trust)</td>
<td>6,000,000</td>
<td>60%</td>
<td>Full and valid founder consideration, including capital contribution, governance oversight, and trust-structured ownership</td>
<td>Majority shareholder</td>
</tr>

<tr>
<td>{{founder_name}}</td>
<td>2,000,000</td>
<td>20%</td>
<td>Founder intellectual property, development labor, pre-incorporation services, and post-incorporation leadership</td>
<td>Founder / Officer / Director</td>
</tr>

<tr>
<td>Unissued (Equity Incentive Pool)</td>
<td>2,000,000</td>
<td>20%</td>
<td>N/A</td>
<td>Reserved for future officers, employees, contractors, or advisors</td>
</tr>

</table>

<p>
RESOLVED FURTHER: That the Board hereby determines that the consideration received for the issuance of the foregoing shares is adequate and sufficient pursuant to DGCL §152, and therefore all issued shares shall be deemed fully paid and nonassessable under DGCL §153.
</p>

<h2>2. AUTHORIZATION TO ISSUE STOCK CERTIFICATES & LEDGER ENTRIES</h2>

<p>
RESOLVED: That the Secretary of the Corporation is authorized and directed to:
</p>

<ul>
<li>issue stock certificates or electronic book-entry statements to the shareholders listed above;</li>
<li>record such issuances in the Corporation''s official stock ledger pursuant to DGCL §224;</li>
<li>maintain all stock records in a secure, permanent, and non-erasable format;</li>
<li>and ensure that each certificate or ledger entry reflects the correct number of shares, dates, and issuance authority.</li>
</ul>

<h2>3. SHAREHOLDER RIGHTS & RESTRICTIONS</h2>

<p>
RESOLVED: That all shares issued shall be subject to any transfer restrictions, lock-ups, shareholder agreements, or repurchase rights that may be adopted by the Corporation in accordance with DGCL §202.
</p>

<h2>4. EQUITY INCENTIVE POOL</h2>

<p>
RESOLVED: That Two Million (2,000,000) shares of Common Stock are hereby reserved as an Equity Incentive Pool, to be issued only upon future Board approval, and such shares shall remain unissued until such time as the Board authorizes their distribution.
</p>

<h2>5. RATIFICATION OF PRIOR ACTIONS</h2>

<p>
RESOLVED: That any and all actions taken prior to this Resolution by the Incorporator, Director, or Officers relating to the share structure or capitalization of the Corporation are hereby approved, ratified, and confirmed pursuant to DGCL §204.
</p>

<h2>EXECUTION</h2>
<p>
IN WITNESS WHEREOF, the undersigned Sole Director has executed this Stock Issuance Resolution as of {{resolution_date}}.
</p>

<div class="signature-line"></div>
<p><strong>Sole Director:</strong> {{director_name}}</p>
<p><small>Email: {{director_email}} | Address: {{director_address}}</small></p>

<!-- Signature Tag -->
<span data-sig="DIRECTOR">{{SIGNATURE_DIRECTOR}}</span>

<hr/>

<h2>SECRETARY CERTIFICATION</h2>

<p>
I, <strong>{{officer_name}}</strong>, Secretary of the Corporation, hereby certify that the foregoing is a true, complete, and correct Stock Issuance Resolution of the Board of Directors of {{company_name}}, duly adopted pursuant to DGCL §141(f).
</p>

<div class="signature-line"></div>
<p><strong>Secretary:</strong> {{officer_name}}</p>

<!-- Signature Tag -->
<span data-sig="SECRETARY">{{SIGNATURE_SECRETARY}}</span>

</body>
</html>',
  'Board resolution authorizing issuance of founding shares - stock issuance authorization',
  true
) ON CONFLICT (template_key) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  name = EXCLUDED.name;

-- E. Capitalization Table Exhibit
INSERT INTO public.document_templates (
  template_key,
  name,
  category,
  html_content,
  description,
  is_active
) VALUES (
  'capitalization_table_exhibit',
  'Capitalization Table Exhibit (DGCL §§102, 151, 152–154, 224)',
  'board',
  '<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Exhibit C — Capitalization Table</title>
<style>
body { font-family:"Times New Roman", serif; line-height:1.35; }
h1 { text-transform:uppercase; text-align:center; font-size:22px; margin-bottom:12px; }
h2 { font-size:16px; text-transform:uppercase; margin-top:28px; }
.table { width:100%; border-collapse:collapse; margin-top:14px; }
.table th, .table td { border:1px solid #000; padding:8px; vertical-align:top; }
.bold { font-weight:bold; }
.center { text-align:center; }
.spacer { height:28px; }
.signature-line { border-bottom:1px solid #000; height:24px; margin-top:24px; }
</style>
</head>

<body>

<h1>Exhibit C<br/>Capitalization Table</h1>
<p class="center"><strong>{{company_name}}</strong></p>
<p class="center">A {{company_state}} Corporation</p>

<p>
This Capitalization Table ("Cap Table") reflects the authorized, issued, outstanding, and reserved shares of 
<strong>{{company_name}}</strong> (the "Corporation"), as adopted by the Board of Directors pursuant to DGCL §§102(a)(4), 151, 152–154, and 224.
</p>

<h2>1. AUTHORIZED CAPITALIZATION</h2>
<table class="table">
<tr><th>Description</th><th>Amount</th><th>Par Value</th><th>DGCL Basis</th></tr>
<tr>
<td>Authorized Shares</td>
<td>10,000,000</td>
<td>$0.0001 per share</td>
<td>DGCL §102(a)(4)</td>
</tr>
<tr>
<td>Class</td>
<td>Common Stock</td>
<td>—</td>
<td>DGCL §§151–153</td>
</tr>
</table>

<h2>2. ISSUED & OUTSTANDING SHARES</h2>
<table class="table">
<tr><th>Shareholder</th><th>Shares Issued</th><th>% Ownership</th><th>Consideration</th><th>Notes</th></tr>

<tr>
<td>Invero Business Trust (Irrevocable Trust)</td>
<td>6,000,000</td>
<td>60%</td>
<td>Founder trust contribution; governance rights</td>
<td>Majority shareholder</td>
</tr>

<tr>
<td>{{founder_name}}</td>
<td>2,000,000</td>
<td>20%</td>
<td>Founder intellectual property, labor, and pre-incorporation services</td>
<td>Founder / Officer / Director</td>
</tr>

<tr>
<td><em>Total Issued & Outstanding</em></td>
<td><strong>8,000,000</strong></td>
<td><strong>80%</strong></td>
<td>—</td>
<td>Fully paid & nonassessable (DGCL §153)</td>
</tr>
</table>

<h2>3. UNISSUED SHARES</h2>
<table class="table">
<tr><th>Description</th><th>Shares</th><th>% of Total Auth.</th><th>Notes</th></tr>

<tr>
<td>Equity Incentive Pool (Unissued)</td>
<td>2,000,000</td>
<td>20%</td>
<td>Reserved for future grants; requires Board approval</td>
</tr>

<tr>
<td><em>Total Unissued</em></td>
<td><strong>2,000,000</strong></td>
<td><strong>20%</strong></td>
<td>—</td>
</tr>
</table>

<h2>4. SUMMARY CHART</h2>
<table class="table">
<tr><th>Category</th><th>Shares</th><th>% of Authorized</th></tr>

<tr>
<td><strong>Authorized Shares</strong></td>
<td>10,000,000</td>
<td>100%</td>
</tr>

<tr>
<td><strong>Issued & Outstanding</strong></td>
<td>8,000,000</td>
<td>80%</td>
</tr>

<tr>
<td><strong>Unissued (Equity Pool)</strong></td>
<td>2,000,000</td>
<td>20%</td>
</tr>
</table>

<h2>5. LEGAL STATUS OF SHARES</h2>
<p>
Pursuant to DGCL §§152–154, the Board has determined that the consideration received for the issued shares is 
adequate and that all issued shares are fully paid and nonassessable.  
All shares shall be recorded in the Corporation''s official stock ledger under DGCL §224.
</p>

<h2>6. CERTIFICATION</h2>
<p>
I, <strong>{{officer_name}}</strong>, Secretary of the Corporation, hereby certify that this Capitalization Table is 
a true, complete, and correct depiction of the capital structure of {{company_name}}, as adopted by the Board on {{cap_table_date}}, and maintained in the Corporation''s minute book.
</p>

<div class="signature-line"></div>
<p><strong>Secretary:</strong> {{officer_name}}</p>

<!-- Signature Tag -->
<span data-sig="SECRETARY">{{SIGNATURE_SECRETARY}}</span>

</body>
</html>',
  'Capitalization table exhibit showing authorized, issued, and unissued shares',
  true
) ON CONFLICT (template_key) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  name = EXCLUDED.name;

-- F. Board Resolution Appointing Chief Executive Officer
INSERT INTO public.document_templates (
  template_key,
  name,
  category,
  html_content,
  description,
  is_active
) VALUES (
  'board_resolution_appointing_ceo',
  'Board Resolution Appointing Chief Executive Officer',
  'board',
  '<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Board Resolution Appointing Chief Executive Officer</title>
<style>
body { font-family:"Times New Roman", serif; line-height:1.4; }
h1 { text-align:center; text-transform:uppercase; font-size:22px; margin-bottom:12px; }
h2 { font-size:16px; text-transform:uppercase; margin-top:28px; }
.table { width:100%; border-collapse:collapse; margin-top:12px; }
.table th, .table td { border:1px solid #000; padding:8px; vertical-align:top; }
.signature-line { border-bottom:1px solid #000; height:24px; margin-top:24px; }
.bold { font-weight:bold; }
</style>
</head>

<body>

<h1>BOARD RESOLUTION<br/>APPOINTING CHIEF EXECUTIVE OFFICER</h1>
<p style="text-align:center;"><strong>{{company_name}}</strong></p>
<p style="text-align:center;">A {{company_state}} Corporation</p>

<p>
The undersigned, <strong>{{director_name}}</strong> (the "Director"), being the sole member of the Board of Directors (the "Board") of 
<strong>{{company_name}}</strong> (the "Corporation"), hereby adopts the following resolutions pursuant to Section 141(f) of the {{company_state}} General Corporation Law ("DGCL") by unanimous written consent in lieu of a meeting.
</p>

<hr/>

<h2>WHEREAS</h2>

<p>
WHEREAS, the Corporation has been duly incorporated under the laws of the State of {{company_state}} and the Certificate of Incorporation has been filed pursuant to DGCL §103;
</p>

<p>
WHEREAS, the Board has authority under DGCL §142(a) and the Bylaws of the Corporation to elect and appoint officers, including the Chief Executive Officer ("CEO");
</p>

<p>
WHEREAS, it is in the best interests of the Corporation to appoint an individual to serve as CEO with broad executive authority to manage the business and affairs of the Corporation under the supervision of the Board pursuant to DGCL §141(a);
</p>

<hr/>

<h2>NOW, THEREFORE, BE IT RESOLVED:</h2>

<h2>1. APPOINTMENT OF CHIEF EXECUTIVE OFFICER (DGCL §142)</h2>
<p>
RESOLVED: That <strong>{{executive_name}}</strong> is hereby appointed to serve as the Chief Executive Officer ("CEO") of the Corporation, effective as of {{effective_date}}, to hold office at the pleasure of the Board and subject to the duties, authority, and responsibilities prescribed by the Bylaws and applicable law.
</p>

<h2>2. CEO AUTHORITY & EXECUTIVE POWERS</h2>
<p>
RESOLVED: That the CEO shall have the broad and general executive authority to:
</p>

<ul>
<li>supervise, manage, and direct the business and operations of the Corporation;</li>
<li>execute and deliver contracts, agreements, instruments, and filings on behalf of the Corporation;</li>
<li>approve operational, financial, and administrative actions;</li>
<li>hire, supervise, and terminate employees, executives, and contractors;</li>
<li>manage corporate strategy, budgeting, fundraising, and financial planning;</li>
<li>represent the Corporation in legal, governmental, banking, and business matters;</li>
<li>exercise any powers typically held by a Chief Executive Officer in a Delaware corporation;</li>
<li>and perform all duties customary to the office of CEO unless otherwise limited by resolution of the Board.</li>
</ul>

<p>
The foregoing authority is granted pursuant to DGCL §142(a) and §141(a).
</p>

<h2>3. AUTHORITY TO EXECUTE DOCUMENTS</h2>
<p>
RESOLVED: That the CEO is authorized to execute and deliver any and all agreements, instruments, certificates, and documents necessary or convenient to carry out the duties of the office, including but not limited to:
</p>

<ul>
<li>banking documents and resolutions,</li>
<li>regulatory filings,</li>
<li>equity and fundraising agreements,</li>
<li>commercial contracts,</li>
<li>employment and contractor agreements,</li>
<li>NDA and IP assignment agreements,</li>
<li>and any other lawful corporate acts.</li>
</ul>

<h2>4. CEO AS AUTHORIZED SIGNATORY</h2>
<p>
RESOLVED: That the CEO shall serve as an authorized signatory of the Corporation for all matters requiring executive approval, unless otherwise designated by the Board.
</p>

<h2>5. COMPENSATION</h2>
<p>
RESOLVED: That the CEO''s compensation, salary-activation triggers, equity terms, and any vesting arrangements shall be set forth in a separate Executive Employment Agreement approved by the Board.
</p>

<h2>6. RATIFICATION OF PRIOR ACTS</h2>
<p>
RESOLVED: That any actions taken by {{executive_name}} prior to the adoption of this Resolution in furtherance of organizing or operating the Corporation are hereby ratified and approved as valid corporate acts pursuant to DGCL §141(f).
</p>

<h2>EXECUTION</h2>
<p>
IN WITNESS WHEREOF, the undersigned Sole Director has executed this Chief Executive Officer Appointment Resolution as of {{resolution_date}}.
</p>

<div class="signature-line"></div>
<p><strong>Sole Director:</strong> {{director_name}}</p>
<p><small>Email: {{director_email}} | Address: {{director_address}}</small></p>

<!-- Signature Tag -->
<span data-sig="DIRECTOR">{{SIGNATURE_DIRECTOR}}</span>

<hr/>

<h2>CEO ACCEPTANCE (DGCL §142(b))</h2>
<p>
I, <strong>{{executive_name}}</strong>, hereby accept appointment as Chief Executive Officer of {{company_name}}, effective as of {{effective_date}}.
</p>

<div class="signature-line"></div>
<p><strong>Chief Executive Officer:</strong> {{executive_name}}</p>

<!-- Signature Tag -->
<span data-sig="CEO">{{SIGNATURE_CEO}}</span>

</body>
</html>',
  'Board resolution appointing Chief Executive Officer with executive authority',
  true
) ON CONFLICT (template_key) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  name = EXCLUDED.name;

-- G. Multi-Role Officer Acceptance
INSERT INTO public.document_templates (
  template_key,
  name,
  category,
  html_content,
  description,
  is_active
) VALUES (
  'multi_role_officer_acceptance',
  'Multi-Role Officer Acceptance (DGCL §142(b))',
  'board',
  '<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Officer Acceptance of Appointment</title>
<style>
body { font-family:"Times New Roman", serif; line-height:1.4; }
h1 { text-align:center; text-transform:uppercase; font-size:22px; margin-bottom:12px; }
h2 { font-size:16px; text-transform:uppercase; margin-top:28px; }
.signature-line { border-bottom:1px solid #000; height:24px; margin-top:24px; }
.bold { font-weight:bold; }
</style>
</head>

<body>

<h1>OFFICER ACCEPTANCE OF APPOINTMENT</h1>
<p style="text-align:center;"><strong>{{company_name}}</strong></p>
<p style="text-align:center;">A {{company_state}} Corporation</p>

<p>
This Officer Acceptance (the "Acceptance") is delivered pursuant to Section 142(b) of the {{company_state}} General Corporation Law ("DGCL") in connection
with the appointment of the undersigned as an officer of <strong>{{company_name}}</strong> (the "Corporation").
</p>

<h2>1. ACCEPTANCE OF APPOINTMENT</h2>
<p>
I, <strong>{{officer_name}}</strong>, hereby accept appointment by the Board of Directors to the following officer positions of the Corporation,
effective as of {{effective_date}}:
</p>

<ul>
<li><strong>Chief Executive Officer (CEO)</strong></li>
<li><strong>Secretary</strong></li>
<li><strong>Treasurer</strong></li>
<li><strong>Chief Operating Officer (Acting)</strong></li>
</ul>

<p>
I acknowledge that I shall serve in each such capacity at the pleasure of the Board and in accordance with DGCL §142(b), the Bylaws of the Corporation,
and applicable law.
</p>

<h2>2. DUTIES & RESPONSIBILITIES</h2>
<p>
I acknowledge and accept the duties, authority, rights, and responsibilities associated with each of the foregoing offices, including but not limited to:
</p>

<ul>
<li>managing the day-to-day business and operations of the Corporation;</li>
<li>executing contracts, agreements, and instruments on behalf of the Corporation;</li>
<li>maintaining the corporate records and books as Secretary;</li>
<li>overseeing financial accounts, expenditures, and fiscal matters as Treasurer;</li>
<li>supervising operational processes and strategic execution as Acting COO;</li>
<li>serving as an authorized signatory of the Corporation.</li>
</ul>

<h2>3. FIDUCIARY DUTIES</h2>
<p>
I further acknowledge that, as an officer of a {{company_state}} corporation, I owe the Corporation the fiduciary duties of:
</p>

<ul>
<li><strong>Duty of Loyalty</strong> — to act in the best interests of the Corporation and avoid self-dealing or conflicts of interest;</li>
<li><strong>Duty of Care</strong> — to act with the care that a reasonably prudent person would exercise under similar circumstances;</li>
<li><strong>Duty of Good Faith</strong> — to act honestly and faithfully in the performance of my responsibilities.</li>
</ul>

<h2>4. COMPLIANCE WITH LAW & BYLAWS</h2>
<p>
I agree to perform all duties in compliance with:
</p>

<ul>
<li>the {{company_state}} General Corporation Law (DGCL);</li>
<li>the Corporation''s Certificate of Incorporation;</li>
<li>the Corporation''s Bylaws;</li>
<li>all resolutions adopted by the Board of Directors;</li>
<li>and all applicable federal, state, and local laws.</li>
</ul>

<h2>5. ACCEPTANCE</h2>
<p>
By signing below, I hereby accept the foregoing appointments and acknowledge that this Acceptance shall be filed in the Corporation''s minute book
as required under DGCL §142(b).
</p>

<div class="signature-line"></div>
<p><strong>Officer:</strong> {{officer_name}}</p>
<p><small>Email: {{officer_email}} | Address: {{officer_address}}</small></p>

<!-- Signature Tag -->
<span data-sig="OFFICER">{{SIGNATURE_OFFICER}}</span>

</body>
</html>',
  'Officer acceptance document for multi-role appointments (CEO, Secretary, Treasurer, Acting COO)',
  true
) ON CONFLICT (template_key) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  name = EXCLUDED.name;

-- H. Corporate Banking Resolution
INSERT INTO public.document_templates (
  template_key,
  name,
  category,
  html_content,
  description,
  is_active
) VALUES (
  'corporate_banking_resolution',
  'Corporate Banking Resolution',
  'board',
  '<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Corporate Banking Resolution</title>
<style>
body { font-family:"Times New Roman", serif; line-height:1.4; }
h1 { text-align:center; font-size:22px; text-transform:uppercase; margin-bottom:14px; }
h2 { font-size:16px; text-transform:uppercase; margin-top:28px; }
p { margin:10px 0; }
.table { width:100%; border-collapse:collapse; margin-top:14px; }
.table th, .table td { border:1px solid #000; padding:8px; vertical-align:top; }
.signature-line { border-bottom:1px solid #000; height:24px; margin-top:24px; }
.center { text-align:center; }
.bold { font-weight:bold; }
</style>
</head>

<body>

<h1>CORPORATE BANKING RESOLUTION</h1>
<p class="center"><strong>{{company_name}}</strong></p>
<p class="center">A {{company_state}} Corporation</p>

<p>
The undersigned, <strong>{{director_name}}</strong>, being the sole member of the Board of Directors (the "Board") of 
<strong>{{company_name}}</strong> (the "Corporation"), hereby adopts the following resolutions pursuant to Section 141(f) of the {{company_state}} General Corporation Law ("DGCL").
</p>

<hr/>

<h2>WHEREAS</h2>

<p>
WHEREAS, the Corporation requires one or more banking relationships for the deposit, safekeeping, and disbursement of funds and for conducting the financial affairs of the Corporation;
</p>

<p>
WHEREAS, the Board has the authority under DGCL §141(a) to manage the business and affairs of the Corporation, including authorization of banking powers;
</p>

<p>
WHEREAS, the Board desires to designate certain officers of the Corporation as authorized signatories for all banking matters;
</p>

<hr/>

<h2>NOW, THEREFORE, BE IT RESOLVED THAT:</h2>

<h2>1. AUTHORIZATION TO OPEN BANK ACCOUNTS</h2>
<p>
RESOLVED: That the Chief Executive Officer ("CEO"), <strong>{{officer_name}}</strong>, is hereby authorized to open, maintain, modify, and close one or more bank accounts in the name of the Corporation with any financial institution, including but not limited to:
</p>

<ul>
<li>Chase</li>
<li>Wells Fargo</li>
<li>Bank of America</li>
<li>PNC</li>
<li>Citibank</li>
<li>Bluevine</li>
<li>Relay</li>
<li>Mercury</li>
<li>or any other FDIC-insured institution</li>
</ul>

<h2>2. AUTHORIZED SIGNATORY OFFICERS</h2>

<p>
RESOLVED: That the following officer is designated as an authorized signatory with full authority over all accounts:
</p>

<table class="table">
<tr><th>Officer Name</th><th>Titles</th><th>Email</th><th>Authority Level</th></tr>

<tr>
<td>{{officer_name}}</td>
<td>
Chief Executive Officer (CEO)<br/>
Secretary<br/>
Treasurer<br/>
Chief Operating Officer (Acting)
</td>
<td>{{officer_email}}</td>
<td><strong>Full banking authority</strong></td>
</tr>
</table>

<h2>3. BANKING POWERS GRANTED</h2>
<p>
RESOLVED: That the above-named officer is authorized to exercise the following powers on behalf of the Corporation:
</p>

<ul>
<li>Open, maintain, or close any bank account</li>
<li>Endorse checks, drafts, and other instruments</li>
<li>Deposit funds into any account of the Corporation</li>
<li>Withdraw funds and issue checks or payments</li>
<li>Initiate ACH transfers, wires, and electronic payments</li>
<li>Obtain debit cards, corporate cards, and payment instruments</li>
<li>Enter into banking agreements and merchant service arrangements</li>
<li>Execute account resolutions, signature cards, and certifications</li>
<li>Authorize online banking access and manage credentials</li>
<li>Approve or revoke user access to corporate bank accounts</li>
</ul>

<h2>4. CERTIFICATION TO FINANCIAL INSTITUTIONS</h2>

<p>
RESOLVED: That any bank may rely on this Resolution until written notice of its amendment or revocation is delivered, and the bank shall not be held liable for actions taken in good faith reliance hereon.
</p>

<h2>5. RATIFICATION OF PRIOR ACTS</h2>
<p>
RESOLVED: That any actions taken by the CEO prior to this Resolution in establishing or maintaining banking relationships are hereby ratified and approved pursuant to DGCL §141(f).
</p>

<h2>EXECUTION</h2>
<p>
IN WITNESS WHEREOF, the undersigned Sole Director has executed this Corporate Banking Resolution as of {{resolution_date}}.
</p>

<div class="signature-line"></div>
<p><strong>Sole Director:</strong> {{director_name}}</p>
<p><small>Email: {{director_email}} | Address: {{director_address}}</small></p>

<!-- Signature Tag -->
<span data-sig="DIRECTOR">{{SIGNATURE_DIRECTOR}}</span>

<hr/>

<h2>SECRETARY CERTIFICATION</h2>

<p>
I, <strong>{{officer_name}}</strong>, Secretary of the Corporation, hereby certify that the foregoing is a true, correct, and complete copy of the 
Corporate Banking Resolution adopted by the Board of Directors, and that said Resolution has not been amended, modified, or rescinded and
is in full force and effect.
</p>

<div class="signature-line"></div>
<p><strong>Secretary:</strong> {{officer_name}}</p>

<!-- Signature Tag -->
<span data-sig="SECRETARY">{{SIGNATURE_SECRETARY}}</span>

</body>
</html>',
  'Corporate banking resolution authorizing banking powers and signatory officers',
  true
) ON CONFLICT (template_key) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  name = EXCLUDED.name;

-- Add signature fields for each template
DO $$
DECLARE
  consent_template_id UUID;
  minutes_template_id UUID;
  resolution_template_id UUID;
  stock_issuance_template_id UUID;
  cap_table_template_id UUID;
  ceo_appointment_template_id UUID;
  officer_acceptance_template_id UUID;
  banking_resolution_template_id UUID;
BEGIN
  -- Get template IDs
  SELECT id INTO consent_template_id FROM public.document_templates WHERE template_key = 'initial_director_consent';
  SELECT id INTO minutes_template_id FROM public.document_templates WHERE template_key = 'organizational_board_minutes';
  SELECT id INTO resolution_template_id FROM public.document_templates WHERE template_key = 'board_resolution_officer_appointment';
  SELECT id INTO stock_issuance_template_id FROM public.document_templates WHERE template_key = 'board_resolution_stock_issuance';
  SELECT id INTO cap_table_template_id FROM public.document_templates WHERE template_key = 'capitalization_table_exhibit';
  SELECT id INTO ceo_appointment_template_id FROM public.document_templates WHERE template_key = 'board_resolution_appointing_ceo';
  SELECT id INTO officer_acceptance_template_id FROM public.document_templates WHERE template_key = 'multi_role_officer_acceptance';
  SELECT id INTO banking_resolution_template_id FROM public.document_templates WHERE template_key = 'corporate_banking_resolution';

  -- Initial Consent signature fields
  IF consent_template_id IS NOT NULL THEN
    DELETE FROM public.document_template_signature_fields WHERE template_id = consent_template_id;
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
    )
    VALUES (
      consent_template_id, 
      'signature', 
      'DIRECTOR',
      1,
      10, 
      85, 
      35, 
      4, 
      'Director Signature',
      true
    );
  END IF;

  -- Organizational Minutes signature fields (both DIRECTOR and SECRETARY)
  IF minutes_template_id IS NOT NULL THEN
    DELETE FROM public.document_template_signature_fields WHERE template_id = minutes_template_id;
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
    )
    VALUES 
      (minutes_template_id, 'signature', 'DIRECTOR', 1, 10, 75, 35, 4, 'Director Signature', true),
      (minutes_template_id, 'signature', 'SECRETARY', 1, 10, 90, 35, 4, 'Secretary Signature', true);
  END IF;

  -- Board Resolution signature fields (DIRECTOR and OFFICER)
  IF resolution_template_id IS NOT NULL THEN
    DELETE FROM public.document_template_signature_fields WHERE template_id = resolution_template_id;
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
    )
    VALUES 
      (resolution_template_id, 'signature', 'DIRECTOR', 1, 10, 75, 35, 4, 'Director Signature', true),
      (resolution_template_id, 'signature', 'OFFICER', 1, 10, 90, 35, 4, 'Officer Signature', true);
  END IF;

  -- Stock Issuance Resolution signature fields (DIRECTOR and SECRETARY)
  IF stock_issuance_template_id IS NOT NULL THEN
    DELETE FROM public.document_template_signature_fields WHERE template_id = stock_issuance_template_id;
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
    )
    VALUES 
      (stock_issuance_template_id, 'signature', 'DIRECTOR', 1, 10, 75, 35, 4, 'Director Signature', true),
      (stock_issuance_template_id, 'signature', 'SECRETARY', 1, 10, 90, 35, 4, 'Secretary Signature', true);
  END IF;

  -- Capitalization Table Exhibit signature fields (SECRETARY only)
  IF cap_table_template_id IS NOT NULL THEN
    DELETE FROM public.document_template_signature_fields WHERE template_id = cap_table_template_id;
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
    )
    VALUES 
      (cap_table_template_id, 'signature', 'SECRETARY', 1, 10, 90, 35, 4, 'Secretary Signature', true);
  END IF;

  -- CEO Appointment Resolution signature fields (DIRECTOR and CEO)
  IF ceo_appointment_template_id IS NOT NULL THEN
    DELETE FROM public.document_template_signature_fields WHERE template_id = ceo_appointment_template_id;
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
    )
    VALUES 
      (ceo_appointment_template_id, 'signature', 'DIRECTOR', 1, 10, 75, 35, 4, 'Director Signature', true),
      (ceo_appointment_template_id, 'signature', 'CEO', 1, 10, 90, 35, 4, 'CEO Signature', true);
  END IF;

  -- Multi-Role Officer Acceptance signature fields (OFFICER only)
  IF officer_acceptance_template_id IS NOT NULL THEN
    DELETE FROM public.document_template_signature_fields WHERE template_id = officer_acceptance_template_id;
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
    )
    VALUES 
      (officer_acceptance_template_id, 'signature', 'OFFICER', 1, 10, 90, 35, 4, 'Officer Signature', true);
  END IF;

  -- Corporate Banking Resolution signature fields (DIRECTOR and SECRETARY)
  IF banking_resolution_template_id IS NOT NULL THEN
    DELETE FROM public.document_template_signature_fields WHERE template_id = banking_resolution_template_id;
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
    )
    VALUES 
      (banking_resolution_template_id, 'signature', 'DIRECTOR', 1, 10, 75, 35, 4, 'Director Signature', true),
      (banking_resolution_template_id, 'signature', 'SECRETARY', 1, 10, 90, 35, 4, 'Secretary Signature', true);
  END IF;
END $$;

