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
        // Step 10: Resolution executed → governance-execute-resolution
        // Documents are already generated in step 3 (governance-handle-appointment-workflow)
        // We just need to update onboarding status and send email
        
        // Get existing documents for this appointment (already generated)
        const { data: existingDocuments } = await supabaseAdmin
          .from('board_documents')
          .select('id, type, title')
          .eq('related_appointment_id', appointmentId);

        const documentIds = existingDocuments?.map(d => d.id) || [];

        // Step 11: Update onboarding status to documents_sent
        const { data: onboarding } = await supabaseAdmin
          .from('executive_onboarding')
          .update({
            status: 'documents_sent',
            updated_at: new Date().toISOString(),
          })
          .eq('appointment_id', appointmentId)
          .eq('user_id', appointment.appointee_user_id)
          .select()
          .single();

        // Step 7: Send email notification to appointee with documents
        // This happens AFTER resolution is executed (step 10), not during document generation
        if (documentIds.length > 0) {
          try {
            await fetch(`${supabaseUrl}/functions/v1/send-appointment-documents-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({ 
                appointmentId: appointmentId,
                documentIds: documentIds,
              }),
            });
          } catch (err) {
            console.error('Error sending appointment email:', err);
          }
        }

        executionResult = { 
          onboarding_updated: true, 
          onboarding_id: onboarding?.id,
          documents_sent: documentIds.length,
          status: 'documents_sent',
        };
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

