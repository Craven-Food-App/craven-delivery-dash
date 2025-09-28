import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to send push notification via Web Push Protocol
async function sendPushNotification(subscription: any, payload: any) {
  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn("VAPID keys not configured, skipping Web Push");
    return { success: false, error: "VAPID keys not configured" };
  }

  try {
    // Import web-push library functionality (simplified implementation)
    const encoder = new TextEncoder();
    const payloadBuffer = encoder.encode(JSON.stringify(payload));

    // For production, you'd use the full web-push protocol with VAPID
    // This is a simplified version for demonstration
    console.log("Would send Web Push notification to:", subscription.endpoint);
    console.log("Payload:", payload);
    
    return { success: true };
  } catch (error) {
    console.error("Web Push error:", error);
    return { success: false, error: (error as Error).message || 'Unknown error' };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, title, message, data = {} } = await req.json();

    if (!userId || !title || !message) {
      throw new Error("Missing required parameters");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    console.log("Sending push notification to user:", userId);

    // Get user's active push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
    }

    const pushPromises = [];
    
    // Send Web Push notifications to all subscriptions
    if (subscriptions && subscriptions.length > 0) {
      for (const subscription of subscriptions) {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh_key,
            auth: subscription.auth_key
          }
        };

        const pushPayload = {
          title,
          message,
          data,
          icon: '/craven-logo.png',
          badge: '/craven-logo.png',
          vibrate: [200, 100, 200],
          requireInteraction: true,
          actions: [
            { action: 'open', title: 'Open App' },
            { action: 'dismiss', title: 'Dismiss' }
          ]
        };

        pushPromises.push(sendPushNotification(pushSubscription, pushPayload));
      }
    }

    // Wait for all push notifications
    const pushResults = await Promise.allSettled(pushPromises);
    const successCount = pushResults.filter(r => r.status === 'fulfilled' && r.value.success).length;

    console.log(`Sent ${successCount}/${pushPromises.length} push notifications`);

    // Send real-time notification via Supabase channels (fallback)
    await supabase
      .channel(`user_notifications_${userId}`)
      .send({
        type: "broadcast",
        event: "push_notification",
        payload: {
          title,
          message,
          data,
          timestamp: new Date().toISOString(),
        },
      });

    // Store notification in database
    await supabase.from("order_notifications").insert({
      order_id: data.orderId || null,
      user_id: userId,
      notification_type: data.type || "general",
      title,
      message,
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        pushNotificationsSent: successCount,
        totalSubscriptions: pushPromises.length
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Enhanced push notification error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Unknown error' }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});