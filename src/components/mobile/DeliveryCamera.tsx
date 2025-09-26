import React, { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, RotateCcw, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CameraTapToStart } from './CameraTapToStart';

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

  const startCamera = useCallback(async () => {
    console.log('Starting camera...');
    setIsLoading(true);
    setCameraError(null);
    
    const tryStart = async (videoConstraints: MediaStreamConstraints['video']) => {
      const constraints: MediaStreamConstraints = { video: videoConstraints, audio: false };
      console.log('Requesting camera with constraints:', constraints);
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera stream obtained:', mediaStream);
      if (!videoRef.current) return mediaStream;

      const video = videoRef.current;
      video.playsInline = true;
      video.muted = true;
      video.autoplay = true;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.srcObject = mediaStream;

      await new Promise((resolve, reject) => {
        const onLoadedMetadata = () => {
          video.removeEventListener('loadedmetadata', onLoadedMetadata);
          video.removeEventListener('error', onError);
          resolve(true);
        };
        const onError = (e: any) => {
          video.removeEventListener('loadedmetadata', onLoadedMetadata);
          video.removeEventListener('error', onError);
          reject(e);
        };
        video.addEventListener('loadedmetadata', onLoadedMetadata);
        video.addEventListener('error', onError);
        setTimeout(() => {
          if (video.readyState >= 2) {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            resolve(true);
          }
        }, 1500);
      });

      try {
        await video.play();
      } catch (e) {
        console.warn('Video play failed, continuing:', e);
      }

      return mediaStream;
    };

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }

      // Primary high-quality constraints
      const primaryVideo: MediaStreamConstraints['video'] = {
        facingMode: 'environment',
        width: { ideal: 1920, max: 1920, min: 640 },
        height: { ideal: 1080, max: 1080, min: 480 },
        frameRate: { ideal: 30, max: 30 },
        aspectRatio: { ideal: 16/9 },
      };

      let mediaStream = await tryStart(primaryVideo);
      setStream(mediaStream);
      setIsCameraActive(true);
      setIsLoading(false);
    } catch (err1) {
      console.warn('Primary camera start failed, retrying with relaxed constraints:', err1);
      try {
        // Relaxed constraints for iOS stability
        const fallbackVideo: MediaStreamConstraints['video'] = {
          facingMode: { ideal: 'environment' },
        };
        const mediaStream = await tryStart(fallbackVideo);
        setStream(mediaStream);
        setIsCameraActive(true);
        setIsLoading(false);
      } catch (err2) {
        console.error('Fallback camera start failed:', err2);
        const errorMessage = err2 instanceof Error ? err2.message : 'Unknown camera error';
        setCameraError(errorMessage);
        setIsLoading(false);
        toast({
          title: 'Camera Error',
          description: `Unable to access camera: ${errorMessage}`,
          variant: 'destructive'
        });
      }
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isCameraActive) {
      console.error('Video or canvas not ready for capture');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState < 2) {
      console.error('Context not available or video not ready');
      toast({
        title: 'Camera Error',
        description: 'Camera not ready. Please wait a moment and try again.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;

      console.log('Capturing photo at dimensions:', canvas.width, 'x', canvas.height);

      // Clear canvas first
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw video frame to canvas (flip horizontally back to normal)
      context.save();
      context.scale(-1, 1);
      context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      context.restore();

      // Convert to data URL with high quality
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      if (dataUrl && dataUrl !== 'data:,') {
        setCapturedPhoto(dataUrl);
        stopCamera();
        console.log('Photo captured successfully');
      } else {
        throw new Error('Failed to capture photo data');
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      toast({
        title: 'Capture Error',
        description: 'Failed to capture photo. Please try again.',
        variant: 'destructive'
      });
    }
  }, [isCameraActive, stopCamera, toast]);

  const retakePhoto = useCallback(() => {
    setCapturedPhoto(null);
    startCamera();
  }, [startCamera]);

  const confirmPhoto = useCallback(() => {
    if (!capturedPhoto || !canvasRef.current) return;

    canvasRef.current.toBlob(
      (blob) => {
        if (blob) {
          onPhotoCapture(blob);
        }
      },
      'image/jpeg',
      0.8
    );
  }, [capturedPhoto, onPhotoCapture]);

  // Enhanced camera initialization with iOS tap-to-start fallback
  const initializeCamera = useCallback(() => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    
    // Add click handler for iOS tap-to-start
    const handleTapToStart = async () => {
      console.log('Tap-to-start camera triggered');
      if (!isCameraActive && !isLoading) {
        await startCamera();
      }
    };
    
    video.addEventListener('click', handleTapToStart);
    video.addEventListener('touchstart', handleTapToStart);
    
    return () => {
      video.removeEventListener('click', handleTapToStart);
      video.removeEventListener('touchstart', handleTapToStart);
    };
  }, [startCamera, isCameraActive, isLoading]);

  React.useEffect(() => {
    // Initialize camera with delay for iOS
    const initTimer = setTimeout(() => {
      startCamera();
    }, 200);
    
    // Setup tap-to-start for iOS
    const cleanup = initializeCamera();
    
    return () => {
      clearTimeout(initTimer);
      stopCamera();
      if (cleanup) cleanup();
    };
  }, [startCamera, stopCamera, initializeCamera]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-green-500 text-white p-4 rounded-2xl text-center">
        <h2 className="text-xl font-bold">Proof of Delivery</h2>
        <p className="opacity-90">Take a photo to confirm delivery</p>
      </div>

      {/* Camera/Photo Display */}
      <Card>
        <CardContent className="p-4">
          <div className="relative aspect-[4/3] bg-gray-900 rounded-lg overflow-hidden">
            {!capturedPhoto ? (
              <>
                {cameraError ? (
                  <div className="w-full h-full flex items-center justify-center flex-col text-white">
                    <Camera className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-center px-4">
                      Camera Error: {cameraError}
                    </p>
                    <Button 
                      onClick={startCamera} 
                      className="mt-4 bg-orange-600 hover:bg-orange-700"
                    >
                      Retry Camera
                    </Button>
                  </div>
                ) : isLoading ? (
                  <div className="w-full h-full flex items-center justify-center flex-col text-white">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                    <p>Starting camera...</p>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover bg-black"
                      style={{ 
                        transform: 'scaleX(-1)', // Mirror for better UX
                        objectFit: 'cover'
                      }}
                      onLoadedData={() => {
                        console.log('Video data loaded');
                        if (!isCameraActive) {
                          setIsCameraActive(true);
                          setIsLoading(false);
                        }
                      }}
                      onCanPlay={() => {
                        console.log('Video can play');
                        if (!isCameraActive) {
                          setIsCameraActive(true);
                          setIsLoading(false);
                        }
                      }}
                    />
                    {!isCameraActive && !cameraError && (
                      <div className="w-full h-full absolute inset-0 flex items-center justify-center text-white bg-black/50">
                        <div className="flex flex-col items-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                          <p>Starting camera...</p>
                        </div>
                      </div>
                    )}
                    {isCameraActive && (
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-4 border-2 border-white/50 rounded-lg" />
                        <div className="absolute top-4 left-4 right-4 text-center">
                          <p className="text-white text-sm bg-black/70 rounded-full px-3 py-2 inline-block">
                            📦 Position the delivery in the frame
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <img
                src={capturedPhoto}
                alt="Captured delivery proof"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Camera Controls */}
          <div className="flex gap-3 mt-4">
            {!capturedPhoto ? (
              <>
                <Button
                  onClick={onCancel}
                  variant="outline"
                  className="flex-1"
                  disabled={isUploading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={capturePhoto}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                  disabled={!isCameraActive || isUploading}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Capture
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={retakePhoto}
                  variant="outline"
                  className="flex-1"
                  disabled={isUploading}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retake
                </Button>
                <Button
                  onClick={confirmPhoto}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={isUploading}
                >
                  <Check className="h-4 w-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Confirm'}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Instructions for Browser Testing */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2 text-yellow-800">📱 Camera Testing Notes:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Camera works best on mobile devices or mobile browsers</li>
            <li>• In desktop browsers, you may need to grant camera permissions</li>
            <li>• Make sure your browser supports camera access (HTTPS required)</li>
            <li>• Some browsers may show a blank screen - try refreshing or using mobile</li>
          </ul>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2">Photo Tips:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Make sure the delivery location is clearly visible</li>
            <li>• Include house numbers or apartment details if possible</li>
            <li>• Ensure the photo is well-lit and not blurry</li>
            <li>• Take the photo from a reasonable distance</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};