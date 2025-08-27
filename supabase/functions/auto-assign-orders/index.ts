import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { orderId } = await req.json()
    
    console.log('Starting auto-assignment for order:', orderId)

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        restaurants!inner(
          id,
          name,
          latitude,
          longitude
        )
      `)
      .eq('id', orderId)
      .eq('status', 'pending')
      .single()

    if (orderError) {
      console.error('Error fetching order:', orderError)
      throw new Error('Order not found or not pending')
    }

    const restaurant = order.restaurants
    console.log('Order found for restaurant:', restaurant.name)

    // Find available drivers within 10 miles, prioritized by rating and level
    const { data: availableDrivers, error: driversError } = await supabase
      .from('driver_profiles')
      .select('*')
      .eq('status', 'online')
      .eq('is_available', true)

    if (driversError) {
      console.error('Error fetching drivers:', driversError)
      throw new Error('Error finding available drivers')
    }

    console.log('Found available drivers:', availableDrivers.length)

    // Calculate distances and prioritize drivers
    const driversWithDistance = []
    for (const driver of availableDrivers) {
      // Get driver location separately
      const { data: locationData, error: locationError } = await supabase
        .from('craver_locations')
        .select('lat, lng, updated_at')
        .eq('user_id', driver.user_id)
        .single()
      
      if (locationError || !locationData) {
        console.log('No location found for driver:', driver.user_id)
        continue
      }
      
      // Calculate distance using the database function
      const { data: distanceResult } = await supabase
        .rpc('calculate_distance', {
          lat1: restaurant.latitude,
          lng1: restaurant.longitude,
          lat2: locationData.lat,
          lng2: locationData.lng
        })

      const distance = distanceResult || 999
      
      // Only consider drivers within 10 miles
      if (distance <= 10) {
        driversWithDistance.push({
          ...driver,
          distance,
          location: locationData,
          priority: calculateDriverPriority(driver.rating, driver.driver_level, distance)
        })
      }
    }

    console.log('Drivers within range:', driversWithDistance.length)

    if (driversWithDistance.length === 0) {
      console.log('No drivers available within range')
      return new Response(
        JSON.stringify({ success: false, message: 'No drivers available' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Sort by priority (higher is better)
    driversWithDistance.sort((a, b) => b.priority - a.priority)
    
    // Take top 3 drivers and assign to the best one first
    const topDrivers = driversWithDistance.slice(0, 3)
    console.log('Top drivers for assignment:', topDrivers.map(d => ({ 
      user_id: d.user_id, 
      rating: d.rating, 
      level: d.driver_level, 
      distance: d.distance,
      priority: d.priority 
    })))

    // Start with the highest priority driver
    for (const driver of topDrivers) {
      try {
        // Create assignment with 30-second timeout
        const expiresAt = new Date()
        expiresAt.setSeconds(expiresAt.getSeconds() + 30)

        const { data: assignment, error: assignmentError } = await supabase
          .from('order_assignments')
          .insert({
            order_id: orderId,
            driver_id: driver.user_id,
            expires_at: expiresAt.toISOString(),
            status: 'pending'
          })
          .select()
          .single()

        if (assignmentError) {
          console.error('Error creating assignment:', assignmentError)
          continue
        }

        console.log('Assignment created:', assignment.id, 'for driver:', driver.user_id)

        // Send real-time notification to driver
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
          estimated_time: Math.ceil(order.distance_km * 2.5) // Rough estimate: 2.5 minutes per km
        }

        // Send notification via Supabase realtime
        try {
          console.log('Sending broadcast to driver:', driver.user_id)
          
          // Create and subscribe to the channel first
          const channelName = `driver_${driver.user_id}`
          const channel = supabase.channel(channelName)
          
          // Subscribe and wait for confirmation
          await new Promise((resolve, reject) => {
            channel.subscribe((status) => {
              console.log('Channel subscription status:', status)
              if (status === 'SUBSCRIBED') {
                resolve(status)
              } else if (status === 'CHANNEL_ERROR') {
                reject(new Error('Channel subscription failed'))
              }
            })
            
            // Timeout after 3 seconds
            setTimeout(() => {
              reject(new Error('Channel subscription timeout'))
            }, 3000)
          })

          // Send the broadcast
          const broadcastResult = await channel.send({
            type: 'broadcast',
            event: 'order_assignment',
            payload: notificationPayload
          })
          
          console.log('Broadcast result:', broadcastResult)
          
          // Keep channel alive for a moment to ensure delivery
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // Clean up the channel
          await supabase.removeChannel(channel)

        } catch (notificationError) {
          console.error('Error sending notification:', notificationError)
          
          // Fallback: try simpler broadcast without waiting for subscription
          try {
            console.log('Attempting fallback broadcast...')
            const fallbackChannel = supabase.channel(`driver_${driver.user_id}_fallback`)
            await fallbackChannel.send({
              type: 'broadcast', 
              event: 'order_assignment',
              payload: notificationPayload
            })
            console.log('Fallback broadcast sent')
          } catch (fallbackError) {
            console.error('Fallback broadcast also failed:', fallbackError)
          }
        }

        console.log('Notification sent to driver:', driver.user_id)

        // Return success - only assign to one driver at a time
        return new Response(
          JSON.stringify({ 
            success: true, 
            assignment_id: assignment.id,
            driver_id: driver.user_id,
            message: 'Order assigned successfully' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      } catch (error) {
        console.error('Error assigning to driver:', driver.user_id, error)
        continue
      }
    }

    // If we get here, assignment failed for all drivers
    console.log('Failed to assign order to any driver')
    return new Response(
      JSON.stringify({ success: false, message: 'Failed to assign order' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )

  } catch (error) {
    console.error('Auto-assignment error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// Calculate driver priority based on rating, level, and distance
function calculateDriverPriority(rating: number, level: number, distance: number): number {
  // Base score from rating (0-50 points)
  const ratingScore = (rating / 5) * 50
  
  // Level bonus (0-20 points)
  const levelScore = (level - 1) * 10
  
  // Distance penalty (closer = better, max 30 points deducted)
  const distanceScore = Math.max(0, 30 - (distance * 3))
  
  return ratingScore + levelScore + distanceScore
}