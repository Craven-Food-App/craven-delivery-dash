import React, { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, RotateCcw, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DeliveryCameraProps {
  onPhotoCapture: (photo: Blob) => void;
  onCancel: () => void;
  isUploading?: boolean;
}

export const DeliveryCamera: React.FC<DeliveryCameraProps> = ({
  onPhotoCapture,
  onCancel,
  isUploading = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Start camera (tap-to-start)
  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      const msg = 'Camera not supported';
      setCameraError(msg);
      toast({ title: 'Camera Error', description: msg, variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setCameraError(null);

    // Stop previous stream
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);

    try {
      const constraints = { video: { facingMode: 'environment' }, audio: false };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      if (!videoRef.current) return;

      const video = videoRef.current;
      video.srcObject = mediaStream;
      video.playsInline = true;
      video.muted = true;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');

      // Wait for metadata to load
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(resolve, 2000); // fallback
        video.onloadedmetadata = () => {
          clearTimeout(timeout);
          resolve();
        };
      });

      await video.play();
      setStream(mediaStream);
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera error:', err);
      const msg = err?.message || 'Unable to access camera';
      setCameraError(msg);
      toast({ title: 'Camera Error', description: msg, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [stream, toast]);

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    setIsCameraActive(false);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    // Mirror for UX if desired
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setCapturedPhoto(url);
          stopCamera();
          onPhotoCapture(blob);
        }
      },
      'image/jpeg',
      0.8
    );
  }, [stopCamera, onPhotoCapture]);

  const retakePhoto = useCallback(() => {
    setCapturedPhoto(null);
    startCamera();
  }, [startCamera]);

  return (
    <div className="space-y-4">
      <div className="bg-green-500 text-white p-4 rounded-2xl text-center">
        <h2 className="text-xl font-bold">Proof of Delivery</h2>
        <p className="opacity-90">Take a photo to confirm delivery</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative aspect-[4/3] bg-gray-900 rounded-lg overflow-hidden">
            {!capturedPhoto ? (
              <>
                {cameraError ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white">
                    <Camera className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-center px-4">{cameraError}</p>
                    <Button onClick={startCamera} className="mt-4 bg-orange-600 hover:bg-orange-700">
                      Retry Camera
                    </Button>
                  </div>
                ) : !isCameraActive ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white">
                    <Button onClick={startCamera} className="bg-orange-600 hover:bg-orange-700 px-6 py-3 rounded-xl">
                      <Camera className="h-5 w-5 mr-2 inline" />
                      Start Camera
                    </Button>
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover bg-black"
                    style={{ transform: 'scaleX(-1)', objectFit: 'cover' }}
                  />
                )}
              </>
            ) : (
              <img src={capturedPhoto} alt="Captured delivery proof" className="w-full h-full object-cover" />
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-3 mt-4">
            {!capturedPhoto ? (
              <>
                <Button onClick={onCancel} variant="outline" className="flex-1" disabled={isUploading}>
                  <X className="h-4 w-4 mr-2" /> Cancel
                </Button>
                <Button onClick={capturePhoto} className="flex-1 bg-orange-600 hover:bg-orange-700" disabled={!isCameraActive || isUploading}>
                  <Camera className="h-4 w-4 mr-2" /> Capture
                </Button>
              </>
            ) : (
              <>
                <Button onClick={retakePhoto} variant="outline" className="flex-1" disabled={isUploading}>
                  <RotateCcw className="h-4 w-4 mr-2" /> Retake
                </Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700" disabled={isUploading}>
                  <Check className="h-4 w-4 mr-2" /> Confirm
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
