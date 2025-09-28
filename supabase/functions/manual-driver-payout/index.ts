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
    const { driver_id, amount, payment_method_id } = await req.json();

    if (!driver_id || !amount || !payment_method_id) {
      throw new Error("Missing required parameters: driver_id, amount, payment_method_id");
    }

    console.log(`Processing manual payout: $${amount} to driver ${driver_id}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get payment method details
    const { data: paymentMethod, error: pmError } = await supabase
      .from('driver_payment_methods')
      .select('*')
      .eq('id', payment_method_id)
      .eq('driver_id', driver_id)
      .single();

    if (pmError || !paymentMethod) {
      throw new Error("Payment method not found or doesn't belong to driver");
    }

    // Create a manual payout batch for today
    const today = new Date().toISOString().split('T')[0];
    const { data: payoutBatch, error: batchError } = await supabase
      .from('daily_payout_batches')
      .upsert({
        payout_date: today,
        total_amount: amount,
        total_drivers: 1,
        status: 'processing'
      }, {
        onConflict: 'payout_date',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (batchError) {
      throw new Error(`Failed to create payout batch: ${batchError.message}`);
    }

    // Create payout record
    const { data: payoutRecord, error: payoutError } = await supabase
      .from('driver_payouts')
      .insert({
        batch_id: payoutBatch.id,
        driver_id: driver_id,
        payment_method_id: payment_method_id,
        amount: amount,
        status: 'pending'
      })
      .select()
      .single();

    if (payoutError) {
      throw new Error(`Failed to create payout record: ${payoutError.message}`);
    }

    // Process the payment based on payment method type
    let paymentResult;
    
    switch (paymentMethod.payment_type) {
      case 'cashapp':
        paymentResult = await processCashAppPayout(paymentMethod.account_identifier, amount);
        break;
      case 'paypal':
        paymentResult = await processPayPalPayout(paymentMethod.account_identifier, amount);
        break;
      case 'venmo':
        paymentResult = await processVenmoPayout(paymentMethod.account_identifier, amount);
        break;
      case 'zelle':
        paymentResult = await processZellePayout(paymentMethod.account_identifier, amount);
        break;
      default:
        throw new Error(`Unsupported payment method: ${paymentMethod.payment_type}`);
    }

    // Update payout record with result
    await supabase
      .from('driver_payouts')
      .update({
        status: paymentResult.success ? 'completed' : 'failed',
        external_transaction_id: paymentResult.transactionId,
        error_message: paymentResult.error,
        processed_at: new Date().toISOString()
      })
      .eq('id', payoutRecord.id);

    // Update batch status
    await supabase
      .from('daily_payout_batches')
      .update({
        status: paymentResult.success ? 'completed' : 'failed',
        processed_at: new Date().toISOString()
      })
      .eq('id', payoutBatch.id);

    return new Response(
      JSON.stringify({
        success: paymentResult.success,
        payout_id: payoutRecord.id,
        transaction_id: paymentResult.transactionId,
        message: paymentResult.success 
          ? `Successfully sent $${amount} to ${paymentMethod.account_identifier} via ${paymentMethod.payment_type}`
          : `Failed to send payment: ${paymentResult.error}`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Manual payout error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

// Cash App payout simulation (replace with actual Cash App Business API)
async function processCashAppPayout(cashtag: string, amount: number) {
  console.log(`Processing Cash App payout: $${amount} to ${cashtag}`);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // For now, simulate payment process
  return {
    success: true,
    transactionId: `cashapp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    error: null
  };
}

// PayPal payout simulation (replace with actual PayPal Payouts API)
async function processPayPalPayout(email: string, amount: number) {
  console.log(`Processing PayPal payout: $${amount} to ${email}`);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    success: true,
    transactionId: `paypal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    error: null
  };
}

// Venmo payout simulation (Venmo doesn't have a business API for payouts)
async function processVenmoPayout(username: string, amount: number) {
  console.log(`Manual Venmo payout needed: $${amount} to ${username}`);
  
  return {
    success: false,
    transactionId: null,
    error: "Venmo payouts require manual processing - please send payment manually via Venmo app"
  };
}

// Zelle payout simulation (Zelle doesn't have API - requires manual processing)
async function processZellePayout(phoneOrEmail: string, amount: number) {
  console.log(`Manual Zelle payout needed: $${amount} to ${phoneOrEmail}`);
  
  return {
    success: false,
    transactionId: null,
    error: "Zelle payouts require manual processing - please send payment manually via your banking app"
  };
}