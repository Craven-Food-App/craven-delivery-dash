import { useState, useEffect, useCallback } from 'react';
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

interface UserNotificationPreference {
  id: string;
  notification_setting_id: string;
  is_enabled: boolean;
}

export const useNotificationSettings = () => {
  const [selectedSetting, setSelectedSetting] = useState<NotificationSetting | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchUserPreference = useCallback(async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      // Get user's notification preference
      const { data: preference } = await supabase
        .from('user_notification_preferences')
        .select(`
          *,
          notification_settings:notification_setting_id (*)
        `)
        .eq('user_id', user.id)
        .eq('is_enabled', true)
        .single();

      if (preference && preference.notification_settings) {
        setSelectedSetting(preference.notification_settings as NotificationSetting);
      } else {
        // Fall back to default setting
        const { data: defaultSetting } = await supabase
          .from('notification_settings')
          .select('*')
          .eq('is_default', true)
          .eq('is_active', true)
          .single();

        if (defaultSetting) {
          setSelectedSetting(defaultSetting);
        }
      }
    } catch (error) {
      console.error('Error fetching notification preference:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserPreference();
  }, [fetchUserPreference]);

  const playNotification = useCallback(async () => {
    if (!selectedSetting || isPlaying) return;

    setIsPlaying(true);

    try {
      console.log('Playing notification:', selectedSetting.name);
      
      for (let i = 0; i < selectedSetting.repeat_count; i++) {
        // Create and play audio
        const audio = new Audio(selectedSetting.sound_file);
        audio.volume = 1.0; // Full volume
        
        try {
          await audio.play();
          console.log(`Playing notification ${i + 1}/${selectedSetting.repeat_count}`);
        } catch (audioError) {
          console.error('Error playing audio:', audioError);
          // Continue with next repetition even if current fails
        }
        
        // Wait for repeat interval if not the last repetition
        if (i < selectedSetting.repeat_count - 1) {
          await new Promise(resolve => setTimeout(resolve, selectedSetting.repeat_interval_ms));
        }
      }
    } catch (error) {
      console.error('Error in notification playback:', error);
    } finally {
      // Set playing to false after duration
      setTimeout(() => {
        setIsPlaying(false);
      }, selectedSetting.duration_ms);
    }
  }, [selectedSetting, isPlaying]);

  const stopNotification = useCallback(() => {
    setIsPlaying(false);
  }, []);

  return {
    selectedSetting,
    loading,
    isPlaying,
    playNotification,
    stopNotification,
    refreshSettings: fetchUserPreference
  };
};