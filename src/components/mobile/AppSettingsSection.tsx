import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, MapPin, Volume2, Smartphone, Moon, Sun, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useNavigation } from '@/hooks/useNavigation';
import { IOSPushNotifications } from './IOSPushNotifications';
import { supabase } from '@/integrations/supabase/client';

interface AppSettingsSectionProps {
  onBack: () => void;
}

export const AppSettingsSection: React.FC<AppSettingsSectionProps> = ({ onBack }) => {
  const { navigationSettings, updateSettings } = useNavigation();
  const [settings, setSettings] = useState({
    pushNotifications: true,
    locationServices: true,
    soundAlerts: true,
    vibration: true,
    darkMode: false,
    language: 'english',
    distanceUnit: 'miles'
  });
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    fetchUser();
  }, []);

  const handleSettingChange = (key: keyof typeof settings, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    toast({
      title: "Setting updated",
      description: "Your preference has been saved."
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20 overflow-y-auto">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-background border-b border-border/50 px-4 py-3 sticky top-0 z-10 safe-area-top">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-foreground">App Settings</h1>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Notifications */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Push Notifications</div>
                  <div className="text-sm text-muted-foreground">Receive order alerts</div>
                </div>
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Sound Alerts</div>
                  <div className="text-sm text-muted-foreground">Audio notifications</div>
                </div>
                <Switch
                  checked={settings.soundAlerts}
                  onCheckedChange={(checked) => handleSettingChange('soundAlerts', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Vibration</div>
                  <div className="text-sm text-muted-foreground">Haptic feedback</div>
                </div>
                <Switch
                  checked={settings.vibration}
                  onCheckedChange={(checked) => handleSettingChange('vibration', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* iOS Push Notifications */}
          {userId && <IOSPushNotifications userId={userId} />}

          {/* Navigation */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Navigation className="h-5 w-5 text-primary" />
                Navigation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="font-medium mb-2">Navigation Provider</div>
                <Select
                  value={navigationSettings.provider}
                  onValueChange={(value) => {
                    updateSettings({ provider: value as any });
                    toast({ title: 'Navigation provider updated' });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {/* In-app navigation */}
                    <SelectItem value="mapbox">Crave'N Navigation (In-App)</SelectItem>
                    {/* Google Maps available on all */}
                    <SelectItem value="google">Google Maps</SelectItem>
                    {/* Apple Maps only on iOS */}
                    {/iPad|iPhone|iPod/.test(navigator.userAgent) && (
                      <SelectItem value="apple">Apple Maps</SelectItem>
                    )}
                    {/* Waze only on Android */}
                    {/Android/.test(navigator.userAgent) && (
                      <SelectItem value="waze">Waze</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {navigationSettings.provider === 'mapbox' 
                    ? 'Turn-by-turn navigation within the app'
                    : 'Opens external navigation app'}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Voice Guidance</div>
                  <div className="text-sm text-muted-foreground">Turn-by-turn voice instructions</div>
                </div>
                <Switch
                  checked={navigationSettings.voiceGuidance}
                  onCheckedChange={(checked) => updateSettings({ voiceGuidance: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Avoid Tolls</div>
                  <div className="text-sm text-muted-foreground">Route around toll roads</div>
                </div>
                <Switch
                  checked={navigationSettings.avoidTolls}
                  onCheckedChange={(checked) => updateSettings({ avoidTolls: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Avoid Highways</div>
                  <div className="text-sm text-muted-foreground">Use local roads when possible</div>
                </div>
                <Switch
                  checked={navigationSettings.avoidHighways}
                  onCheckedChange={(checked) => updateSettings({ avoidHighways: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Location Services */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Location Services
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Location Access</div>
                  <div className="text-sm text-muted-foreground">Required for deliveries</div>
                </div>
                <Switch
                  checked={settings.locationServices}
                  onCheckedChange={(checked) => handleSettingChange('locationServices', checked)}
                />
              </div>

              <div>
                <div className="font-medium mb-2">Distance Unit</div>
                <Select
                  value={settings.distanceUnit}
                  onValueChange={(value) => handleSettingChange('distanceUnit', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="miles">Miles</SelectItem>
                    <SelectItem value="kilometers">Kilometers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Display */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                Display
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Dark Mode</div>
                  <div className="text-sm text-muted-foreground">Use dark theme</div>
                </div>
                <Switch
                  checked={settings.darkMode}
                  onCheckedChange={(checked) => handleSettingChange('darkMode', checked)}
                />
              </div>

              <div>
                <div className="font-medium mb-2">Language</div>
                <Select
                  value={settings.language}
                  onValueChange={(value) => handleSettingChange('language', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="spanish">Español</SelectItem>
                    <SelectItem value="french">Français</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Data & Storage */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Data & Storage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full">
                Clear Cache
              </Button>
              
              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <div className="font-medium mb-1">Cache Size: 23.4 MB</div>
                Clearing cache may improve app performance but will require re-downloading some data.
              </div>
            </CardContent>
          </Card>

          {/* Privacy */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Privacy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                Privacy Policy
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Terms of Service
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Data Usage
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};