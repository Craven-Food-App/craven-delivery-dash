import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
      }
    });
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

    // Find all Nathan Curry appointments
    const { data: appointments, error: fetchError } = await supabaseAdmin
      .from('executive_appointments')
      .select('*')
      .or('proposed_officer_email.ilike.%natecurry%,proposed_officer_name.ilike.%nathan%curry%')
      .order('created_at', { ascending: false });

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch appointments: ${fetchError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!appointments || appointments.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No Nathan Curry appointments found',
          appointments_found: 0 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${appointments.length} Nathan Curry appointments`);

    const results = [];
    const errors = [];

    // Process each appointment
    for (const appointment of appointments) {
      try {
        console.log(`Processing appointment ${appointment.id} for ${appointment.proposed_officer_name}`);

        // Step 1: Find or create the appointments record (new governance system)
        let appointmentRecord = null;
        if (appointment.proposed_officer_email) {
          // Find user by email
          const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
          const user = users?.find(u => u.email?.toLowerCase() === appointment.proposed_officer_email.toLowerCase());
          
          if (user) {
            // Find appointment in new appointments table
            const { data: newAppt } = await supabaseAdmin
              .from('appointments')
              .select('*')
              .eq('appointee_user_id', user.id)
              .eq('role_titles', [appointment.proposed_title])
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            appointmentRecord = newAppt;
          }
        }

        // Step 2: Trigger the workflow if we have an appointment record
        if (appointmentRecord) {
          console.log(`Triggering workflow for appointment ${appointmentRecord.id}`);
          
          const workflowUrl = `${supabaseUrl}/functions/v1/governance-handle-appointment-workflow`;
          const workflowResponse = await fetch(workflowUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              appointment_id: appointmentRecord.id,
              executive_appointment_id: appointment.id,
              formation_mode: appointment.formation_mode || false,
              equity_details: appointment.equity_included && appointment.equity_details 
                ? (typeof appointment.equity_details === 'string' ? JSON.parse(appointment.equity_details) : appointment.equity_details)
                : null,
            }),
          });

          if (!workflowResponse.ok) {
            const errorText = await workflowResponse.text();
            throw new Error(`Workflow failed: ${workflowResponse.status} ${errorText}`);
          }

          const workflowResult = await workflowResponse.json();
          console.log(`Workflow completed for appointment ${appointmentRecord.id}:`, workflowResult);
        }

        // Step 3: Backfill documents using the existing backfill function
        console.log(`Backfilling documents for appointment ${appointment.id}`);
        const backfillUrl = `${supabaseUrl}/functions/v1/governance-backfill-appointment-documents`;
        const backfillResponse = await fetch(backfillUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            appointment_id: appointment.id,
            force_regenerate: true, // Force regeneration
          }),
        });

        if (!backfillResponse.ok) {
          const errorText = await backfillResponse.text();
          throw new Error(`Backfill failed: ${backfillResponse.status} ${errorText}`);
        }

        const backfillResult = await backfillResponse.json();
        console.log(`Backfill completed for appointment ${appointment.id}:`, backfillResult);

        results.push({
          appointment_id: appointment.id,
          appointment_name: appointment.proposed_officer_name,
          appointment_title: appointment.proposed_title,
          status: appointment.status,
          workflow_triggered: !!appointmentRecord,
          backfill_result: backfillResult,
        });

      } catch (error: any) {
        console.error(`Error processing appointment ${appointment.id}:`, error);
        errors.push({
          appointment_id: appointment.id,
          appointment_name: appointment.proposed_officer_name,
          error: error.message || String(error),
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${appointments.length} Nathan Curry appointments`,
        appointments_found: appointments.length,
        results,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in governance-fix-nathan-appointments:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        stack: error.stack 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

