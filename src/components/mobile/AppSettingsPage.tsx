import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, Globe, Moon, Sun, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AppSettingsPageProps = {
  onBack: () => void;
};

const AppSettingsPage: React.FC<AppSettingsPageProps> = ({ onBack }) => {
  const [settings, setSettings] = useState({
    pushNotifications: true,
    soundEnabled: true,
    vibrationEnabled: true,
    darkMode: false,
    language: 'en',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch driver preferences
      const { data: preferences } = await supabase
        .from('driver_preferences')
        .select('*')
        .eq('driver_id', user.id)
        .single();

      if (preferences) {
        setSettings({
          pushNotifications: preferences.notification_sound ?? true,
          soundEnabled: preferences.notification_sound ?? true,
          vibrationEnabled: preferences.notification_sound ?? true,
          darkMode: false, // Default to light mode as theme field doesn't exist
          language: 'en',
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const updateSetting = async (key: string, value: boolean | string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updates: any = {};
      if (key === 'pushNotifications') updates.push_notifications_enabled = value;
      if (key === 'soundEnabled') updates.sound_enabled = value;
      if (key === 'vibrationEnabled') updates.vibration_enabled = value;
      if (key === 'darkMode') updates.theme = value ? 'dark' : 'light';

      // Update or create preferences
      const { error } = await supabase
        .from('driver_preferences')
        .upsert({
          driver_id: user.id,
          ...updates,
        }, {
          onConflict: 'driver_id'
        });

      if (error) throw error;

      setSettings({ ...settings, [key]: value });
      toast.success('Settings updated');
    } catch (error: any) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    }
  };

  return (
    <div className="h-screen w-full bg-gray-50 overflow-y-auto" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between safe-area-top">
        <button onClick={onBack} className="text-gray-900">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-gray-900 text-xl font-bold">App Settings</h1>
        <div className="w-6"></div>
      </div>

      <div className="px-6 py-6 space-y-4">
        {/* Notifications */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 p-3 rounded-xl">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Notifications</h2>
              <p className="text-sm text-gray-500">Manage notification preferences</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-bold text-gray-900">Push Notifications</p>
                  <p className="text-sm text-gray-500">Receive push notifications</p>
                </div>
              </div>
              <button
                onClick={() => updateSetting('pushNotifications', !settings.pushNotifications)}
                className={`w-12 h-6 rounded-full transition-colors ${settings.pushNotifications ? 'bg-orange-600' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform m-0.5 ${settings.pushNotifications ? 'translate-x-6' : ''}`}></div>
              </button>
            </div>

            <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl">
              <div className="flex items-center gap-3">
                {settings.soundEnabled ? <Volume2 className="w-5 h-5 text-gray-600" /> : <VolumeX className="w-5 h-5 text-gray-600" />}
                <div>
                  <p className="font-bold text-gray-900">Sound</p>
                  <p className="text-sm text-gray-500">Notification sounds</p>
                </div>
              </div>
              <button
                onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)}
                className={`w-12 h-6 rounded-full transition-colors ${settings.soundEnabled ? 'bg-orange-600' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform m-0.5 ${settings.soundEnabled ? 'translate-x-6' : ''}`}></div>
              </button>
            </div>

            <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-bold text-gray-900">Vibration</p>
                  <p className="text-sm text-gray-500">Vibrate on notifications</p>
                </div>
              </div>
              <button
                onClick={() => updateSetting('vibrationEnabled', !settings.vibrationEnabled)}
                className={`w-12 h-6 rounded-full transition-colors ${settings.vibrationEnabled ? 'bg-orange-600' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform m-0.5 ${settings.vibrationEnabled ? 'translate-x-6' : ''}`}></div>
              </button>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-purple-100 p-3 rounded-xl">
              {settings.darkMode ? <Moon className="w-6 h-6 text-purple-600" /> : <Sun className="w-6 h-6 text-purple-600" />}
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Appearance</h2>
              <p className="text-sm text-gray-500">Theme and display settings</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl">
            <div className="flex items-center gap-3">
              {settings.darkMode ? <Moon className="w-5 h-5 text-gray-600" /> : <Sun className="w-5 h-5 text-gray-600" />}
              <div>
                <p className="font-bold text-gray-900">Dark Mode</p>
                <p className="text-sm text-gray-500">Switch to dark theme</p>
              </div>
            </div>
            <button
              onClick={() => updateSetting('darkMode', !settings.darkMode)}
              className={`w-12 h-6 rounded-full transition-colors ${settings.darkMode ? 'bg-orange-600' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform m-0.5 ${settings.darkMode ? 'translate-x-6' : ''}`}></div>
            </button>
          </div>
        </div>

        {/* Language */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-100 p-3 rounded-xl">
              <Globe className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Language</h2>
              <p className="text-sm text-gray-500">App language preference</p>
            </div>
          </div>

          <div className="p-4 border-2 border-gray-200 rounded-xl">
            <select
              value={settings.language}
              onChange={(e) => updateSetting('language', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppSettingsPage;

