import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompleteTaskRequest {
  task_id: number;
  driver_id: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { task_id, driver_id } = await req.json() as CompleteTaskRequest;

    console.log('Completing task:', { task_id, driver_id });

    // Get task details
    const { data: task, error: taskError } = await supabaseClient
      .from('onboarding_tasks')
      .select('*')
      .eq('id', task_id)
      .eq('driver_id', driver_id)
      .single();

    if (taskError || !task) {
      throw new Error('Task not found or unauthorized');
    }

    if (task.completed) {
      return new Response(
        JSON.stringify({ success: true, message: 'Task already completed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark task as complete
    const { error: updateError } = await supabaseClient
      .from('onboarding_tasks')
      .update({ 
        completed: true, 
        completed_at: new Date().toISOString() 
      })
      .eq('id', task_id);

    if (updateError) throw updateError;

    // The trigger will automatically:
    // 1. Update driver points
    // 2. Update priority score
    // 3. Update activation queue priority
    // 4. Check if all tasks are complete and set onboarding_completed_at

    console.log('Task completed successfully:', task.task_name);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Task "${task.task_name}" completed! You earned ${task.points_reward} points.`,
        points_earned: task.points_reward
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error completing task:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
