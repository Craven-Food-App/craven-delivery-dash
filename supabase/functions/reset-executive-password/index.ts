import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body
    const { email, newPassword } = await req.json();

    if (!email || !newPassword) {
      throw new Error('Email and newPassword are required');
    }

    console.log(`Resetting password for executive: ${email}`);

    // Find the user by email using admin API
    let user = null;
    let page = 1;
    const pageSize = 1000;
    
    while (true) {
      const { data: usersData, error: listError } = await supabase.auth.admin.listUsers({
        page,
        perPage: pageSize
      });
      
      if (listError) {
        throw new Error(`Failed to list users: ${listError.message}`);
      }

      user = usersData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (user || !usersData.users.length || usersData.users.length < pageSize) {
        break;
      }
      
      page++;
    }
    
    if (!user) {
      throw new Error(`User with email ${email} not found`);
    }

    console.log(`Found user: ${user.id} (${user.email})`);

    // Update the password using admin API
    const { data, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      throw new Error(`Failed to update password: ${updateError.message}`);
    }

    // Verify the user exists in exec_users table
    const { data: execUser, error: execError } = await supabase
      .from('exec_users')
      .select('*')
      .eq('email', email)
      .single();

    let execInfo = null;
    if (!execError && execUser) {
      execInfo = {
        full_name: execUser.full_name,
        role: execUser.role,
        title: execUser.title
      };
    }

    console.log(`Password reset successfully for ${email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Password reset successfully',
        email: email,
        user_id: user.id,
        executive: execInfo
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Error resetting executive password:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});

