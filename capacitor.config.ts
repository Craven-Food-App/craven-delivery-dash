import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.craven.delivery.driver',
  appName: 'Craven Delivery Driver',
  webDir: 'dist',
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