import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.44d88461c1ea4d2293feebc1a7d81db9',
  appName: 'craven-delivery-dash',
  webDir: 'dist',
  server: {
    url: 'https://44d88461-c1ea-4d22-93fe-ebc1a7d81db9.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;