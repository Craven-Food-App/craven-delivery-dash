import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let appointment_id: string | undefined;
  let document_type: string | undefined;

  try {
    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const body = await req.json();
    appointment_id = body.appointment_id;
    document_type = body.document_type;

    if (!appointment_id || !document_type) {
      return new Response(
        JSON.stringify({ error: 'Missing appointment_id or document_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch appointment
    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from('executive_appointments')
      .select('*')
      .eq('id', appointment_id)
      .single();

    if (appointmentError || !appointment) {
      return new Response(
        JSON.stringify({ error: 'Appointment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch resolution if exists
    let resolution = null;
    if (appointment.board_resolution_id) {
      const { data: resData } = await supabaseAdmin
        .from('governance_board_resolutions')
        .select('*')
        .eq('id', appointment.board_resolution_id)
        .single();
      resolution = resData;
    }

    // Parse JSON fields if they're strings
    const compensationStructure = typeof appointment.compensation_structure === 'string' 
      ? JSON.parse(appointment.compensation_structure) 
      : appointment.compensation_structure || {};
    
    const equityDetails = typeof appointment.equity_details === 'string'
      ? JSON.parse(appointment.equity_details)
      : appointment.equity_details || {};

    // Map appointment data to template placeholders
    const templateData: Record<string, any> = {
      // Name variations
      full_name: appointment.proposed_officer_name,
      executive_name: appointment.proposed_officer_name,
      officer_name: appointment.proposed_officer_name,
      name: appointment.proposed_officer_name,
      proposed_officer_name: appointment.proposed_officer_name,
      
      // Contact information
      proposed_officer_email: appointment.proposed_officer_email || '',
      email: appointment.proposed_officer_email || '',
      proposed_officer_phone: (appointment as any).proposed_officer_phone || '',
      phone: (appointment as any).proposed_officer_phone || '',
      
      // Title variations
      role: appointment.proposed_title,
      position: appointment.proposed_title,
      title: appointment.proposed_title,
      position_title: appointment.proposed_title,
      executive_title: appointment.proposed_title,
      proposed_title: appointment.proposed_title,
      
      // Company and dates
      company_name: 'Crave\'n, Inc.',
      effective_date: appointment.effective_date,
      date: appointment.effective_date,
      appointment_date: appointment.effective_date,
      board_meeting_date: appointment.board_meeting_date || appointment.effective_date,
      
      // Appointment details
      appointment_type: appointment.appointment_type || 'NEW',
      reporting_to: (appointment as any).reporting_to || 'Board of Directors',
      department: (appointment as any).department || '',
      
      // Compensation
      annual_salary: compensationStructure.base_salary || 0,
      annual_base_salary: compensationStructure.base_salary || 0,
      base_salary: compensationStructure.base_salary || 0,
      salary: compensationStructure.base_salary || 0,
      annual_bonus_percentage: compensationStructure.annual_bonus_percentage || 0,
      bonus_percentage: compensationStructure.annual_bonus_percentage || 0,
      performance_bonus: compensationStructure.performance_bonus || '',
      benefits: compensationStructure.benefits || '',
      compensation_description: compensationStructure.description || '',
      
      // Equity
      equity_percentage: equityDetails.percentage || 0,
      equity_percent: equityDetails.percentage || 0,
      share_count: equityDetails.share_count || 0,
      shares_issued: equityDetails.share_count || 0,
      vesting_schedule: equityDetails.vesting_schedule || '',
      exercise_price: equityDetails.exercise_price || '',
      equity_included: appointment.equity_included ? 'Yes' : 'No',
      
      // Authority and terms
      authority_granted: appointment.authority_granted || 'Standard executive authority',
      term_length_months: appointment.term_length_months || null,
      term_end: appointment.term_end || null,
      
      // Resolution details
      resolution_number: resolution?.resolution_number || 'TBD',
      resolution_date: resolution?.meeting_date || appointment.effective_date,
      
      // Stock Certificate specific fields
      certificate_number: `CERT-${appointment.id.substring(0, 8).toUpperCase()}`,
      number_of_shares: equityDetails.share_count || 0,
      share_class: 'Common',
      company_state: 'Ohio',
      issue_date: appointment.effective_date,
      company_signatory_name: 'Torrence Stroman',
      company_signatory_title: 'Chief Executive Officer',
      secretary_name: 'Corporate Secretary',
      
      // Additional notes
      notes: appointment.notes || '',
    };

    // Fetch template from database
    const templateKeyMap: Record<string, string> = {
      'appointment_letter': 'offer_letter',
      'board_resolution': 'board_resolution',
      'employment_agreement': 'employment_agreement',
      'certificate': 'stock_certificate',
    };

    const templateKey = templateKeyMap[document_type] || 'offer_letter';
    
    const { data: template, error: templateError } = await supabaseAdmin
      .from('document_templates')
      .select('html_content, template_html, placeholders')
      .eq('template_key', templateKey)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      console.error(`Template ${templateKey} not found:`, templateError);
      return new Response(
        JSON.stringify({ error: `Template ${templateKey} not found. Please create it in Template Manager.` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use html_content if available, otherwise fall back to template_html
    const htmlContent = template.html_content || template.template_html;
    if (!htmlContent) {
      console.error(`Template ${templateKey} has no HTML content`);
      return new Response(
        JSON.stringify({ error: `Template ${templateKey} has no HTML content.` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Render HTML (replace placeholders)
    let html = htmlContent;
    Object.keys(templateData).forEach((key) => {
      const value = templateData[key];
      if (value !== null && value !== undefined) {
        // Replace multiple placeholder formats
        const patterns = [
          new RegExp(`\\{\\{${key}\\}\\}`, 'gi'),
          new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi'),
          new RegExp(`\\$\\{${key}\\}`, 'gi'),
          new RegExp(`\\[${key}\\]`, 'gi'),
        ];
        patterns.forEach(pattern => {
          html = html.replace(pattern, String(value));
        });
      }
    });

    // Upload HTML to storage
    const htmlBlob = new Blob([html], { type: 'text/html' });
    
    const bucketMap: Record<string, string> = {
      'appointment_letter': 'contracts-executives',
      'board_resolution': 'governance-resolutions',
      'employment_agreement': 'contracts-executives',
      'certificate': 'governance-certificates',
    };

    const bucket = bucketMap[document_type] || 'contracts-executives';
    const fileName = `${appointment_id}/${document_type}_${Date.now()}.html`;
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileName, htmlBlob, {
        contentType: 'text/html',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      const errorMessage = uploadError.message || JSON.stringify(uploadError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Failed to upload document to storage: ${errorMessage}. Make sure the storage bucket allows HTML files (text/html).` 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(fileName);

    // Update appointment with document URL
    const documentFieldMap: Record<string, string> = {
      'appointment_letter': 'appointment_letter_url',
      'board_resolution': 'board_resolution_url',
      'employment_agreement': 'employment_agreement_url',
      'certificate': 'certificate_url',
    };

    const documentField = documentFieldMap[document_type];
    if (documentField) {
      const { error: updateError } = await supabaseAdmin
        .from('executive_appointments')
        .update({ [documentField]: urlData.publicUrl })
        .eq('id', appointment_id);

      if (updateError) {
        console.error('Update error:', updateError);
        // Don't fail the whole request if update fails
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        document_url: urlData.publicUrl,
        document_type 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error generating document:', error);
    const errorMessage = error?.message || error?.toString() || 'Internal server error';
    console.error('Error details:', {
      message: errorMessage,
      stack: error?.stack,
      name: error?.name,
      appointment_id,
      document_type,
    });
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

