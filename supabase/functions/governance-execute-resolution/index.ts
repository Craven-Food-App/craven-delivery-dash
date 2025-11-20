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

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Missing Supabase environment variables' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const body = await req.json();
    const resolution_id = body.resolution_id || body.resolutionId;

    if (!resolution_id) {
      return new Response(
        JSON.stringify({ error: 'Missing resolution_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get resolution
    const { data: resolution, error: resolutionError } = await supabaseAdmin
      .from('governance_board_resolutions')
      .select('*')
      .eq('id', resolution_id)
      .single();

    if (resolutionError || !resolution) {
      return new Response(
        JSON.stringify({ error: 'Resolution not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (resolution.status !== 'ADOPTED') {
      return new Response(
        JSON.stringify({ error: 'Resolution must be ADOPTED before execution' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resolutionType = resolution.type;
    const metadata = resolution.metadata || {};

    // Execute based on resolution type
    let executionResult: any = {};

    if (resolutionType === 'EXECUTIVE_APPOINTMENT' && metadata.appointment_id) {
      // Start executive onboarding workflow
      const appointmentId = metadata.appointment_id;
      
      const { data: appointment } = await supabaseAdmin
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single();

      if (appointment && appointment.appointee_user_id) {
        // Create or update executive_onboarding record
        const { data: onboarding } = await supabaseAdmin
          .from('executive_onboarding')
          .upsert({
            appointment_id: appointmentId,
            user_id: appointment.appointee_user_id,
            status: 'documents_sent',
            documents_required: metadata.documents_required || [],
            signing_deadline: metadata.signing_deadline || null,
          }, {
            onConflict: 'appointment_id,user_id',
          })
          .select()
          .single();

        // Trigger document generation and email sending
        try {
          await fetch(`${supabaseUrl}/functions/v1/send-appointment-documents-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({ appointmentId }),
          });
        } catch (err) {
          console.error('Error sending appointment email:', err);
        }

        executionResult = { onboarding_created: true, onboarding_id: onboarding?.id };
      }
    } else if (resolutionType === 'EQUITY_GRANT' && metadata.grant_details) {
      // Execute equity grant
      try {
        const grantResponse = await fetch(`${supabaseUrl}/functions/v1/governance-grant-equity`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            resolution_id: resolution_id,
            ...metadata.grant_details,
          }),
        });
        executionResult = await grantResponse.json();
      } catch (err) {
        console.error('Error granting equity:', err);
        executionResult = { error: 'Failed to grant equity' };
      }
    }

    // Update resolution status to EXECUTED
    const { data: updatedResolution } = await supabaseAdmin
      .from('governance_board_resolutions')
      .update({
        status: 'EXECUTED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', resolution_id)
      .select()
      .single();

    // Log execution
    await supabaseAdmin.rpc('log_governance_action', {
      p_action_type: 'resolution_executed',
      p_action_category: 'board',
      p_target_type: 'resolution',
      p_target_id: resolution_id,
      p_target_name: resolution.title,
      p_description: `Resolution executed: ${resolution.title}`,
      p_metadata: { execution_result: executionResult },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Resolution executed successfully',
        resolution: updatedResolution,
        execution_result: executionResult,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in governance-execute-resolution:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

