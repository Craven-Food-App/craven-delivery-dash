import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's auth token
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Missing Supabase environment variables' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's auth
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await req.json();

    // Validate required fields
    const requiredFields = ['proposed_officer_name', 'proposed_title', 'effective_date'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return new Response(
          JSON.stringify({ error: `Missing required field: ${field}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create service role client for inserting
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Insert appointment
    const { data: appointment, error: insertError } = await supabaseAdmin
      .from('executive_appointments')
      .insert({
        proposed_officer_name: body.proposed_officer_name,
        proposed_officer_email: body.proposed_officer_email || null,
        proposed_title: body.proposed_title,
        appointment_type: body.appointment_type || 'NEW',
        board_meeting_date: body.board_meeting_date || null,
        effective_date: body.effective_date,
        term_length_months: body.term_length_months ? parseInt(body.term_length_months) : null,
        authority_granted: body.authority_granted || null,
        compensation_structure: body.compensation_structure || null,
        equity_included: body.equity_included || false,
        equity_details: body.equity_details || null,
        notes: body.notes || null,
        status: 'DRAFT',
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating appointment:', insertError);
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the action
    await supabaseAdmin.from('governance_logs').insert({
      action: 'CREATE_APPOINTMENT',
      entity_type: 'executive_appointment',
      entity_id: appointment.id,
      description: `Created appointment draft for ${body.proposed_officer_name} as ${body.proposed_title}`,
      actor_id: user.id,
      data: {
        appointment_type: body.appointment_type,
        effective_date: body.effective_date,
      },
    });

    // Generate appointment letter document (async, don't wait)
    try {
      const generateDocUrl = `${supabaseUrl}/functions/v1/governance-generate-appointment-document`;
      fetch(generateDocUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          appointment_id: appointment.id,
          document_type: 'appointment_letter',
        }),
      }).catch(err => console.error('Error generating appointment letter:', err));
    } catch (err) {
      console.error('Error calling document generation:', err);
      // Don't fail the request if document generation fails
    }

    return new Response(
      JSON.stringify({ success: true, data: appointment }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in governance-create-appointment:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

