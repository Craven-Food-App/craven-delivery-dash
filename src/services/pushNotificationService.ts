/**
 * Push Notification Service
 * Handles Firebase Cloud Messaging for real-time order and driver updates
 * Supports web push notifications and future mobile push notifications
 */

import { supabase } from '@/integrations/supabase/client';

// Firebase configuration - Replace with your actual Firebase config
const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
};

export type NotificationType = 
  | 'order_confirmed'
  | 'order_preparing'
  | 'order_ready'
  | 'order_picked_up'
  | 'order_nearby'
  | 'order_delivered'
  | 'driver_assigned'
  | 'new_order_available'
  | 'refund_approved'
  | 'promotion_available';

export interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

class PushNotificationService {
  private messagingSupported: boolean = false;
  private messaging: any = null;
  private token: string | null = null;

  constructor() {
    this.initializeMessaging();
  }

  /**
   * Initialize Firebase Cloud Messaging
   */
  private async initializeMessaging() {
    try {
      // Check if browser supports notifications
      if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return;
      }

      // Check if service workers are supported
      if (!('serviceWorker' in navigator)) {
        console.warn('Service workers are not supported');
        return;
      }

      // Dynamically import Firebase to avoid bundle size impact
      const { initializeApp } = await import('firebase/app');
      const { getMessaging, isSupported } = await import('firebase/messaging');

      // Check if Firebase Messaging is supported
      const supported = await isSupported();
      if (!supported) {
        console.warn('Firebase Messaging is not supported in this browser');
        return;
      }

      // Initialize Firebase
      const app = initializeApp(FIREBASE_CONFIG);
      this.messaging = getMessaging(app);
      this.messagingSupported = true;

      console.log('Firebase Cloud Messaging initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase Messaging:', error);
    }
  }

  /**
   * Request permission for push notifications
   */
  async requestPermission(): Promise<boolean> {
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('Notification permission granted');
        return true;
      } else if (permission === 'denied') {
        console.warn('Notification permission denied');
        return false;
      } else {
        console.log('Notification permission dismissed');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Get FCM token for this device
   */
  async getToken(): Promise<string | null> {
    if (!this.messagingSupported || !this.messaging) {
      console.warn('Messaging not supported, cannot get token');
      return null;
    }

    try {
      const { getToken } = await import('firebase/messaging');
      
      const token = await getToken(this.messaging, {
        vapidKey: FIREBASE_CONFIG.vapidKey
      });

      if (token) {
        this.token = token;
        console.log('FCM Token:', token);
        return token;
      } else {
        console.warn('No registration token available');
        return null;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Save FCM token to user profile
   */
  async saveTokenToProfile(userId: string, token: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ fcm_token: token })
        .eq('user_id', userId);

      if (error) throw error;
      console.log('FCM token saved to profile');
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  }

  /**
   * Listen for foreground messages
   */
  async onForegroundMessage(callback: (notification: PushNotification) => void): Promise<void> {
    if (!this.messagingSupported || !this.messaging) {
      console.warn('Messaging not supported');
      return;
    }

    try {
      const { onMessage } = await import('firebase/messaging');
      
      onMessage(this.messaging, (payload) => {
        console.log('Foreground message received:', payload);
        
        const notification: PushNotification = {
          title: payload.notification?.title || 'New Notification',
          body: payload.notification?.body || '',
          icon: payload.notification?.icon,
          data: payload.data
        };

        callback(notification);

        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.body,
            icon: notification.icon || '/logo.png',
            badge: '/logo.png',
            data: notification.data,
            tag: notification.data?.type || 'general'
          });
        }
      });
    } catch (error) {
      console.error('Error setting up foreground message listener:', error);
    }
  }

  /**
   * Send notification to specific user (via Supabase Edge Function)
   */
  async sendNotification(
    userId: string,
    type: NotificationType,
    notification: PushNotification
  ): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId,
          type,
          notification
        }
      });

      if (error) throw error;
      console.log('Notification sent successfully');
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Send order update notification
   */
  async sendOrderUpdate(
    customerId: string,
    orderId: string,
    status: string,
    restaurantName?: string
  ): Promise<void> {
    const notifications: Record<string, PushNotification> = {
      confirmed: {
        title: '✅ Order Confirmed!',
        body: `Your order from ${restaurantName || 'the restaurant'} has been confirmed.`,
        icon: '/logo.png',
        data: { orderId, type: 'order_update' }
      },
      preparing: {
        title: '👨‍🍳 Preparing Your Order',
        body: `${restaurantName || 'The restaurant'} is preparing your delicious food!`,
        icon: '/logo.png',
        data: { orderId, type: 'order_update' }
      },
      ready_for_pickup: {
        title: '📦 Order Ready!',
        body: 'Your order is ready for pickup. A driver will collect it soon.',
        icon: '/logo.png',
        data: { orderId, type: 'order_update' }
      },
      picked_up: {
        title: '🚗 Driver On The Way!',
        body: 'Your order has been picked up and is heading your way.',
        icon: '/logo.png',
        data: { orderId, type: 'order_update' },
        actions: [
          { action: 'track', title: 'Track Order' }
        ]
      },
      nearby: {
        title: '📍 Driver Nearby!',
        body: 'Your driver will arrive in 2 minutes!',
        icon: '/logo.png',
        data: { orderId, type: 'order_update' }
      },
      delivered: {
        title: '🎉 Order Delivered!',
        body: 'Enjoy your meal! Please rate your experience.',
        icon: '/logo.png',
        data: { orderId, type: 'order_update' },
        actions: [
          { action: 'rate', title: 'Rate Order' }
        ]
      }
    };

    const notification = notifications[status];
    if (notification) {
      await this.sendNotification(customerId, status as NotificationType, notification);
    }
  }

  /**
   * Send driver notification for new order
   */
  async sendDriverOrderAvailable(
    driverId: string,
    restaurantName: string,
    earnings: number
  ): Promise<void> {
    await this.sendNotification(driverId, 'new_order_available', {
      title: '💰 New Order Available!',
      body: `${restaurantName} - Earn $${earnings.toFixed(2)}`,
      icon: '/logo.png',
      data: { type: 'new_order' },
      actions: [
        { action: 'accept', title: 'Accept' },
        { action: 'decline', title: 'Decline' }
      ]
    });
  }

  /**
   * Initialize push notifications for current user
   */
  async initialize(): Promise<boolean> {
    try {
      // Request permission
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        return false;
      }

      // Get FCM token
      const token = await this.getToken();
      if (!token) {
        return false;
      }

      // Save token to user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await this.saveTokenToProfile(user.id, token);
      }

      // Set up foreground message listener
      await this.onForegroundMessage((notification) => {
        console.log('Received notification:', notification);
        
        // Handle notification clicks
        if (notification.data?.orderId) {
          const trackOrderUrl = `/track-order/${notification.data.orderId}`;
          console.log('Order notification - track at:', trackOrderUrl);
        }
      });

      return true;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return false;
    }
  }

  /**
   * Check if notifications are supported
   */
  isSupported(): boolean {
    return this.messagingSupported && 'Notification' in window;
  }

  /**
   * Get current notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();

