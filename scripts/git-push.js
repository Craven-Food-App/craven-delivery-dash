#!/usr/bin/env node
/**
 * Streamlined Git Push Script
 * Usage: npm run git:push "commit message"
 * Or: node scripts/git-push.js "commit message"
 */

import { execSync } from 'child_process';
import readline from 'readline';

async function promptForMessage() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question('Enter commit message: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  // Get commit message from command line arguments
  let commitMessage = process.argv.slice(2).join(' ').trim();
  
  // If no message provided, prompt for one
  if (!commitMessage) {
    commitMessage = await promptForMessage();
    if (!commitMessage) {
      console.error('❌ Commit message cannot be empty');
      process.exit(1);
    }
  }

  // Get current branch name
  let branch;
  try {
    branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
  } catch (error) {
    console.error('❌ Not a git repository');
    process.exit(1);
  }

  console.log('\n🚀 Pushing to git...');
  console.log(`Branch: ${branch}`);
  console.log(`Message: ${commitMessage}\n`);

  // Check if there are changes to commit
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    if (!status.trim()) {
      console.log('⚠️  No changes to commit');
      process.exit(0);
    }
  } catch (error) {
    // Continue if status check fails
  }

  // Stage all changes
  console.log('📦 Staging changes...');
  try {
    execSync('git add -A', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed to stage changes');
    process.exit(1);
  }

  // Commit changes
  console.log('💾 Committing changes...');
  try {
    // Escape quotes in commit message
    const escapedMessage = commitMessage.replace(/"/g, '\\"');
    execSync(`git commit -m "${escapedMessage}"`, { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed to commit changes');
    process.exit(1);
  }

  // Push to remote
  console.log('⬆️  Pushing to remote...');
  try {
    execSync('git push', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed to push changes');
    console.log(`💡 Try: git push --set-upstream origin ${branch}`);
    process.exit(1);
  }

  console.log('\n✅ Successfully pushed to git!');
  console.log(`Branch: ${branch}`);
  console.log(`Commit: ${commitMessage}\n`);
}

// Run main function
main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
