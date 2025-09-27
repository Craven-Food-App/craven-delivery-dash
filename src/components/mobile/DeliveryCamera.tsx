import React, { useRef, useState, useCallback, useEffect } from 'react';
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
  isUploading = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Start camera with primary and fallback constraints
  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      const errMsg = 'Camera not supported in this browser';
      setCameraError(errMsg);
      toast({ title: 'Camera Error', description: errMsg, variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setCameraError(null);

    const tryConstraints = async (constraints: MediaStreamConstraints) => {
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = mediaStream;
        video.playsInline = true;
        video.muted = true;
        video.autoplay = true;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        await video.play();
      }
      return mediaStream;
    };

    try {
      // High-quality back camera
      const primaryConstraints = {
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      };
      const mediaStream = await tryConstraints(primaryConstraints);
      setStream(mediaStream);
      setIsCameraActive(true);
    } catch (err1) {
      try {
        // Fallback: simpler constraints
        const fallbackConstraints = { video: { facingMode: 'environment' }, audio: false };
        const mediaStream = await tryConstraints(fallbackConstraints);
        setStream(mediaStream);
        setIsCameraActive(true);
      } catch (err2) {
        const errorMessage = err2 instanceof Error ? err2.message : 'Unknown camera error';
        setCameraError(errorMessage);
        toast({ title: 'Camera Error', description: errorMessage, variant: 'destructive' });
      }
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach(track => track.stop());
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

    // Optional mirror for better UX
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    // Convert to Blob and set preview
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setCapturedPhoto(url);
          stopCamera();
          onPhotoCapture(blob); // send immediately
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

  // Tap-to-start for iOS
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleTap = async () => {
      if (!isCameraActive && !isLoading) await startCamera();
    };
    video.addEventListener('click', handleTap);
    video.addEventListener('touchstart', handleTap);
    return () => {
      video.removeEventListener('click', handleTap);
      video.removeEventListener('touchstart', handleTap);
    };
  }, [startCamera, isCameraActive, isLoading]);

  useEffect(() => {
    // Auto-start camera on mount
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-green-500 text-white p-4 rounded-2xl text-center">
        <h2 className="text-xl font-bold">Proof of Delivery</h2>
        <p className="opacity-90">Take a photo to confirm delivery</p>
      </div>

      {/* Camera / Photo Display */}
      <Card>
        <CardContent className="p-4">
          <div className="relative aspect-[4/3] bg-gray-900 rounded-lg overflow-hidden">
            {!capturedPhoto ? (
              <>
                {cameraError ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white">
                    <Camera className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-center px-4">Camera Error: {cameraError}</p>
                    <Button onClick={startCamera} className="mt-4 bg-orange-600 hover:bg-orange-700">
                      Retry Camera
                    </Button>
                  </div>
                ) : isLoading ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                    <p>Starting camera...</p>
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
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={capturePhoto} className="flex-1 bg-orange-600 hover:bg-orange-700" disabled={!isCameraActive || isUploading}>
                  <Camera className="h-4 w-4 mr-2" />
                  Capture
                </Button>
              </>
            ) : (
              <>
                <Button onClick={retakePhoto} variant="outline" className="flex-1" disabled={isUploading}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retake
                </Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700" disabled={isUploading}>
                  <Check className="h-4 w-4 mr-2" />
                  Confirm
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hidden canvas */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
