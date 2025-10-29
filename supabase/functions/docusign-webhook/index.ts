// ================================================================
// DOCUSIGN-WEBHOOK EDGE FUNCTION
// ================================================================
// Receives webhook from DocuSign when envelope status changes
// Updates driver status when contract is signed
// Triggers zone capacity check and waitlist logic

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse DocuSign webhook payload
    const payload = await req.json();
    
    console.log('DocuSign webhook received:', payload);

    // Extract envelope ID and status
    const envelopeId = payload.envelopeId || payload.data?.envelopeId;
    const status = payload.status || payload.data?.envelopeSummary?.status;

    if (!envelopeId) {
      return new Response(
        JSON.stringify({ error: 'Missing envelope ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find driver by envelope ID
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('id, status, zip')
      .eq('docusign_envelope_id', envelopeId)
      .single();

    if (driverError || !driver) {
      console.error('Driver not found for envelope:', envelopeId);
      return new Response(
        JSON.stringify({ error: 'Driver not found for this envelope' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if envelope is completed
    if (status === 'completed') {
      // Update driver status to contract_signed
      const { error: updateError } = await supabase
        .from('drivers')
        .update({
          status: 'contract_signed',
          contract_signed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', driver.id);

      if (updateError) {
        throw updateError;
      }

      // Call start-onboarding function to check zone capacity
      const onboardingResponse = await fetch(
        `${supabaseUrl}/functions/v1/start-onboarding`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ driverId: driver.id })
        }
      );

      const onboardingResult = await onboardingResponse.json();

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Contract signed - onboarding process continued',
          driverId: driver.id,
          envelopeId: envelopeId,
          onboardingResult: onboardingResult
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      // Envelope status is not completed - log and ignore
      console.log(`Envelope ${envelopeId} status: ${status} - no action needed`);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: `Envelope status updated: ${status}`,
          envelopeId: envelopeId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('DocuSign webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

