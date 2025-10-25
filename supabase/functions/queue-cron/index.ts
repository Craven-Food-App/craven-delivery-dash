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

    console.log('Running daily queue management tasks...');

    // Run all queue management tasks
    await Promise.all([
      recalculateQueuePriorities(supabase),
      checkRegionCapacity(supabase),
      notifyUpcomingActivations(supabase),
      cleanupExpiredInvitations(supabase)
    ]);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Daily queue management completed',
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Queue cron error:', error);
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
 * Recalculate priority scores for all drivers
 */
async function recalculateQueuePriorities(supabase) {
  console.log('Recalculating queue priorities...');

  // Get all waitlist drivers
  const { data: drivers, error: driversError } = await supabase
    .from('craver_applications')
    .select(`
      id,
      points,
      priority_score,
      created_at,
      region_id
    `)
    .eq('status', 'waitlist');

  if (driversError) throw driversError;

  let updatedCount = 0;

  for (const driver of drivers) {
    // Calculate new priority score
    const daysOnWaitlist = Math.floor(
      (new Date() - new Date(driver.created_at)) / (1000 * 60 * 60 * 24)
    );
    
    let newPriorityScore = driver.points || 0;
    
    // Time bonus (diminishing returns)
    const timeBonus = Math.min(daysOnWaitlist * 2, 50);
    newPriorityScore += timeBonus;
    
    // Referral bonus
    const { data: referrals } = await supabase
      .from('driver_referrals')
      .select('points_awarded')
      .eq('referrer_id', driver.id)
      .eq('status', 'completed');
    
    if (referrals) {
      const referralBonus = referrals.reduce((sum, ref) => sum + (ref.points_awarded || 0), 0);
      newPriorityScore += referralBonus;
    }

    // Update if priority changed
    if (newPriorityScore !== driver.priority_score) {
      const { error: updateError } = await supabase
        .from('craver_applications')
        .update({ priority_score: newPriorityScore })
        .eq('id', driver.id);

      if (!updateError) {
        updatedCount++;
      }
    }
  }

  console.log(`Updated priorities for ${updatedCount} drivers`);
}

/**
 * Check region capacity and auto-activate drivers if needed
 */
async function checkRegionCapacity(supabase) {
  console.log('Checking region capacity...');

  const { data: regions, error: regionsError } = await supabase
    .from('regions')
    .select(`
      id,
      name,
      status,
      active_quota
    `);

  if (regionsError) throw regionsError;

  for (const region of regions) {
    // Get current active count
    const { data: activeDrivers, error: activeError } = await supabase
      .from('craver_applications')
      .select('id', { count: 'exact' })
      .eq('region_id', region.id)
      .eq('status', 'approved');

    if (activeError) continue;

    const activeCount = activeDrivers?.length || 0;
    const capacityPercentage = (activeCount / region.active_quota) * 100;
    
    // If below 80% capacity and region is active, auto-activate top drivers
    if (capacityPercentage < 80 && region.status === 'active') {
      const slotsToOpen = Math.min(
        Math.floor(region.active_quota * 0.1), // Open 10% of quota
        5 // Max 5 at a time
      );
      
      if (slotsToOpen > 0) {
        await activateTopDrivers(supabase, region.id, slotsToOpen);
      }
    }
  }
}

/**
 * Notify drivers in top positions about upcoming activation
 */
async function notifyUpcomingActivations(supabase) {
  console.log('Notifying upcoming activations...');

  const { data: regions, error: regionsError } = await supabase
    .from('regions')
    .select('id, name, active_quota, status');

  if (regionsError) throw regionsError;

  for (const region of regions) {
    if (region.status !== 'active') continue;

    // Get current active count
    const { data: activeCount } = await supabase
      .from('craver_applications')
      .select('id', { count: 'exact' })
      .eq('region_id', region.id)
      .eq('status', 'approved');

    const currentActive = activeCount?.length || 0;
    const availableSlots = region.active_quota - currentActive;
    
    if (availableSlots > 0) {
      // Get top priority drivers to notify
      const { data: topDrivers, error: driversError } = await supabase
        .from('craver_applications')
        .select('id, first_name, last_name, email, priority_score')
        .eq('region_id', region.id)
        .eq('status', 'waitlist')
        .order('priority_score', { ascending: false })
        .limit(Math.min(availableSlots * 2, 10));

      if (driversError) continue;

      // Send notifications
      for (const driver of topDrivers) {
        await sendUpcomingActivationEmail(supabase, driver, region);
      }
    }
  }
}

/**
 * Clean up expired invitations and reset status
 */
async function cleanupExpiredInvitations(supabase) {
  console.log('Cleaning up expired invitations...');

  // Find drivers who were invited but didn't respond within 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: expiredInvitations, error: expiredError } = await supabase
    .from('craver_applications')
    .select('id, first_name, last_name, email')
    .eq('status', 'invited')
    .lt('invited_at', sevenDaysAgo.toISOString());

  if (expiredError) throw expiredError;

  if (expiredInvitations && expiredInvitations.length > 0) {
    // Reset to waitlist status
    const { error: resetError } = await supabase
      .from('craver_applications')
      .update({ 
        status: 'waitlist',
        invited_at: null
      })
      .in('id', expiredInvitations.map(d => d.id));

    if (resetError) throw resetError;

    console.log(`Reset ${expiredInvitations.length} expired invitations to waitlist`);
  }
}

/**
 * Activate top priority drivers for a region
 */
async function activateTopDrivers(supabase, regionId, count) {
  console.log(`Activating top ${count} drivers for region ${regionId}`);

  const { data: topDrivers, error: driversError } = await supabase
    .from('craver_applications')
    .select('id, first_name, last_name, email')
    .eq('region_id', regionId)
    .eq('status', 'waitlist')
    .order('priority_score', { ascending: false })
    .limit(count);

  if (driversError) throw driversError;

  if (topDrivers && topDrivers.length > 0) {
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

