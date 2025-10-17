import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    // Get restaurant owned by this user
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, name, email')
      .eq('owner_id', user.id)
      .single();

    if (restaurantError || !restaurant) {
      throw new Error('Restaurant not found');
    }

    // Generate a random 8-character password
    const newPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
    
    // Update the restaurant with the new password (in production, this should be hashed)
    const { error: updateError } = await supabase
      .from('restaurants')
      .update({ tablet_password: newPassword })
      .eq('id', restaurant.id);

    if (updateError) {
      throw updateError;
    }

    // In a real implementation, send email via Resend
    // For now, just return the password for demo purposes
    console.log(`Password reset for restaurant ${restaurant.id}: ${newPassword}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password reset successfully. Check your email for the new credentials.',
        // In production, don't return the password - send via email only
        password: newPassword,
        username: restaurant.id.slice(0, 15)
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error resetting tablet password:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});