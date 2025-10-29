// ================================================================
// START-ONBOARDING EDGE FUNCTION
// ================================================================
// Checks zone capacity and determines if driver should be:
// - eligible (zone has capacity) → can be activated
// - waitlisted (zone is full) → added to waitlist

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

interface OnboardingRequest {
  driverId: string;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { driverId }: OnboardingRequest = await req.json();

    if (!driverId) {
      return new Response(
        JSON.stringify({ error: 'Missing driverId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get driver and their ZIP
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('id, zip, status')
      .eq('id', driverId)
      .single();

    if (driverError || !driver) {
      return new Response(
        JSON.stringify({ error: 'Driver not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find zone for driver's ZIP
    const { data: zone, error: zoneError } = await supabase
      .from('zones')
      .select('*')
      .eq('zip_code', driver.zip)
      .eq('is_active', true)
      .single();

    if (zoneError || !zone) {
      return new Response(
        JSON.stringify({ 
          error: 'No active zone for this ZIP code',
          zip: driver.zip 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check zone capacity
    const hasCapacity = zone.active_drivers < zone.capacity;

    if (hasCapacity) {
      // Zone has capacity - mark driver as eligible
      const { error: updateError } = await supabase
        .from('drivers')
        .update({
          status: 'eligible',
          zone_id: zone.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', driverId);

      if (updateError) {
        throw updateError;
      }

      return new Response(
        JSON.stringify({
          success: true,
          status: 'eligible',
          message: 'Driver is eligible and can be activated',
          zone: {
            city: zone.city,
            state: zone.state,
            availableSlots: zone.capacity - zone.active_drivers
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      // Zone is full - add to waitlist
      const { error: updateError } = await supabase
        .from('drivers')
        .update({
          status: 'waitlisted_contract_signed',
          zone_id: zone.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', driverId);

      if (updateError) {
        throw updateError;
      }

      // Add to waitlist
      const { data: waitlistData, error: waitlistError } = await supabase
        .from('driver_waitlist')
        .insert({
          driver_id: driverId,
          zone_id: zone.id,
          contract_signed: true,
          position: zone.waitlist_count + 1
        })
        .select()
        .single();

      if (waitlistError) {
        console.error('Waitlist error:', waitlistError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          status: 'waitlisted',
          message: 'Driver added to waitlist - zone is at capacity',
          zone: {
            city: zone.city,
            state: zone.state,
            capacity: zone.capacity,
            currentDrivers: zone.active_drivers
          },
          waitlist: {
            position: waitlistData?.position || zone.waitlist_count + 1
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Start onboarding error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

