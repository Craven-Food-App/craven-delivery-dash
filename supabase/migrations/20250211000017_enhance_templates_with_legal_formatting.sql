-- ============================================================================
-- ENHANCE ALL DOCUMENT TEMPLATES WITH BULLETPROOF LEGAL FORMATTING
-- This migration updates all 7 appointment document templates with proper
-- corporate law terminology, legal formatting, and standard legal clauses
-- ============================================================================

-- 1. ENHANCED OFFER LETTER (Executive Appointment Letter)
UPDATE public.document_templates
SET html_content = '
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Executive Appointment Letter</title>
  <style>
    @page { margin: 1in; }
    body {
      font-family: "Times New Roman", serif;
      font-size: 12pt;
      line-height: 1.8;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 1in;
      color: #000;
    }
    .header { text-align: center; margin-bottom: 30pt; }
    .company-name { font-size: 14pt; font-weight: bold; text-transform: uppercase; }
    .recital { margin: 12pt 0; text-indent: 24pt; }
    .section { margin: 18pt 0; }
    .section-number { font-weight: bold; }
    .subsection { margin: 12pt 0 12pt 24pt; }
    .signature-block { margin-top: 48pt; border-top: 1pt solid #000; width: 3in; padding-top: 12pt; }
    .date-line { text-align: right; margin-bottom: 24pt; }
    .equity-chart { margin: 20pt 0; padding: 20pt; border: 1pt solid #ddd; background: #f9f9f9; }
    table { width: 100%; border-collapse: collapse; margin: 12pt 0; }
    td { padding: 8pt; border-bottom: 1pt solid #ddd; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">{{company_name}}</div>
    <div style="font-size: 10pt; margin-top: 6pt;">A Delaware Corporation</div>
  </div>
  
  <div class="date-line">{{date}}</div>
  
  <p>{{full_name}}<br>{{proposed_officer_email}}<br>{{proposed_officer_phone}}</p>
  
  <p style="margin-top: 24pt;"><strong>RE: Executive Appointment Letter</strong></p>
  
  <p style="margin-top: 18pt;">Dear {{full_name}}:</p>
  
  <div class="section">
    <p class="recital"><strong>WHEREAS</strong>, {{company_name}}, a Delaware corporation (the "Company"), desires to appoint {{full_name}} (the "Executive") to serve as {{title}} of the Company;</p>
    
    <p class="recital"><strong>WHEREAS</strong>, the Board of Directors of the Company (the "Board") has determined that it is in the best interests of the Company and its stockholders to appoint the Executive to such position;</p>
    
    <p class="recital"><strong>WHEREAS</strong>, the Executive has agreed to serve in such capacity subject to the terms and conditions set forth herein;</p>
    
    <p style="margin-top: 18pt;"><strong>NOW, THEREFORE</strong>, the Company hereby offers, and subject to the Executive''s acceptance, appoints the Executive to the position of {{title}}, effective as of {{effective_date}} (the "Effective Date"), on the terms and conditions set forth in this letter agreement (this "Letter Agreement").</p>
  </div>
  
  <div class="section">
    <p class="section-number">1. POSITION AND DUTIES.</p>
    <p class="subsection">1.1. The Executive shall serve as {{title}} of the Company and shall have such duties, responsibilities, and authority as are customary for such position and as may be assigned from time to time by the Board. The Executive shall report directly to {{reporting_to}}.</p>
    <p class="subsection">1.2. The Executive shall devote substantially all of the Executive''s business time and attention to the performance of the Executive''s duties hereunder, except for (a) service on corporate, civic, or charitable boards or committees, (b) delivery of lectures, fulfillment of speaking engagements, or teaching at educational institutions, or (c) management of personal business interests and investments, in each case, so long as such activities do not materially interfere with the performance of the Executive''s duties hereunder.</p>
  </div>
  
  <div class="section">
    <p class="section-number">2. COMPENSATION AND BENEFITS.</p>
    <p class="subsection">2.1. <strong>Base Salary.</strong> The Executive shall receive an annual base salary of {{annual_salary}} (the "Base Salary"), payable in accordance with the Company''s standard payroll practices, subject to applicable withholdings and deductions. The Base Salary shall be reviewed annually by the Board or a committee thereof.</p>
    
    <p class="subsection">2.2. <strong>Equity Grant.</strong> Subject to the approval of the Board and the terms of the Company''s equity incentive plan (the "Equity Plan"), the Executive shall be granted {{share_count}} shares of the Company''s Common Stock (the "Shares"), representing approximately {{equity_percentage}}% of the Company''s fully diluted equity capitalization as of the Effective Date (the "Equity Grant"). The Equity Grant shall be subject to the terms and conditions of the Equity Plan and a stock option agreement or restricted stock agreement to be entered into between the Company and the Executive.</p>
    
    <p class="subsection">2.3. <strong>Vesting.</strong> The Shares shall vest in accordance with the following schedule: {{vesting_schedule}}</p>
    
    <div class="equity-chart">
      <p style="font-weight: bold; margin-top: 0;">Equity Ownership Structure</p>
      <table>
        <tr>
          <td><strong>Total Shares:</strong></td>
          <td>{{share_count}}</td>
        </tr>
        <tr>
          <td><strong>Ownership Percentage:</strong></td>
          <td>{{equity_percentage}}%</td>
        </tr>
        <tr>
          <td><strong>Share Class:</strong></td>
          <td>{{share_class}}</td>
        </tr>
        <tr>
          <td><strong>Exercise Price:</strong></td>
          <td>{{exercise_price}}</td>
        </tr>
      </table>
    </div>
    
    <p class="subsection">2.4. <strong>Benefits.</strong> The Executive shall be eligible to participate in all employee benefit plans and programs maintained by the Company for its senior executives, including but not limited to health, dental, vision, life insurance, and retirement plans, subject to the terms and conditions of such plans.</p>
  </div>
  
  <div class="section">
    <p class="section-number">3. TERM.</p>
    <p class="subsection">3.1. This appointment shall commence on the Effective Date and shall continue for a term of {{term_length_months}} months (the "Term"), unless earlier terminated in accordance with the terms of the Executive Employment Agreement to be entered into between the Company and the Executive (the "Employment Agreement").</p>
  </div>
  
  <div class="section">
    <p class="section-number">4. COMMITMENT TO TERM.</p>
    <p class="subsection">4.1. By accepting this appointment, the Executive acknowledges and agrees to serve in the position of {{title}} for the full Term specified in Section 3 hereof. The Executive understands that resignation from this position without a Valid Resignation Reason (as defined in the Employment Agreement) constitutes a material breach of the Employment Agreement and may result in forfeiture of unvested equity, repayment of signing bonuses and relocation expenses, and other remedies available to the Company at law or in equity.</p>
    <p class="subsection">4.2. For purposes of this Letter Agreement, "Valid Resignation Reason" means (a) a material reduction in the Executive''s Base Salary, (b) a material diminution in the Executive''s duties or responsibilities, (c) a material change in the geographic location at which the Executive must perform services, (d) a material breach by the Company of the Employment Agreement, or (e) any other reason mutually agreed upon in writing by the Company and the Executive.</p>
  </div>
  
  <div class="section">
    <p class="section-number">5. AUTHORITY AND RESPONSIBILITIES.</p>
    <p class="subsection">5.1. The Executive is hereby granted the following authority: {{authority_granted}}</p>
    <p class="subsection">5.2. The Executive shall exercise such authority in accordance with the Company''s policies, procedures, and applicable law.</p>
  </div>
  
  <div class="section">
    <p class="section-number">6. CONFIDENTIALITY AND RESTRICTIVE COVENANTS.</p>
    <p class="subsection">6.1. The Executive acknowledges that the Executive will have access to confidential and proprietary information of the Company. The Executive agrees to execute the Company''s standard Confidentiality and Intellectual Property Assignment Agreement as a condition of employment.</p>
    <p class="subsection">6.2. <strong>Post-Termination Confidentiality Obligations.</strong> The Executive acknowledges and agrees that the Executive''s confidentiality obligations with respect to the Company''s Confidential Information shall survive the termination of the Executive''s employment for any reason and shall continue in full force and effect for a period of ten (10) years following the date of such termination, regardless of whether such termination is voluntary or involuntary, with or without Cause, with or without Good Reason, or for any other reason. The Executive further acknowledges that any breach of such confidentiality obligations would cause irreparable harm to the Company and that the Company shall be entitled to seek injunctive relief and other remedies available at law or in equity.</p>
  </div>
  
  <div class="section">
    <p class="section-number">7. GOVERNING LAW.</p>
    <p class="subsection">7.1. This Letter Agreement and the rights and obligations of the parties hereunder shall be governed by and construed in accordance with the laws of the State of {{governing_law_state}}, without regard to its conflict of laws principles.</p>
    <p class="subsection">7.2. Any dispute arising out of or relating to this Letter Agreement shall be subject to the exclusive jurisdiction of the state and federal courts located in {{governing_law_state}}.</p>
  </div>
  
  <div class="section">
    <p class="section-number">8. ENTIRE AGREEMENT.</p>
    <p class="subsection">8.1. This Letter Agreement, together with the Employment Agreement to be executed by the parties, constitutes the entire agreement between the Company and the Executive with respect to the subject matter hereof and supersedes all prior agreements, understandings, and negotiations, whether written or oral, relating to such subject matter.</p>
  </div>
  
  <div class="section">
    <p class="section-number">9. MODIFICATION AND WAIVER.</p>
    <p class="subsection">9.1. No modification, amendment, or waiver of any provision of this Letter Agreement shall be effective unless in writing and signed by both parties.</p>
    <p class="subsection">9.2. No waiver by either party of any breach of this Letter Agreement shall be deemed a waiver of any subsequent breach.</p>
  </div>
  
  <div class="section">
    <p class="section-number">10. SEVERABILITY.</p>
    <p class="subsection">10.1. If any provision of this Letter Agreement is held to be invalid, illegal, or unenforceable, the validity, legality, and enforceability of the remaining provisions shall not be affected thereby.</p>
  </div>
  
  <div class="section">
    <p class="section-number">11. ASSIGNMENT.</p>
    <p class="subsection">11.1. This Letter Agreement shall be binding upon and inure to the benefit of the parties and their respective successors and assigns. The Executive may not assign this Letter Agreement without the prior written consent of the Company.</p>
  </div>
  
  <div class="section">
    <p class="section-number">12. COUNTERPARTS.</p>
    <p class="subsection">12.1. This Letter Agreement may be executed in counterparts, each of which shall be deemed an original, but all of which together shall constitute one and the same instrument. Facsimile or electronic signatures shall be deemed original signatures for purposes of this Letter Agreement.</p>
  </div>
  
  <div class="section">
    <p class="section-number">13. HEADINGS.</p>
    <p class="subsection">13.1. The headings in this Letter Agreement are for convenience of reference only and shall not affect the interpretation of this Letter Agreement.</p>
  </div>
  
  <p style="margin-top: 36pt;">Please indicate your acceptance of this appointment by signing and returning a copy of this Letter Agreement.</p>
  
  <p style="margin-top: 24pt;">Very truly yours,</p>
  
  <div class="signature-block" style="margin-top: 36pt;">
    <p><strong>{{company_name}}</strong></p>
    <p style="margin-top: 36pt;">By: _________________________</p>
    <p>{{company_signatory_name}}<br>{{company_signatory_title}}</p>
    <p style="margin-top: 12pt;">Date: {{company_signature_date}}</p>
  </div>
  
  <div style="margin-top: 48pt;">
    <p><strong>ACCEPTED AND AGREED:</strong></p>
    <div class="signature-block" style="margin-top: 36pt;">
      <p>_________________________</p>
      <p>{{full_name}}</p>
      <p style="margin-top: 12pt;">Date: {{executive_signature_date}}</p>
    </div>
  </div>
</body>
</html>',
placeholders = '["full_name", "title", "company_name", "effective_date", "annual_salary", "equity_percentage", "share_count", "authority_granted", "date", "proposed_officer_email", "proposed_officer_phone", "term_length_months", "vesting_schedule", "share_class", "exercise_price", "governing_law_state", "company_signatory_name", "company_signatory_title", "company_signature_date", "executive_signature_date"]'::jsonb,
updated_at = now()
WHERE template_key = 'offer_letter';

-- 2. ENHANCED BOARD RESOLUTION
UPDATE public.document_templates
SET html_content = '
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Board Resolution</title>
  <style>
    @page { margin: 1in; }
    body {
      font-family: "Times New Roman", serif;
      font-size: 12pt;
      line-height: 1.8;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 1in;
      color: #000;
    }
    .header { text-align: center; margin-bottom: 30pt; }
    .company-name { font-size: 14pt; font-weight: bold; text-transform: uppercase; }
    .resolution-number { text-align: right; margin-bottom: 18pt; font-weight: bold; }
    .recital { margin: 12pt 0; text-indent: 24pt; }
    .resolved { margin: 18pt 0; font-weight: bold; }
    .signature-block { margin-top: 48pt; border-top: 1pt solid #000; width: 3in; padding-top: 12pt; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">{{company_name}}</div>
    <div style="font-size: 10pt; margin-top: 6pt;">A Delaware Corporation</div>
    <div style="font-size: 12pt; font-weight: bold; margin-top: 12pt; text-transform: uppercase;">Board Resolution</div>
  </div>
  
  <div class="resolution-number">
    Resolution No. {{resolution_number}}
  </div>
  
  <p style="text-align: right; margin-bottom: 24pt;">Date: {{resolution_date}}</p>
  
  <div class="recital"><strong>WHEREAS</strong>, {{company_name}}, a Delaware corporation (the "Company"), desires to appoint an executive officer;</div>
  
  <div class="recital"><strong>WHEREAS</strong>, {{full_name}} (the "Executive") has been proposed for the position of {{title}};</div>
  
  <div class="recital"><strong>WHEREAS</strong>, the Board of Directors of the Company (the "Board") has reviewed and approved the terms of this appointment, including the Executive''s compensation, equity grant, and authority;</div>
  
  <div class="recital"><strong>WHEREAS</strong>, the Board has determined that such appointment is in the best interests of the Company and its stockholders;</div>
  
  <div class="recital"><strong>WHEREAS</strong>, the Board has determined that the Executive possesses the qualifications, experience, and skills necessary to serve in such capacity;</div>
  
  <div class="resolved" style="margin-top: 24pt;"><strong>NOW, THEREFORE, BE IT RESOLVED</strong>, that:</div>
  
  <p style="margin-top: 18pt; text-indent: 24pt;">1. The Executive is hereby appointed as {{title}} of the Company, effective as of {{effective_date}} (the "Effective Date").</p>
  
  <p style="margin-top: 12pt; text-indent: 24pt;">2. The Executive shall receive an annual base salary of {{annual_salary}}, payable in accordance with the Company''s standard payroll practices, subject to applicable withholdings and deductions.</p>
  
  <p style="margin-top: 12pt; text-indent: 24pt;">3. The Executive shall be granted {{share_count}} shares of the Company''s Common Stock, representing approximately {{equity_percentage}}% of the Company''s fully diluted equity capitalization, subject to the terms of the Company''s equity incentive plan and applicable award agreements.</p>
  
  <p style="margin-top: 12pt; text-indent: 24pt;">4. The Executive is hereby granted the following authority: {{authority_granted}}</p>
  
  <p style="margin-top: 12pt; text-indent: 24pt;">5. The Executive shall enter into an Executive Employment Agreement with the Company setting forth the terms and conditions of the Executive''s employment.</p>
  
  <div class="resolved" style="margin-top: 24pt;"><strong>FURTHER RESOLVED</strong>, that:</div>
  
  <p style="margin-top: 18pt; text-indent: 24pt;">6. The officers of the Company are hereby authorized and directed to take all actions necessary or appropriate to effectuate the foregoing resolutions.</p>
  
  <p style="margin-top: 12pt; text-indent: 24pt;">7. This resolution shall take effect immediately upon adoption.</p>
  
  <p style="margin-top: 12pt; text-indent: 24pt;">8. The Secretary of the Company is hereby authorized and directed to file this resolution in the corporate records of the Company.</p>
  
  <p style="margin-top: 36pt;">Adopted by the Board of Directors on {{resolution_date}}.</p>
  
  <div class="signature-block" style="margin-top: 48pt;">
    <p>_________________________</p>
    <p>Secretary</p>
    <p>{{company_name}}</p>
    <p style="margin-top: 12pt;">Date: {{resolution_date}}</p>
  </div>
</body>
</html>',
placeholders = '["full_name", "title", "company_name", "effective_date", "annual_salary", "equity_percentage", "share_count", "authority_granted", "resolution_number", "resolution_date"]'::jsonb,
updated_at = now()
WHERE template_key = 'board_resolution';

-- 3. ENHANCED EMPLOYMENT AGREEMENT
UPDATE public.document_templates
SET html_content = '
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Executive Employment Agreement</title>
  <style>
    @page { margin: 1in; }
    body {
      font-family: "Times New Roman", serif;
      font-size: 12pt;
      line-height: 1.8;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 1in;
      color: #000;
    }
    .header { text-align: center; margin-bottom: 30pt; }
    .company-name { font-size: 14pt; font-weight: bold; text-transform: uppercase; }
    .recital { margin: 12pt 0; text-indent: 24pt; }
    .section { margin: 18pt 0; }
    .section-number { font-weight: bold; }
    .subsection { margin: 12pt 0 12pt 24pt; }
    .signature-block { margin-top: 48pt; border-top: 1pt solid #000; width: 3in; padding-top: 12pt; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">{{company_name}}</div>
    <div style="font-size: 10pt; margin-top: 6pt;">A Delaware Corporation</div>
    <div style="font-size: 12pt; font-weight: bold; margin-top: 12pt; text-transform: uppercase;">Executive Employment Agreement</div>
  </div>
  
  <div class="section">
    <p>This Executive Employment Agreement (this "Agreement") is entered into as of {{date}} (the "Execution Date"), by and between {{company_name}}, a Delaware corporation (the "Company"), and {{full_name}} (the "Executive").</p>
  </div>
  
  <div class="section">
    <p class="recital"><strong>WHEREAS</strong>, the Company desires to employ the Executive, and the Executive desires to be employed by the Company, on the terms and conditions set forth herein;</p>
    
    <p class="recital"><strong>WHEREAS</strong>, the Executive and the Company desire to set forth the terms and conditions of the Executive''s employment;</p>
    
    <p style="margin-top: 18pt;"><strong>NOW, THEREFORE</strong>, in consideration of the mutual covenants and agreements set forth herein, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the parties agree as follows:</p>
  </div>
  
  <div class="section">
    <p class="section-number">1. DEFINITIONS.</p>
    <p class="subsection">1.1. "Affiliate" means, with respect to any Person, any other Person that directly or indirectly controls, is controlled by, or is under common control with, such Person.</p>
    <p class="subsection">1.2. "Board" means the Board of Directors of the Company.</p>
    <p class="subsection">1.3. "Cause" means (a) the Executive''s willful failure to perform the Executive''s duties (other than as a result of physical or mental illness or injury), (b) the Executive''s willful misconduct that is materially injurious to the Company, (c) the Executive''s conviction of, or plea of guilty or nolo contendere to, a felony, (d) the Executive''s material breach of this Agreement, or (e) the Executive''s material violation of the Company''s written policies.</p>
    <p class="subsection">1.4. "Company" means {{company_name}}, a Delaware corporation.</p>
    <p class="subsection">1.5. "Confidential Information" means all non-public, proprietary, or confidential information of the Company or its Affiliates.</p>
    <p class="subsection">1.6. "Disability" means the Executive''s inability to perform the Executive''s duties due to physical or mental illness for a period of 90 consecutive days or 180 days in any 12-month period.</p>
    <p class="subsection">1.7. "Effective Date" means {{effective_date}}.</p>
    <p class="subsection">1.8. "Executive" means {{full_name}}.</p>
    <p class="subsection">1.9. "Good Reason" means (a) a material reduction in the Executive''s Base Salary, (b) a material diminution in the Executive''s duties or responsibilities, (c) a material change in the geographic location at which the Executive must perform services, or (d) a material breach by the Company of this Agreement.</p>
    <p class="subsection">1.10. "Person" means any individual, corporation, partnership, limited liability company, trust, or other entity.</p>
    <p class="subsection">1.11. "Valid Resignation Reason" means (a) Good Reason as defined in Section 1.9 hereof, (b) the Executive''s death or Disability, (c) a material breach by the Company of this Agreement that is not cured within 30 days after written notice thereof from the Executive, (d) the Company''s relocation of the Executive''s principal place of employment to a location more than 50 miles from the Executive''s current principal place of employment without the Executive''s consent, (e) the Company''s assignment to the Executive of duties that are materially inconsistent with the Executive''s position, authority, duties, or responsibilities, or (f) any other reason mutually agreed upon in writing by the Company and the Executive.</p>
  </div>
  
  <div class="section">
    <p class="section-number">2. EMPLOYMENT.</p>
    <p class="subsection">2.1. <strong>Position.</strong> The Company hereby employs the Executive, and the Executive hereby accepts employment with the Company, as {{title}}, effective as of the Effective Date.</p>
    <p class="subsection">2.2. <strong>Duties.</strong> The Executive shall have such duties, responsibilities, and authority as are customary for such position and as may be assigned from time to time by the Board. The Executive shall report directly to {{reporting_to}}.</p>
    <p class="subsection">2.3. <strong>Full-Time Service.</strong> The Executive shall devote substantially all of the Executive''s business time and attention to the performance of the Executive''s duties hereunder.</p>
  </div>
  
  <div class="section">
    <p class="section-number">3. COMPENSATION.</p>
    <p class="subsection">3.1. <strong>Base Salary.</strong> The Executive shall receive an annual base salary of {{annual_salary}} (the "Base Salary"), payable in accordance with the Company''s standard payroll practices, subject to applicable withholdings and deductions.</p>
    <p class="subsection">3.2. <strong>Equity.</strong> The Executive shall be granted {{share_count}} shares of the Company''s Common Stock, representing approximately {{equity_percentage}}% of the Company''s fully diluted equity capitalization, subject to the terms of the Company''s equity incentive plan and applicable award agreements.</p>
    <p class="subsection">3.3. <strong>Benefits.</strong> The Executive shall be eligible to participate in all employee benefit plans and programs maintained by the Company for its senior executives.</p>
  </div>
  
  <div class="section">
    <p class="section-number">4. TERM.</p>
    <p class="subsection">4.1. The Executive''s employment hereunder shall commence on the Effective Date and shall continue for a term of {{term_length_months}} months (the "Term"), unless earlier terminated in accordance with Section 5 hereof. The Executive acknowledges and agrees that this Agreement creates a binding commitment to serve the full Term, and that resignation without a Valid Resignation Reason constitutes a material breach of this Agreement subject to the remedies set forth in Section 5.5 hereof.</p>
  </div>
  
  <div class="section">
    <p class="section-number">5. TERMINATION.</p>
    <p class="subsection">5.1. <strong>Termination by the Company for Cause.</strong> The Company may terminate the Executive''s employment hereunder for Cause at any time upon written notice to the Executive.</p>
    <p class="subsection">5.2. <strong>Termination by the Company without Cause.</strong> The Company may terminate the Executive''s employment hereunder without Cause at any time upon 30 days'' prior written notice to the Executive.</p>
    <p class="subsection">5.3. <strong>Termination by the Executive for Good Reason.</strong> The Executive may terminate the Executive''s employment hereunder for Good Reason upon 30 days'' prior written notice to the Company.</p>
    <p class="subsection">5.4. <strong>Termination due to Death or Disability.</strong> The Executive''s employment hereunder shall terminate automatically upon the Executive''s death or Disability.</p>
    <p class="subsection">5.5. <strong>Termination by the Executive Without Valid Resignation Reason.</strong> If the Executive terminates the Executive''s employment hereunder without a Valid Resignation Reason (a "Breach Resignation"), the Executive shall be deemed to have materially breached this Agreement. In the event of a Breach Resignation:</p>
    <p class="subsection" style="margin-left: 48pt;">(a) The Executive shall immediately forfeit all unvested equity, stock options, restricted stock, and any other unvested compensation;</p>
    <p class="subsection" style="margin-left: 48pt;">(b) The Executive shall repay to the Company, within 30 days of such termination, any signing bonus, relocation expenses, or other upfront compensation paid to the Executive within the 12 months preceding such termination;</p>
    <p class="subsection" style="margin-left: 48pt;">(c) The Executive shall not be entitled to any severance payments, continuation of benefits, or other post-termination compensation;</p>
    <p class="subsection" style="margin-left: 48pt;">(d) The Company may seek damages, including but not limited to liquidated damages equal to six (6) months of the Executive''s Base Salary, plus reasonable attorneys'' fees and costs incurred in enforcing this Agreement;</p>
    <p class="subsection" style="margin-left: 48pt;">(e) The restrictive covenants set forth in Section 8 hereof shall remain in full force and effect for the full term specified therein.</p>
    <p class="subsection">5.6. <strong>Notice of Resignation.</strong> The Executive must provide the Company with at least 90 days'' prior written notice of any resignation. If the Executive provides less than 90 days'' notice, the Company may, at its option, (a) require the Executive to continue employment for the full 90-day notice period, or (b) accept the resignation immediately but treat it as a Breach Resignation for purposes of Section 5.5 hereof, unless the resignation is for a Valid Resignation Reason.</p>
  </div>
  
  <div class="section">
    <p class="section-number">6. CONFIDENTIALITY.</p>
    <p class="subsection">6.1. <strong>Obligation of Confidentiality.</strong> The Executive acknowledges that the Executive will have access to Confidential Information. The Executive agrees to maintain the confidentiality of all Confidential Information and not to disclose or use any Confidential Information except as necessary in the performance of the Executive''s duties hereunder or as required by law.</p>
    <p class="subsection">6.2. <strong>Post-Termination Confidentiality.</strong> The Executive''s obligations under Section 6.1 hereof shall survive the termination of the Executive''s employment for any reason and shall continue in full force and effect for a period of ten (10) years following the date of such termination (the "Confidentiality Period"). During the Confidentiality Period, the Executive shall continue to be bound by all confidentiality obligations set forth herein, regardless of whether such termination is voluntary or involuntary, with or without Cause, with or without Good Reason, or for any other reason.</p>
    <p class="subsection">6.3. <strong>Return of Materials.</strong> Upon termination of the Executive''s employment for any reason, or at any time upon request by the Company, the Executive shall immediately return to the Company all documents, materials, electronic files, and other property (whether in physical or electronic form) containing Confidential Information, and the Executive shall not retain any copies, duplicates, reproductions, or excerpts thereof.</p>
    <p class="subsection">6.4. <strong>Exceptions.</strong> The obligations set forth in Sections 6.1 and 6.2 hereof shall not apply to information that (a) is or becomes publicly available through no breach of this Agreement by the Executive, (b) was known to the Executive prior to disclosure by the Company (as evidenced by written records), (c) is independently developed by the Executive without use of or reference to Confidential Information (as evidenced by written records), or (d) is required to be disclosed by law or court order, provided that the Executive provides the Company with prompt written notice of such requirement and cooperates with the Company in seeking a protective order or other appropriate remedy.</p>
    <p class="subsection">6.5. <strong>Injunctive Relief.</strong> The Executive acknowledges that any breach of the confidentiality obligations set forth in this Section 6 would cause irreparable harm to the Company for which monetary damages would be inadequate. Therefore, the Executive agrees that the Company shall be entitled to seek injunctive relief, specific performance, and other equitable remedies to enforce the provisions of this Section 6, without prejudice to any other rights or remedies available to the Company at law or in equity.</p>
    <p class="subsection">6.6. <strong>Survival.</strong> The provisions of this Section 6 shall survive the termination of this Agreement and the Executive''s employment for any reason and shall remain in effect for the full Confidentiality Period specified herein.</p>
  </div>
  
  <div class="section">
    <p class="section-number">7. INTELLECTUAL PROPERTY.</p>
    <p class="subsection">7.1. All inventions, discoveries, improvements, and other intellectual property made or conceived by the Executive during the Executive''s employment hereunder that relate to the Company''s business shall be the sole and exclusive property of the Company.</p>
  </div>
  
  <div class="section">
    <p class="section-number">8. NON-COMPETITION AND NON-SOLICITATION.</p>
    <p class="subsection">8.1. During the Executive''s employment and for a period of 12 months thereafter, the Executive shall not, without the prior written consent of the Company, (a) engage in any business that competes with the Company, or (b) solicit any employee, customer, or vendor of the Company.</p>
    <p class="subsection">8.2. <strong>Confidentiality During Restrictive Period.</strong> During the Executive''s employment and for the period specified in Section 8.1 hereof, and in addition thereto, for a period of ten (10) years following termination of employment for any reason, the Executive shall continue to be bound by all confidentiality obligations set forth in Section 6 hereof.</p>
  </div>
  
  <div class="section">
    <p class="section-number">9. GOVERNING LAW.</p>
    <p class="subsection">9.1. This Agreement and the rights and obligations of the parties hereunder shall be governed by and construed in accordance with the laws of the State of {{governing_law_state}}, without regard to its conflict of laws principles.</p>
    <p class="subsection">9.2. Any dispute arising out of or relating to this Agreement shall be subject to the exclusive jurisdiction of the state and federal courts located in {{governing_law_state}}.</p>
  </div>
  
  <div class="section">
    <p class="section-number">10. ENTIRE AGREEMENT.</p>
    <p class="subsection">10.1. This Agreement constitutes the entire agreement between the parties with respect to the subject matter hereof and supersedes all prior agreements, understandings, and negotiations, whether written or oral.</p>
  </div>
  
  <div class="section">
    <p class="section-number">11. MODIFICATION AND WAIVER.</p>
    <p class="subsection">11.1. No modification, amendment, or waiver of any provision of this Agreement shall be effective unless in writing and signed by both parties.</p>
    <p class="subsection">11.2. No waiver by either party of any breach of this Agreement shall be deemed a waiver of any subsequent breach.</p>
  </div>
  
  <div class="section">
    <p class="section-number">12. SEVERABILITY.</p>
    <p class="subsection">12.1. If any provision of this Agreement is held to be invalid, illegal, or unenforceable, the validity, legality, and enforceability of the remaining provisions shall not be affected thereby.</p>
  </div>
  
  <div class="section">
    <p class="section-number">13. ASSIGNMENT.</p>
    <p class="subsection">13.1. This Agreement shall be binding upon and inure to the benefit of the parties and their respective successors and assigns. The Executive may not assign this Agreement without the prior written consent of the Company.</p>
  </div>
  
  <div class="section">
    <p class="section-number">14. NOTICES.</p>
    <p class="subsection">14.1. All notices required or permitted hereunder shall be in writing and shall be deemed given when delivered personally or sent by certified mail, return receipt requested, to the parties at their respective addresses set forth herein or such other address as may be designated in writing by either party.</p>
  </div>
  
  <div class="section">
    <p class="section-number">15. COUNTERPARTS.</p>
    <p class="subsection">15.1. This Agreement may be executed in counterparts, each of which shall be deemed an original, but all of which together shall constitute one and the same instrument. Facsimile or electronic signatures shall be deemed original signatures.</p>
  </div>
  
  <div class="section">
    <p class="section-number">16. HEADINGS.</p>
    <p class="subsection">16.1. The headings in this Agreement are for convenience of reference only and shall not affect the interpretation of this Agreement.</p>
  </div>
  
  <div class="section">
    <p class="section-number">17. NO THIRD-PARTY BENEFICIARIES.</p>
    <p class="subsection">17.1. This Agreement is for the sole benefit of the parties and their respective successors and assigns and nothing herein, express or implied, is intended to or shall confer upon any other Person any legal or equitable right, benefit, or remedy of any nature whatsoever.</p>
  </div>
  
  <p style="margin-top: 36pt; text-align: center; font-weight: bold;">IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.</p>
  
  <div style="margin-top: 48pt; display: flex; justify-content: space-between;">
    <div class="signature-block">
      <p><strong>{{company_name}}</strong></p>
      <p style="margin-top: 36pt;">By: _________________________</p>
      <p>{{company_signatory_name}}<br>{{company_signatory_title}}</p>
      <p style="margin-top: 12pt;">Date: {{company_signature_date}}</p>
    </div>
    <div class="signature-block">
      <p style="margin-top: 36pt;">_________________________</p>
      <p>{{full_name}}</p>
      <p style="margin-top: 12pt;">Date: {{executive_signature_date}}</p>
    </div>
  </div>
</body>
</html>',
placeholders = '["full_name", "title", "company_name", "effective_date", "annual_salary", "equity_percentage", "share_count", "authority_granted", "date", "term_length_months", "reporting_to", "governing_law_state", "company_signatory_name", "company_signatory_title", "company_signature_date", "executive_signature_date"]'::jsonb,
updated_at = now()
WHERE template_key = 'employment_agreement';

-- 4. ENHANCED STOCK CERTIFICATE
UPDATE public.document_templates
SET html_content = '
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Stock Certificate - {{executive_name}}</title>
  <style>
    @page { margin: 1in; }
    body { 
      font-family: "Times New Roman", serif; 
      font-size: 12pt;
      line-height: 1.8;
    }
    .certificate {
      width: 8.5in;
      margin: 0 auto;
      padding: 1in;
      border: 4pt double #000;
      min-height: 11in;
    }
    .title { 
      text-align: center; 
      font-size: 16pt; 
      font-weight: bold; 
      text-transform: uppercase;
      margin-bottom: 12pt;
    }
    .subtitle { 
      text-align: center; 
      font-size: 10pt; 
      margin-bottom: 24pt; 
    }
    .center { text-align: center; }
    .big { font-size: 14pt; font-weight: bold; margin: 18pt 0; }
    .signature-row { 
      margin-top: 60pt; 
      display: flex; 
      justify-content: space-between; 
    }
    .sig-block { 
      width: 40%; 
      text-align: center; 
    }
    .sig-line { 
      border-top: 1pt solid #000; 
      margin-top: 40pt; 
      width: 100%;
    }
    .certificate-info {
      text-align: center;
      margin: 24pt 0;
      font-size: 11pt;
    }
  </style>
</head>
<body>
<div class="certificate">
  <div class="title">{{company_name}}</div>
  <div class="subtitle">A Delaware Corporation<br>Incorporated under the laws of the State of {{company_state}}</div>

  <p class="center big">STOCK CERTIFICATE</p>

  <div class="certificate-info">
    <p><strong>Certificate No.:</strong> {{certificate_number}}</p>
    <p><strong>Number of Shares:</strong> {{number_of_shares}}</p>
    <p><strong>Share Class:</strong> {{share_class}}</p>
  </div>

  <p>
    <strong>THIS CERTIFIES</strong> that <strong>{{executive_name}}</strong> is the record holder of
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

  <p>
    The shares represented by this Certificate have not been registered under the Securities Act of
    1933, as amended, or any state securities laws, and may not be sold, transferred, or otherwise
    disposed of except in compliance with such laws.
  </p>

  <p class="center" style="margin-top: 36pt;">
    <strong>IN WITNESS WHEREOF</strong>, the Company has caused this Certificate to be executed by its duly authorized officers as of {{issue_date}}.
  </p>

  <div class="signature-row">
    <div class="sig-block">
      <div class="sig-line"></div>
      <p style="margin-top: 12pt;">{{company_signatory_name}}<br />{{company_signatory_title}}</p>
    </div>
    <div class="sig-block">
      <div class="sig-line"></div>
      <p style="margin-top: 12pt;">{{secretary_name}}<br />Secretary</p>
    </div>
  </div>

</div>
</body>
</html>',
placeholders = '["executive_name", "full_name", "name", "proposed_officer_name", "title", "proposed_title", "company_name", "company_state", "certificate_number", "number_of_shares", "share_count", "share_class", "issue_date", "effective_date", "date", "company_signatory_name", "company_signatory_title", "secretary_name"]'::jsonb,
updated_at = now()
WHERE template_key = 'stock_certificate';

-- 5. ENHANCED DEFERRED COMPENSATION ADDENDUM
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
  'deferred_comp_addendum',
  'Deferred Compensation Addendum',
  'Template for deferred compensation addendums to employment agreements',
  'governance',
  '
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Deferred Compensation Addendum</title>
  <style>
    @page { margin: 1in; }
    body {
      font-family: "Times New Roman", serif;
      font-size: 12pt;
      line-height: 1.8;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 1in;
      color: #000;
    }
    .header { text-align: center; margin-bottom: 30pt; }
    .company-name { font-size: 14pt; font-weight: bold; text-transform: uppercase; }
    .recital { margin: 12pt 0; text-indent: 24pt; }
    .section { margin: 18pt 0; }
    .section-number { font-weight: bold; }
    .subsection { margin: 12pt 0 12pt 24pt; }
    .signature-block { margin-top: 48pt; border-top: 1pt solid #000; width: 3in; padding-top: 12pt; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">{{company_name}}</div>
    <div style="font-size: 10pt; margin-top: 6pt;">A Delaware Corporation</div>
    <div style="font-size: 12pt; font-weight: bold; margin-top: 12pt; text-transform: uppercase;">Deferred Compensation Addendum</div>
  </div>
  
  <div class="section">
    <p>This Deferred Compensation Addendum (this "Addendum") is entered into as of {{date}} (the "Effective Date"), by and between {{company_name}}, a Delaware corporation (the "Company"), and {{full_name}} (the "Executive"), and amends and supplements the Executive Employment Agreement entered into between the parties dated {{effective_date}} (the "Employment Agreement").</p>
  </div>
  
  <div class="section">
    <p class="recital"><strong>WHEREAS</strong>, the Company and the Executive have entered into the Employment Agreement;</p>
    
    <p class="recital"><strong>WHEREAS</strong>, the parties desire to provide for the deferral of a portion of the Executive''s compensation;</p>
    
    <p class="recital"><strong>WHEREAS</strong>, the parties desire to set forth the terms and conditions governing such deferred compensation;</p>
    
    <p style="margin-top: 18pt;"><strong>NOW, THEREFORE</strong>, in consideration of the mutual covenants and agreements set forth herein, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the parties agree as follows:</p>
  </div>
  
  <div class="section">
    <p class="section-number">1. DEFINITIONS.</p>
    <p class="subsection">1.1. "Base Salary" means the Executive''s annual base salary of {{annual_salary}}.</p>
    <p class="subsection">1.2. "Company" means {{company_name}}, a Delaware corporation.</p>
    <p class="subsection">1.3. "Deferred Amount" means the portion of the Base Salary that is deferred pursuant to this Addendum.</p>
    <p class="subsection">1.4. "Executive" means {{full_name}}.</p>
    <p class="subsection">1.5. "Trigger Event" means any of the events set forth in Section 2.2 hereof.</p>
  </div>
  
  <div class="section">
    <p class="section-number">2. DEFERRAL OF BASE SALARY.</p>
    <p class="subsection">2.1. <strong>Deferral Terms.</strong> Executive''s base salary is {{salary_currency}}{{annual_salary}} per year (the "Base Salary"), subject to the following deferral provisions.</p>
    
    <p class="subsection">2.2. <strong>Trigger Events.</strong> Payment of the Base Salary shall be deferred until the occurrence of one of the following "Trigger Events":</p>
    <p class="subsection" style="margin-left: 48pt;">{{trigger_conditions}}</p>
    
    <p class="subsection">2.3. <strong>Accrual.</strong> The Company shall accrue but not pay the Base Salary until a Trigger Event occurs. Upon the occurrence of a Trigger Event, payment of the accrued Base Salary shall begin according to the Company''s standard payroll practices, unless otherwise agreed by the parties.</p>
    
    <p class="subsection">2.4. <strong>No Guarantee.</strong> Executive acknowledges that no representation or guarantee has been made by the Company that any Trigger Event will occur at any particular time or at all.</p>
  </div>
  
  <div class="section">
    <p class="section-number">3. INTEREST AND ACCRUAL.</p>
    <p class="subsection">3.1. The Deferred Amount shall accrue interest at a rate equal to the prime rate as published in The Wall Street Journal, compounded annually, from the date of deferral until payment.</p>
  </div>
  
  <div class="section">
    <p class="section-number">4. GOVERNING LAW.</p>
    <p class="subsection">4.1. This Addendum and the rights and obligations of the parties hereunder shall be governed by and construed in accordance with the laws of the State of {{governing_law_state}}, without regard to its conflict of laws principles.</p>
  </div>
  
  <div class="section">
    <p class="section-number">5. ENTIRE AGREEMENT.</p>
    <p class="subsection">5.1. This Addendum, together with the Employment Agreement, constitutes the entire agreement between the parties with respect to the subject matter hereof and supersedes all prior agreements, understandings, and negotiations, whether written or oral.</p>
  </div>
  
  <div class="section">
    <p class="section-number">6. MODIFICATION.</p>
    <p class="subsection">6.1. This Addendum may be amended only by a written instrument signed by both parties.</p>
  </div>
  
  <p style="margin-top: 36pt; text-align: center; font-weight: bold;">IN WITNESS WHEREOF, the parties have executed this Addendum as of the date first written above.</p>
  
  <div style="margin-top: 48pt; display: flex; justify-content: space-between;">
    <div class="signature-block">
      <p><strong>{{company_name}}</strong></p>
      <p style="margin-top: 36pt;">By: _________________________</p>
      <p>{{company_signatory_name}}<br>{{company_signatory_title}}</p>
      <p style="margin-top: 12pt;">Date: {{company_signature_date}}</p>
    </div>
    <div class="signature-block">
      <p style="margin-top: 36pt;">_________________________</p>
      <p>{{full_name}}</p>
      <p style="margin-top: 12pt;">Date: {{executive_signature_date}}</p>
    </div>
  </div>
</body>
</html>',
  '["full_name", "company_name", "date", "effective_date", "annual_salary", "salary_currency", "trigger_conditions", "governing_law_state", "company_signatory_name", "company_signatory_title", "company_signature_date", "executive_signature_date"]'::jsonb,
  true,
  now(),
  now()
) ON CONFLICT (template_key) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  placeholders = EXCLUDED.placeholders,
  is_active = true,
  updated_at = now();

-- 6. ENHANCED CONFIDENTIALITY & IP ASSIGNMENT AGREEMENT
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
  'confidentiality_ip',
  'Confidentiality & IP Assignment Agreement',
  'Template for confidentiality and intellectual property assignment agreements',
  'governance',
  '
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Confidentiality & IP Assignment Agreement</title>
  <style>
    @page { margin: 1in; }
    body {
      font-family: "Times New Roman", serif;
      font-size: 12pt;
      line-height: 1.8;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 1in;
      color: #000;
    }
    .header { text-align: center; margin-bottom: 30pt; }
    .company-name { font-size: 14pt; font-weight: bold; text-transform: uppercase; }
    .recital { margin: 12pt 0; text-indent: 24pt; }
    .section { margin: 18pt 0; }
    .section-number { font-weight: bold; }
    .subsection { margin: 12pt 0 12pt 24pt; }
    .signature-block { margin-top: 48pt; border-top: 1pt solid #000; width: 3in; padding-top: 12pt; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">{{company_name}}</div>
    <div style="font-size: 10pt; margin-top: 6pt;">A Delaware Corporation</div>
    <div style="font-size: 12pt; font-weight: bold; margin-top: 12pt; text-transform: uppercase;">Confidentiality & Intellectual Property Assignment Agreement</div>
  </div>
  
  <div class="section">
    <p>This Confidentiality and Intellectual Property Assignment Agreement (this "Agreement") is entered into as of {{date}} (the "Effective Date"), by and between {{company_name}}, a Delaware corporation (the "Company"), and {{full_name}} (the "Executive").</p>
  </div>
  
  <div class="section">
    <p class="recital"><strong>WHEREAS</strong>, the Executive is or will be employed by the Company;</p>
    
    <p class="recital"><strong>WHEREAS</strong>, in the course of the Executive''s employment, the Executive will have access to confidential and proprietary information of the Company;</p>
    
    <p class="recital"><strong>WHEREAS</strong>, the Company desires to protect its confidential information and intellectual property;</p>
    
    <p class="recital"><strong>WHEREAS</strong>, the Company desires to ensure that all inventions, discoveries, and other intellectual property created by the Executive during employment belong to the Company;</p>
    
    <p style="margin-top: 18pt;"><strong>NOW, THEREFORE</strong>, in consideration of the Executive''s employment with the Company and the compensation to be paid therefor, the receipt and sufficiency of which are hereby acknowledged, the parties agree as follows:</p>
  </div>
  
  <div class="section">
    <p class="section-number">1. DEFINITIONS.</p>
    <p class="subsection">1.1. "Confidential Information" means all non-public, proprietary, or confidential information of the Company or its Affiliates, including but not limited to trade secrets, business plans, financial information, customer lists, supplier lists, marketing strategies, technical data, know-how, processes, formulas, software, and any other information that is not generally known to the public.</p>
    <p class="subsection">1.2. "Intellectual Property" means all inventions, discoveries, improvements, works of authorship, trade secrets, know-how, ideas, concepts, designs, processes, methods, techniques, software, and other intellectual property, whether or not patentable, copyrightable, or registrable.</p>
    <p class="subsection">1.3. "Work Product" means all Intellectual Property made, conceived, developed, or reduced to practice by the Executive, either alone or jointly with others, during the Executive''s employment with the Company that (a) relates to the Company''s business, (b) results from work performed by the Executive for the Company, or (c) is made using the Company''s equipment, supplies, facilities, or Confidential Information.</p>
  </div>
  
  <div class="section">
    <p class="section-number">2. CONFIDENTIALITY.</p>
    <p class="subsection">2.1. <strong>Obligation of Confidentiality.</strong> The Executive agrees to hold all Confidential Information in strict confidence and not to disclose, use, or permit others to disclose or use any Confidential Information, except as necessary in the performance of the Executive''s duties for the Company or as required by law.</p>
    <p class="subsection">2.2. <strong>Post-Termination Confidentiality Period.</strong> The Executive''s obligations under Section 2.1 hereof shall survive the termination of the Executive''s employment for any reason (whether voluntary or involuntary, with or without cause, with or without good reason, or for any other reason) and shall continue in full force and effect for a period of ten (10) years following the date of such termination (the "Confidentiality Period"). The Executive acknowledges and agrees that the Confidential Information constitutes valuable, special, and unique assets of the Company, and that the protection of such Confidential Information is essential to the Company''s business and competitive position.</p>
    <p class="subsection">2.3. <strong>Return of Materials.</strong> Upon termination of the Executive''s employment for any reason, or at any time upon request by the Company, the Executive shall immediately return to the Company all documents, materials, electronic files, computer files, databases, records, notes, memoranda, reports, and other property (whether in physical or electronic form) containing Confidential Information, and the Executive shall not retain any copies, duplicates, reproductions, excerpts, or summaries thereof. The Executive further agrees to permanently delete all Confidential Information from any personal devices, cloud storage, or other systems under the Executive''s control.</p>
    <p class="subsection">2.4. <strong>Exceptions.</strong> The obligations set forth in Sections 2.1 and 2.2 hereof shall not apply to information that (a) is or becomes publicly available through no breach of this Agreement by the Executive, (b) was known to the Executive prior to disclosure by the Company (as evidenced by written records), (c) is independently developed by the Executive without use of or reference to Confidential Information (as evidenced by written records), or (d) is required to be disclosed by law or court order, provided that the Executive provides the Company with prompt written notice of such requirement and cooperates with the Company in seeking a protective order or other appropriate remedy.</p>
    <p class="subsection">2.5. <strong>Injunctive Relief and Remedies.</strong> The Executive acknowledges that any breach of the confidentiality obligations set forth in this Section 2 would cause irreparable and continuing harm to the Company for which monetary damages would be inadequate. Therefore, the Executive agrees that the Company shall be entitled to seek injunctive relief, specific performance, and other equitable remedies to enforce the provisions of this Section 2, without prejudice to any other rights or remedies available to the Company at law or in equity, including but not limited to monetary damages, attorneys'' fees, and costs.</p>
    <p class="subsection">2.6. <strong>Survival.</strong> The provisions of this Section 2 shall survive the termination of this Agreement and the Executive''s employment for any reason and shall remain in effect for the full Confidentiality Period of ten (10) years specified herein, regardless of the reason for termination.</p>
  </div>
  
  <div class="section">
    <p class="section-number">3. ASSIGNMENT OF INTELLECTUAL PROPERTY.</p>
    <p class="subsection">3.1. <strong>Assignment of Work Product.</strong> The Executive hereby assigns to the Company all right, title, and interest in and to all Work Product, including all intellectual property rights therein.</p>
    <p class="subsection">3.2. <strong>Work Made for Hire.</strong> All Work Product shall be deemed "work made for hire" within the meaning of the Copyright Act of 1976, as amended. To the extent any Work Product is not deemed work made for hire, the Executive hereby assigns all right, title, and interest therein to the Company.</p>
    <p class="subsection">3.3. <strong>Moral Rights.</strong> The Executive hereby waives all moral rights in and to the Work Product to the extent permitted by law.</p>
    <p class="subsection">3.4. <strong>Further Assurances.</strong> The Executive agrees to execute all documents and take all actions reasonably requested by the Company to perfect the Company''s ownership of the Work Product.</p>
  </div>
  
  <div class="section">
    <p class="section-number">4. DISCLOSURE OF INVENTIONS.</p>
    <p class="subsection">4.1. The Executive agrees to promptly disclose to the Company all Work Product and to maintain adequate records of all Work Product.</p>
  </div>
  
  <div class="section">
    <p class="section-number">5. GOVERNING LAW.</p>
    <p class="subsection">5.1. This Agreement shall be governed by the laws of the State of {{governing_law_state}} without regard to its conflict of laws rules. This Agreement may be executed electronically and in counterparts.</p>
    <p class="subsection">5.2. Any dispute arising out of or relating to this Agreement shall be subject to the exclusive jurisdiction of the state and federal courts located in {{governing_law_state}}.</p>
  </div>
  
  <div class="section">
    <p class="section-number">6. ENTIRE AGREEMENT.</p>
    <p class="subsection">6.1. This Agreement constitutes the entire agreement between the parties with respect to the subject matter hereof and supersedes all prior agreements, understandings, and negotiations, whether written or oral.</p>
  </div>
  
  <div class="section">
    <p class="section-number">7. MODIFICATION AND WAIVER.</p>
    <p class="subsection">7.1. No modification, amendment, or waiver of any provision of this Agreement shall be effective unless in writing and signed by both parties.</p>
  </div>
  
  <div class="section">
    <p class="section-number">8. SEVERABILITY.</p>
    <p class="subsection">8.1. If any provision of this Agreement is held to be invalid, illegal, or unenforceable, the validity, legality, and enforceability of the remaining provisions shall not be affected thereby.</p>
  </div>
  
  <div class="section">
    <p class="section-number">9. ASSIGNMENT.</p>
    <p class="subsection">9.1. This Agreement shall be binding upon and inure to the benefit of the parties and their respective successors and assigns. The Executive may not assign this Agreement without the prior written consent of the Company.</p>
  </div>
  
  <p style="margin-top: 36pt; text-align: center; font-weight: bold;">IN WITNESS WHEREOF, the parties have executed this Confidentiality & IP Assignment Agreement as of the date first written above.</p>
  
  <div style="margin-top: 48pt; display: flex; justify-content: space-between;">
    <div class="signature-block">
      <p><strong>{{company_name}}</strong></p>
      <p style="margin-top: 36pt;">By: _________________________</p>
      <p>{{company_signatory_name}}<br>{{company_signatory_title}}</p>
      <p style="margin-top: 12pt;">Date: {{company_signature_date}}</p>
    </div>
    <div class="signature-block">
      <p style="font-weight: bold; margin-bottom: 12pt;">EXECUTIVE</p>
      <p style="margin-top: 24pt;">_________________________</p>
      <p>{{full_name}}</p>
      <p style="margin-top: 12pt;">Date: {{executive_signature_date}}</p>
    </div>
  </div>
</body>
</html>',
  '["full_name", "company_name", "date", "governing_law_state", "company_signatory_name", "company_signatory_title", "company_signature_date", "executive_signature_date"]'::jsonb,
  true,
  now(),
  now()
) ON CONFLICT (template_key) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  placeholders = EXCLUDED.placeholders,
  is_active = true,
  updated_at = now();

-- 7. ENHANCED STOCK SUBSCRIPTION / ISSUANCE AGREEMENT
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
  'stock_issuance',
  'Stock Subscription / Issuance Agreement',
  'Template for stock subscription and equity grant agreements',
  'governance',
  '
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Stock Subscription / Issuance Agreement</title>
  <style>
    @page { margin: 1in; }
    body {
      font-family: "Times New Roman", serif;
      font-size: 12pt;
      line-height: 1.8;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 1in;
      color: #000;
    }
    .header { text-align: center; margin-bottom: 30pt; }
    .company-name { font-size: 14pt; font-weight: bold; text-transform: uppercase; }
    .recital { margin: 12pt 0; text-indent: 24pt; }
    .section { margin: 18pt 0; }
    .section-number { font-weight: bold; }
    .subsection { margin: 12pt 0 12pt 24pt; }
    .signature-block { margin-top: 48pt; border-top: 1pt solid #000; width: 3in; padding-top: 12pt; }
    .equity-table { width: 100%; border-collapse: collapse; margin: 18pt 0; }
    .equity-table td { padding: 8pt; border-bottom: 1pt solid #ddd; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">{{company_name}}</div>
    <div style="font-size: 10pt; margin-top: 6pt;">A Delaware Corporation</div>
    <div style="font-size: 12pt; font-weight: bold; margin-top: 12pt; text-transform: uppercase;">Stock Subscription / Equity Grant Agreement</div>
  </div>
  
  <div class="section">
    <p>This Stock Subscription and Equity Grant Agreement (this "Agreement") is entered into as of {{date}} (the "Effective Date"), by and between {{company_name}}, a Delaware corporation (the "Company"), and {{full_name}} (the "Subscriber" or "Executive").</p>
  </div>
  
  <div class="section">
    <p class="recital"><strong>WHEREAS</strong>, the Company desires to issue shares of its Common Stock to the Executive;</p>
    
    <p class="recital"><strong>WHEREAS</strong>, the Executive desires to subscribe for and purchase shares of the Company''s Common Stock;</p>
    
    <p class="recital"><strong>WHEREAS</strong>, the parties desire to set forth the terms and conditions governing such subscription and issuance;</p>
    
    <p style="margin-top: 18pt;"><strong>NOW, THEREFORE</strong>, in consideration of the mutual covenants and agreements set forth herein, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the parties agree as follows:</p>
  </div>
  
  <div class="section">
    <p class="section-number">1. DEFINITIONS.</p>
    <p class="subsection">1.1. "Company" means {{company_name}}, a Delaware corporation.</p>
    <p class="subsection">1.2. "Common Stock" means the Company''s common stock, par value $0.001 per share.</p>
    <p class="subsection">1.3. "Executive" or "Subscriber" means {{full_name}}.</p>
    <p class="subsection">1.4. "Shares" means {{share_count}} shares of Common Stock to be issued pursuant to this Agreement.</p>
    <p class="subsection">1.5. "Purchase Price" means {{price_per_share}} per share, for a total purchase price of {{total_purchase_price}}.</p>
  </div>
  
  <div class="section">
    <p class="section-number">2. SUBSCRIPTION AND ISSUANCE.</p>
    <p class="subsection">2.1. <strong>Subscription.</strong> The Executive hereby subscribes for and agrees to purchase from the Company, and the Company agrees to issue and sell to the Executive, {{share_count}} shares of Common Stock (the "Shares") at a price of {{price_per_share}} per share.</p>
    
    <p class="subsection">2.2. <strong>Consideration.</strong> The consideration for the Shares shall be {{consideration_type}}, in the amount of {{total_purchase_price}}.</p>
    
    <p class="subsection">2.3. <strong>Ownership Percentage.</strong> The Shares represent approximately {{equity_percentage}}% of the Company''s fully diluted equity capitalization as of the Effective Date.</p>
    
    <table class="equity-table">
      <tr>
        <td><strong>Number of Shares:</strong></td>
        <td>{{share_count}}</td>
      </tr>
      <tr>
        <td><strong>Share Class:</strong></td>
        <td>{{share_class}}</td>
      </tr>
      <tr>
        <td><strong>Price Per Share:</strong></td>
        <td>{{price_per_share}}</td>
      </tr>
      <tr>
        <td><strong>Total Purchase Price:</strong></td>
        <td>{{total_purchase_price}}</td>
      </tr>
      <tr>
        <td><strong>Ownership Percentage:</strong></td>
        <td>{{equity_percentage}}%</td>
      </tr>
      <tr>
        <td><strong>Vesting Schedule:</strong></td>
        <td>{{vesting_schedule}}</td>
      </tr>
    </table>
  </div>
  
  <div class="section">
    <p class="section-number">3. REPRESENTATIONS AND WARRANTIES OF THE EXECUTIVE.</p>
    <p class="subsection">3.1. The Executive represents and warrants that (a) the Executive has the full power and authority to enter into this Agreement, (b) the Executive is an "accredited investor" as defined in Rule 501 of Regulation D under the Securities Act of 1933, as amended, (c) the Executive is acquiring the Shares for investment purposes only and not with a view to distribution, and (d) the Executive has had the opportunity to ask questions of and receive answers from the Company regarding the Shares.</p>
  </div>
  
  <div class="section">
    <p class="section-number">4. RESTRICTIONS ON TRANSFER.</p>
    <p class="subsection">4.1. The Shares have not been registered under the Securities Act of 1933, as amended, or any state securities laws, and may not be sold, transferred, or otherwise disposed of except in compliance with such laws.</p>
    <p class="subsection">4.2. The Shares are subject to restrictions on transfer set forth in the Company''s Bylaws, any Shareholders'' Agreement, and applicable securities laws.</p>
  </div>
  
  <div class="section">
    <p class="section-number">5. VESTING.</p>
    <p class="subsection">5.1. The Shares shall vest in accordance with the following schedule: {{vesting_schedule}}</p>
  </div>
  
  <div class="section">
    <p class="section-number">6. GOVERNING LAW.</p>
    <p class="subsection">6.1. This Agreement and the rights and obligations of the parties hereunder shall be governed by and construed in accordance with the laws of the State of {{governing_law_state}}, without regard to its conflict of laws principles.</p>
    <p class="subsection">6.2. Any dispute arising out of or relating to this Agreement shall be subject to the exclusive jurisdiction of the state and federal courts located in {{governing_law_state}}.</p>
  </div>
  
  <div class="section">
    <p class="section-number">7. ENTIRE AGREEMENT.</p>
    <p class="subsection">7.1. This Agreement constitutes the entire agreement between the parties with respect to the subject matter hereof and supersedes all prior agreements, understandings, and negotiations, whether written or oral.</p>
  </div>
  
  <div class="section">
    <p class="section-number">8. MODIFICATION AND WAIVER.</p>
    <p class="subsection">8.1. No modification, amendment, or waiver of any provision of this Agreement shall be effective unless in writing and signed by both parties.</p>
    <p class="subsection">8.2. No waiver by either party of any breach of this Agreement shall be deemed a waiver of any subsequent breach.</p>
  </div>
  
  <div class="section">
    <p class="section-number">9. SEVERABILITY.</p>
    <p class="subsection">9.1. If any provision of this Agreement is held to be invalid, illegal, or unenforceable, the validity, legality, and enforceability of the remaining provisions shall not be affected thereby.</p>
  </div>
  
  <div class="section">
    <p class="section-number">10. COUNTERPARTS.</p>
    <p class="subsection">10.1. This Agreement may be executed in counterparts, each of which shall be deemed an original, but all of which together shall constitute one and the same instrument. Facsimile or electronic signatures shall be deemed original signatures.</p>
  </div>
  
  <div class="section">
    <p class="section-number">11. HEADINGS.</p>
    <p class="subsection">11.1. The headings in this Agreement are for convenience of reference only and shall not affect the interpretation of this Agreement.</p>
  </div>
  
  <p style="margin-top: 36pt; text-align: center; font-weight: bold;">IN WITNESS WHEREOF, the parties have executed this Stock Subscription / Equity Grant Agreement as of the date first written above.</p>
  
  <div style="margin-top: 48pt; display: flex; justify-content: space-between;">
    <div class="signature-block">
      <p><strong>{{company_name}}</strong></p>
      <p style="margin-top: 36pt;">By: _________________________</p>
      <p>{{company_signatory_name}}<br>{{company_signatory_title}}</p>
      <p style="margin-top: 12pt;">Date: {{company_signature_date}}</p>
    </div>
    <div class="signature-block">
      <p style="font-weight: bold; margin-bottom: 12pt;">HOLDER</p>
      <p style="margin-top: 24pt;">_________________________</p>
      <p>{{full_name}}</p>
      <p style="margin-top: 12pt;">Date: {{executive_signature_date}}</p>
    </div>
  </div>
</body>
</html>',
  '["full_name", "company_name", "date", "share_count", "price_per_share", "total_purchase_price", "equity_percentage", "share_class", "vesting_schedule", "consideration_type", "governing_law_state", "company_signatory_name", "company_signatory_title", "company_signature_date", "executive_signature_date"]'::jsonb,
  true,
  now(),
  now()
) ON CONFLICT (template_key) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  placeholders = EXCLUDED.placeholders,
  is_active = true,
  updated_at = now();

-- Update placeholders arrays to include all new placeholders
UPDATE public.document_templates
SET placeholders = '["full_name", "title", "company_name", "effective_date", "annual_salary", "equity_percentage", "share_count", "authority_granted", "date", "proposed_officer_email", "proposed_officer_phone", "term_length_months", "vesting_schedule", "share_class", "exercise_price", "governing_law_state", "company_signatory_name", "company_signatory_title", "company_signature_date", "executive_signature_date", "reporting_to"]'::jsonb
WHERE template_key = 'offer_letter';

UPDATE public.document_templates
SET placeholders = '["full_name", "title", "company_name", "effective_date", "annual_salary", "equity_percentage", "share_count", "authority_granted", "resolution_number", "resolution_date"]'::jsonb
WHERE template_key = 'board_resolution';

UPDATE public.document_templates
SET placeholders = '["full_name", "title", "company_name", "effective_date", "annual_salary", "equity_percentage", "share_count", "authority_granted", "date", "term_length_months", "reporting_to", "governing_law_state", "company_signatory_name", "company_signatory_title", "company_signature_date", "executive_signature_date"]'::jsonb
WHERE template_key = 'employment_agreement';

UPDATE public.document_templates
SET placeholders = '["executive_name", "full_name", "name", "proposed_officer_name", "title", "proposed_title", "company_name", "company_state", "certificate_number", "number_of_shares", "share_count", "share_class", "issue_date", "effective_date", "date", "company_signatory_name", "company_signatory_title", "secretary_name"]'::jsonb
WHERE template_key = 'stock_certificate';

UPDATE public.document_templates
SET placeholders = '["full_name", "company_name", "date", "effective_date", "annual_salary", "salary_currency", "trigger_conditions", "governing_law_state", "company_signatory_name", "company_signatory_title", "company_signature_date", "executive_signature_date"]'::jsonb
WHERE template_key = 'deferred_comp_addendum';

UPDATE public.document_templates
SET placeholders = '["full_name", "company_name", "date", "governing_law_state", "company_signatory_name", "company_signatory_title", "company_signature_date", "executive_signature_date"]'::jsonb
WHERE template_key = 'confidentiality_ip';

UPDATE public.document_templates
SET placeholders = '["full_name", "company_name", "date", "share_count", "price_per_share", "total_purchase_price", "equity_percentage", "share_class", "vesting_schedule", "consideration_type", "governing_law_state", "company_signatory_name", "company_signatory_title", "company_signature_date", "executive_signature_date"]'::jsonb
WHERE template_key = 'stock_issuance';

-- 8. ENHANCED PRE-INCORPORATION CONSENT AGREEMENT
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
  'pre_incorporation_consent',
  'Pre-Incorporation Consent (Conditional Appointments)',
  'Written consent of the sole incorporator for pre-incorporation actions, including conditional appointment of officers and directors',
  'governance',
  '
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Pre-Incorporation Consent (Conditional Appointments)</title>
  <style>
    @page { margin: 1in; }
    body {
      font-family: "Times New Roman", serif;
      font-size: 12pt;
      line-height: 1.8;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 1in;
      color: #000;
    }
    .header { text-align: center; margin-bottom: 30pt; }
    .company-name { font-size: 14pt; font-weight: bold; text-transform: uppercase; }
    .recital { margin: 12pt 0; text-indent: 24pt; }
    .section { margin: 18pt 0; }
    .section-number { font-weight: bold; }
    .subsection { margin: 12pt 0 12pt 24pt; }
    .signature-block { margin-top: 48pt; border-top: 1pt solid #000; width: 3in; padding-top: 12pt; }
    table { width: 100%; border-collapse: collapse; margin: 12pt 0; }
    th, td { padding: 8pt; border: 1pt solid #000; text-align: left; }
    th { background-color: #f0f0f0; font-weight: bold; }
    .box { border: 1pt solid #000; padding: 12pt; margin: 12pt 0; }
    .page-break { page-break-before: always; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="font-size: 16pt; font-weight: bold; text-transform: uppercase; margin-bottom: 12pt;">Pre-Incorporation Written Consent<br/>of the Sole Incorporator</h1>
    <div class="company-name">{{company_name}}</div>
    <div style="font-size: 10pt; margin-top: 6pt;">A Delaware Corporation (to be formed)</div>
    <p style="font-size: 10pt; margin-top: 12pt;">
      Intended State of Incorporation: <strong>{{state_of_incorporation}}</strong><br/>
      Intended Registered Office: {{registered_office}}<br/>
      Effective Upon: Filing and acceptance of the Articles of Incorporation by {{state_filing_office}} (the "Effective Time")
    </p>
  </div>
  
  <div class="section">
    <h2 class="section-number">RECITALS</h2>
    <div class="box">
      <p class="recital"><strong>WHEREAS</strong>, the undersigned is the sole incorporator ("Incorporator") of {{company_name}}, a corporation to be formed under the laws of the State of {{state_of_incorporation}};</p>
      <p class="recital"><strong>WHEREAS</strong>, the Incorporator desires to adopt certain resolutions by written consent in lieu of an organizational meeting;</p>
      <p class="recital"><strong>WHEREAS</strong>, this consent is executed prior to filing the Articles of Incorporation and shall become operative automatically as of the Effective Time;</p>
      <p class="recital"><strong>WHEREAS</strong>, prior to the Effective Time the Corporation does not yet exist as a legal entity, and accordingly, the actions below are expressly made conditional and shall be deemed authorized and effective only as of the Effective Time;</p>
      <p style="margin-top: 18pt;"><strong>NOW, THEREFORE</strong>, the Incorporator hereby adopts the following resolutions:</p>
    </div>
  </div>
  
  <div class="section">
    <h2 class="section-number">1. ARTICLES OF INCORPORATION</h2>
    <p class="subsection">1.1. The Incorporator hereby approves the filing of the Articles of Incorporation in substantially the form attached as <em>Exhibit A</em>, and authorizes submission for filing with {{state_filing_office}}. This resolution is ratified effective as of the Effective Time.</p>
  </div>
  
  <div class="section">
    <h2 class="section-number">2. ADOPTION OF BYLAWS</h2>
    <p class="subsection">2.1. Effective as of the Effective Time, the Bylaws of the Corporation in the form attached as <em>Exhibit B</em> are hereby adopted and approved.</p>
  </div>
  
  <div class="section">
    <h2 class="section-number">3. APPOINTMENT OF INITIAL BOARD OF DIRECTORS (CONDITIONAL)</h2>
    <p class="subsection">3.1. Effective as of the Effective Time, the following individuals are hereby appointed to serve as the initial members of the Board of Directors of the Corporation, to hold office until successors are duly elected and qualified or until earlier death, resignation, or removal in accordance with the Bylaws:</p>
    <table>
      <thead>
        <tr>
          <th>Director Name</th>
          <th>Address</th>
          <th>Email</th>
          <th>Term Notes</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{{director_1_name}}</td>
          <td>{{director_1_address}}</td>
          <td>{{director_1_email}}</td>
          <td>Initial director; serves per Bylaws</td>
        </tr>
        <tr>
          <td>{{director_2_name}}</td>
          <td>{{director_2_address}}</td>
          <td>{{director_2_email}}</td>
          <td>Initial director; serves per Bylaws</td>
        </tr>
      </tbody>
    </table>
  </div>
  
  <div class="section">
    <h2 class="section-number">4. APPOINTMENT OF INITIAL OFFICERS (CONDITIONAL)</h2>
    <p class="subsection">4.1. Effective as of the Effective Time, the following individuals are hereby appointed to the officer positions indicated below, to serve at the pleasure of the Board and in accordance with the Bylaws:</p>
    <table>
      <thead>
        <tr>
          <th>Officer Name</th>
          <th>Title</th>
          <th>Email</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{{officer_1_name}}</td>
          <td>{{officer_1_title}}</td>
          <td>{{officer_1_email}}</td>
          <td>Appointment effective at Effective Time</td>
        </tr>
        <tr>
          <td>{{officer_2_name}}</td>
          <td>{{officer_2_title}}</td>
          <td>{{officer_2_email}}</td>
          <td>Appointment effective at Effective Time</td>
        </tr>
        <tr>
          <td>{{officer_3_name}}</td>
          <td>{{officer_3_title}}</td>
          <td>{{officer_3_email}}</td>
          <td>Appointment effective at Effective Time</td>
        </tr>
      </tbody>
    </table>
  </div>
  
  <div class="section">
    <h2 class="section-number">5. ORGANIZATIONAL ACTIONS UPON EFFECTIVENESS</h2>
    <p class="subsection">5.1. As of the Effective Time, the Board is hereby authorized to open and maintain bank accounts, apply for an Employer Identification Number (EIN), issue stock, and take such further actions as necessary to fully organize the Corporation.</p>
  </div>
  
  <div class="section">
    <h2 class="section-number">6. RATIFICATION OF PRE-INCORPORATION AGREEMENTS</h2>
    <p class="subsection">6.1. Subject to Board review, any pre-incorporation agreements entered into by or on behalf of the Corporation, as listed on <em>Exhibit C</em> (if any), are hereby adopted and ratified as of the Effective Time.</p>
  </div>
  
  <div class="section">
    <h2 class="section-number">7. FISCAL YEAR</h2>
    <p class="subsection">7.1. The fiscal year of the Corporation shall end on {{fiscal_year_end}} unless changed by resolution of the Board.</p>
  </div>
  
  <div class="section">
    <h2 class="section-number">8. REGISTERED AGENT</h2>
    <p class="subsection">8.1. The Incorporator hereby approves the designation of {{registered_agent_name}}, located at {{registered_agent_address}}, as the Corporation''s registered agent in {{state_of_incorporation}}, effective as of the Effective Time.</p>
  </div>
  
  <div class="section">
    <h2 class="section-number">9. GENERAL AUTHORIZATION</h2>
    <p class="subsection">9.1. The officers and directors appointed as of the Effective Time are hereby authorized to execute and deliver any documents and instruments necessary to effectuate these resolutions.</p>
  </div>
  
  <div class="section">
    <h2 class="section-number">10. GOVERNING LAW</h2>
    <p class="subsection">10.1. This Written Consent and the rights and obligations hereunder shall be governed by and construed in accordance with the laws of the State of {{state_of_incorporation}}, without regard to its conflict of laws principles.</p>
    <p class="subsection">10.2. Any dispute arising out of or relating to this Written Consent shall be subject to the exclusive jurisdiction of the state and federal courts located in {{state_of_incorporation}}.</p>
  </div>
  
  <div class="section">
    <h2 class="section-number">11. EXECUTION</h2>
    <p>IN WITNESS WHEREOF, the undersigned Incorporator has executed this Written Consent as of {{consent_date}}. This Written Consent shall be filed in the Corporation''s minute book following the Effective Time.</p>
    
    <div class="signature-block" style="margin-top: 36pt;">
      <p><strong>INCORPORATOR:</strong></p>
      <p style="margin-top: 36pt;">_________________________</p>
      <p>{{incorporator_name}}</p>
      <p style="margin-top: 12pt; font-size: 10pt;">Address: {{incorporator_address}}</p>
      <p style="font-size: 10pt;">Email: {{incorporator_email}}</p>
      <p style="margin-top: 12pt;">Date: {{consent_date}}</p>
    </div>
  </div>
  
  <div class="page-break"></div>
  
  <div class="section">
    <h2 class="section-number">OFFICER/DIRECTOR ACCEPTANCE (EFFECTIVE UPON FILING)</h2>
    <p>Each undersigned acknowledges appointment and agrees to serve effective as of the Effective Time, subject to the Bylaws and applicable law.</p>
    
    <div class="box" style="margin-top: 24pt;">
      <p><strong>Name:</strong> {{appointee_1_name}}</p>
      <p><strong>Role:</strong> {{appointee_1_role}}</p>
      <p><strong>Email:</strong> {{appointee_1_email}}</p>
      <div style="margin-top: 24pt; border-top: 1pt solid #000; padding-top: 12pt;">
        <p>_________________________</p>
        <p>Signature of Appointee</p>
        <p style="margin-top: 12pt;">Date: _________________________</p>
      </div>
    </div>
    
    <div class="box" style="margin-top: 24pt;">
      <p><strong>Name:</strong> {{appointee_2_name}}</p>
      <p><strong>Role:</strong> {{appointee_2_role}}</p>
      <p><strong>Email:</strong> {{appointee_2_email}}</p>
      <div style="margin-top: 24pt; border-top: 1pt solid #000; padding-top: 12pt;">
        <p>_________________________</p>
        <p>Signature of Appointee</p>
        <p style="margin-top: 12pt;">Date: _________________________</p>
      </div>
    </div>
  </div>
  
  <div class="page-break"></div>
  
  <div class="section">
    <h2 class="section-number">EXHIBIT A — ARTICLES OF INCORPORATION (DRAFT)</h2>
    <p style="margin-top: 24pt; font-style: italic; color: #666;">[Articles of Incorporation to be attached]</p>
  </div>
  
  <div class="page-break"></div>
  
  <div class="section">
    <h2 class="section-number">EXHIBIT B — BYLAWS OF {{company_name}}</h2>
    <div style="text-align: center; margin: 24pt 0;">
      <h1 style="font-size: 16pt; font-weight: bold; text-transform: uppercase;">BYLAWS OF {{company_name}}</h1>
      <p style="font-size: 10pt; margin-top: 12pt;">A Delaware Corporation</p>
      <p style="font-size: 10pt; margin-top: 6pt;">Adopted as of the Effective Time under the Pre-Incorporation Consent</p>
    </div>
    
    <div class="section">
      <h2 class="section-number">ARTICLE I — OFFICES</h2>
      <p class="subsection">Section 1. <strong>Principal Office.</strong> The principal office of the Corporation shall be located at {{principal_office}} or at such other place as the Board of Directors may from time to time determine.</p>
      <p class="subsection">Section 2. <strong>Other Offices.</strong> The Corporation may have such other offices, either within or without the State of {{state_of_incorporation}}, as the Board of Directors may from time to time determine.</p>
    </div>
    
    <div class="section">
      <h2 class="section-number">ARTICLE II — SHAREHOLDERS</h2>
      <p class="subsection">Section 1. <strong>Annual Meetings.</strong> An annual meeting of shareholders shall be held at such time and place as the Board of Directors may determine for the purpose of electing directors and transacting such other business as may properly come before the meeting.</p>
      <p class="subsection">Section 2. <strong>Special Meetings.</strong> Special meetings of shareholders may be called by the President, the Board of Directors, or by shareholders holding not less than one-tenth of all shares entitled to vote.</p>
      <p class="subsection">Section 3. <strong>Notice.</strong> Written notice of any meeting of shareholders shall be delivered not less than 10 nor more than 60 days before the date of the meeting.</p>
    </div>
    
    <div class="section">
      <h2 class="section-number">ARTICLE III — BOARD OF DIRECTORS</h2>
      <p class="subsection">Section 1. <strong>General Powers.</strong> The business and affairs of the Corporation shall be managed by its Board of Directors.</p>
      <p class="subsection">Section 2. <strong>Number and Tenure.</strong> The number of directors shall be fixed by resolution of the Board of Directors or shareholders.</p>
      <p class="subsection">Section 3. <strong>Meetings.</strong> Regular and special meetings of the Board may be held with such notice as determined by the Board.</p>
      <p class="subsection">Section 4. <strong>Quorum.</strong> A majority of the directors constitutes a quorum. The act of a majority of the directors present at a meeting at which a quorum is present is the act of the Board.</p>
      <p class="subsection">Section 5. <strong>Action Without Meeting.</strong> Any action required or permitted to be taken at a meeting of the Board may be taken without a meeting if consented to in writing by all directors.</p>
    </div>
    
    <div class="section">
      <h2 class="section-number">ARTICLE IV — OFFICERS</h2>
      <p class="subsection">Section 1. <strong>Officers.</strong> The principal officers of the Corporation shall be a Chief Executive Officer, President, Chief Financial Officer, Secretary, and such other officers as the Board of Directors may from time to time appoint.</p>
      <p class="subsection">Section 2. <strong>Election and Term.</strong> Officers shall be elected annually by the Board of Directors and shall serve until their successors are chosen and qualified or until their resignation or removal.</p>
      <p class="subsection">Section 3. <strong>Duties.</strong> (a) Chief Executive Officer — general supervision and control of the business and affairs of the Corporation. (b) President — acts as chief operating officer. (c) Chief Financial Officer — chief accounting and financial officer. (d) Secretary — keeps minutes and records of the corporation.</p>
    </div>
    
    <div class="section">
      <h2 class="section-number">ARTICLE V — COMMITTEES</h2>
      <p class="subsection">The Board of Directors may designate committees and delegate authority as permitted by law. Each committee shall keep minutes and report to the Board.</p>
    </div>
    
    <div class="section">
      <h2 class="section-number">ARTICLE VI — INDEMNIFICATION</h2>
      <p class="subsection">The Corporation shall indemnify directors, officers, and authorized agents to the fullest extent permitted by law against expenses and liabilities reasonably incurred in connection with service to the Corporation.</p>
    </div>
    
    <div class="section">
      <h2 class="section-number">ARTICLE VII — STOCK AND CERTIFICATES</h2>
      <p class="subsection">Shares may be issued in certificated or uncertificated form as determined by the Board. Certificates shall bear signatures of the President and Secretary and the corporate seal if any.</p>
    </div>
    
    <div class="section">
      <h2 class="section-number">ARTICLE VIII — FISCAL MATTERS</h2>
      <p class="subsection">Section 1. <strong>Fiscal Year.</strong> The fiscal year of the Corporation shall end on {{fiscal_year_end}} unless changed by resolution of the Board.</p>
      <p class="subsection">Section 2. <strong>Checks and Drafts.</strong> All checks, drafts, or orders for payment shall be signed as authorized by the Board.</p>
    </div>
    
    <div class="section">
      <h2 class="section-number">ARTICLE IX — CORPORATE SEAL</h2>
      <p class="subsection">The Corporation may adopt a seal bearing its name and state of incorporation; use is not required for validity of acts or documents.</p>
    </div>
    
    <div class="section">
      <h2 class="section-number">ARTICLE X — AMENDMENTS</h2>
      <p class="subsection">These Bylaws may be amended or repealed, and new Bylaws adopted, by majority vote of the Board or shareholders as permitted by law and the Articles of Incorporation.</p>
    </div>
    
    <div style="margin-top: 36pt; text-align: center;">
      <p style="font-size: 10pt; font-style: italic;">Certified to be the true and correct Bylaws of {{company_name}} as adopted on {{effective_date}}.</p>
      <div style="margin-top: 24pt; border-top: 1pt solid #000; width: 3in; margin-left: auto; margin-right: auto; padding-top: 12pt;">
        <p>Secretary: _________________________</p>
      </div>
    </div>
  </div>
  
  <div class="page-break"></div>
  
  <div class="section">
    <h2 class="section-number">EXHIBIT C — PRE-INCORPORATION AGREEMENTS LIST (IF ANY)</h2>
    <table>
      <thead>
        <tr>
          <th>Counterparty</th>
          <th>Agreement Name</th>
          <th>Date</th>
          <th>Assumption Notes</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{{counterparty_1}}</td>
          <td>{{agreement_1_name}}</td>
          <td>{{agreement_1_date}}</td>
          <td>{{agreement_1_notes}}</td>
        </tr>
      </tbody>
    </table>
  </div>
  
  <p style="margin-top: 24pt; font-size: 10pt; text-align: center; font-style: italic; color: #666;">
    This Pre-Incorporation Consent template may require modification to comply with the laws of {{state_of_incorporation}}. Consult counsel for your specific facts.
  </p>
</body>
</html>',
  '["company_name", "state_of_incorporation", "registered_office", "state_filing_office", "fiscal_year_end", "registered_agent_name", "registered_agent_address", "incorporator_name", "incorporator_address", "incorporator_email", "consent_date", "effective_date", "principal_office", "director_1_name", "director_1_address", "director_1_email", "director_2_name", "director_2_address", "director_2_email", "officer_1_name", "officer_1_title", "officer_1_email", "officer_2_name", "officer_2_title", "officer_2_email", "officer_3_name", "officer_3_title", "officer_3_email", "appointee_1_name", "appointee_1_role", "appointee_1_email", "appointee_2_name", "appointee_2_role", "appointee_2_email", "counterparty_1", "agreement_1_name", "agreement_1_date", "agreement_1_notes", "state"]'::jsonb,
  true,
  now(),
  now()
) ON CONFLICT (template_key) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  placeholders = EXCLUDED.placeholders,
  is_active = true,
  updated_at = now();

UPDATE public.document_templates
SET placeholders = '["company_name", "state_of_incorporation", "registered_office", "state_filing_office", "fiscal_year_end", "registered_agent_name", "registered_agent_address", "incorporator_name", "incorporator_address", "incorporator_email", "consent_date", "effective_date", "principal_office", "director_1_name", "director_1_address", "director_1_email", "director_2_name", "director_2_address", "director_2_email", "officer_1_name", "officer_1_title", "officer_1_email", "officer_2_name", "officer_2_title", "officer_2_email", "officer_3_name", "officer_3_title", "officer_3_email", "appointee_1_name", "appointee_1_role", "appointee_1_email", "appointee_2_name", "appointee_2_role", "appointee_2_email", "counterparty_1", "agreement_1_name", "agreement_1_date", "agreement_1_notes", "state", "governing_law_state"]'::jsonb
WHERE template_key = 'pre_incorporation_consent';

