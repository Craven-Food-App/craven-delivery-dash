import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Missing Supabase environment variables' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const body = await req.json();
    const {
      recipient_user_id,
      shares_amount,
      share_class = 'Common',
      price_per_share = 0.0001,
      vesting_type = 'graded',
      vesting_period_months = 48,
      cliff_months = 12,
      start_date,
      resolution_id,
      appointment_id,
    } = body;

    if (!recipient_user_id || !shares_amount) {
      return new Response(
        JSON.stringify({ error: 'Missing recipient_user_id or shares_amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get or create cap table
    const { data: capTable } = await supabaseAdmin
      .from('cap_tables')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (!capTable) {
      return new Response(
        JSON.stringify({ error: 'Cap table not initialized' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if we have enough unissued shares
    if (capTable.total_unissued < shares_amount) {
      return new Response(
        JSON.stringify({ error: 'Insufficient unissued shares in cap table' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const vestingStartDate = start_date || new Date().toISOString().split('T')[0];
    const vestingEndDate = new Date(
      new Date(vestingStartDate).getTime() + vesting_period_months * 30 * 24 * 60 * 60 * 1000
    ).toISOString().split('T')[0];

    // Create vesting schedule
    const vestingSchedule: any[] = [];
    if (vesting_type === 'graded') {
      const monthlyVest = shares_amount / vesting_period_months;
      for (let i = 0; i < vesting_period_months; i++) {
        const vestDate = new Date(
          new Date(vestingStartDate).getTime() + (i + 1) * 30 * 24 * 60 * 60 * 1000
        ).toISOString().split('T')[0];
        vestingSchedule.push({
          date: vestDate,
          shares: Math.floor(monthlyVest),
          vested: false,
        });
      }
    } else if (vesting_type === 'cliff') {
      const cliffDate = new Date(
        new Date(vestingStartDate).getTime() + cliff_months * 30 * 24 * 60 * 60 * 1000
      ).toISOString().split('T')[0];
      vestingSchedule.push({
        date: cliffDate,
        shares: shares_amount,
        vested: false,
      });
    } else if (vesting_type === 'immediate') {
      vestingSchedule.push({
        date: vestingStartDate,
        shares: shares_amount,
        vested: true,
      });
    }

    // Create vesting schedule record
    const { data: vestingRecord, error: vestingError } = await supabaseAdmin
      .from('vesting_schedules')
      .insert({
        recipient_user_id,
        total_shares: shares_amount,
        vesting_type,
        cliff_months,
        vesting_period_months,
        vesting_schedule: vestingSchedule,
        start_date: vestingStartDate,
        end_date: vestingEndDate,
        vested_shares: vesting_type === 'immediate' ? shares_amount : 0,
        unvested_shares: vesting_type === 'immediate' ? 0 : shares_amount,
      })
      .select()
      .single();

    if (vestingError) {
      throw vestingError;
    }

    // Create equity ledger entry for grant
    const { data: ledgerEntry, error: ledgerError } = await supabaseAdmin
      .from('equity_ledger')
      .insert({
        transaction_type: 'grant',
        recipient_user_id,
        shares_amount,
        share_class,
        price_per_share,
        transaction_date: vestingStartDate,
        effective_date: vestingStartDate,
        resolution_id,
        notes: `Equity grant: ${shares_amount} shares, ${vesting_type} vesting over ${vesting_period_months} months`,
      })
      .select()
      .single();

    if (ledgerError) {
      throw ledgerError;
    }

    // Update cap table (deduct from unissued, add to equity pool tracking)
    await supabaseAdmin
      .from('cap_tables')
      .update({
        total_unissued: capTable.total_unissued - shares_amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', capTable.id);

    // Log the action
    await supabaseAdmin.rpc('log_governance_action', {
      p_action_type: 'equity_granted',
      p_action_category: 'equity',
      p_target_type: 'equity_grant',
      p_target_id: vestingRecord.id,
      p_target_name: `${shares_amount} shares granted`,
      p_description: `Equity grant: ${shares_amount} shares to user ${recipient_user_id}`,
      p_metadata: {
        shares_amount,
        vesting_type,
        vesting_period_months,
        resolution_id,
        appointment_id,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Equity grant created successfully',
        vesting_schedule: vestingRecord,
        ledger_entry: ledgerEntry,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in governance-grant-equity:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

