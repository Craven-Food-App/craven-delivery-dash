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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Missing Supabase environment variables' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const resolution_id = body.resolution_id || body.resolutionId;
    const vote = body.vote;
    const comment = body.comment;

    if (!resolution_id || !vote) {
      return new Response(
        JSON.stringify({ error: 'Missing resolution_id or vote' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['YES', 'NO', 'ABSTAIN'].includes(vote)) {
      return new Response(
        JSON.stringify({ error: 'Invalid vote. Must be YES, NO, or ABSTAIN' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Get board member for this user
    let { data: boardMember, error: boardError } = await supabaseAdmin
      .from('board_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    // If no board member record exists, check if user has board member role and create one
    if (boardError || !boardMember) {
      // Check if user has board member role
      const { data: userRoles } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['CRAVEN_BOARD_MEMBER', 'CRAVEN_FOUNDER']);

      // Also check exec_users for board_member role
      const { data: execUser } = await supabaseAdmin
        .from('exec_users')
        .select('role, email, full_name')
        .eq('user_id', user.id)
        .eq('role', 'board_member')
        .single();

      const hasBoardRole = (userRoles && userRoles.length > 0) || execUser || user.email === 'craven@usa.com';

      if (hasBoardRole) {
        // Get user email and name
        const userEmail = user.email || '';
        const userName = execUser?.full_name || userEmail.split('@')[0] || 'Board Member';

        // Create board member record
        const { data: newBoardMember, error: createError } = await supabaseAdmin
          .from('board_members')
          .insert({
            user_id: user.id,
            full_name: userName,
            email: userEmail,
            role: execUser?.role === 'board_member' ? 'Director' : 'Board Chair',
            is_active: true,
          })
          .select('id')
          .single();

        if (createError || !newBoardMember) {
          console.error('Error creating board member:', createError);
          return new Response(
            JSON.stringify({ error: 'Failed to create board member record' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        boardMember = newBoardMember;
      } else {
        return new Response(
          JSON.stringify({ error: 'User is not an active board member' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check if vote already exists
    const { data: existingVote } = await supabaseAdmin
      .from('board_resolution_votes')
      .select('id')
      .eq('resolution_id', resolution_id)
      .eq('board_member_id', boardMember.id)
      .single();

    let voteData;
    if (existingVote) {
      // Update existing vote
      const { data, error } = await supabaseAdmin
        .from('board_resolution_votes')
        .update({
          vote,
          comment: comment || null,
        })
        .eq('id', existingVote.id)
        .select()
        .single();

      if (error) {
        throw error;
      }
      voteData = data;
    } else {
      // Create new vote
      const { data, error } = await supabaseAdmin
        .from('board_resolution_votes')
        .insert({
          resolution_id,
          board_member_id: boardMember.id,
          vote,
          comment: comment || null,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }
      voteData = data;
    }

    // Log the action
    await supabaseAdmin.rpc('log_governance_action', {
      p_action_type: 'vote_cast',
      p_action_category: 'board',
      p_target_type: 'resolution',
      p_target_id: resolution_id,
      p_target_name: `Resolution ${resolution_id}`,
      p_description: `Cast ${vote} vote on resolution`,
      p_metadata: {
        vote,
        comment: comment || null,
        board_member_id: boardMember.id,
      },
    });

    // Check if resolution should be finalized (adopted/rejected)
    try {
      const finalizeUrl = `${supabaseUrl}/functions/v1/governance-finalize-resolution`;
      await fetch(finalizeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ resolution_id }),
      });
    } catch (finalizeError) {
      // Don't fail the vote if finalization check fails
      console.error('Error checking resolution finalization:', finalizeError);
    }

    return new Response(
      JSON.stringify({ success: true, data: voteData }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in governance-cast-vote:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

