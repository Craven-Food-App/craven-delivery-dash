import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@14.5.0?target=deno";

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

    const { returnUrl, refreshUrl } = await req.json();

    // Get restaurant for this user
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, name, email, stripe_connect_account_id')
      .eq('owner_id', user.id)
      .single();

    if (restaurantError || !restaurant) {
      throw new Error('Restaurant not found');
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    let accountId = restaurant.stripe_connect_account_id;

    // Create Stripe Connect account if it doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: restaurant.email || user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'company',
        metadata: {
          restaurant_id: restaurant.id,
          restaurant_name: restaurant.name
        }
      });

      accountId = account.id;

      // Save account ID to restaurant
      await supabase
        .from('restaurants')
        .update({ stripe_connect_account_id: accountId })
        .eq('id', restaurant.id);
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl || `${returnUrl}?refresh=true`,
      return_url: returnUrl || `${Deno.env.get('SUPABASE_URL')}/merchant-portal`,
      type: 'account_onboarding',
    });

    return new Response(
      JSON.stringify({ 
        url: accountLink.url,
        accountId: accountId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error creating Stripe Connect link:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});