import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Camera, Upload, CheckCircle } from 'lucide-react';

export const VehiclePhotosUpload: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState({
    front: null as string | null,
    back: null as string | null,
    left: null as string | null,
    right: null as string | null
  });
  const fileInputRefs = {
    front: useRef<HTMLInputElement>(null),
    back: useRef<HTMLInputElement>(null),
    left: useRef<HTMLInputElement>(null),
    right: useRef<HTMLInputElement>(null)
  };

  const handlePhotoCapture = async (side: 'front' | 'back' | 'left' | 'right', file: File) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: application } = await supabase
        .from('craver_applications')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!application) return;

      // Upload photo
      const fileExt = file.name.split('.').pop();
      const fileName = `${application.id}_vehicle_${side}_${Date.now()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from('driver-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('driver-documents')
        .getPublicUrl(fileName);

      setPhotos(prev => ({ ...prev, [side]: publicUrl }));

      toast({
        title: "Photo Uploaded! ✅",
        description: `${side.charAt(0).toUpperCase() + side.slice(1)} view captured successfully.`,
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Error",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleComplete = async () => {
    const allPhotosUploaded = Object.values(photos).every(photo => photo !== null);
    
    if (!allPhotosUploaded) {
      toast({
        title: "Missing Photos",
        description: "Please upload all 4 vehicle photos (front, back, left, right).",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: application } = await supabase
        .from('craver_applications')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!application) return;

      // Save photo URLs to application
      const { error: updateError } = await supabase
        .from('craver_applications')
        .update({
          vehicle_photo_front: photos.front,
          vehicle_photo_back: photos.back,
          vehicle_photo_left: photos.left,
          vehicle_photo_right: photos.right
        })
        .eq('id', application.id);

      if (updateError) throw updateError;

      // Complete the task
      const { data: task } = await supabase
        .from('onboarding_tasks')
        .select('id')
        .eq('driver_id', application.id)
        .eq('task_key', 'upload_vehicle_photos')
        .single();

      if (task) {
        await supabase.functions.invoke('complete-onboarding-task', {
          body: {
            task_id: task.id,
            driver_id: application.id,
          },
        });
      }

      toast({
        title: "Vehicle Photos Saved! 🚗",
        description: "All vehicle photos have been uploaded successfully.",
      });

      navigate('/enhanced-onboarding');
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: "Error",
        description: "Failed to save vehicle photos. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const PhotoCard = ({ side, label }: { side: 'front' | 'back' | 'left' | 'right', label: string }) => (
    <Card>
      <CardContent className="p-4">
        <div className="text-center space-y-3">
          <div className="font-medium">{label}</div>
          {photos[side] ? (
            <div className="relative">
              <img src={photos[side]!} alt={`${label} view`} className="w-full h-40 object-cover rounded-lg" />
              <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
            </div>
          ) : (
            <div className="h-40 bg-gray-100 rounded-lg flex items-center justify-center">
              <Camera className="h-12 w-12 text-gray-400" />
            </div>
          )}
          <input
            ref={fileInputRefs[side]}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePhotoCapture(side, file);
            }}
          />
          <Button
            onClick={() => fileInputRefs[side].current?.click()}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            {photos[side] ? 'Retake Photo' : 'Take Photo'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/enhanced-onboarding')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Onboarding
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Upload Vehicle Photos</CardTitle>
            <p className="text-sm text-gray-600">
              Take clear photos of your vehicle from all 4 angles
            </p>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <PhotoCard side="front" label="Front View" />
          <PhotoCard side="back" label="Back View" />
          <PhotoCard side="left" label="Left Side" />
          <PhotoCard side="right" label="Right Side" />
        </div>

        <Button
          onClick={handleComplete}
          disabled={loading || !Object.values(photos).every(p => p)}
          className="w-full bg-orange-500 hover:bg-orange-600"
        >
          {loading ? 'Saving...' : 'Complete Task'}
        </Button>
      </div>
    </div>
  );
};
