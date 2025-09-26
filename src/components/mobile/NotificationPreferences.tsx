import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Volume2, Play, Pause } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface NotificationSetting {
  id: string;
  name: string;
  description: string;
  sound_file: string;
  duration_ms: number;
  repeat_count: number;
  repeat_interval_ms: number;
  is_active: boolean;
  is_default: boolean;
}

interface UserPreference {
  id: string;
  notification_setting_id: string;
  is_enabled: boolean;
}

export const NotificationPreferences: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSetting[]>([]);
  const [preferences, setPreferences] = useState<UserPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSetting, setSelectedSetting] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      // Fetch available notification settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (settingsError) throw settingsError;

      // Fetch user preferences
      const { data: preferencesData, error: preferencesError } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (preferencesError && preferencesError.code !== 'PGRST116') {
        throw preferencesError;
      }

      setSettings(settingsData || []);
      setPreferences(preferencesData || []);

      // Set default selection if no preferences exist
      if (!preferencesData?.length && settingsData?.length) {
        const defaultSetting = settingsData.find(s => s.is_default) || settingsData[0];
        setSelectedSetting(defaultSetting.id);
      } else if (preferencesData?.length) {
        const enabledPreference = preferencesData.find(p => p.is_enabled);
        if (enabledPreference) {
          setSelectedSetting(enabledPreference.notification_setting_id);
        }
      }
    } catch (error) {
      console.error('Error fetching notification data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notification preferences',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePreferenceChange = async (settingId: string, enabled: boolean) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      if (enabled) {
        // Disable all other preferences first
        await supabase
          .from('user_notification_preferences')
          .update({ is_enabled: false })
          .eq('user_id', user.id);

        // Enable the selected one
        const { error } = await supabase
          .from('user_notification_preferences')
          .upsert({
            user_id: user.id,
            notification_setting_id: settingId,
            is_enabled: true
          }, {
            onConflict: 'user_id,notification_setting_id'
          });

        if (error) throw error;
        setSelectedSetting(settingId);
      } else {
        // Disable the preference
        const { error } = await supabase
          .from('user_notification_preferences')
          .update({ is_enabled: false })
          .eq('user_id', user.id)
          .eq('notification_setting_id', settingId);

        if (error) throw error;
        
        if (selectedSetting === settingId) {
          setSelectedSetting(null);
        }
      }

      toast({
        title: 'Success',
        description: 'Notification preference updated'
      });

      fetchData();
    } catch (error) {
      console.error('Error updating preference:', error);
      toast({
        title: 'Error',
        description: 'Failed to update notification preference',
        variant: 'destructive'
      });
    }
  };

  const playNotificationPreview = async (setting: NotificationSetting) => {
    if (playingAudio === setting.id) {
      setPlayingAudio(null);
      return;
    }

    setPlayingAudio(setting.id);

    try {
      for (let i = 0; i < setting.repeat_count; i++) {
        const audio = new Audio(setting.sound_file);
        audio.play();
        
        if (i < setting.repeat_count - 1) {
          await new Promise(resolve => setTimeout(resolve, setting.repeat_interval_ms));
        }
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    } finally {
      setTimeout(() => setPlayingAudio(null), setting.duration_ms);
    }
  };

  const isPreferenceEnabled = (settingId: string) => {
    return selectedSetting === settingId;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Order Notification Settings
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Choose how you want to be notified when you receive new orders
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {settings.map((setting) => (
          <div key={setting.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{setting.name}</h3>
                {setting.is_default && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                    Recommended
                  </Badge>
                )}
              </div>
              <Switch
                checked={isPreferenceEnabled(setting.id)}
                onCheckedChange={(checked) => handlePreferenceChange(setting.id, checked)}
              />
            </div>
            
            <p className="text-sm text-muted-foreground mb-3">
              {setting.description}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>Duration: {(setting.duration_ms / 1000).toFixed(1)}s</span>
                <span>Repeats: {setting.repeat_count}x</span>
                <span>Interval: {(setting.repeat_interval_ms / 1000).toFixed(1)}s</span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => playNotificationPreview(setting)}
                disabled={playingAudio === setting.id}
              >
                {playingAudio === setting.id ? (
                  <>
                    <Pause className="h-4 w-4 mr-1" />
                    Playing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-1" />
                    Preview
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
        
        {settings.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Volume2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No notification settings available</p>
            <p className="text-sm">Contact admin to configure notification options</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};