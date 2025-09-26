import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, orderId } = await req.json();

    if (!sessionId || !orderId) {
      throw new Error("Missing session ID or order ID");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      // Update order status and payment info
      const { error: updateError } = await supabase
        .from("customer_orders")
        .update({
          payment_status: "paid",
          order_status: "confirmed",
          stripe_session_id: sessionId,
          stripe_payment_intent_id: session.payment_intent as string,
        })
        .eq("id", orderId);

      if (updateError) {
        throw updateError;
      }

      // Send notification to restaurant
      const { data: order } = await supabase
        .from("customer_orders")
        .select(`
          *,
          restaurants (
            owner_id,
            name
          )
        `)
        .eq("id", orderId)
        .single();

      if (order?.restaurants?.owner_id) {
        await supabase.from("order_notifications").insert({
          order_id: orderId,
          user_id: order.restaurants.owner_id,
          notification_type: "new_order",
          title: "New Order Received! 🍕",
          message: `Order #${orderId.slice(-8)} from ${order.customer_name} - $${(order.total_cents / 100).toFixed(2)}`,
        });
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          payment_status: session.payment_status,
          order_status: "confirmed"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        payment_status: session.payment_status 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Payment verification error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Unknown error' }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});