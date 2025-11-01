import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ActivateDriversRequest {
  driver_ids: string[]; // Array of craver_application IDs
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { driver_ids } = await req.json() as ActivateDriversRequest;

    console.log('Activating drivers:', driver_ids);

    const results = [];

    for (const driverId of driver_ids) {
      try {
        // Get the application with user_id
        const { data: application, error: appError } = await supabaseClient
          .from('craver_applications')
          .select('user_id, first_name, last_name, email, vehicle_type, vehicle_make, vehicle_model, vehicle_year, license_plate')
          .eq('id', driverId)
          .single();

        if (appError || !application) {
          console.error('Error getting application:', appError);
          results.push({ driver_id: driverId, success: false, error: 'Application not found' });
          continue;
        }

        // Update craver_applications to 'invited' status
        const { error: updateError } = await supabaseClient
          .from('craver_applications')
          .update({
            status: 'invited',
            onboarding_started_at: new Date().toISOString()
          })
          .eq('id', driverId);

        if (updateError) {
          console.error('Error updating application:', updateError);
          results.push({ driver_id: driverId, success: false, error: updateError.message });
          continue;
        }

        // Send invitation email to continue onboarding
        try {
          const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-driver-waitlist-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
            },
            body: JSON.stringify({
              driverName: `${application.first_name} ${application.last_name}`,
              driverEmail: application.email,
              location: 'Your Region',
              emailType: 'invitation',
            }),
          });

          if (!emailResponse.ok) {
            console.log('Warning: Email sending failed');
          }
        } catch (emailError) {
          console.log('Warning: Email sending error:', emailError);
        }

        // Remove from activation_queue
        await supabaseClient
          .from('activation_queue')
          .delete()
          .eq('driver_id', driverId);

        results.push({ 
          driver_id: driverId, 
          success: true, 
          email: application.email,
          name: `${application.first_name} ${application.last_name}`
        });

        console.log('Driver activated successfully:', application.email);
      } catch (error) {
        console.error('Error processing driver:', driverId, error);
        results.push({ driver_id: driverId, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        activated_count: successCount,
        total: driver_ids.length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error activating drivers:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
