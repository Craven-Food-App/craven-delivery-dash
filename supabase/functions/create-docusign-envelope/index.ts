// ================================================================
// CREATE-DOCUSIGN-ENVELOPE EDGE FUNCTION
// ================================================================
// Creates and sends DocuSign envelope with ICA template to driver
// Updates driver status to 'awaiting_contract'

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

interface DocuSignRequest {
  driverId: string;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { driverId }: DocuSignRequest = await req.json();

    if (!driverId) {
      return new Response(
        JSON.stringify({ error: 'Missing driverId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get DocuSign credentials
    const docusignAccountId = Deno.env.get('DOCUSIGN_ACCOUNT_ID');
    const docusignAccessToken = Deno.env.get('DOCUSIGN_ACCESS_TOKEN');
    const docusignTemplateId = Deno.env.get('DOCUSIGN_TEMPLATE_ID');
    const docusignBaseUrl = Deno.env.get('DOCUSIGN_BASE_URL') || 'https://demo.docusign.net/restapi';

    if (!docusignAccountId || !docusignAccessToken || !docusignTemplateId) {
      console.error('DocuSign credentials not configured');
      return new Response(
        JSON.stringify({ error: 'DocuSign not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get driver details
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('id, full_name, email, status')
      .eq('id', driverId)
      .single();

    if (driverError || !driver) {
      return new Response(
        JSON.stringify({ error: 'Driver not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create DocuSign envelope using template
    const envelopeDefinition = {
      templateId: docusignTemplateId,
      status: 'sent',
      templateRoles: [
        {
          email: driver.email,
          name: driver.full_name,
          roleName: 'Driver',
          tabs: {
            textTabs: [
              {
                tabLabel: 'FullName',
                value: driver.full_name
              },
              {
                tabLabel: 'SignDate',
                value: new Date().toLocaleDateString()
              }
            ]
          }
        }
      ]
    };

    // Send to DocuSign API
    const docusignResponse = await fetch(
      `${docusignBaseUrl}/v2.1/accounts/${docusignAccountId}/envelopes`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${docusignAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(envelopeDefinition)
      }
    );

    if (!docusignResponse.ok) {
      const errorText = await docusignResponse.text();
      console.error('DocuSign API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to create DocuSign envelope', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const envelopeData = await docusignResponse.json();

    // Update driver with envelope ID and status
    const { error: updateError } = await supabase
      .from('drivers')
      .update({
        docusign_envelope_id: envelopeData.envelopeId,
        status: 'awaiting_contract',
        updated_at: new Date().toISOString()
      })
      .eq('id', driverId);

    if (updateError) {
      console.error('Driver update error:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'DocuSign envelope sent to driver',
        envelopeId: envelopeData.envelopeId,
        status: 'awaiting_contract',
        email: driver.email
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Create envelope error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

