import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface HRPDFRequest {
  documentType: 'offer_letter' | 'board_resolution' | 'equity_agreement' | 'founders_equity_insurance_agreement';
  employeeId: string;
  metadata: any; // Document-specific data
  alsoEmail?: boolean; // Whether to send via email too
}

// Generate HTML from document type and metadata
function generateDocumentHTML(documentType: string, metadata: any): string {
  switch (documentType) {
    case 'board_resolution':
      return generateBoardResolutionHTML(metadata);
    case 'offer_letter':
      return generateOfferLetterHTML(metadata);
    case 'equity_agreement':
      return generateEquityAgreementHTML(metadata);
    case 'founders_equity_insurance_agreement':
      return generateFoundersAgreementHTML(metadata);
    default:
      throw new Error(`Unknown document type: ${documentType}`);
  }
}

function generateBoardResolutionHTML(data: any): string {
  const effectiveDateFormatted = new Date(data.effectiveDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const votesFor = data.boardMembers.filter((m: any) => m.vote === 'for').length;
  const votesAgainst = data.boardMembers.filter((m: any) => m.vote === 'against').length;
  const votesAbstain = data.boardMembers.filter((m: any) => m.vote === 'abstain').length;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 40px; text-align: center; color: white; margin-bottom: 40px; }
          .section { margin: 30px 0; }
          table { width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          th { background-color: #f8fafc; font-weight: 600; }
          .highlight { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; }
          .approved { background-color: #dcfce7; border: 2px solid #16a34a; padding: 20px; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📋 BOARD RESOLUTION</h1>
          <p>${data.companyName}</p>
          <p>Resolution #${data.resolutionNumber}</p>
        </div>
        
        <div class="section">
          <h2>BOARD RESOLUTION</h2>
          <p>Adopted on ${effectiveDateFormatted}</p>
          
          <div style="background-color: #f8fafc; border: 2px solid #e2e8f0; padding: 25px; border-radius: 8px; margin: 20px 0;">
            <p><strong>WHEREAS</strong>, the Board of Directors of ${data.companyName} has determined that it is in the best interests of the Company to appoint ${data.employeeName} to the position of ${data.position};</p>
            <p>WHEREAS, ${data.employeeName} has demonstrated the qualifications, experience, and leadership necessary to serve effectively in this capacity;</p>
            ${data.equityPercentage ? `<p>WHEREAS, the Board has determined that ${data.employeeName} should receive ${data.equityPercentage}% equity ownership in the Company as part of their compensation package;</p>` : ''}
            <p><strong>NOW, THEREFORE, BE IT RESOLVED</strong>, that the Board of Directors hereby appoints ${data.employeeName} to the position of ${data.position}, effective ${effectiveDateFormatted};</p>
            ${data.equityPercentage ? `<p><strong>BE IT FURTHER RESOLVED</strong>, that the Company shall issue ${data.equityPercentage}% equity ownership to ${data.employeeName} in accordance with the terms of the applicable equity agreement;</p>` : ''}
            <p><strong>BE IT FURTHER RESOLVED</strong>, that the officers of the Company are hereby authorized and directed to take all actions necessary to effectuate the purposes of this resolution.</p>
          </div>
        </div>

        <div class="section">
          <h3>VOTING RECORD</h3>
          <div style="background-color: #f0f9ff; border: 2px solid #0ea5e9; padding: 20px; border-radius: 8px;">
            <div style="display: flex; justify-content: space-around;">
              <div style="text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #059669;">${votesFor}</div>
                <div>Votes For</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #dc2626;">${votesAgainst}</div>
                <div>Votes Against</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #6b7280;">${votesAbstain}</div>
                <div>Abstentions</div>
              </div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr><th>Board Member</th><th>Title</th><th>Vote</th></tr>
            </thead>
            <tbody>
              ${data.boardMembers.map((member: any) => `
                <tr>
                  <td>${member.name}</td>
                  <td>${member.title}</td>
                  <td><strong>${member.vote.toUpperCase()}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section approved">
          <h3>✅ RESOLUTION STATUS: APPROVED</h3>
          <p>This resolution has been duly adopted by the Board of Directors and is effective as of ${effectiveDateFormatted}.</p>
        </div>

        <div style="margin-top: 60px;">
          <div style="display: flex; justify-content: space-between;">
            <div style="width: 45%;">
              <div style="border-bottom: 1px solid #000; height: 40px; margin-bottom: 5px;"></div>
              <p>Board Secretary</p>
              <p>Date: _______________</p>
            </div>
            <div style="width: 45%;">
              <div style="border-bottom: 1px solid #000; height: 40px; margin-bottom: 5px;"></div>
              <p>Board Chair</p>
              <p>Date: _______________</p>
            </div>
          </div>
        </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #4a4a4a;">
          <p>This resolution is a legal document and constitutes official corporate action by ${data.companyName}.</p>
        </div>
      </body>
    </html>
  `;
}

function generateOfferLetterHTML(data: any): string {
  const salaryFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(data.salary);

  const equitySection = data.equity ? `
    <div style="background-color: #fff9e6; border: 2px solid #ffd700; padding: 20px; border-radius: 6px; margin: 25px 0;">
      <h3 style="margin: 0 0 15px 0; color: #b8860b; font-size: 18px;">🏆 Equity Compensation</h3>
      <p><strong>${data.equity}% Equity Stake</strong></p>
      <p>Details regarding vesting schedule and share allocation will be provided in your formal equity agreement.</p>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { background: linear-gradient(135deg, #ff6b00 0%, #ff8c00 100%); padding: 50px; text-align: center; color: white; margin-bottom: 40px; }
          .section { margin: 30px 0; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎯 Offer Letter</h1>
        </div>
        
        <p><strong>Dear ${data.employeeName},</strong></p>
        
        <p>We are pleased to offer you the position of <strong>${data.position}</strong> in our <strong>${data.department}</strong> department at Crave'N Delivery, effective ${new Date(data.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.</p>

        <div style="background-color: #f9f9f9; border-left: 4px solid #ff6b00; padding: 25px; margin: 30px 0;">
          <h3 style="margin: 0 0 20px 0;">📋 Position Details</h3>
          <table>
            <tr><td><strong>Position:</strong></td><td>${data.position}</td></tr>
            <tr><td><strong>Department:</strong></td><td>${data.department}</td></tr>
            <tr><td><strong>Salary:</strong></td><td><strong>${salaryFormatted}/year</strong></td></tr>
            <tr><td><strong>Start Date:</strong></td><td>${new Date(data.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
          </table>
        </div>

        ${equitySection}

        <p><strong>Reporting To:</strong> ${data.reportingTo}</p>

        <p>We look forward to welcoming you to the Crave'N Delivery team!</p>

        <p>Best regards,<br/>Crave'N Delivery HR Team</p>
      </body>
    </html>
  `;
}

function generateEquityAgreementHTML(data: any): string {
  const vestingMap: Record<string, string> = {
    'immediate': 'Immediate (100% vested)',
    '4_year_1_cliff': '4 years, 1-year cliff',
    '3_year_1_cliff': '3 years, 1-year cliff',
    '2_year_1_cliff': '2 years, 1-year cliff',
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%); padding: 40px; text-align: center; color: white; margin-bottom: 40px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📄 Equity Offer Agreement</h1>
        </div>
        
        <h2>Company: ${data.companyName || 'Crave\'n Inc'} (Ohio)</h2>
        
        <ul>
          <li>Grantee: ${data.employeeName} (${data.position})</li>
          <li>Ownership: <strong>${data.equityPercentage}%</strong></li>
          <li>Equity Type: ${data.equityType || 'Common Stock'}</li>
          <li>Vesting: ${vestingMap[data.vestingSchedule] || '4 years, 1-year cliff'}</li>
          ${data.strikePrice ? `<li>Strike Price: $${data.strikePrice.toFixed(2)}</li>` : ''}
        </ul>

        <p>Governing law: Ohio.</p>
      </body>
    </html>
  `;
}

function generateFoundersAgreementHTML(data: any): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); padding: 40px; text-align: center; color: white; margin-bottom: 40px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🏆 Founders Equity Insurance Agreement</h1>
        </div>
        
        <p><strong>Founder:</strong> ${data.employeeName} (CEO)</p>
        <p><strong>Ownership protected:</strong> ${data.equityPercentage}% (anti-dilution, board-supermajority exception)</p>
        <p><strong>Resolution reference:</strong> #${data.resolutionNumber}</p>
      </body>
    </html>
  `;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { documentType, employeeId, metadata, alsoEmail }: HRPDFRequest = await req.json();

    // Generate HTML content
    const htmlContent = generateDocumentHTML(documentType, metadata);

    // Convert HTML to PDF using external service or Puppeteer
    // For now, we'll store the HTML and convert client-side or use a PDF service
    const fileName = `${documentType}_${employeeId}_${Date.now()}.html`;
    
    // Upload HTML to storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('hr-documents')
      .upload(`documents/${fileName}`, htmlContent, {
        contentType: 'text/html',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from('hr-documents')
      .getPublicUrl(uploadData.path);

    // Store document record
    const { data: docRecord, error: docError } = await supabaseClient
      .from('employee_documents')
      .insert({
        employee_id: employeeId,
        document_type: documentType,
        document_title: `${documentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} - ${metadata.employeeName || ''}`,
        storage_path: uploadData.path,
        file_size_bytes: new TextEncoder().encode(htmlContent).length,
        mime_type: 'text/html',
        metadata: metadata,
        created_by: metadata.createdBy
      })
      .select()
      .single();

    if (docError) console.error('Error storing document record:', docError);

    // Send email if requested
    if (alsoEmail && metadata.employeeEmail) {
      try {
        const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "Crave'N <hr@cravenusa.com>";
        
        await resend.emails.send({
          from: fromEmail,
          to: [metadata.employeeEmail],
          subject: `${documentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} - ${metadata.companyName || 'Crave\'N'}`,
          html: htmlContent,
        });
      } catch (emailError) {
        console.error('Error sending email:', emailError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        fileUrl: urlData.publicUrl,
        documentId: docRecord?.id,
        storagePath: uploadData.path
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error generating HR PDF:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

