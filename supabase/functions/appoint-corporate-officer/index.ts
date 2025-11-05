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

    // Default strike price for founder/officer grants (adjust if you have pricing rules)
    const strikePrice = 0.0001;

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

    // 4. Generate documents (call existing appoint-executive or create documents directly)
    const documentData = {
      company_name: 'Crave\'N',
      executive_name,
      executive_first_name: executive_name.split(' ')[0],
      executive_email,
      position_title: executive_title,
      appointment_date,
      equity_percent,
      share_count: shares_issued,
      vesting_schedule,
      annual_base_salary: annual_salary,
      defer_salary,
      funding_trigger_amount: funding_trigger,
      governing_law_state: 'Ohio',
      state_of_incorporation: 'Ohio',
    };

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
<p>On behalf of ${data.company_name}, we are pleased to appoint you as ${data.position_title}, effective ${data.appointment_date}.</p>
<p><strong>Equity:</strong> ${data.equity_percent}% (${data.share_count} shares)</p>
<p><strong>Vesting:</strong> ${data.vesting_schedule}</p>
<p><strong>Annual Salary:</strong> $${data.annual_base_salary}</p>
${data.defer_salary ? `<p><strong>Salary Status:</strong> Deferred until ${data.funding_trigger_amount}</p>` : ''}
</body>
</html>`;
}
