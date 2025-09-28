import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const { orderId, status, userId } = await req.json();

    if (!orderId || !status) {
      throw new Error("Missing required parameters");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Update order status
    const { data: order, error: updateError } = await supabase
      .from("customer_orders")
      .update({ order_status: status })
      .eq("id", orderId)
      .select(`
        *,
        restaurants (
          name,
          owner_id
        )
      `)
      .single();

    if (updateError) throw updateError;

    // Send notifications based on status change
    const notifications = [];
    const statusMessages = {
      confirmed: "Your order has been confirmed! 🎉",
      preparing: "Your order is being prepared 👨‍🍳",
      ready: "Your order is ready for pickup! 📦",
      picked_up: "Your order has been picked up for delivery 🚚",
      delivered: "Your order has been delivered! Enjoy your meal! 🍽️",
      canceled: "Your order has been canceled ❌"
    };

    // Notify customer (we don't have customer user_id, so we'll use email for now)
    if (statusMessages[status as keyof typeof statusMessages]) {
      // In a real app, you'd have customer user accounts
      console.log(`Would notify customer ${order.customer_email}: ${statusMessages[status as keyof typeof statusMessages]}`);
    }

    // Notify restaurant owner
    if (order.restaurants?.owner_id && (status === 'picked_up' || status === 'delivered')) {
      notifications.push({
        order_id: orderId,
        user_id: order.restaurants.owner_id,
        notification_type: "order_update",
        title: `Order #${orderId.slice(-8)} ${status.replace('_', ' ')}`,
        message: `Order from ${order.customer_name} has been ${status.replace('_', ' ')}.`
      });
    }

    // Insert notifications
    if (notifications.length > 0) {
      await supabase.from("order_notifications").insert(notifications);
    }

    // If delivery order, update delivery status as well
    if (status === 'picked_up' || status === 'delivered') {
      await supabase
        .from("delivery_orders")
        .update({ 
          status: status === 'picked_up' ? 'in_transit' : 'delivered' 
        })
        .eq("customer_order_id", orderId);
    }

    return new Response(
      JSON.stringify({ success: true, order }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error updating order status:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Unknown error' }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});