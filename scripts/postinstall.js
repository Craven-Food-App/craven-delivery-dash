#!/usr/bin/env node

// Skip Capacitor sync in CI environments to avoid build failures
if (process.env.CI === 'true' || process.env.SKIP_CAP_SYNC === 'true') {
  console.log('Skipping Capacitor sync in CI environment');
  process.exit(0);
}

try {
  const { execSync } = require('child_process');
  execSync('npx cap sync', { stdio: 'inherit' });
} catch (error) {
  // Don't fail the build if cap sync fails
  console.warn('Capacitor sync failed, continuing...');
  process.exit(0);
}

