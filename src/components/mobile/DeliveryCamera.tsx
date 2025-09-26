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
    
    try {
      // Check if navigator.mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }

      // iOS-optimized camera constraints
      const constraints = {
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1920, max: 1920, min: 640 },
          height: { ideal: 1080, max: 1080, min: 480 },
          frameRate: { ideal: 30, max: 30 },
          aspectRatio: { ideal: 16/9 }
        },
        audio: false // Explicitly disable audio for faster initialization
      };

      console.log('Requesting camera with constraints:', constraints);
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('Camera stream obtained:', mediaStream);
      console.log('Video tracks:', mediaStream.getVideoTracks());
      
      if (videoRef.current && mediaStream) {
        // Set video properties before assigning stream
        videoRef.current.playsInline = true;
        videoRef.current.muted = true;
        videoRef.current.autoplay = true;
        
        // For iOS Safari compatibility
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
        
        // Assign stream and handle loading
        videoRef.current.srcObject = mediaStream;
        
        // Create promise to handle video loading
        const videoLoadPromise = new Promise((resolve, reject) => {
          const video = videoRef.current;
          if (!video) {
            reject(new Error('Video element not available'));
            return;
          }

          const onLoadedMetadata = () => {
            console.log('Video metadata loaded successfully');
            console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            resolve(true);
          };

          const onError = (error: any) => {
            console.error('Video loading error:', error);
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            reject(error);
          };

          video.addEventListener('loadedmetadata', onLoadedMetadata);
          video.addEventListener('error', onError);
          
          // Timeout fallback for iOS
          setTimeout(() => {
            if (video.readyState >= 2) { // HAVE_CURRENT_DATA
              console.log('Video ready via timeout fallback');
              video.removeEventListener('loadedmetadata', onLoadedMetadata);
              video.removeEventListener('error', onError);
              resolve(true);
            }
          }, 2000);
        });

        // Wait for video to be ready
        await videoLoadPromise;
        
        // Ensure video is playing
        try {
          await videoRef.current.play();
          console.log('Video playback started');
        } catch (playError) {
          console.warn('Video play failed, but continuing:', playError);
        }
        
        setStream(mediaStream);
        setIsCameraActive(true);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown camera error';
      setCameraError(errorMessage);
      setIsLoading(false);
      
      toast({
        title: 'Camera Error',
        description: `Unable to access camera: ${errorMessage}`,
        variant: 'destructive'
      });
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

  React.useEffect(() => {
    // Add small delay for iOS to ensure proper initialization
    const initTimer = setTimeout(() => {
      startCamera();
    }, 100);
    
    return () => {
      clearTimeout(initTimer);
      stopCamera();
    };
  }, [startCamera, stopCamera]);

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