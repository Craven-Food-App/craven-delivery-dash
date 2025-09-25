import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Bell, 
  Smartphone, 
  AlertTriangle,
  CheckCircle,
  Settings,
  Volume2,
  Vibrate,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NotificationSettings {
  newOffers: boolean;
  orderUpdates: boolean;
  scheduleReminders: boolean;
  earnings: boolean;
  emergencyAlerts: boolean;
  sound: boolean;
  vibration: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

interface NotificationPermissionStatus {
  permission: NotificationPermission;
  supported: boolean;
  serviceWorkerReady: boolean;
}

export const PushNotificationSetup: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    newOffers: true,
    orderUpdates: true,
    scheduleReminders: true,
    earnings: false,
    emergencyAlerts: true,
    sound: true,
    vibration: true,
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '07:00'
    }
  });

  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>({
    permission: 'default',
    supported: false,
    serviceWorkerReady: false
  });

  const [testingNotification, setTestingNotification] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    checkNotificationSupport();
    loadSettings();
  }, []);

  const checkNotificationSupport = () => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    const permission = supported ? Notification.permission : 'denied';
    
    setPermissionStatus({
      permission,
      supported,
      serviceWorkerReady: false
    });

    if (supported) {
      checkServiceWorker();
    }
  };

  const checkServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      setPermissionStatus(prev => ({
        ...prev,
        serviceWorkerReady: !!registration
      }));
    } catch (error) {
      console.error('Service Worker not ready:', error);
    }
  };

  const loadSettings = () => {
    const saved = localStorage.getItem('notificationSettings');
    if (saved) {
      try {
        const parsedSettings = JSON.parse(saved);
        setSettings(parsedSettings);
      } catch (error) {
        console.error('Error loading notification settings:', error);
      }
    }
  };

  const saveSettings = (newSettings: NotificationSettings) => {
    setSettings(newSettings);
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
  };

  const requestPermission = async () => {
    if (!permissionStatus.supported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported on this device.",
        variant: "destructive"
      });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(prev => ({ ...prev, permission }));
      
      if (permission === 'granted') {
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive important delivery notifications.",
        });
        
        // Register for push notifications with your service
        await registerForPushNotifications();
      } else {
        toast({
          title: "Notifications Denied",
          description: "You can enable them later in your browser settings.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: "Error",
        description: "Failed to request notification permission.",
        variant: "destructive"
      });
    }
  };

  const registerForPushNotifications = async () => {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        
        // In a real app, you'd get this from your server
        const vapidPublicKey = 'YOUR_VAPID_PUBLIC_KEY';
        
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidPublicKey
        });

        // Send subscription to your server
        await sendSubscriptionToServer(subscription);
      }
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  };

  const sendSubscriptionToServer = async (subscription: PushSubscription) => {
    // In a real app, send this to your Supabase edge function
    console.log('Push subscription:', subscription);
    
    // Example of how you'd send it:
    /*
    await supabase.functions.invoke('register-push-subscription', {
      body: {
        subscription,
        userId: user.id,
        deviceInfo: {
          platform: navigator.platform,
          userAgent: navigator.userAgent
        }
      }
    });
    */
  };

  const testNotification = async () => {
    setTestingNotification(true);
    
    try {
      if (permissionStatus.permission === 'granted') {
        // Show local notification for testing
        const notification = new Notification('🚗 New Delivery Offer!', {
          body: 'McDonald\'s • $8.50 • 2.3 miles • 15 min',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'delivery-offer',
          requireInteraction: true
        });

        // Auto-close after 5 seconds
        setTimeout(() => notification.close(), 5000);

        // Play notification sound if enabled
        if (settings.sound) {
          playNotificationSound();
        }

        toast({
          title: "Test Notification Sent",
          description: "Check if you received the notification!",
        });
      } else {
        toast({
          title: "Permission Required",
          description: "Please enable notifications first.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: "Test Failed", 
        description: "Could not send test notification.",
        variant: "destructive"
      });
    } finally {
      setTestingNotification(false);
    }
  };

  const playNotificationSound = () => {
    try {
      // Create audio context for notification sound
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  };

  const getPermissionStatusIcon = () => {
    switch (permissionStatus.permission) {
      case 'granted':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'denied':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getPermissionStatusText = () => {
    if (!permissionStatus.supported) return 'Not Supported';
    
    switch (permissionStatus.permission) {
      case 'granted': return 'Enabled';
      case 'denied': return 'Denied';
      default: return 'Not Set';
    }
  };

  const updateSetting = (key: keyof NotificationSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="max-w-md mx-auto p-4 space-y-4">
        
        {/* Permission Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getPermissionStatusIcon()}
                Notification Status
              </div>
              <Badge variant={permissionStatus.permission === 'granted' ? 'default' : 'secondary'}>
                {getPermissionStatusText()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {permissionStatus.permission !== 'granted' && (
              <Button 
                onClick={requestPermission} 
                className="w-full"
                disabled={!permissionStatus.supported}
              >
                <Bell className="h-4 w-4 mr-2" />
                Enable Notifications
              </Button>
            )}
            
            {permissionStatus.permission === 'granted' && (
              <Button 
                onClick={testNotification} 
                variant="outline" 
                className="w-full"
                disabled={testingNotification}
              >
                <Volume2 className="h-4 w-4 mr-2" />
                {testingNotification ? 'Sending...' : 'Test Notification'}
              </Button>
            )}

            {!permissionStatus.supported && (
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <AlertTriangle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-sm text-yellow-800">
                  Push notifications are not supported on this device or browser.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Critical Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Critical Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">New Delivery Offers</p>
                <p className="text-xs text-muted-foreground">Get notified of new opportunities</p>
              </div>
              <Switch 
                checked={settings.newOffers}
                onCheckedChange={(checked) => updateSetting('newOffers', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Order Updates</p>
                <p className="text-xs text-muted-foreground">Status changes and customer messages</p>
              </div>
              <Switch 
                checked={settings.orderUpdates}
                onCheckedChange={(checked) => updateSetting('orderUpdates', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Emergency Alerts</p>
                <p className="text-xs text-muted-foreground">Safety and security notifications</p>
              </div>
              <Switch 
                checked={settings.emergencyAlerts}
                onCheckedChange={(checked) => updateSetting('emergencyAlerts', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Optional Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Optional Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Schedule Reminders</p>
                <p className="text-xs text-muted-foreground">Remind when to go online</p>
              </div>
              <Switch 
                checked={settings.scheduleReminders}
                onCheckedChange={(checked) => updateSetting('scheduleReminders', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Earnings Updates</p>
                <p className="text-xs text-muted-foreground">Daily and weekly summaries</p>
              </div>
              <Switch 
                checked={settings.earnings}
                onCheckedChange={(checked) => updateSetting('earnings', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Behavior */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Notification Behavior
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                <div>
                  <p className="font-medium text-sm">Sound</p>
                  <p className="text-xs text-muted-foreground">Play notification sounds</p>
                </div>
              </div>
              <Switch 
                checked={settings.sound}
                onCheckedChange={(checked) => updateSetting('sound', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Vibrate className="h-4 w-4" />
                <div>
                  <p className="font-medium text-sm">Vibration</p>
                  <p className="text-xs text-muted-foreground">Vibrate on notifications</p>
                </div>
              </div>
              <Switch 
                checked={settings.vibration}
                onCheckedChange={(checked) => updateSetting('vibration', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Quiet Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Quiet Hours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Enable Quiet Hours</p>
                <p className="text-xs text-muted-foreground">Reduce notifications during these times</p>
              </div>
              <Switch 
                checked={settings.quietHours.enabled}
                onCheckedChange={(checked) => 
                  updateSetting('quietHours', { ...settings.quietHours, enabled: checked })
                }
              />
            </div>

            {settings.quietHours.enabled && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Start Time</label>
                    <input 
                      type="time" 
                      value={settings.quietHours.start}
                      onChange={(e) => 
                        updateSetting('quietHours', { 
                          ...settings.quietHours, 
                          start: e.target.value 
                        })
                      }
                      className="w-full mt-1 p-2 border rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">End Time</label>
                    <input 
                      type="time" 
                      value={settings.quietHours.end}
                      onChange={(e) => 
                        updateSetting('quietHours', { 
                          ...settings.quietHours, 
                          end: e.target.value 
                        })
                      }
                      className="w-full mt-1 p-2 border rounded-md text-sm"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Only critical notifications will be shown during quiet hours
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-blue-800">Pro Tips</p>
                <ul className="text-xs text-blue-700 mt-1 space-y-1">
                  <li>• Keep notifications enabled for the best earning opportunities</li>
                  <li>• Test notifications regularly to ensure they're working</li>
                  <li>• Critical notifications will bypass quiet hours</li>
                  <li>• Check your phone's battery optimization settings</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};