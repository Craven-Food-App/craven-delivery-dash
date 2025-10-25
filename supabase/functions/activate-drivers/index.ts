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

        // Update craver_applications
        const { error: updateError } = await supabaseClient
          .from('craver_applications')
          .update({
            status: 'approved',
            background_check: true,
            onboarding_completed_at: new Date().toISOString(),
            background_check_initiated_at: new Date().toISOString(),
          })
          .eq('id', driverId);

        if (updateError) {
          console.error('Error updating application:', updateError);
          results.push({ driver_id: driverId, success: false, error: updateError.message });
          continue;
        }

        // Call make_user_active_driver function
        const vehicleInfo = {
          vehicle_type: application.vehicle_type,
          vehicle_make: application.vehicle_make,
          vehicle_model: application.vehicle_model,
          vehicle_year: application.vehicle_year,
          license_plate: application.license_plate,
        };

        const { error: activateError } = await supabaseClient.rpc(
          'make_user_active_driver',
          {
            target_user_id: application.user_id,
            vehicle_info: vehicleInfo,
          }
        );

        if (activateError) {
          console.error('Error activating driver profile:', activateError);
          results.push({ driver_id: driverId, success: false, error: activateError.message });
          continue;
        }

        // Update driver_onboarding_progress
        const { error: progressError } = await supabaseClient
          .from('driver_onboarding_progress')
          .update({
            current_step: 'activated',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', application.user_id);

        if (progressError) {
          console.log('Warning: Could not update onboarding progress:', progressError);
        }

        // Send activation email
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
              emailType: 'activation',
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
        results.push({ driver_id: driverId, success: false, error: error.message });
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
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
