import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.craven.delivery.driver',
  appName: 'Crave\'N Driver',
  webDir: 'dist',
  server: {
    url: 'https://44d88461-c1ea-4d22-93fe-ebc1a7d81db9.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    },
    Geolocation: {
      requestPermission: true,
      enableHighAccuracy: true
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
      sound: "craven-notification.caf"
    }
  }
};

export default config;