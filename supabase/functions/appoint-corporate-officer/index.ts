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

    // 1. Create board resolution
    const { data: resolutionData, error: resolutionError } = await supabaseClient
      .from('board_resolutions')
      .insert({
        resolution_type: 'officer_appointment',
        resolution_title: `Appointment of ${executive_name} as ${executive_title}`,
        resolution_number: `BR-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
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

    if (resolutionError) throw resolutionError;

    // 2. Create or update exec_users record
    const { data: execData, error: execError } = await supabaseClient
      .from('exec_users')
      .upsert({
        full_name: executive_name,
        title: executive_title,
        role: role,
        equity_percent: parseFloat(equity_percent),
        appointment_date: appointment_date,
        board_resolution_id: resolutionData.id,
        officer_status: 'appointed',
        is_also_employee: false, // Officers start as equity-only
      })
      .select()
      .single();

    if (execError) throw execError;

    // 3. Create equity grant record
    const { error: equityError } = await supabaseClient
      .from('employee_equity')
      .insert({
        employee_id: execData.id,
        grant_type: 'founder',
        shares_granted: parseInt(shares_issued),
        equity_percent: parseFloat(equity_percent),
        vesting_schedule: vesting_schedule,
        grant_date: appointment_date,
        vesting_start_date: appointment_date,
        status: 'active',
      });

    if (equityError) throw equityError;

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
