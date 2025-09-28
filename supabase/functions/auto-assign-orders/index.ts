// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { orderId } = await req.json();
    console.log('Auto-assigning order:', orderId);

    // Fetch order with restaurant coordinates
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`*, restaurants!inner(id, name, latitude, longitude)`)
      .eq('id', orderId)
      .eq('order_status', 'pending')
      .single();

    if (orderError || !order) throw new Error('Order not found or not pending');

    const restaurant = order.restaurants;

    // Get available online drivers
    const { data: availableDrivers, error: driversError } = await supabase
      .from('driver_profiles')
      .select('*')
      .eq('status', 'online')
      .eq('is_available', true);

    if (driversError || !availableDrivers || availableDrivers.length === 0)
      throw new Error('No drivers available');

    // Calculate distance and priority
    const driversWithDistance: any[] = [];
    for (const driver of availableDrivers) {
      const { data: locationData } = await supabase
        .from('craver_locations')
        .select('lat, lng, updated_at')
        .eq('user_id', driver.user_id)
        .single();

      if (!locationData) continue;

      const distanceResult = restaurant.latitude != null && restaurant.longitude != null
        ? (await supabase.rpc('calculate_distance', {
            lat1: restaurant.latitude,
            lng1: restaurant.longitude,
            lat2: locationData.lat,
            lng2: locationData.lng
          })).data
        : 999;

      const distanceMiles = distanceResult ?? 999;
      if (distanceMiles > 10) continue;

      const level = driver.driver_level ?? 1;
      const priority = calculateDriverPriority(Number(driver.rating) || 5, Number(level), Number(distanceMiles));

      driversWithDistance.push({ ...driver, distance: distanceMiles, location: locationData, priority });
    }

    if (driversWithDistance.length === 0)
      return new Response(JSON.stringify({ success: false, message: 'No drivers in range' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Sort by priority (nearest + best rating/level)
    driversWithDistance.sort((a, b) => b.priority - a.priority);

    // Assign order to drivers one by one until accepted
    for (const driver of driversWithDistance) {
      try {
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + 30);

        const { data: assignment } = await supabase
          .from('order_assignments')
          .insert({
            order_id: orderId,
            driver_id: driver.user_id,
            status: 'pending',
            expires_at: expiresAt.toISOString()
          })
          .select()
          .single();

        const notificationPayload = {
          type: 'order_assignment',
          assignment_id: assignment.id,
          order_id: orderId,
          restaurant_name: restaurant.name,
          pickup_address: order.pickup_address,
          dropoff_address: order.dropoff_address,
          payout_cents: order.payout_cents,
          distance_km: order.distance_km,
          distance_mi: (order.distance_km * 0.621371).toFixed(1),
          expires_at: assignment.expires_at,
          estimated_time: Math.ceil(order.distance_km * 2.5)
        };

        // Send real-time notification via persistent channel
        const channel = supabase.channel(`driver_${driver.user_id}`);
        await channel.subscribe();
        await channel.send({ type: 'broadcast', event: 'order_assignment', payload: notificationPayload });

        console.log(`Order assigned to driver: ${driver.user_id} with priority ${driver.priority}`);

        // Monitor acceptance for 30 seconds
        await waitForAcceptance(supabase, assignment.id, 30_000);

        return new Response(JSON.stringify({
          success: true,
          assignment_id: assignment.id,
          driver_id: driver.user_id,
          message: 'Order assigned successfully'
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      } catch (err) {
        console.warn(`Driver ${driver.user_id} failed to accept or error occurred. Trying next driver.`);
        continue;
      }
    }

    return new Response(JSON.stringify({ success: false, message: 'Failed to assign order to any driver' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });

  } catch (err) {
    console.error('Auto-assignment error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});

// Wait for driver acceptance (checks assignment status periodically)
async function waitForAcceptance(supabase, assignmentId: string, timeoutMs: number) {
  const interval = 1000;
  const maxChecks = timeoutMs / interval;
  let checks = 0;

  while (checks < maxChecks) {
    const { data: assignment } = await supabase.from('order_assignments').select('status').eq('id', assignmentId).single();
    if (assignment?.status === 'accepted') return true;
    await new Promise(res => setTimeout(res, interval));
    checks++;
  }

  // Mark assignment expired if not accepted
  await supabase.from('order_assignments').update({ status: 'expired' }).eq('id', assignmentId);
  return false;
}

// Driver priority: higher rating/level + closer distance
function calculateDriverPriority(rating: number, level: number, distance: number): number {
  const ratingScore = (rating / 5) * 50;
  const levelScore = (level - 1) * 10;
  const distanceScore = Math.max(0, 30 - (distance * 3));
  return ratingScore + levelScore + distanceScore;
}
