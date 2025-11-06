/**
 * Direct password reset for CFO using Supabase Admin API
 * This script uses the service role key to reset the password
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xaxbucnjlrfkccsfiddq.supabase.co';

// Try to get service role key from environment or prompt
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required');
  console.error('');
  console.error('To get your service role key:');
  console.error('1. Go to https://supabase.com/dashboard/project/xaxbucnjlrfkccsfiddq/settings/api');
  console.error('2. Copy the "service_role" key (keep it secret!)');
  console.error('3. Set it: $env:SUPABASE_SERVICE_ROLE_KEY = "your-key-here"');
  console.error('4. Run this script again');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetCFOPassword() {
  try {
    const email = 'wowbilallovely@gmail.com';
    const newPassword = 'Craventemp01!';

    console.log(`🔄 Resetting password for CFO: ${email}...`);

    // Find the user by email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }

    const user = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      throw new Error(`User with email ${email} not found`);
    }

    console.log(`✓ Found user: ${user.id} (${user.email})`);

    // Update the password using admin API
    const { data, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      throw new Error(`Failed to update password: ${updateError.message}`);
    }

    console.log('');
    console.log('✅ Password reset successfully!');
    console.log(`   Email: ${email}`);
    console.log(`   New Password: ${newPassword}`);
    console.log(`   User ID: ${user.id}`);
    console.log('');

    // Verify the user exists in exec_users table
    const { data: execUser, error: execError } = await supabase
      .from('exec_users')
      .select('*')
      .eq('email', email)
      .single();

    if (execError) {
      console.warn(`⚠ Warning: Could not find exec_users record: ${execError.message}`);
    } else {
      console.log(`✓ Executive record found: ${execUser.full_name} (${execUser.role})`);
    }

    console.log('');
    console.log('The CFO can now log in with:');
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${newPassword}`);

  } catch (error: any) {
    console.error('');
    console.error('❌ Error:', error.message);
    console.error('');
    process.exit(1);
  }
}

resetCFOPassword();

