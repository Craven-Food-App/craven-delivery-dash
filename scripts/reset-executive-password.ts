/**
 * Reset password for an executive user
 * Usage: 
 *   SUPABASE_SERVICE_ROLE_KEY=xxx tsx scripts/reset-executive-password.ts
 *   Or set environment variables in your shell
 */

import { createClient } from '@supabase/supabase-js';

// Use the Supabase URL from the client file
const supabaseUrl = 'https://xaxbucnjlrfkccsfiddq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  console.error('Please set these environment variables or add them to .env.local');
  console.error('Example:');
  console.error('  VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetExecutivePassword() {
  try {
    const email = 'wowbilallovely@gmail.com';
    const newPassword = 'Craventemp01!';

    console.log(`Resetting password for ${email}...`);

    // First, find the user by email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }

    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      throw new Error(`User with email ${email} not found`);
    }

    console.log(`Found user: ${user.id} (${user.email})`);

    // Update the password using admin API
    const { data, error } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (error) {
      throw new Error(`Failed to update password: ${error.message}`);
    }

    console.log('✓ Password reset successfully!');
    console.log(`  Email: ${email}`);
    console.log(`  New Password: ${newPassword}`);
    console.log(`  User ID: ${user.id}`);

    // Verify the user exists in exec_users table
    const { data: execUser, error: execError } = await supabase
      .from('exec_users')
      .select('*')
      .eq('email', email)
      .single();

    if (execError) {
      console.warn(`⚠ Warning: Could not find exec_users record: ${execError.message}`);
    } else {
      console.log(`✓ Found exec_users record: ${execUser.full_name} (${execUser.role})`);
    }

  } catch (error: any) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

resetExecutivePassword();

