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

    const { action } = await req.json();

    switch (action) {
      case 'recalculate_priorities':
        await recalculateQueuePriorities(supabase);
        break;
      
      case 'check_region_capacity':
        await checkRegionCapacity(supabase);
        break;
      
      case 'notify_upcoming_activations':
        await notifyUpcomingActivations(supabase);
        break;
      
      default:
        throw new Error('Invalid action');
    }

    return new Response(
      JSON.stringify({ success: true, message: `Action ${action} completed` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Queue management error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

/**
 * Recalculate priority scores for all drivers in the queue
 */
async function recalculateQueuePriorities(supabase) {
  console.log('Recalculating queue priorities...');

  // Get all waitlist drivers with their completed tasks
  const { data: drivers, error: driversError } = await supabase
    .from('craver_applications')
    .select(`
      id,
      points,
      priority_score,
      created_at,
      regions!inner(id, name)
    `)
    .eq('status', 'waitlist');

  if (driversError) throw driversError;

  for (const driver of drivers) {
    // Calculate new priority score based on:
    // 1. Points from completed tasks
    // 2. Time on waitlist (earlier = higher priority)
    // 3. Referral bonuses
    
    const daysOnWaitlist = Math.floor(
      (new Date() - new Date(driver.created_at)) / (1000 * 60 * 60 * 24)
    );
    
    // Base priority from points
    let newPriorityScore = driver.points || 0;
    
    // Bonus for time on waitlist (diminishing returns)
    const timeBonus = Math.min(daysOnWaitlist * 2, 50);
    newPriorityScore += timeBonus;
    
    // Check for referral bonuses
    const { data: referrals } = await supabase
      .from('driver_referrals')
      .select('points_awarded')
      .eq('referrer_id', driver.id)
      .eq('status', 'completed');
    
    if (referrals) {
      const referralBonus = referrals.reduce((sum, ref) => sum + (ref.points_awarded || 0), 0);
      newPriorityScore += referralBonus;
    }

    // Update priority score
    const { error: updateError } = await supabase
      .from('craver_applications')
      .update({ priority_score: newPriorityScore })
      .eq('id', driver.id);

    if (updateError) {
      console.error(`Failed to update priority for driver ${driver.id}:`, updateError);
    }
  }

  // Update activation queue with new priorities
  const { error: queueError } = await supabase
    .from('activation_queue')
    .update({ priority_score: supabase.from('craver_applications').select('priority_score') })
    .eq('driver_id', supabase.from('craver_applications').select('id'));

  if (queueError) {
    console.error('Failed to update activation queue:', queueError);
  }

  console.log(`Updated priorities for ${drivers.length} drivers`);
}

/**
 * Check region capacity and auto-open regions if needed
 */
async function checkRegionCapacity(supabase) {
  console.log('Checking region capacity...');

  // Get all regions with their current active driver counts
  const { data: regions, error: regionsError } = await supabase
    .from('regions')
    .select(`
      id,
      name,
      status,
      active_quota,
      craver_applications!inner(status)
    `);

  if (regionsError) throw regionsError;

  for (const region of regions) {
    const activeDrivers = region.craver_applications.filter(app => app.status === 'approved').length;
    const waitlistCount = region.craver_applications.filter(app => app.status === 'waitlist').length;
    
    // If region is at less than 80% capacity and has waitlist drivers, consider opening more slots
    const capacityPercentage = (activeDrivers / region.active_quota) * 100;
    
    if (capacityPercentage < 80 && waitlistCount > 0 && region.status === 'limited') {
      console.log(`Region ${region.name} is at ${capacityPercentage.toFixed(1)}% capacity with ${waitlistCount} waitlist drivers`);
      
      // Auto-activate top priority drivers (up to 10% of quota)
      const slotsToOpen = Math.min(
        Math.floor(region.active_quota * 0.1),
        waitlistCount
      );
      
      if (slotsToOpen > 0) {
        await activateTopDrivers(supabase, region.id, slotsToOpen);
      }
    }
  }
}

/**
 * Notify drivers in top 10% of queue about upcoming activation
 */
async function notifyUpcomingActivations(supabase) {
  console.log('Notifying upcoming activations...');

  // Get top 10% of drivers by priority score for each region
  const { data: regions, error: regionsError } = await supabase
    .from('regions')
    .select('id, name, active_quota');

  if (regionsError) throw regionsError;

  for (const region of regions) {
    // Get current active count
    const { data: activeCount } = await supabase
      .from('craver_applications')
      .select('id', { count: 'exact' })
      .eq('region_id', region.id)
      .eq('status', 'approved');

    const currentActive = activeCount?.length || 0;
    const availableSlots = region.active_quota - currentActive;
    
    if (availableSlots > 0) {
      // Get top priority drivers
      const { data: topDrivers, error: driversError } = await supabase
        .from('craver_applications')
        .select('id, first_name, last_name, email, priority_score')
        .eq('region_id', region.id)
        .eq('status', 'waitlist')
        .order('priority_score', { ascending: false })
        .limit(Math.min(availableSlots * 2, 20)); // Notify 2x the available slots

      if (driversError) throw driversError;

      // Send notification emails
      for (const driver of topDrivers) {
        await sendUpcomingActivationEmail(supabase, driver, region);
      }
    }
  }
}

/**
 * Activate top priority drivers for a region
 */
async function activateTopDrivers(supabase, regionId, count) {
  console.log(`Activating top ${count} drivers for region ${regionId}`);

  // Get top priority drivers
  const { data: topDrivers, error: driversError } = await supabase
    .from('craver_applications')
    .select('id, first_name, last_name, email')
    .eq('region_id', regionId)
    .eq('status', 'waitlist')
    .order('priority_score', { ascending: false })
    .limit(count);

  if (driversError) throw driversError;

  // Activate drivers
  const driverIds = topDrivers.map(d => d.id);
  
  const { error: updateError } = await supabase
    .from('craver_applications')
    .update({ 
      status: 'approved',
      background_check: true,
      background_check_initiated_at: new Date().toISOString()
    })
    .in('id', driverIds);

  if (updateError) throw updateError;

  // Send activation emails
  for (const driver of topDrivers) {
    await sendActivationEmail(supabase, driver);
  }

  console.log(`Activated ${topDrivers.length} drivers`);
}

/**
 * Send upcoming activation notification email
 */
async function sendUpcomingActivationEmail(supabase, driver, region) {
  try {
    const { error } = await supabase.functions.invoke('send-driver-waitlist-email', {
      body: {
        driverName: `${driver.first_name} ${driver.last_name}`,
        driverEmail: driver.email,
        city: region.name,
        messageType: 'upcoming_activation',
        priorityScore: driver.priority_score
      }
    });

    if (error) throw error;
    console.log(`Sent upcoming activation email to ${driver.email}`);
  } catch (error) {
    console.error(`Failed to send email to ${driver.email}:`, error);
  }
}

/**
 * Send activation email
 */
async function sendActivationEmail(supabase, driver) {
  try {
    const { error } = await supabase.functions.invoke('send-driver-waitlist-email', {
      body: {
        driverName: `${driver.first_name} ${driver.last_name}`,
        driverEmail: driver.email,
        messageType: 'activation',
        activationLink: `${Deno.env.get('SITE_URL')}/driver/activate`
      }
    });

    if (error) throw error;
    console.log(`Sent activation email to ${driver.email}`);
  } catch (error) {
    console.error(`Failed to send activation email to ${driver.email}:`, error);
  }
}

