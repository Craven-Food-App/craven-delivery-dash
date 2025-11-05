import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OfficerAppointmentRequest {
  executive_name: string;
  executive_email: string;
  executive_title: 'CEO' | 'CFO' | 'COO' | 'CTO' | 'CXO';
  appointment_date: string;
  equity_percent: string;
  shares_issued: string;
  vesting_schedule?: string;
  strike_price?: string;
  annual_salary?: string;
  defer_salary: boolean;
  funding_trigger?: string;
  photo_url?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: OfficerAppointmentRequest = await req.json();
    const {
      executive_name,
      executive_email,
      executive_title,
      appointment_date,
      equity_percent,
      shares_issued,
      vesting_schedule = '4 years, 1 year cliff',
      strike_price = '0.0001',
      annual_salary = '120000',
      defer_salary,
      funding_trigger,
      photo_url,
    } = payload;

    // Map title to role
    const roleMap: Record<string, string> = {
      'CEO': 'ceo',
      'CFO': 'cfo',
      'COO': 'coo',
      'CTO': 'cto',
      'CXO': 'cxo',
    };
    const role = roleMap[executive_title] || 'board_member';

    // Generate resolution number using the function
    const { data: resolutionNumberData, error: resolutionNumberError } = await supabaseClient
      .rpc('generate_resolution_number');

    if (resolutionNumberError) {
      console.warn('Failed to generate resolution number, using fallback:', resolutionNumberError);
    }

    const resolutionNumber = resolutionNumberData || `BR-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

    // 1. Create board resolution
    const { data: resolutionData, error: resolutionError } = await supabaseClient
      .from('board_resolutions')
      .insert({
        resolution_type: 'appointment', // Must be 'appointment', not 'officer_appointment'
        resolution_title: `Appointment of ${executive_name} as ${executive_title}`,
        resolution_number: resolutionNumber,
        subject_person_name: executive_name,
        subject_person_email: executive_email,
        subject_position: executive_title,
        effective_date: appointment_date,
        status: 'approved',
        resolution_text: `BE IT RESOLVED that ${executive_name} is hereby appointed as ${executive_title} of the Company, effective ${appointment_date}, with ${equity_percent}% equity (${shares_issued} shares) subject to ${vesting_schedule} vesting schedule.`,
        board_members: [],
      })
      .select()
      .single();

    if (resolutionError) {
      console.error('Board resolution error:', resolutionError);
      throw new Error(`Failed to create board resolution: ${resolutionError.message}`);
    }

    // 2. Create or update exec_users record
    // Check if exec_user already exists for this role
    const { data: existingExec } = await supabaseClient
      .from('exec_users')
      .select('id, user_id, title, role')
      .eq('role', role)
      .maybeSingle();

    let execData;
    if (existingExec) {
      // Update existing exec_user
      const { data: updatedExec, error: updateError } = await supabaseClient
        .from('exec_users')
        .update({
          title: executive_title,
          role: role,
          photo_url: photo_url,
        })
        .eq('id', existingExec.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('Update exec_user error:', updateError);
        throw new Error(`Failed to update exec_user: ${updateError.message}`);
      }
      execData = updatedExec;
    } else {
      // Create new exec_user (user_id can be null initially, will be linked when auth user is created)
      const { data: newExec, error: createError } = await supabaseClient
        .from('exec_users')
        .insert({
          user_id: null, // Will be linked when auth user is created
          title: executive_title,
          role: role,
          department: null,
          access_level: 1,
          photo_url: photo_url,
        })
        .select()
        .single();

      if (createError) {
        console.error('Create exec_user error:', createError);
        throw new Error(`Failed to create exec_user: ${createError.message}`);
      }
      execData = newExec;
    }

    // 3. Create equity grant for the officer (separate from employees)
    // Officers get equity via equity_grants table, linked to exec_users
    const vestingJson = (vesting_schedule && typeof vesting_schedule === 'string')
      ? { type: vesting_schedule, duration_months: 0 }
      : { type: 'none', duration_months: 0 };

    // Use provided strike_price or default to 0.0001
    const strikePrice = parseFloat(strike_price || '0.0001');
    const sharesIssued = parseInt(shares_issued, 10);
    const totalPurchasePrice = strikePrice * sharesIssued;

    let equityGrantId: string | null = null;
    const { data: equityGrant, error: equityError } = await supabaseClient
      .from('equity_grants')
      .insert({
        executive_id: execData.id,          // Link to exec_users
        employee_id: null,                  // Officers are separate from employees
        granted_by: execData.id,            // Granted via appointment/board action
        grant_date: appointment_date,
        shares_total: parseInt(shares_issued, 10),
        shares_percentage: parseFloat(equity_percent),
        share_class: 'Common Stock',
        strike_price: strikePrice,
        vesting_schedule: vestingJson,
        consideration_type: 'Founder/Officer Appointment',
        consideration_value: 0,
        status: 'approved',                 // Auto-approved as part of board resolution
        board_resolution_id: resolutionData.id,
        notes: `Officer appointment equity grant for ${executive_name} as ${executive_title}`,
      })
      .select()
      .single();

    if (equityError) {
      console.error('Equity grant error:', equityError);
      // Do not throw to avoid breaking appointment flow; return without equity_grant_id
    } else {
      equityGrantId = equityGrant?.id || null;
    }

    // 4. Generate documents using document-generate API
    const documentData = {
      company_name: "Crave'n, Inc.",
      state_of_incorporation: "Ohio",
      company_address: "123 Main St, Cleveland, OH 44101",
      full_name: executive_name,
      role: executive_title === 'CXO' ? 'Chief Experience Officer' : executive_title,
      effective_date: formatDate(appointment_date),
      appointment_date: appointment_date,
      equity_percentage: equity_percent,
      shares_issued: sharesIssued.toLocaleString(),
      strike_price: strikePrice.toFixed(4),
      price_per_share: strikePrice.toFixed(4),
      total_purchase_price: totalPurchasePrice.toFixed(2),
      share_count: sharesIssued.toLocaleString(),
      vesting_schedule: vesting_schedule || '4 years with 1 year cliff',
      annual_salary: parseInt(annual_salary || '0', 10).toLocaleString(),
      funding_trigger: funding_trigger || "Upon Series A funding or significant investment event",
      governing_law_state: "Ohio",
      executive_email,
      executive_first_name: executive_name.split(' ')[0],
      position_title: executive_title,
      defer_salary: defer_salary,
    };

    // Generate Stock Issuance Agreement document with price fields
    const stockIssuanceHtml = generateStockIssuanceHtml(documentData);
    
    // Call document-generate API for Stock Issuance Agreement
    let stockIssuanceDocId: string | null = null;
    try {
      const docGenerateResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/document-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          template_id: 'stock_issuance',
          officer_name: executive_name,
          role: executive_title === 'CXO' ? 'Chief Experience Officer' : executive_title,
          equity: parseFloat(equity_percent),
          data: documentData,
          html_content: stockIssuanceHtml,
          executive_id: execData.id, // Link document to executive for signature portal
        }),
      });

      if (docGenerateResponse.ok) {
        const docResult = await docGenerateResponse.json();
        if (docResult?.ok && docResult?.document?.id) {
          stockIssuanceDocId = docResult.document.id;
          console.log('Stock Issuance Agreement generated successfully:', stockIssuanceDocId);
        }
      } else {
        const errorText = await docGenerateResponse.text();
        console.error('Document generation error:', docGenerateResponse.status, errorText);
      }
    } catch (docError) {
      console.error('Error calling document-generate:', docError);
      // Don't throw - document generation is nice to have but shouldn't break appointment
    }

    // Generate board resolution document
    const boardResolutionHtml = generateBoardResolutionHtml(documentData);
    
    // Generate offer letter
    const offerLetterHtml = generateOfferLetterHtml(documentData);

    return new Response(
      JSON.stringify({
        success: true,
        officer_id: execData.id,
        resolution_id: resolutionData.id,
        equity_grant_id: equityGrantId,
        message: `${executive_name} successfully appointed as ${executive_title}`,
        documents_generated: [
          'Board Resolution',
          'Executive Offer Letter',
          'Stock Issuance Agreement',
          'Confidentiality & IP Agreement',
          defer_salary ? 'Deferred Compensation Addendum' : null,
        ].filter(Boolean),
        stock_issuance_document_id: stockIssuanceDocId,
        price_per_share: strikePrice.toFixed(4),
        total_purchase_price: totalPurchasePrice.toFixed(2),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error appointing officer:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

// Helper function to format date
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

// Helper function to generate board resolution HTML
function generateBoardResolutionHtml(data: any): string {
  return `<!DOCTYPE html>
<html>
<head><title>Board Resolution</title></head>
<body>
<h1>Board Resolution – Appointment of Officer</h1>
<p><strong>Company:</strong> ${data.company_name}</p>
<p><strong>Date:</strong> ${data.appointment_date}</p>
<p><strong>Officer Appointed:</strong> ${data.executive_name}</p>
<p><strong>Title:</strong> ${data.position_title}</p>
<p><strong>Equity:</strong> ${data.equity_percent}% (${data.share_count} shares)</p>
<p><strong>Vesting:</strong> ${data.vesting_schedule}</p>
</body>
</html>`;
}

// Helper function to generate offer letter HTML
function generateOfferLetterHtml(data: any): string {
  return `<!DOCTYPE html>
<html>
<head><title>Executive Offer Letter</title></head>
<body>
<h1>Officer Appointment Letter</h1>
<p>Dear ${data.executive_first_name},</p>
    <p>On behalf of ${data.company_name}, we are pleased to appoint you as ${data.position_title}, effective ${data.effective_date}.</p>
    <p><strong>Equity:</strong> ${data.equity_percentage}% (${data.share_count} shares)</p>
    <p><strong>Vesting:</strong> ${data.vesting_schedule}</p>
    <p><strong>Annual Salary:</strong> $${data.annual_salary}</p>
    ${data.defer_salary ? `<p><strong>Salary Status:</strong> Deferred until ${data.funding_trigger}</p>` : ''}
</body>
</html>`;
}

// Helper function to generate Stock Issuance Agreement HTML with price fields
function generateStockIssuanceHtml(data: any): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Stock Subscription / Issuance Agreement</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
    h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
    h2 { color: #666; margin-top: 30px; }
    .section { margin: 20px 0; }
    .field { margin: 10px 0; }
    .label { font-weight: bold; display: inline-block; width: 200px; }
    .value { display: inline-block; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #f4f4f4; font-weight: bold; }
  </style>
</head>
<body>
  <h1>STOCK SUBSCRIPTION / ISSUANCE AGREEMENT</h1>
  
  <div class="section">
    <h2>Company Information</h2>
    <div class="field"><span class="label">Company Name:</span><span class="value">${data.company_name}</span></div>
    <div class="field"><span class="label">State of Incorporation:</span><span class="value">${data.state_of_incorporation}</span></div>
    <div class="field"><span class="label">Company Address:</span><span class="value">${data.company_address}</span></div>
  </div>

  <div class="section">
    <h2>Subscriber Information</h2>
    <div class="field"><span class="label">Subscriber Name:</span><span class="value">${data.full_name}</span></div>
    <div class="field"><span class="label">Subscriber Email:</span><span class="value">${data.executive_email}</span></div>
    <div class="field"><span class="label">Position:</span><span class="value">${data.role}</span></div>
  </div>

  <div class="section">
    <h2>Stock Issuance Details</h2>
    <table>
      <tr>
        <th>Item</th>
        <th>Details</th>
      </tr>
      <tr>
        <td>Share Class</td>
        <td>Common Stock</td>
      </tr>
      <tr>
        <td>Number of Shares</td>
        <td>${data.share_count}</td>
      </tr>
      <tr>
        <td><strong>Price per Share</strong></td>
        <td><strong>$${data.price_per_share}</strong></td>
      </tr>
      <tr>
        <td><strong>Total Purchase Price</strong></td>
        <td><strong>$${data.total_purchase_price}</strong></td>
      </tr>
      <tr>
        <td>Equity Percentage</td>
        <td>${data.equity_percentage}%</td>
      </tr>
      <tr>
        <td>Vesting Schedule</td>
        <td>${data.vesting_schedule}</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <h2>Terms and Conditions</h2>
    <p>This agreement is subject to the terms and conditions set forth in the Company's Bylaws and Board Resolutions.</p>
    <p>The shares issued hereunder are subject to the vesting schedule: <strong>${data.vesting_schedule}</strong></p>
    <p>Payment for the shares shall be made through services rendered and to be rendered to the Company.</p>
  </div>

  <div class="section">
    <h2>Effective Date</h2>
    <p>This agreement is effective as of <strong>${data.effective_date}</strong>.</p>
  </div>

  <div style="margin-top: 60px;">
    <div style="margin-top: 40px;">
      <div style="border-top: 1px solid #333; width: 300px; padding-top: 10px; margin-top: 40px;">
        <div class="label">Subscriber Signature:</div>
        <div style="margin-top: 40px;">___________________________</div>
        <div style="margin-top: 5px;">${data.full_name}</div>
        <div style="margin-top: 5px;">Date: _______________</div>
      </div>
    </div>
    <div style="margin-top: 40px;">
      <div style="border-top: 1px solid #333; width: 300px; padding-top: 10px;">
        <div class="label">Company Signature:</div>
        <div style="margin-top: 40px;">___________________________</div>
        <div style="margin-top: 5px;">Torrance Stroman, CEO</div>
        <div style="margin-top: 5px;">Date: _______________</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
