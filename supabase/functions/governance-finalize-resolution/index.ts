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
    const resolution_id = body.resolution_id || body.resolutionId;

    if (!resolution_id) {
      return new Response(
        JSON.stringify({ error: 'Missing resolution_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get resolution
    const { data: resolution, error: resolutionError } = await supabaseAdmin
      .from('governance_board_resolutions')
      .select('*')
      .eq('id', resolution_id)
      .single();

    if (resolutionError || !resolution) {
      return new Response(
        JSON.stringify({ error: 'Resolution not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (resolution.status !== 'PENDING_VOTE') {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Resolution is already ${resolution.status}`,
          resolution 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Count total active board members
    const { count: totalBoardMembers } = await supabaseAdmin
      .from('board_members')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (!totalBoardMembers || totalBoardMembers === 0) {
      return new Response(
        JSON.stringify({ error: 'No active board members found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all votes for this resolution
    const { data: votes, error: votesError } = await supabaseAdmin
      .from('board_resolution_votes')
      .select('vote')
      .eq('resolution_id', resolution_id);

    if (votesError) {
      console.error('Error fetching votes:', votesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch votes' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const voteCounts = {
      YES: votes?.filter((v) => v.vote === 'YES').length || 0,
      NO: votes?.filter((v) => v.vote === 'NO').length || 0,
      ABSTAIN: votes?.filter((v) => v.vote === 'ABSTAIN').length || 0,
    };

    const totalVotes = voteCounts.YES + voteCounts.NO + voteCounts.ABSTAIN;
    const majorityThreshold = Math.floor(totalBoardMembers / 2) + 1;
    const votingMajority = Math.floor(totalVotes / 2) + 1;

    let newStatus = resolution.status;
    let action = '';

    // Check if majority YES votes reached
    if (voteCounts.YES >= majorityThreshold) {
      newStatus = 'ADOPTED';
      action = 'ADOPTED';
    }
    // Check if majority NO votes reached (only if we have enough votes)
    else if (voteCounts.NO >= majorityThreshold) {
      newStatus = 'REJECTED';
      action = 'REJECTED';
    }
    // Check if majority of voting members voted YES (even if not all have voted)
    else if (totalVotes >= votingMajority && voteCounts.YES > voteCounts.NO) {
      newStatus = 'ADOPTED';
      action = 'ADOPTED';
    }
    // Check if majority of voting members voted NO
    else if (totalVotes >= votingMajority && voteCounts.NO > voteCounts.YES) {
      newStatus = 'REJECTED';
      action = 'REJECTED';
    }

    // Only update if status changed
    if (newStatus !== resolution.status) {
      const { data: updatedResolution, error: updateError } = await supabaseAdmin
        .from('governance_board_resolutions')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', resolution_id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating resolution:', updateError);
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log the action
      await supabaseAdmin.rpc('log_governance_action', {
        p_action_type: `resolution_${action.toLowerCase()}`,
        p_action_category: 'board',
        p_target_type: 'resolution',
        p_target_id: resolution_id,
        p_target_name: resolution.title,
        p_description: `Resolution ${action.toLowerCase()} with ${voteCounts.YES} YES, ${voteCounts.NO} NO, ${voteCounts.ABSTAIN} ABSTAIN votes (${totalVotes}/${totalBoardMembers} board members voted)`,
        p_metadata: {
          vote_counts: voteCounts,
          total_board_members: totalBoardMembers,
          total_votes: totalVotes,
          majority_threshold: majorityThreshold,
        },
      });

      // If this is an appointment resolution and it was adopted, finalize the appointment
      if (newStatus === 'ADOPTED' && resolution.type === 'EXECUTIVE_APPOINTMENT' && resolution.metadata?.appointment_id) {
        const appointmentId = resolution.metadata.appointment_id;

        // Update appointment status to APPROVED
        await supabaseAdmin
          .from('executive_appointments')
          .update({
            status: 'APPROVED',
            updated_at: new Date().toISOString(),
          })
          .eq('id', appointmentId);

        // Create corporate officer record if appointment is approved
        const { data: appointment } = await supabaseAdmin
          .from('executive_appointments')
          .select('*')
          .eq('id', appointmentId)
          .single();

        if (appointment) {
          // Check if officer already exists
          const { data: existingOfficer } = await supabaseAdmin
            .from('corporate_officers')
            .select('id')
            .eq('email', appointment.proposed_officer_email)
            .eq('status', 'ACTIVE')
            .single();

          if (!existingOfficer && appointment.proposed_officer_email) {
            // Create corporate officer record
            await supabaseAdmin.from('corporate_officers').insert({
              full_name: appointment.proposed_officer_name,
              email: appointment.proposed_officer_email,
              title: appointment.proposed_title,
              appointed_by: resolution_id,
              effective_date: appointment.effective_date,
              term_end: appointment.term_length_months
                ? new Date(new Date(appointment.effective_date).getTime() + appointment.term_length_months * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                : null,
              status: 'ACTIVE',
              metadata: {
                appointment_id: appointmentId,
                appointment_type: appointment.appointment_type,
                authority_granted: appointment.authority_granted,
                compensation_structure: appointment.compensation_structure,
                equity_included: appointment.equity_included,
                equity_details: appointment.equity_details,
              },
            });

            // Log officer creation
            await supabaseAdmin.rpc('log_governance_action', {
              p_action_type: 'officer_appointed',
              p_action_category: 'executive',
              p_target_type: 'officer',
              p_target_id: appointmentId,
              p_target_name: appointment.proposed_officer_name,
              p_description: `Corporate officer ${appointment.proposed_officer_name} appointed as ${appointment.proposed_title}`,
              p_metadata: {
                resolution_id: resolution_id,
                appointment_id: appointmentId,
                title: appointment.proposed_title,
              },
            });

            // Generate final documents (certificate and employment agreement)
            try {
              const generateDocUrl = `${supabaseUrl}/functions/v1/governance-generate-appointment-document`;
              
              // Generate certificate
              fetch(generateDocUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                },
                body: JSON.stringify({
                  appointment_id: appointmentId,
                  document_type: 'certificate',
                }),
              }).catch(err => console.error('Error generating certificate:', err));

              // Generate employment agreement
              fetch(generateDocUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                },
                body: JSON.stringify({
                  appointment_id: appointmentId,
                  document_type: 'employment_agreement',
                }),
              }).catch(err => console.error('Error generating employment agreement:', err));
            } catch (err) {
              console.error('Error calling document generation:', err);
              // Don't fail the request if document generation fails
            }
          }
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Resolution ${action.toLowerCase()}`,
          resolution: updatedResolution,
          vote_counts: voteCounts,
          total_board_members: totalBoardMembers,
          total_votes: totalVotes,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Status didn't change - not enough votes yet
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Resolution still pending - not enough votes for majority',
        resolution,
        vote_counts: voteCounts,
        total_board_members: totalBoardMembers,
        total_votes: totalVotes,
        majority_threshold: majorityThreshold,
        needs_more_votes: majorityThreshold - totalVotes,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in governance-finalize-resolution:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

