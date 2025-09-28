import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Play, Pause } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface NotificationSound {
  id: string;
  name: string;
  file: string;
  is_default: boolean;
}

export const NotificationSettingsManager: React.FC = () => {
  const [sounds, setSounds] = useState<NotificationSound[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSoundFile, setNewSoundFile] = useState<File | null>(null);
  const [newSoundName, setNewSoundName] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load sounds from database
  const loadSounds = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedSounds = data?.map(setting => ({
        id: setting.id,
        name: setting.name,
        file: setting.sound_file,
        is_default: setting.is_default
      })) || [];

      setSounds(formattedSounds);
    } catch (error) {
      console.error('Error loading sounds:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSounds();
  }, [loadSounds]);

  // Add new sound
  const addSound = useCallback(async () => {
    if (!newSoundName || !newSoundFile) return;

    try {
      // Generate unique filename
      const fileExtension = newSoundFile.name.split('.').pop() || 'mp3';
      const fileName = `notification-sounds/${Date.now()}-${newSoundName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${fileExtension}`;

      // Upload file to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('craver-documents')
        .upload(fileName, newSoundFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('craver-documents')
        .getPublicUrl(fileName);

      // Save to database with permanent URL
      const { data, error } = await supabase
        .from('notification_settings')
        .insert({
          name: newSoundName,
          sound_file: urlData.publicUrl,
          is_default: sounds.length === 0, // First sound becomes default
          description: `Custom sound: ${newSoundName}`,
          duration_ms: 3000,
          repeat_count: 1,
          repeat_interval_ms: 1000,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      const newSound = {
        id: data.id,
        name: data.name,
        file: data.sound_file,
        is_default: data.is_default
      };

      setSounds(prev => [...prev, newSound]);
      setNewSoundName('');
      setNewSoundFile(null);
      setIsDialogOpen(false);
      
      console.log('Sound uploaded successfully:', urlData.publicUrl);
    } catch (error) {
      console.error('Error adding sound:', error);
      alert('Failed to upload sound file. Please try again.');
    }
  }, [newSoundName, newSoundFile, sounds.length]);

  // Set default sound
  const setDefault = async (id: string) => {
    try {
      // Update database - unset all defaults first
      await supabase
        .from('notification_settings')
        .update({ is_default: false })
        .neq('id', id);

      // Set new default
      await supabase
        .from('notification_settings')
        .update({ is_default: true })
        .eq('id', id);

      // Update local state
      setSounds(prev =>
        prev.map(s => ({ ...s, is_default: s.id === id }))
      );
    } catch (error) {
      console.error('Error setting default sound:', error);
    }
  };

  // Play preview
  const playPreview = async (sound: NotificationSound) => {
    if (playingId === sound.id) {
      setPlayingId(null);
      return;
    }
    setPlayingId(sound.id);
    const audio = new Audio(sound.file);
    await audio.play().catch(console.warn);
    setTimeout(() => setPlayingId(null), 2000); // simple duration
  };

  if (loading) {
    return <div className="p-6">Loading notification settings...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Driver Notification Sounds</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" /> Add Sound
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md p-4">
            <DialogHeader>
              <DialogTitle>Add New Sound</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Label>Name</Label>
              <Input value={newSoundName} onChange={e => setNewSoundName(e.target.value)} />

              <Label>File</Label>
              <Input type="file" accept="audio/*" onChange={e => setNewSoundFile(e.target.files?.[0] || null)} />

              <Button onClick={addSound} className="bg-orange-600 hover:bg-orange-700 w-full">Add</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {sounds.map(sound => (
          <Card key={sound.id} className="p-4 flex justify-between items-center">
            <div>
              <p className="font-bold">{sound.name} {sound.is_default && '(Default)'}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => playPreview(sound)} size="sm">
                {playingId === sound.id ? <Pause /> : <Play />}
              </Button>
              {!sound.is_default && (
                <Button onClick={() => setDefault(sound.id)} size="sm" className="bg-gray-200">
                  Set Default
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
