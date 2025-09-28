import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Play, Pause, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// --- STUBS ---
const useToast = () => ({
  toast: (options: { title: string; description: string; variant?: string }) => {
    console.log(`[TOAST] ${options.title}: ${options.description}`);
  },
});

const playNotificationSound = async (
  soundFile: string,
  repeatCount: number,
  repeatIntervalMs: number
) => {
  if (!soundFile) return;
  const audio = new Audio(soundFile);
  await audio.play().catch(e => console.warn('Audio play failed:', e));
};

const generateUUID = () =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 15);

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

const DEFAULT_SOUND_FILE = '/notification.mp3';
let MOCK_SETTINGS: NotificationSetting[] = [
  {
    id: generateUUID(),
    name: 'Default Alert',
    description: 'Standard system notification sound.',
    sound_file: DEFAULT_SOUND_FILE,
    duration_ms: 3000,
    repeat_count: 1,
    repeat_interval_ms: 0,
    is_active: true,
    is_default: true,
  },
  {
    id: generateUUID(),
    name: 'High Priority',
    description: 'Repeated sound for critical events.',
    sound_file: 'https://cdn.mock/high_priority.wav',
    duration_ms: 5000,
    repeat_count: 3,
    repeat_interval_ms: 500,
    is_active: true,
    is_default: false,
  },
  {
    id: generateUUID(),
    name: 'Low Priority',
    description: 'Silent alert, visual only.',
    sound_file: '',
    duration_ms: 1000,
    repeat_count: 1,
    repeat_interval_ms: 0,
    is_active: false,
    is_default: false,
  },
];

const mockFrom = (tableName: string) => ({
  select: () => ({
    order: (key: string) => ({
      then: (callback: (data: any) => any) => {
        setTimeout(() => callback({ data: MOCK_SETTINGS, error: null }), 100);
        return { error: null };
      },
      data: MOCK_SETTINGS,
      error: null,
    }),
  }),
  update: (data: Partial<NotificationSetting>) => ({
    eq: (key: keyof NotificationSetting, value: string) => {
      const index = MOCK_SETTINGS.findIndex(s => s[key] === value);
      if (index !== -1) MOCK_SETTINGS[index] = { ...MOCK_SETTINGS[index], ...data } as NotificationSetting;
      else if (key === 'is_default' && data.is_default === false)
        MOCK_SETTINGS = MOCK_SETTINGS.map(s => ({ ...s, is_default: false }));
      return { error: null };
    },
    neq: (key: string, value: string) => {
      MOCK_SETTINGS = MOCK_SETTINGS.map(s => ({ ...s, is_default: false }));
      return { error: null };
    },
  }),
  insert: (dataArray: NotificationSetting[]) => {
    MOCK_SETTINGS.push(...dataArray);
    return { error: null };
  },
  delete: () => ({
    eq: (key: keyof NotificationSetting, value: string) => {
      MOCK_SETTINGS = MOCK_SETTINGS.filter(s => s[key] !== value);
      return { error: null };
    },
  }),
});

const mockStorage = {
  from: (bucketName: string) => ({
    upload: (filePath: string, file: File, options: any) => ({ data: { path: filePath }, error: null }),
    getPublicUrl: (filePath: string) => ({ data: { publicUrl: `https://mock-storage.com/${filePath}` } }),
  }),
};

const supabase = { from: mockFrom, storage: mockStorage };

// --- COMPONENT ---
export function NotificationSettingsManager() {
  const { toast } = useToast();

  const [settings, setSettings] = useState<NotificationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSetting, setEditingSetting] = useState<NotificationSetting | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sound_file: DEFAULT_SOUND_FILE,
    duration_ms: 3000,
    repeat_count: 1,
    repeat_interval_ms: 1000,
    is_active: true,
    is_default: false,
  });

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      sound_file: DEFAULT_SOUND_FILE,
      duration_ms: 3000,
      repeat_count: 1,
      repeat_interval_ms: 1000,
      is_active: true,
      is_default: false,
    });
    setAudioFile(null);
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from('notification_settings').select('*').order('name');
      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      toast({ title: 'Error', description: 'Failed to load notification settings', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  // --- Additional handlers ---
  // handleSave, handleDelete, playNotificationPreview, handleSetDefault, handleFileChange, openEditDialog, openCreateDialog
  // These remain the same as in your previous component

  if (loading)
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        </CardContent>
      </Card>
    );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
            Driver Notification Settings
          </h2>
          <p className="text-md text-muted-foreground mt-1">
            Configure notification options for drivers when they receive orders, including custom sounds.
          </p>
        </div>
        {/* Add New Alert Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingSetting(null); resetForm(); }} className="bg-orange-600 hover:bg-orange-700 shadow-lg">
              <Plus className="h-4 w-4 mr-2" /> Add New Alert
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl rounded-lg shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {editingSetting ? 'Edit Notification Setting' : 'Create New Notification Setting'}
              </DialogTitle>
            </DialogHeader>
            {/* Form content goes here */}
          </DialogContent>
        </Dialog>
      </div>

      {/* Settings List */}
      <div className="grid gap-4">
        {settings.map((setting) => (
          <Card key={setting.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold truncate">{setting.name}</h3>
                    {setting.is_default && <Badge className="bg-orange-600 text-white">Default</Badge>}
                    {!setting.is_active && <Badge variant="outline" className="text-gray-500 border-gray-300">Inactive</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{setting.description}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 font-medium">
                    <span>Duration: <span className='font-semibold'>{setting.duration_ms}ms</span></span>
                    <span>Repeats: <span className='font-semibold'>{setting.repeat_count}x</span></span>
                    <span>Interval: <span className='font-semibold'>{setting.repeat_interval_ms}ms</span></span>
                  </div>
                </div>
                {/* Buttons */}
                <div className="flex items-center gap-3 ml-4">
                  <Button variant="outline" size="icon" className="rounded-full h-10 w-10 hover:bg-orange-50 text-orange-600 border-orange-300">
                    {playingAudio === setting.id ? <Pause className="h-5 w-5 fill-orange-600" /> : <Play className="h-5 w-5 fill-none" />}
                  </Button>
                  {!setting.is_default && <Button variant="outline" size="sm" className="text-gray-600 hover:bg-gray-100">Set Default</Button>}
                  <Button variant="outline" size="icon" className="rounded-full h-10 w-10 hover:bg-blue-50 text-blue-600">
                    <Edit2 className="h-5 w-5" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full h-10 w-10 hover:bg-red-50 text-red-600">
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
