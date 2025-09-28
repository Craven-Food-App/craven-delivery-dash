import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Play, Pause } from 'lucide-react';

interface NotificationSound {
  id: string;
  name: string;
  file: string;
  is_default: boolean;
}

const DEFAULT_SOUNDS: NotificationSound[] = [
  { id: '1', name: 'Default Alert', file: '/notification.mp3', is_default: true },
];

export const NotificationSettingsManager: React.FC = () => {
  const [sounds, setSounds] = useState<NotificationSound[]>(DEFAULT_SOUNDS);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSoundFile, setNewSoundFile] = useState<File | null>(null);
  const [newSoundName, setNewSoundName] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Add new sound
  const addSound = useCallback(() => {
    if (!newSoundName || !newSoundFile) return;

    const id = Math.random().toString(36).substring(2, 15);
    const fileUrl = URL.createObjectURL(newSoundFile);

    setSounds(prev => [...prev, { id, name: newSoundName, file: fileUrl, is_default: false }]);
    setNewSoundName('');
    setNewSoundFile(null);
    setIsDialogOpen(false);
  }, [newSoundName, newSoundFile]);

  // Set default sound
  const setDefault = (id: string) => {
    setSounds(prev =>
      prev.map(s => ({ ...s, is_default: s.id === id }))
    );
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
