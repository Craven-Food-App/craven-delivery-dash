import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Play, Pause, Upload } from 'lucide-react';
// Assuming useToast is available from the UI components
// import { useToast } from '@/hooks/use-toast'; 

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// --- START: STUBS FOR COMPILATION FIX ---

// 1. Stub/Mock for the useToast hook
// Replace with your actual implementation if outside this environment
const useToast = () => ({
  toast: (options: { title: string, description: string, variant?: string }) => {
    console.log(`[TOAST] ${options.title}: ${options.description}`);
  }
});

// 2. Stub for playNotificationSound utility
const playNotificationSound = async (
  soundFile: string,
  repeatCount: number,
  repeatIntervalMs: number
) => {
  // A minimal stub to allow compilation and prevent immediate errors on call.
  // For actual sound playback, the audioUtils file would handle the repeating logic.
  console.log(`Playing sound: ${soundFile}, Repeats: ${repeatCount}x, Interval: ${repeatIntervalMs}ms`);
  try {
    // Only attempt to play if a sound file path/URL is provided
    if (soundFile) {
        const audio = new Audio(soundFile);
        // Using .catch() to suppress browser warnings about unhandled promise rejection for autoplay block
        await audio.play().catch(e => console.warn("Audio play failed (browser restriction or invalid file):", e));
    }
  } catch (error) {
    console.error("Error creating audio instance:", error);
  }
};

// Helper function to generate a unique ID
const generateUUID = () => typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);


interface NotificationSetting {
  id: string;
  name: string;
  description: string;
  sound_file: string; // This will now hold the URL to the audio file
  duration_ms: number;
  repeat_count: number;
  repeat_interval_ms: number;
  is_active: boolean;
  is_default: boolean;
}

const DEFAULT_SOUND_FILE = '/notification.mp3';

// Mock data store for client-side persistence simulation
let MOCK_SETTINGS: NotificationSetting[] = [
    { id: generateUUID(), name: 'Default Alert', description: 'Standard system notification sound.', sound_file: DEFAULT_SOUND_FILE, duration_ms: 3000, repeat_count: 1, repeat_interval_ms: 0, is_active: true, is_default: true },
    { id: generateUUID(), name: 'High Priority', description: 'Repeated sound for critical events.', sound_file: 'https://cdn.mock/high_priority.wav', duration_ms: 5000, repeat_count: 3, repeat_interval_ms: 500, is_active: true, is_default: false },
    { id: generateUUID(), name: 'Low Priority', description: 'Silent alert, visual only.', sound_file: '', duration_ms: 1000, repeat_count: 1, repeat_interval_ms: 0, is_active: false, is_default: false },
];

// 3. Stub/Mock for the Supabase client
const mockFrom = (tableName: string) => ({
    // Mock the data retrieval
    select: () => ({
        order: (key: string) => ({
            then: (callback: (data: any) => any) => {
                // Simulate async call and return current mock data
                setTimeout(() => callback({ data: MOCK_SETTINGS, error: null }), 100);
                return { error: null };
            },
            // Direct return for immediate execution in useEffect/fetchSettings
            data: MOCK_SETTINGS,
            error: null
        }),
    }),
    // Mock the data update
    update: (data: Partial<NotificationSetting>) => ({
        eq: (key: keyof NotificationSetting, value: string) => {
            const index = MOCK_SETTINGS.findIndex(s => s[key] === value);
            if (index !== -1) {
                MOCK_SETTINGS[index] = { ...MOCK_SETTINGS[index], ...data } as NotificationSetting;
            } else if (key === 'is_default' && data.is_default === false) {
                 // Simulate setting all non-ID specific items to false
                MOCK_SETTINGS = MOCK_SETTINGS.map(s => ({...s, is_default: false}));
            }
            return { error: null };
        },
        // Mock the update all (used for setting default logic)
        neq: (key: string, value: string) => {
             // Simulate removing default from others
             MOCK_SETTINGS = MOCK_SETTINGS.map(s => ({...s, is_default: false}));
             return { error: null };
        }
    }),
    // Mock data insertion
    insert: (dataArray: NotificationSetting[]) => {
        MOCK_SETTINGS.push(...dataArray);
        return { error: null };
    },
    // Mock data deletion
    delete: () => ({
        eq: (key: keyof NotificationSetting, value: string) => {
            MOCK_SETTINGS = MOCK_SETTINGS.filter(s => s[key] !== value);
            return { error: null };
        },
    }),
});

const mockStorage = {
    from: (bucketName: string) => ({
        // Mock file upload
        upload: (filePath: string, file: File, options: any) => ({ 
            data: { path: filePath }, 
            error: null 
        }),
        // Mock getting the public URL
        getPublicUrl: (filePath: string) => ({ 
            data: { publicUrl: `https://mock-storage.com/${filePath}` } 
        }),
    }),
};

// The component's required Supabase client object
const supabase = {
    from: mockFrom,
    storage: mockStorage,
};
// --- END: STUBS FOR COMPILATION FIX ---


export default function App() { // FIX: Changed named export 'NotificationSettingsManager' to default export 'App'
  const { toast } = useToast();
  
  // State for all settings
  const [settings, setSettings] = useState<NotificationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for the modal
  const [editingSetting, setEditingSetting] = useState<NotificationSetting | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // State for audio playback preview
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  
  // State for file upload
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false); // New state for upload status

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sound_file: DEFAULT_SOUND_FILE,
    duration_ms: 3000,
    repeat_count: 1,
    repeat_interval_ms: 1000,
    is_active: true,
    is_default: false
  });

  /**
   * Supabase Storage Helper: Uploads the audio file and returns its public URL.
   * Uses the mockStorage stub for this environment.
   */
  const uploadAudioToStorage = async (file: File, settingId: string) => {
    setIsUploading(true);
    // Use the setting's ID to create a unique and organized file path
    const filePath = `notification_sounds/${settingId}/${file.name}`;
    
    // Upload the file to the 'notification-sounds' bucket
    const { error: uploadError } = await supabase.storage
      .from('notification-sounds')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      setIsUploading(false);
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Get the public URL for the newly uploaded file
    const { data: publicUrlData } = supabase.storage
      .from('notification-sounds')
      .getPublicUrl(filePath);

    if (!publicUrlData.publicUrl) {
      setIsUploading(false);
      throw new Error('Could not retrieve public URL after upload.');
    }
    
    setIsUploading(false);
    return publicUrlData.publicUrl;
  };
  
  /**
   * Resets the form state and uploaded file.
   */
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      sound_file: DEFAULT_SOUND_FILE,
      duration_ms: 3000,
      repeat_count: 1,
      repeat_interval_ms: 1000,
      is_active: true,
      is_default: false
    });
    setAudioFile(null); // Crucial: clear the file input state
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .order('name');

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notification settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      let finalFormData = { ...formData };
      
      // Determine the ID. Use existing ID for update, or generate one for insert.
      const currentId = editingSetting ? editingSetting.id : generateUUID(); 

      // 1. Handle File Upload if a new file is selected
      if (audioFile) {
        // Upload file and get public URL
        const publicUrl = await uploadAudioToStorage(audioFile, currentId);
        finalFormData = { ...finalFormData, sound_file: publicUrl };
      }

      let error;
      
      if (editingSetting) {
        // Update existing setting
        const { error: updateError } = await supabase
          .from('notification_settings')
          .update(finalFormData)
          .eq('id', editingSetting.id);
        error = updateError;
      } else {
        // Create new setting (must include the generated ID for the insert)
        const insertData = { ...finalFormData, id: currentId };

        const { error: insertError } = await supabase
          .from('notification_settings')
          .insert([insertData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Notification setting ${editingSetting ? 'updated' : 'created'} successfully`
      });

      // Cleanup
      setIsDialogOpen(false);
      setEditingSetting(null);
      resetForm();
      fetchSettings();
    } catch (error) {
      console.error('Error saving notification setting:', error);
      toast({
        title: 'Error',
        description: `Failed to save notification setting: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
      // Ensure upload state and file state are clean on error
      setIsUploading(false);
      setAudioFile(null);
    }
  };

  const handleDelete = async (id: string) => {
    // IMPORTANT: Replacing the forbidden `confirm()` dialog with a simplified, direct action.
    toast({
      title: 'Deleting...',
      description: 'The item has been deleted from the mock database.',
    });

    try {
      const { error } = await supabase
        .from('notification_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Notification setting deleted successfully'
      });

      fetchSettings();
    } catch (error) {
      console.error('Error deleting notification setting:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete notification setting',
        variant: 'destructive'
      });
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      // First, remove default from all settings
      await supabase
        .from('notification_settings')
        .update({ is_default: false })
        .neq('is_default', 'true-but-mocked'); // Mocking an update all where default is true

      // Then set the selected one as default
      const { error } = await supabase
        .from('notification_settings')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Default notification setting updated'
      });

      fetchSettings();
    } catch (error) {
      console.error('Error setting default:', error);
      toast({
        title: 'Error',
        description: 'Failed to set default notification',
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
      // Use the utility stub defined above
      await playNotificationSound(
        setting.sound_file,
        setting.repeat_count,
        setting.repeat_interval_ms
      );
    } catch (error) {
      console.error('Error playing notification:', error);
    } finally {
      // Set playingAudio back to null after the estimated duration
      setTimeout(() => setPlayingAudio(null), setting.duration_ms + (setting.repeat_count - 1) * setting.repeat_interval_ms + 100);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setAudioFile(file);
    if (file) {
      // Update form data preview with file name (temporary display)
      setFormData(prev => ({ ...prev, sound_file: file.name }));
    } else if (!editingSetting || (editingSetting.sound_file === file?.name)) {
      // If no file selected, revert to default or previously saved sound_file
      setFormData(prev => ({ ...prev, sound_file: editingSetting?.sound_file || DEFAULT_SOUND_FILE }));
    }
  };

  const openEditDialog = (setting: NotificationSetting) => {
    setEditingSetting(setting);
    setFormData({
      name: setting.name,
      description: setting.description,
      sound_file: setting.sound_file,
      duration_ms: setting.duration_ms,
      repeat_count: setting.repeat_count,
      repeat_interval_ms: setting.repeat_interval_ms,
      is_active: setting.is_active,
      is_default: setting.is_default
    });
    setAudioFile(null); // Clear any pending file upload
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingSetting(null);
    resetForm();
    setIsDialogOpen(true);
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
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Driver Notification Settings</h2>
          <p className="text-md text-muted-foreground mt-1">
            Configure notification options for drivers when they receive orders, including custom sounds.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm(); // Reset form when closing
        }}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="bg-orange-600 hover:bg-orange-700 shadow-lg transition duration-150 ease-in-out transform hover:scale-105">
              <Plus className="h-4 w-4 mr-2" />
              Add New Alert
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl rounded-lg shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {editingSetting ? 'Edit Notification Setting' : 'Create New Notification Setting'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Name and Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Critical Priority Alert"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of this notification style"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Sound File Upload */}
              <Card className="p-4 bg-gray-50 border-dashed border-gray-300">
                <div className='space-y-2'>
                    <div className="flex items-center space-x-2">
                        <Upload className="h-5 w-5 text-orange-600" />
                        <Label htmlFor="audio_file" className="text-sm font-medium">Custom Sound File (Optional)</Label>
                    </div>
                    
                    <Input
                        id="audio_file"
                        type="file"
                        accept="audio/mp3,audio/wav,audio/ogg"
                        onChange={handleFileChange}
                        className="file:text-orange-600 file:font-semibold file:border-none file:bg-transparent"
                    />
                    <p className='text-xs text-muted-foreground pt-1'>
                        Current File: <span className='font-mono text-gray-700 break-words'>{audioFile ? audioFile.name : formData.sound_file}</span>
                    </p>
                </div>
              </Card>

              {/* Timing Controls */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="duration" className="text-sm font-medium">Duration (ms)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="100"
                    value={formData.duration_ms}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration_ms: parseInt(e.target.value) || 0 }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="repeat_count" className="text-sm font-medium">Repeat Count</Label>
                  <Input
                    id="repeat_count"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.repeat_count}
                    onChange={(e) => setFormData(prev => ({ ...prev, repeat_count: parseInt(e.target.value) || 1 }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="repeat_interval" className="text-sm font-medium">Interval (ms)</Label>
                  <Input
                    id="repeat_interval"
                    type="number"
                    min="0"
                    value={formData.repeat_interval_ms}
                    onChange={(e) => setFormData(prev => ({ ...prev, repeat_interval_ms: parseInt(e.target.value) || 0 }))}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Switches */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active" className="text-sm font-medium">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_default"
                    checked={formData.is_default}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))}
                  />
                  <Label htmlFor="is_default" className="text-sm font-medium">Set as Default</Label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <Button onClick={() => setIsDialogOpen(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button 
                    onClick={handleSave} 
                    disabled={isUploading || !formData.name}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 shadow-md disabled:bg-gray-400"
                >
                    {isUploading ? (
                        <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Uploading...
                        </div>
                    ) : (
                        editingSetting ? 'Update Setting' : 'Create Setting'
                    )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {settings.map((setting) => (
          <Card key={setting.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold truncate">{setting.name}</h3>
                    {setting.is_default && (
                      <Badge className="bg-orange-600 text-white hover:bg-orange-700">
                        Default
                      </Badge>
                    )}
                    {!setting.is_active && (
                      <Badge variant="outline" className="text-gray-500 border-gray-300">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                    {setting.description}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 font-medium">
                    <span>Duration: <span className='font-semibold'>{setting.duration_ms}ms</span></span>
                    <span>Repeats: <span className='font-semibold'>{setting.repeat_count}x</span></span>
                    <span>Interval: <span className='font-semibold'>{setting.repeat_interval_ms}ms</span></span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 ml-4">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full h-10 w-10 hover:bg-orange-50 text-orange-600 border-orange-300"
                    onClick={() => playNotificationPreview(setting)}
                    disabled={playingAudio === setting.id}
                  >
                    {playingAudio === setting.id ? (
                      <Pause className="h-5 w-5 fill-orange-600" />
                    ) : (
                      <Play className="h-5 w-5 fill-none" />
                    )}
                  </Button>
                  
                  {!setting.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-gray-600 hover:bg-gray-100"
                      onClick={() => handleSetDefault(setting.id)}
                    >
                      Set Default
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full h-10 w-10 hover:bg-blue-50 text-blue-600"
                    onClick={() => openEditDialog(setting)}
                  >
                    <Edit2 className="h-5 w-5" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full h-10 w-10 hover:bg-red-50 text-red-600"
                    onClick={() => handleDelete(setting.id)}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
