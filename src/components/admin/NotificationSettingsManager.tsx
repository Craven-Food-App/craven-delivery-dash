import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Volume2, Play, Pause } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

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

export const NotificationSettingsManager: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSetting, setEditingSetting] = useState<NotificationSetting | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sound_file: '/notification.mp3',
    duration_ms: 3000,
    repeat_count: 1,
    repeat_interval_ms: 1000,
    is_active: true,
    is_default: false
  });

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
      let error;
      
      if (editingSetting) {
        // Update existing setting
        const { error: updateError } = await supabase
          .from('notification_settings')
          .update(formData)
          .eq('id', editingSetting.id);
        error = updateError;
      } else {
        // Create new setting
        const { error: insertError } = await supabase
          .from('notification_settings')
          .insert([formData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Notification setting ${editingSetting ? 'updated' : 'created'} successfully`
      });

      setIsDialogOpen(false);
      setEditingSetting(null);
      resetForm();
      fetchSettings();
    } catch (error) {
      console.error('Error saving notification setting:', error);
      toast({
        title: 'Error',
        description: 'Failed to save notification setting',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification setting?')) return;

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
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

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

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sound_file: '/notification.mp3',
      duration_ms: 3000,
      repeat_count: 1,
      repeat_interval_ms: 1000,
      is_active: true,
      is_default: false
    });
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Driver Notification Settings</h2>
          <p className="text-muted-foreground">
            Configure notification options for drivers when they receive orders
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Notification
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingSetting ? 'Edit Notification Setting' : 'Create Notification Setting'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Standard Alert"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this notification style"
                />
              </div>

              <div>
                <Label htmlFor="duration">Duration (milliseconds)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration_ms}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_ms: parseInt(e.target.value) }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="repeat_count">Repeat Count</Label>
                  <Input
                    id="repeat_count"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.repeat_count}
                    onChange={(e) => setFormData(prev => ({ ...prev, repeat_count: parseInt(e.target.value) }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="repeat_interval">Repeat Interval (ms)</Label>
                  <Input
                    id="repeat_interval"
                    type="number"
                    value={formData.repeat_interval_ms}
                    onChange={(e) => setFormData(prev => ({ ...prev, repeat_interval_ms: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_default"
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))}
                />
                <Label htmlFor="is_default">Set as Default</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={() => setIsDialogOpen(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSave} className="flex-1 bg-orange-600 hover:bg-orange-700">
                  {editingSetting ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {settings.map((setting) => (
          <Card key={setting.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{setting.name}</h3>
                    {setting.is_default && (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        Default
                      </Badge>
                    )}
                    {!setting.is_active && (
                      <Badge variant="outline" className="text-gray-500">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {setting.description}
                  </p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Duration: {setting.duration_ms}ms</span>
                    <span>Repeats: {setting.repeat_count}x</span>
                    <span>Interval: {setting.repeat_interval_ms}ms</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => playNotificationPreview(setting)}
                    disabled={playingAudio === setting.id}
                  >
                    {playingAudio === setting.id ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  
                  {!setting.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(setting.id)}
                    >
                      Set Default
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(setting)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(setting.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};